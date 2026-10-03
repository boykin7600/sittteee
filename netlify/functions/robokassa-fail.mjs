export default async (request) => {
  const params = request.method === "POST"
    ? new URLSearchParams(await request.text())
    : new URL(request.url).searchParams;
  const target = new URL("/", request.url);
  target.searchParams.set("payment", "failed");
  const invoiceId = params.get("InvId") || params.get("InvID");
  if (invoiceId) target.searchParams.set("invoice", invoiceId);
  return Response.redirect(target, 302);
};

export const config = { path: "/api/payments/robokassa/fail" };
