import { createOrder, findOrCreateClient } from "../lib/data.mjs";
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
import {
  escapeHTML,
  notifyAdmins,
  orderKeyboard,
  telegramConfigured,
} from "../lib/telegram.mjs";
import { createPaymentURL, robokassaConfigured } from "../lib/robokassa.mjs";

const offers = {
  solo: { title: "1 банка", price: "1 799 ₽", amount: 1799, quantity: 1 },
  ritual: { title: "2 банки", price: "3 399 ₽", amount: 3399, quantity: 2 },
  signature: { title: "3 банки", price: "4 999 ₽", amount: 4999, quantity: 3 },
};

export default async (request) => {
  if (request.method !== "POST") return methodNotAllowed(["POST"]);

  try {
    if (!telegramConfigured()) {
      throw new PublicError("Приём заказов ещё настраивается", 503);
    }

    const body = await readJSON(request);
    const name = cleanText(body.name, 80);
    const phone = normalizePhone(body.phone);
    const city = cleanText(body.city, 100);
    const street = cleanText(body.street, 220);
    if (!name || !city || !street) {
      throw new PublicError("Заполните обязательные поля");
    }

    const offerCode = offers[body.offerCode] ? body.offerCode : "solo";
    const offer = offers[offerCode];
    const sessionId = safeSession(body.sessionId);
    const deliveryMethod = "courier";

    const client = await findOrCreateClient({ name, phone, city });
    const order = await createOrder({
      clientId: client.clientId,
      sessionId,
      name,
      phone,
      city,
      postalCode: cleanText(body.postalCode, 20),
      street,
      house: "",
      apartment: cleanText(body.apartment, 20),
      deliveryMethod,
      comment: cleanText(body.comment, 800),
      offerCode,
      offerTitle: offer.title,
      quantity: offer.quantity,
      price: offer.price,
      amount: offer.amount,
    });

    const address = [
      order.city,
      order.postalCode,
      order.street,
    ].filter(Boolean).join(", ");

    const notification = [
      `🛍 <b>Новый заказ ${escapeHTML(order.orderId)}</b>`,
      `Клиент: <b>${escapeHTML(client.clientId)}</b>`,
      "",
      `👤 ${escapeHTML(name)}`,
      `📞 +${escapeHTML(phone)}`,
      `📍 ${escapeHTML(address || city)}`,
      `📦 ${escapeHTML(offer.title)} · <b>${escapeHTML(offer.price)}</b>`,
      order.comment ? `💬 ${escapeHTML(order.comment)}` : "",
    ].filter(Boolean).join("\n");

    const delivery = await notifyAdmins(notification, {
      reply_markup: orderKeyboard(order.orderId),
    });

    if (!delivery.delivered) {
      console.error("Order saved but no Telegram notification was delivered", order.orderId);
    }

    let paymentUrl = null;
    if (robokassaConfigured()) {
      paymentUrl = createPaymentURL({
        amount: offer.amount,
        invoiceId: order.number,
        orderId: order.orderId,
        description: `KONONOV · ${offer.title}`,
      });
    }

    return json({
      ok: true,
      orderId: order.orderId,
      clientId: client.clientId,
      paymentUrl,
    }, 201);
  } catch (error) {
    return handleError(error);
  }
};

export const config = {
  path: "/api/orders",
  method: "POST",
  rateLimit: { action: "rate_limit", aggregateBy: ["domain", "ip"], windowSize: 60, windowLimit: 8 },
};
