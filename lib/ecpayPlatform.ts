import { randomBytes } from "node:crypto";
import { getEcpayConfig } from "@/lib/ecpay";
import { isEcpayAtmAvailable } from "@/lib/ecpayAtmSchedule";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function createPlatformPayment(orderId: string, accessToken: string, siteOrigin: string, method: "Credit" | "ATM" = "Credit") {
  if (method === "Credit" && !getEcpayConfig().inSiteAvailable) throw new Error("綠界站內刷卡尚未開放");
  if (method === "ATM" && (!isEcpayAtmAvailable() || !getEcpayConfig().nonCreditAvailable))
    throw new Error("綠界虛擬 ATM 將於 9 月 28 日開放");
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) throw new Error("訂單編號格式錯誤");
  if (!["https://wearestilllhere.com", "https://www.wearestilllhere.com"].includes(siteOrigin))
    throw new Error("網站來源錯誤");
  const admin = getSupabaseAdmin();
  const { data: { user }, error: authError } = await admin.auth.getUser(accessToken);
  if (authError || !user) throw new Error("請先登入會員");
  const { data: order, error: orderError } = await admin.from("platform_orders")
    .select("id,customer_user_id,total_amount,paid_amount,payment_method,payment_status,status,created_at")
    .eq("id", orderId).maybeSingle();
  if (orderError || !order || order.customer_user_id !== user.id) throw new Error("找不到你的待付款訂單");
  if (order.payment_method !== (method === "Credit" ? "card" : "transfer") || order.payment_status !== "unpaid" ||
      order.status !== "pending_payment" || Number(order.paid_amount) !== 0)
    throw new Error("這筆訂單不能使用所選付款方式");
  const amount = Number(order.total_amount);
  const [minimum, maximum] = method === "Credit" ? [6, 199_999] : [16, 49_999];
  if (!Number.isSafeInteger(amount) || amount < minimum || amount > maximum)
    throw new Error(method === "Credit" ? "站內刷卡金額須介於 NT$6 至 NT$199,999" : "虛擬 ATM 金額須介於 NT$16 至 NT$49,999");
  if (Date.now() - Date.parse(order.created_at) > 24 * 60 * 60 * 1000)
    throw new Error("訂單已超過付款期限，請聯絡客服");

  const { data: existing, error: existingError } = await admin.from("ecpay_platform_payments")
    .select("merchant_trade_no,status,method").eq("platform_order_id", orderId).maybeSingle();
  if (existingError) throw new Error("無法確認網站付款單");
  if (existing) {
    if (existing.status !== "pending" || existing.method !== method) throw new Error("這筆訂單已有其他付款單，請重新整理訂單頁");
    return method === "Credit"
      ? { insiteUrl: `/payments/ecpay/platform/insite?order=${encodeURIComponent(existing.merchant_trade_no)}` }
      : { merchantTradeNo: existing.merchant_trade_no };
  }
  const merchantTradeNo = `P${randomBytes(9).toString("hex").toUpperCase()}`;
  const { error: insertError } = await admin.from("ecpay_platform_payments").insert({
    merchant_trade_no: merchantTradeNo, platform_order_id: orderId,
    customer_user_id: user.id, amount, site_origin: siteOrigin, method,
  });
  if (insertError) {
    if (insertError.code !== "23505") throw new Error("無法建立網站付款單");
    const { data: raced } = await admin.from("ecpay_platform_payments")
      .select("merchant_trade_no,status,method").eq("platform_order_id", orderId).maybeSingle();
    if (!raced || raced.status !== "pending" || raced.method !== method) throw new Error("付款單已建立，請回到訂單頁查詢");
    return method === "Credit"
      ? { insiteUrl: `/payments/ecpay/platform/insite?order=${encodeURIComponent(raced.merchant_trade_no)}` }
      : { merchantTradeNo: raced.merchant_trade_no };
  }
  return method === "Credit"
    ? { insiteUrl: `/payments/ecpay/platform/insite?order=${merchantTradeNo}` }
    : { merchantTradeNo };
}
