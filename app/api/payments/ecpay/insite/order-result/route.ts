import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 16384) return new Response("無法顯示付款結果", { status: 413 });
    const body = await request.text();
    if (body.length > 16384) return new Response("無法顯示付款結果", { status: 413 });
    const resultData = new URLSearchParams(body).get("ResultData");
    if (!resultData) throw new Error("付款結果資料不足");
    const outer = JSON.parse(resultData) as { Data?: string };
    // This browser redirect is navigation only. Never settle an order from ResultData.
    const { decryptEcpayInSiteData } = await import("@/lib/ecpayInSite");
    const { getEcpayConfig } = await import("@/lib/ecpay");
    const gateway = getEcpayConfig();
    const data = decryptEcpayInSiteData(String(outer.Data || ""), gateway.hashKey, gateway.hashIv);
    const orderInfo = data.OrderInfo as Record<string, unknown> | undefined;
    const merchantTradeNo = String(orderInfo?.MerchantTradeNo || "");
    if (!/^[A-Za-z0-9]{1,20}$/.test(merchantTradeNo)) throw new Error("付款編號錯誤");
    const { data: attempt } = await getSupabaseAdmin().from("ecpay_insite_attempts")
      .select("payment_kind").eq("merchant_trade_no", merchantTradeNo).maybeSingle();
    if (!attempt) throw new Error("找不到付款單");
    const path = attempt.payment_kind === "service" ? "/payments/ecpay/service/status" : "/merchandise/payment-result";
    const destination = new URL(path, request.url);
    destination.searchParams.set("order", merchantTradeNo);
    return Response.redirect(destination, 303);
  } catch (error) {
    console.error("ECPay in-site OrderResultURL failed", error);
    return new Response("無法確認付款結果，請回到原訂單頁查詢；請勿重複付款。", { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  }
}
