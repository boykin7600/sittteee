import { createHash, timingSafeEqual } from "node:crypto";

const PAYMENT_URL = "https://auth.robokassa.ru/Merchant/Index.aspx";

export function robokassaConfigured() {
  return Boolean(
    process.env.ROBOKASSA_MERCHANT_LOGIN
      && process.env.ROBOKASSA_PASSWORD_1
      && process.env.ROBOKASSA_PASSWORD_2,
  );
}

function digest(value) {
  const algorithm = String(process.env.ROBOKASSA_HASH_ALGORITHM || "MD5").toLowerCase();
  if (algorithm !== "md5") {
    throw new Error("ROBOKASSA_HASH_ALGORITHM must match the MD5 setting in Robokassa");
  }
  return createHash(algorithm).update(value, "utf8").digest("hex");
}

export function money(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Invalid payment amount");
  return amount.toFixed(2);
}

function signatureEquals(actual, expected) {
  const left = Buffer.from(String(actual || "").toLowerCase(), "utf8");
  const right = Buffer.from(String(expected || "").toLowerCase(), "utf8");
  return left.length === right.length && timingSafeEqual(left, right);
}

function shopParameters(orderId) {
  return `Shp_orderId=${orderId}`;
}

export function createPaymentURL({ amount, invoiceId, orderId, description }) {
  if (!robokassaConfigured()) throw new Error("Robokassa is not configured");
  const merchant = process.env.ROBOKASSA_MERCHANT_LOGIN;
  const outSum = money(amount);
  const invId = String(invoiceId);
  const shp = shopParameters(orderId);
  const signature = digest(
    `${merchant}:${outSum}:${invId}:${process.env.ROBOKASSA_PASSWORD_1}:${shp}`,
  );
  const query = new URLSearchParams({
    MerchantLogin: merchant,
    OutSum: outSum,
    InvId: invId,
    Description: String(description || "Заказ KONONOV").slice(0, 100),
    SignatureValue: signature,
    Culture: "ru",
    Encoding: "utf-8",
    Shp_orderId: orderId,
  });
  if (String(process.env.ROBOKASSA_TEST_MODE || "").toLowerCase() === "true") {
    query.set("IsTest", "1");
  }
  return `${PAYMENT_URL}?${query.toString()}`;
}

export function verifyResultSignature({ outSum, invoiceId, orderId, signature }) {
  const expected = digest(
    `${money(outSum)}:${invoiceId}:${process.env.ROBOKASSA_PASSWORD_2}:${shopParameters(orderId)}`,
  );
  return signatureEquals(signature, expected);
}

export function verifySuccessSignature({ outSum, invoiceId, orderId, signature }) {
  const expected = digest(
    `${money(outSum)}:${invoiceId}:${process.env.ROBOKASSA_PASSWORD_1}:${shopParameters(orderId)}`,
  );
  return signatureEquals(signature, expected);
}
