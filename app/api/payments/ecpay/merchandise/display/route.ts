import { getEcpayConfig } from "@/lib/ecpay";

export async function POST(request: Request) {
  const fields = Object.fromEntries(new URLSearchParams(await request.text()));
  const order = /^[A-Za-z0-9]{1,20}$/.test(fields.MerchantTradeNo || "")
    ? fields.MerchantTradeNo
    : "";
  // Source: ECPay AIO OrderResultURL (https://developers.ecpay.com.tw/2862/), checked 2026-09-23.
  const url = new URL("/merchandise/payment-result", getEcpayConfig().baseUrl);
  if (order) url.searchParams.set("order", order);
  return Response.redirect(url, 303);
}
