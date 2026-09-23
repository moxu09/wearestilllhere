export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > 16_384) return new Response("無法查詢付款結果", { status: 413 });
  const fields = Object.fromEntries(new URLSearchParams(body));
  const url = new URL("/payments/ecpay/service/status", request.url);
  if (/^[A-Za-z0-9]{1,20}$/.test(fields.MerchantTradeNo || ""))
    url.searchParams.set("order", fields.MerchantTradeNo);
  return Response.redirect(url, 303);
}
