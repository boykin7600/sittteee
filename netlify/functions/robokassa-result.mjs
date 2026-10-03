import { getJSON, updateOrder } from "../lib/data.mjs";
import { notifyAdmins, escapeHTML } from "../lib/telegram.mjs";
import { money, robokassaConfigured, verifyResultSignature } from "../lib/robokassa.mjs";

const text = (body, status = 200) => new Response(body, {
  status,
  headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
});

async function parameters(request) {
  if (request.method === "POST") {
    return new URLSearchParams(await request.text());
  }
  return new URL(request.url).searchParams;
}

export default async (request) => {
  if (!robokassaConfigured()) return text("Robokassa is not configured", 503);
  if (!["GET", "POST"].includes(request.method)) return text("Method not allowed", 405);

  try {
    const params = await parameters(request);
    const outSum = params.get("OutSum") || params.get("outSum");
    const invoiceId = params.get("InvId") || params.get("InvID") || params.get("invoiceID");
    const signature = params.get("SignatureValue");
    const orderId = params.get("Shp_orderId");
    if (!outSum || !invoiceId || !signature || !/^K-\d{6}$/.test(orderId || "")) {
      return text("Invalid payment data", 400);
    }
    if (!verifyResultSignature({ outSum, invoiceId, orderId, signature })) {
      return text("Invalid signature", 403);
    }

    const order = await getJSON(`order/${orderId}`);
    if (!order || String(order.number) !== String(Number(invoiceId))) return text("Order not found", 404);
    if (money(order.amount) !== money(outSum)) return text("Invalid amount", 400);

    if (order.status !== "paid") {
      await updateOrder(orderId, {
        status: "paid",
        paidAt: new Date().toISOString(),
        paymentProvider: "robokassa",
        paymentInvoiceId: String(invoiceId),
        paidAmount: money(outSum),
      });
      await notifyAdmins([
        `💳 <b>Оплачен заказ ${escapeHTML(orderId)}</b>`,
        `Сумма: <b>${escapeHTML(money(outSum))} ₽</b>`,
        `Клиент: ${escapeHTML(order.name)} · +${escapeHTML(order.phone)}`,
      ].join("\n"));
    }

    return text(`OK${invoiceId}`);
  } catch (error) {
    console.error("Robokassa ResultURL error", error);
    return text("Temporary error", 500);
  }
};

export const config = {
  path: "/api/payments/robokassa/result",
};
