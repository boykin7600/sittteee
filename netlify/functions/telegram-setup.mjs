import { handleError, json, methodNotAllowed, readJSON } from "../lib/http.mjs";
import { telegram } from "../lib/telegram.mjs";

export default async (request) => {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  try {
    const body = await readJSON(request, 4_000);
    if (!process.env.SETUP_KEY || body.setupKey !== process.env.SETUP_KEY) {
      return json({ error: "Неверный ключ настройки" }, 401);
    }
    if (!process.env.TELEGRAM_WEBHOOK_SECRET) {
      return json({ error: "TELEGRAM_WEBHOOK_SECRET не задан" }, 503);
    }

    const origin = new URL(request.url).origin;
    const webhookUrl = `${origin}/api/telegram/webhook`;
    const bot = await telegram("getMe");
    await telegram("setMyCommands", { commands: [
      { command: "help", description: "Команды администратора" },
      { command: "invite", description: "Пригласить администратора" },
      { command: "admins", description: "Список администраторов" },
      { command: "clients", description: "База клиентов и заявок" },
    ] });
    const webhook = await telegram("setWebhook", {
      url: webhookUrl,
      secret_token: process.env.TELEGRAM_WEBHOOK_SECRET,
      allowed_updates: ["message", "callback_query"],
      drop_pending_updates: false,
    });
    return json({
      ok: true,
      bot: `@${bot.username}`,
      webhookUrl,
      webhook,
      next: "Откройте бота и нажмите Start",
    });
  } catch (error) {
    return handleError(error);
  }
};

export const config = {
  path: "/api/telegram/setup",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["domain", "ip"], windowSize: 60, windowLimit: 5 },
};
