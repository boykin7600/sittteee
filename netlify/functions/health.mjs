import { json } from "../lib/http.mjs";

export default async () => json({
  ok: true,
  service: "kononov-netlify",
  telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN),
  adminConfigured: Boolean(process.env.PRIMARY_ADMIN_ID || process.env.TELEGRAM_ADMIN_CHAT_ID),
  webhookSecretConfigured: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
  robokassaConfigured: Boolean(
    process.env.ROBOKASSA_MERCHANT_LOGIN
      && process.env.ROBOKASSA_PASSWORD_1
      && process.env.ROBOKASSA_PASSWORD_2,
  ),
});

export const config = { path: "/api/health", method: "GET" };
