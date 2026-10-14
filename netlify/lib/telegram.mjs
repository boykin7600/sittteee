import { listAdmins } from "./data.mjs";

export function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN);
}

export async function telegram(method, payload = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured");
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  if (!result.ok) {
    const error = new Error(result.description || `Telegram ${method} failed`);
    error.telegram = result;
    throw error;
  }
  return result.result;
}

export async function sendMessage(chatId, text, options = {}) {
  return telegram("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
    ...options,
  });
}

export async function notifyAdmins(text, options = {}) {
  const ids = await listAdmins();
  const results = await Promise.allSettled(ids.map((id) => sendMessage(id, text, options)));
  const delivered = results.filter((result) => result.status === "fulfilled").length;
  const failures = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason?.message || "unknown error");
  if (!delivered && ids.length) console.error("Telegram delivery failed", failures);
  return { recipients: ids.length, delivered, failures };
}

export function orderKeyboard(orderId) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Принять", callback_data: `order:accepted:${orderId}` },
        { text: "🧪 В работу", callback_data: `order:processing:${orderId}` },
      ],
      [
        { text: "🚚 Отправлен", callback_data: `order:shipped:${orderId}` },
        { text: "✖️ Отменить", callback_data: `order:cancelled:${orderId}` },
      ],
    ],
  };
}

export function chatKeyboard(sessionId) {
  return {
    inline_keyboard: [[
      { text: "💬 Ответить клиенту", callback_data: `chat:reply:${sessionId}` },
    ]],
  };
}

export function chatReplyPrompt() {
  return {
    force_reply: true,
    selective: true,
    input_field_placeholder: "Напишите сообщение клиенту…",
  };
}

export function adminMenuKeyboard() {
  return {
    inline_keyboard: [[
      { text: "👥 Клиенты", callback_data: "clients:list:0" },
    ]],
  };
}

export function clientsKeyboard(clients, { page = 0, hasPrevious = false, hasNext = false } = {}) {
  const rows = clients.map((client) => [{
    text: `${client.name || "Без имени"} · +${client.phone || "—"}`.slice(0, 60),
    callback_data: `clients:view:${client.clientId}`,
  }]);
  const navigation = [];
  if (hasPrevious) navigation.push({ text: "← Назад", callback_data: `clients:list:${page - 1}` });
  if (hasNext) navigation.push({ text: "Дальше →", callback_data: `clients:list:${page + 1}` });
  if (navigation.length) rows.push(navigation);
  rows.push([{ text: "↻ Обновить", callback_data: `clients:list:${page}` }]);
  return { inline_keyboard: rows };
}

export function clientCardKeyboard() {
  return {
    inline_keyboard: [[
      { text: "← К списку клиентов", callback_data: "clients:list:0" },
    ]],
  };
}
