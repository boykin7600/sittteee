import { verifySuccessSignature } from "../lib/robokassa.mjs";

export default async (request) => {
  const params = request.method === "POST"
    ? new URLSearchParams(await request.text())
    : new URL(request.url).searchParams;
  const outSum = params.get("OutSum");
  const invoiceId = params.get("InvId") || params.get("InvID");
  const signature = params.get("SignatureValue");
  const orderId = params.get("Shp_orderId") || "";
  const valid = outSum && invoiceId && signature && orderId
    && verifySuccessSignature({ outSum, invoiceId, orderId, signature });
  const target = new URL("/", request.url);
  target.searchParams.set("payment", valid ? "success" : "checking");
  if (orderId) target.searchParams.set("order", orderId);
  return Response.redirect(target, 302);
};

export const config = { path: "/api/payments/robokassa/success" };
