import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { parseInSiteResultOrder } from "@/lib/ecpayInSite";
import { getEcpayConfig } from "@/lib/ecpay";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 16384) return new Response("無法顯示付款結果", { status: 413 });
    const body = await request.text();
    if (body.length > 16384) return new Response("無法顯示付款結果", { status: 413 });
    const resultData = new URLSearchParams(body).get("ResultData");
    if (!resultData) throw new Error("付款結果資料不足");
    const outer: unknown = JSON.parse(resultData);
    // This browser redirect is navigation only. Never settle an order from ResultData.
    const gateway = getEcpayConfig();
    const merchantTradeNo = parseInSiteResultOrder(outer, gateway.merchantId, gateway.hashKey, gateway.hashIv);
    const { data: attempt } = await getSupabaseAdmin().from("ecpay_insite_attempts")
      .select("payment_kind").eq("merchant_trade_no", merchantTradeNo).maybeSingle();
    if (!attempt) throw new Error("找不到付款單");
    const path = attempt.payment_kind === "service" ? "/payments/ecpay/service/status"
      : attempt.payment_kind === "platform" ? "/payments/ecpay/platform/status"
      : attempt.payment_kind === "merchandise" ? "/merchandise/payment-result" : null;
    if (!path) throw new Error("站內付交易類別錯誤");
    const destination = new URL(path, request.url);
    destination.searchParams.set("order", merchantTradeNo);
    return Response.redirect(destination, 303);
  } catch (error) {
    console.error("ECPay in-site OrderResultURL failed", error);
    return new Response("無法確認付款結果，請回到原訂單頁查詢；請勿重複付款。", { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  }
}
