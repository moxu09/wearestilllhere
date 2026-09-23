import { getEcpayConfig, verifyEcpayCallback } from "@/lib/ecpay";
import { isEcpayFailedResultCode } from "@/lib/ecpayResult";

export async function POST(request: Request) {
  const fields = Object.fromEntries(new URLSearchParams(await request.text()));
  const verified = verifyEcpayCallback(fields);
  const order = verified && /^[A-Za-z0-9]{1,20}$/.test(fields.MerchantTradeNo || "")
    ? fields.MerchantTradeNo
    : "";
  // Source: ECPay AIO OrderResultURL (https://developers.ecpay.com.tw/2862/), checked 2026-09-23.
  const url = new URL("/merchandise/payment-result", getEcpayConfig().baseUrl);
  if (order) url.searchParams.set("order", order);
  // Source: https://developers.ecpay.com.tw/2878/ — front-end result is navigation only.
  if (order && isEcpayFailedResultCode(fields.RtnCode)) url.searchParams.set("result", "failed");
  return Response.redirect(url, 303);
}
