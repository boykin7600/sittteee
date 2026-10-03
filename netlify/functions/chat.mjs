import { appendChatMessage, findOrCreateClient, getJSON } from "../lib/data.mjs";
import {
  cleanText,
  handleError,
  json,
  methodNotAllowed,
  normalizePhone,
  PublicError,
  readJSON,
  safeSession,
} from "../lib/http.mjs";
import { chatKeyboard, escapeHTML, notifyAdmins, telegramConfigured } from "../lib/telegram.mjs";

export default async (request) => {
  try {
    const url = new URL(request.url);
    if (request.method === "GET") {
      const sessionId = safeSession(url.searchParams.get("sessionId"));
      const conversation = await getJSON(`chat/${sessionId}`);
      return json({ messages: conversation?.messages || [] });
    }

    if (request.method !== "POST") return methodNotAllowed(["GET", "POST"]);
    if (!telegramConfigured()) throw new PublicError("Чат ещё настраивается", 503);

    const body = await readJSON(request);
    const sessionId = safeSession(body.sessionId);
    const name = cleanText(body.name, 80);
    const phone = normalizePhone(body.phone);
    const messageText = cleanText(body.message, 1000);
    if (!name || !messageText) throw new PublicError("Введите сообщение");

    const client = await findOrCreateClient({ name, phone, city: "" });
    const message = {
      id: crypto.randomUUID(),
      direction: "user",
      body: messageText,
      createdAt: new Date().toISOString(),
    };
    await appendChatMessage(sessionId, message, {
      clientId: client.clientId,
      name,
      phone,
    });

    await notifyAdmins([
      `💬 <b>Сообщение из поддержки</b>`,
      `Клиент: <b>${escapeHTML(client.clientId)}</b>`,
      `👤 ${escapeHTML(name)}`,
      `📞 +${escapeHTML(phone)}`,
      "",
      escapeHTML(messageText),
    ].join("\n"), {
      reply_markup: chatKeyboard(sessionId),
    });

    return json({ ok: true, message }, 201);
  } catch (error) {
    return handleError(error);
  }
};

export const config = {
  path: "/api/chat",
  rateLimit: { action: "rate_limit", aggregateBy: ["domain", "ip"], windowSize: 60, windowLimit: 30 },
};
