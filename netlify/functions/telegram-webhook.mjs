import {
  appendChatMessage,
  getClientOrders,
  getJSON,
  isAdmin,
  isPermanentAdmin,
  listClients,
  listAdmins,
  putJSON,
  remove,
  updateOrder,
} from "../lib/data.mjs";
import { cleanText, handleError, json, methodNotAllowed, readJSON, safeSession } from "../lib/http.mjs";
import {
  adminMenuKeyboard,
  chatReplyPrompt,
  clientCardKeyboard,
  clientsKeyboard,
  escapeHTML,
  notifyAdmins,
  sendMessage,
  telegram,
} from "../lib/telegram.mjs";

const statusNames = {
  accepted: "принят",
  processing: "в работе",
  shipped: "отправлен",
  cancelled: "отменён",
};

const helpText = [
  "<b>KONONOV · панель администратора</b>",
  "",
  "/invite — создать ссылку для нового администратора",
  "/addadmin 123456789 — добавить по Telegram ID",
  "/removeadmin 123456789 — удалить администратора",
  "/admins — показать администраторов",
  "/clients — открыть базу клиентов",
  "/reply SESSION сообщение — ответить в чат сайта",
  "/help — показать команды",
  "",
  "Кнопки «Клиенты» и «Помощь» закреплены внизу чата.",
  "Под новой анкетой нажмите «Взять в работу» или «Завершить».",
  "Для ответа клиенту удобнее нажать кнопку под сообщением и отправить следующий текст.",
].join("\n");

const clientPageSize = 8;

function formatDate(value) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function statusLabel(status) {
  return statusNames[status] || (status === "new" ? "новая заявка" : status || "—");
}

async function showClients(chatId, rawPage = 0) {
  const requestedPage = Math.max(Number.parseInt(rawPage, 10) || 0, 0);
  let result = await listClients({ limit: clientPageSize, offset: requestedPage * clientPageSize });
  const lastPage = Math.max(Math.ceil(result.total / clientPageSize) - 1, 0);
  const page = Math.min(requestedPage, lastPage);
  if (page !== requestedPage) {
    result = await listClients({ limit: clientPageSize, offset: page * clientPageSize });
  }

  if (!result.total) {
    await sendMessage(chatId, [
      "👥 <b>Клиенты</b>",
      "",
      "Пока заявок нет. Первый клиент появится здесь сразу после заполнения формы на сайте.",
    ].join("\n"), { reply_markup: adminMenuKeyboard() });
    return;
  }

  await sendMessage(chatId, [
    `👥 <b>Клиенты · ${result.total}</b>`,
    "",
    "Нажмите на клиента, чтобы увидеть контакты и его заявки.",
    `Страница ${page + 1} из ${lastPage + 1}`,
  ].join("\n"), {
    reply_markup: clientsKeyboard(result.clients, {
      page,
      hasPrevious: page > 0,
      hasNext: page < lastPage,
    }),
  });
}

async function showClientCard(chatId, clientId) {
  const client = await getJSON(`client/${clientId}`);
  if (!client) {
    await sendMessage(chatId, "Клиент не найден. Возможно, запись была удалена.", {
      reply_markup: clientCardKeyboard(),
    });
    return;
  }
  const history = await getClientOrders(clientId, 10);
  const orderLines = history.orders.length
    ? history.orders.map((order) => [
      `• <b>${escapeHTML(order.orderId)}</b> · ${escapeHTML(order.offerTitle || "Заказ")}`,
      `  ${escapeHTML(order.price || "—")} · ${escapeHTML(statusLabel(order.status))} · ${escapeHTML(formatDate(order.createdAt))}`,
    ].join("\n"))
    : ["• Заявок пока нет"];

  await sendMessage(chatId, [
    `👤 <b>${escapeHTML(client.name || "Без имени")}</b>`,
    `<code>${escapeHTML(client.clientId)}</code>`,
    "",
    `📞 <code>+${escapeHTML(client.phone || "—")}</code>`,
    client.city ? `📍 ${escapeHTML(client.city)}` : "",
    `🕒 В базе с ${escapeHTML(formatDate(client.createdAt))}`,
    `🛍 Заявок: <b>${history.total}</b>`,
    "",
    "<b>Последние заявки</b>",
    ...orderLines,
  ].filter(Boolean).join("\n"), {
    reply_markup: clientCardKeyboard(),
  });
}

