import { putJSON } from "../lib/data.mjs";
import { cleanText, handleError, json, methodNotAllowed, readJSON, safeSession } from "../lib/http.mjs";
import { escapeHTML, notifyAdmins, telegramConfigured } from "../lib/telegram.mjs";

const offers = {
  solo: "1 банка · 1 799 ₽",
  ritual: "2 банки · 3 399 ₽",
  signature: "3 банки · 4 999 ₽",
};

export default async (request) => {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  try {
    const body = await readJSON(request, 8_000);
    const sessionId = safeSession(body.sessionId);
    const type = cleanText(body.type, 50);
    const allowed = new Set(["order_clicked", "support_clicked"]);
    if (!allowed.has(type)) return json({ ok: true });

    const bucket = Math.floor(Date.now() / (10 * 60 * 1000));
    const once = await putJSON(
      `event/${type}/${sessionId}/${bucket}`,
      { type, sessionId, meta: body.meta || {}, createdAt: new Date().toISOString() },
      { onlyIfNew: true },
    );
    if (!once.modified || !telegramConfigured()) return json({ ok: true });

    if (type === "support_clicked") {
      await notifyAdmins("🟢 Посетитель открыл чат поддержки на сайте.");
    } else {
      const offer = offers[body.meta?.offerCode] || "Набор пока не выбран";
      await notifyAdmins(
        `🟢 Посетитель нажал «Заказать»\nВыбор: <b>${escapeHTML(offer)}</b>`,
      );
    }
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
};

export const config = {
  path: "/api/events",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["domain", "ip"], windowSize: 60, windowLimit: 60 },
};
