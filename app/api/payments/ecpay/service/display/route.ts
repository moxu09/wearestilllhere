import { getEcpayConfig } from "@/lib/ecpay";

export async function POST(request: Request) {
  const body = await request.text();
  if (body.length > 16_384) return new Response("無法查詢付款結果", { status: 413 });
  const fields = Object.fromEntries(new URLSearchParams(body));
  // Source: ECPay AIO OrderResultURL (https://developers.ecpay.com.tw/2862/), checked 2026-09-23.
  // The request origin may be Railway's internal localhost; browser navigation must use the public site.
  const url = new URL("/payments/ecpay/service/status", getEcpayConfig().baseUrl);
  if (/^[A-Za-z0-9]{1,20}$/.test(fields.MerchantTradeNo || ""))
    url.searchParams.set("order", fields.MerchantTradeNo);
  return Response.redirect(url, 303);
}