async function registerAdmin(user, chatId, source = "start") {
  const id = String(user.id);
  const previous = await getJSON(`admin/${id}`);
  await putJSON(`admin/${id}`, {
    ...previous,
    userId: id,
    chatId: String(chatId),
    username: user.username || previous?.username || "",
    firstName: user.first_name || previous?.firstName || "",
    active: true,
    source: previous?.source || source,
    updatedAt: new Date().toISOString(),
    createdAt: previous?.createdAt || new Date().toISOString(),
  });
}

async function claimInvite(payload, user, chatId) {
  const token = payload.replace(/^admin_/, "");
  const invite = await getJSON(`invite/${token}`);
  if (!invite || invite.usedAt || new Date(invite.expiresAt).getTime() < Date.now()) {
    await sendMessage(chatId, "Ссылка недействительна или уже использована. Попросите создать новую командой /invite.");
    return;
  }
  await registerAdmin(user, chatId, "invite");
  await putJSON(`invite/${token}`, {
    ...invite,
    usedAt: new Date().toISOString(),
    usedBy: String(user.id),
  });
  await sendMessage(chatId, `✅ Вы добавлены как администратор.\n\n${helpText}`, {
    reply_markup: adminMenuKeyboard(),
  });
  await notifyAdmins(`👤 Добавлен администратор: <b>${escapeHTML(user.first_name || user.username || user.id)}</b> · <code>${user.id}</code>`);
}

async function createInvite(chatId, creatorId) {
  const token = crypto.randomUUID().replaceAll("-", "").slice(0, 24);
  const bot = await telegram("getMe");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await putJSON(`invite/${token}`, {
    token,
    createdBy: String(creatorId),
    createdAt: new Date().toISOString(),
    expiresAt,
    usedAt: null,
  }, { onlyIfNew: true });
  const link = `https://t.me/${bot.username}?start=admin_${token}`;
  await sendMessage(chatId, [
    "👤 <b>Приглашение администратора</b>",
    "",
    "Отправьте эту ссылку человеку. Ему нужно открыть её и нажать Start:",
    link,
    "",
    "Ссылка одноразовая и действует 24 часа.",
  ].join("\n"));
}

async function addAdminById(chatId, rawId, creatorId) {
  const targetId = String(rawId || "").replace(/\D/g, "");
  if (!targetId) {
    await sendMessage(chatId, "Формат: <code>/addadmin 123456789</code>");
    return;
  }
  const previous = await getJSON(`admin/${targetId}`);
  await putJSON(`admin/${targetId}`, {
    ...previous,
    userId: targetId,
    chatId: previous?.chatId || targetId,
    active: true,
    source: "manual",
    addedBy: String(creatorId),
    updatedAt: new Date().toISOString(),
    createdAt: previous?.createdAt || new Date().toISOString(),
  });

  try {
    await sendMessage(targetId, `✅ Вас добавили как администратора KONONOV.\n\n${helpText}`);
    await sendMessage(chatId, `✅ Администратор <code>${targetId}</code> добавлен и получил уведомление.`);
  } catch (error) {
    console.error("Could not notify new admin", error);
    await sendMessage(chatId, [
      `⚠️ ID <code>${targetId}</code> сохранён, но Telegram не разрешил отправить уведомление.`,
      "Человек должен сначала самостоятельно открыть бота и нажать Start.",
      "Надёжнее использовать команду /invite.",
    ].join("\n"));
  }
}

async function showAdmins(chatId) {
  const ids = await listAdmins();
  await sendMessage(chatId, ids.length
    ? `👥 <b>Активные получатели уведомлений</b>\n${ids.map((id) => `• <code>${escapeHTML(id)}</code>`).join("\n")}`
    : "Активных администраторов пока нет.");
}

