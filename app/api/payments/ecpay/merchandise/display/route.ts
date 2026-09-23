export async function POST(request: Request) {
  const fields = Object.fromEntries(new URLSearchParams(await request.text()));
  const order = /^[A-Za-z0-9]{1,20}$/.test(fields.MerchantTradeNo || "")
    ? fields.MerchantTradeNo
    : "";
  const url = new URL("/merchandise/payment-result", request.url);
  if (order) url.searchParams.set("order", order);
  return Response.redirect(url, 303);
}