async function deliverReply(adminId, chatId, sessionId, body) {
  const session = safeSession(sessionId);
  const conversation = await getJSON(`chat/${session}`);
  if (!conversation) {
    await sendMessage(chatId, "Диалог не найден. Возможно, клиент ещё не отправил сообщение.");
    return;
  }
  const message = {
    id: crypto.randomUUID(),
    direction: "admin",
    body: cleanText(body, 1000),
    adminId: String(adminId),
    createdAt: new Date().toISOString(),
  };
  if (!message.body) {
    await sendMessage(chatId, "Ответ пустой — отправьте текст ещё раз.");
    return;
  }
  await appendChatMessage(session, message);
  await remove(`admin-state/${adminId}`);
  const clientLabel = conversation.identity?.clientId || conversation.identity?.name || "клиент";
  await sendMessage(chatId, `✅ Ответ отправлен: <b>${escapeHTML(clientLabel)}</b>. Клиент увидит его в чате на сайте.`);
}

async function handleMessage(message) {
  const chatId = String(message.chat.id);
  const user = message.from || {};
  const userId = String(user.id || "");
  const text = cleanText(message.text, 1500);
  if (!userId || !text) return;

  const [commandWithBot, ...args] = text.split(" ");
  const command = commandWithBot.toLowerCase().split("@")[0];

  if (command === "/start" && args[0]?.startsWith("admin_")) {
    await claimInvite(args[0], user, chatId);
    return;
  }

  const authorized = await isAdmin(userId);
  if (command === "/start") {
    if (authorized) {
      await registerAdmin(user, chatId, "start");
      await sendMessage(chatId, `✅ Администратор подключён.\n\n${helpText}`, {
        reply_markup: adminMenuKeyboard(),
      });
    } else {
      await sendMessage(chatId, "Здравствуйте! Это служебный бот KONONOV. Для связи используйте чат поддержки на сайте.");
    }
    return;
  }

  if (!authorized) {
    await sendMessage(chatId, "У вас нет доступа к административным командам.");
    return;
  }

  await registerAdmin(user, chatId, "command");

  if (text === "👥 Клиенты") return showClients(chatId, 0);
  if (text === "ℹ️ Помощь") return sendMessage(chatId, helpText, { reply_markup: adminMenuKeyboard() });

  if (command === "/cancel") {
    await remove(`admin-state/${userId}`);
    return sendMessage(chatId, "Отправка ответа отменена.");
  }
  if (command === "/help") return sendMessage(chatId, helpText, { reply_markup: adminMenuKeyboard() });
  if (command === "/invite") return createInvite(chatId, userId);
  if (command === "/admins") return showAdmins(chatId);
  if (command === "/clients") return showClients(chatId, 0);
  if (command === "/addadmin") return addAdminById(chatId, args[0], userId);
  if (command === "/removeadmin") {
    const targetId = String(args[0] || "").replace(/\D/g, "");
    if (!targetId) return sendMessage(chatId, "Формат: <code>/removeadmin 123456789</code>");
    if (isPermanentAdmin(targetId) || String(process.env.PRIMARY_ADMIN_ID || "").split(",").map((x) => x.trim()).includes(targetId)) {
      return sendMessage(chatId, "Основного администратора нужно менять в настройках Netlify.");
    }
    const admin = await getJSON(`admin/${targetId}`);
    await putJSON(`admin/${targetId}`, { ...admin, userId: targetId, active: false, updatedAt: new Date().toISOString() });
    return sendMessage(chatId, `✅ Администратор <code>${targetId}</code> отключён.`);
  }
  if (command === "/reply") {
    const sessionId = args.shift();
    return deliverReply(userId, chatId, sessionId, args.join(" "));
  }

  const state = await getJSON(`admin-state/${userId}`);
  if (state?.mode === "chat-reply") {
    const stateAge = Date.now() - new Date(state.createdAt || 0).getTime();
    if (!Number.isFinite(stateAge) || stateAge > 30 * 60 * 1000) {
      await remove(`admin-state/${userId}`);
      return sendMessage(chatId, "Время ответа истекло. Нажмите «Ответить клиенту» под сообщением ещё раз.");
    }
    return deliverReply(userId, chatId, state.sessionId, text);
  }

  await sendMessage(chatId, `Команда не распознана.\n\n${helpText}`);
}

async function handleCallback(callback) {
  const userId = String(callback.from?.id || "");
  const chatId = String(callback.message?.chat?.id || userId);
  if (!await isAdmin(userId)) {
    await telegram("answerCallbackQuery", { callback_query_id: callback.id, text: "Нет доступа", show_alert: true });
    return;
  }

  const [kind, action, ...rest] = String(callback.data || "").split(":");
  const id = rest.join(":");
  if (kind === "quizlead" && (action === "take" || action === "done")) {
    const status = action === "take" ? "В работе" : "Завершено";
    const previousText = String(callback.message?.text || "");
    const cleanPreviousText = previousText.replace(/\n*<b>Статус обработки:<\/b>[^\n]*(?:\n[\s\S]*)?$/, "");
    await telegram("editMessageText", {
      chat_id: chatId,
      message_id: callback.message?.message_id,
      text: `${cleanPreviousText}\n\n<b>Статус обработки:</b> ${status}`,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: action === "take"
        ? { inline_keyboard: [[{ text: "✅ Завершить", callback_data: "quizlead:done" }]] }
        : { inline_keyboard: [] },
    });
    await telegram("answerCallbackQuery", {
      callback_query_id: callback.id,
      text: action === "take" ? "Анкета взята в работу" : "Анкета завершена",
    });
    return;
  }

  if (kind === "clients" && action === "list") {
    await telegram("answerCallbackQuery", {
      callback_query_id: callback.id,
      text: "Открываю клиентов…",
    });
    await showClients(chatId, id);
    return;
  }

  if (kind === "clients" && action === "view" && /^C-\d{6}$/.test(id)) {
    await telegram("answerCallbackQuery", {
      callback_query_id: callback.id,
      text: "Открываю карточку…",
    });
    await showClientCard(chatId, id);
    return;
  }

  if (kind === "chat" && action === "reply") {
    // Stop Telegram's loading spinner immediately, before any database work.
    await telegram("answerCallbackQuery", {
      callback_query_id: callback.id,
      text: "Открываю поле для ответа…",
    });

    try {
      const sessionId = safeSession(id);
      const conversation = await getJSON(`chat/${sessionId}`);
      if (!conversation) {
        await sendMessage(chatId, "Диалог уже недоступен. Попросите клиента отправить новое сообщение.");
        return;
      }

      await putJSON(`admin-state/${userId}`, {
        mode: "chat-reply",
        sessionId,
        sourceMessageId: callback.message?.message_id || null,
        createdAt: new Date().toISOString(),
      });

      const clientLabel = conversation.identity?.clientId || conversation.identity?.name || "клиент";
      await sendMessage(chatId, [
        `✍️ <b>Ответ для ${escapeHTML(clientLabel)}</b>`,
        "",
        "Напишите сообщение в появившемся поле и отправьте его.",
        "Для отмены используйте /cancel.",
      ].join("\n"), {
        reply_markup: chatReplyPrompt(),
      });
    } catch (error) {
      console.error("Could not prepare chat reply", error);
      await remove(`admin-state/${userId}`).catch(() => {});
      await sendMessage(chatId, "Не удалось открыть ответ. Попробуйте нажать кнопку ещё раз.");
    }
    return;
  }

  if (kind === "order" && statusNames[action] && /^K-\d{6}$/.test(id)) {
    const order = await updateOrder(id, { status: action, statusChangedBy: userId });
    await telegram("answerCallbackQuery", { callback_query_id: callback.id, text: `Заказ ${statusNames[action]}` });
    await notifyAdmins(`📌 Заказ <b>${escapeHTML(order.orderId)}</b>: ${escapeHTML(statusNames[action])}.`);
    return;
  }

  await telegram("answerCallbackQuery", { callback_query_id: callback.id, text: "Действие устарело" });
}

export default async (request) => {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);
  try {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (!secret || request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
      return json({ error: "Unauthorized" }, 401);
    }
    const update = await readJSON(request, 256_000);
    if (update.callback_query) await handleCallback(update.callback_query);
    else if (update.message) await handleMessage(update.message);
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
};

export const config = { path: "/api/telegram/webhook", method: "POST" };
