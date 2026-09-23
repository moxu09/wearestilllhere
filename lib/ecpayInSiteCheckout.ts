import { randomUUID } from "node:crypto";
import { getEcpayConfig } from "@/lib/ecpay";
import { buildEcpayInSiteTokenData, callEcpayInSiteApi, decryptEcpayInSiteData, parsePaidCreditNotice } from "@/lib/ecpayInSite";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type InSiteKind = "service" | "merchandise" | "platform";
type ObjectValue = Record<string, unknown>;

function object(value: unknown): ObjectValue {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("綠界資料格式錯誤");
  return value as ObjectValue;
}

function tradeNo(value: unknown): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9]{1,20}$/.test(value)) throw new Error("付款編號格式錯誤");
  return value;
}

function safeText(value: unknown, limit: number): string {
  return String(value || "").replace(/[<>#&\x00-\x1f]/g, " ").replace(/\s+/g, " ").trim().slice(0, limit);
}

function tradeDate(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${p.year}/${p.month}/${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

function config() {
  const result = getEcpayConfig();
  if (!result.merchantId || !result.hashKey || !result.hashIv || process.env.ECPAY_INSITE_ACCEPT_PAYMENTS !== "true")
    throw new Error("站內付目前尚未開放");
  return result;
}

async function payableOrder(kind: InSiteKind, merchantTradeNo: string) {
  const admin = getSupabaseAdmin();
  if (kind === "service") {
    const { data, error } = await admin.from("ecpay_service_payments")
      .select("amount,status,description,organization_code,created_at,payment_kind")
      .eq("merchant_trade_no", merchantTradeNo).maybeSingle();
    if (error || !data || data.status !== "pending") throw new Error("付款單不存在或已完成");
    if (Date.now() - Date.parse(data.created_at) > 24 * 60 * 60 * 1000)
      throw new Error("付款連結已過期，請回到 Discord 重新建立訂單");
    return { amount: Number(data.amount), phone: "", description: data.organization_code === "qiunai" ? "秋奈電競服務付款" : "深夜不關燈服務付款", itemName: safeText(data.description, 100) || "服務付款" };
  }
  if (kind === "platform") {
    const { data: payment, error: paymentError } = await admin.from("ecpay_platform_payments")
      .select("platform_order_id,amount,status,created_at")
      .eq("merchant_trade_no", merchantTradeNo).maybeSingle();
    if (paymentError || !payment || payment.status !== "pending")
      throw new Error("網站刷卡付款單不存在或已完成");
    if (Date.now() - Date.parse(payment.created_at) > 24 * 60 * 60 * 1000)
      throw new Error("刷卡付款單已過期，請回到訂單頁聯絡客服");
    const { data: order, error: orderError } = await admin.from("platform_orders")
      .select("title,total_amount,paid_amount,payment_method,payment_status,status")
      .eq("id", payment.platform_order_id).maybeSingle();
    if (orderError || !order || order.payment_method !== "card" ||
        order.payment_status !== "unpaid" || order.status !== "pending_payment" ||
        Number(order.paid_amount) !== 0 || Number(order.total_amount) !== Number(payment.amount))
      throw new Error("這筆網站訂單不能再次刷卡付款");
    return { amount: Number(payment.amount), phone: "", description: "深夜不關燈陪陪服務付款",
      itemName: safeText(order.title, 100) || "陪陪服務付款" };
  }
  const { data, error } = await admin.from("merchandise_orders")
    .select("total_amount,status,payment_method,phone,items,created_at")
    .eq("platform_order_id", merchantTradeNo).maybeSingle();
  if (error || !data || data.status !== "pending" || data.payment_method !== "綠界支付")
    throw new Error("商品付款單不存在或已完成");
  if (Date.now() - Date.parse(data.created_at) > 24 * 60 * 60 * 1000)
    throw new Error("商品付款單已過期，請重新下單");
  const items = Array.isArray(data.items) ? data.items : [];
  return { amount: Number(data.total_amount), phone: String(data.phone || ""), description: "深夜不關燈周邊商品", itemName: items.map((item: unknown) => {
    const product = object(item);
    return safeText(`${product.name || "商品"} x${product.quantity || 1}`, 80);
  }).join("#").slice(0, 190) || "周邊商品" };
}

// Source: https://developers.ecpay.com.tw/9040/ and /9053/ (live checked 2026-09-23).
export async function createInSiteToken(input: {
  kind: InSiteKind; merchantTradeNo: string; phone?: string; email?: string;
}) {
  const gateway = config();
  const merchantTradeNo = tradeNo(input.merchantTradeNo);
  const order = await payableOrder(input.kind, merchantTradeNo);
  if (!Number.isSafeInteger(order.amount) || order.amount < 6 || order.amount > 199_999)
    throw new Error("信用卡付款金額不符合綠界限制");
  const phone = input.phone?.replace(/[\s-]/g, "") || order.phone;
  const email = input.email?.trim() || "";
  if (phone && !/^09\d{8}$/.test(phone)) throw new Error("請填寫正確的台灣手機號碼");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("請填寫正確的電子郵件");
  if (!phone && !email) throw new Error("請填寫手機號碼或電子郵件");

  const admin = getSupabaseAdmin();
  const attemptId = randomUUID();
  const { error: insertError } = await admin.from("ecpay_insite_attempts").insert({
    merchant_trade_no: merchantTradeNo, payment_kind: input.kind, attempt_id: attemptId,
    status: "token_requested",
  });
  if (insertError) throw new Error(insertError.code === "23505"
    ? "此付款單已建立站內付交易；請勿重複付款，請先查詢結果"
    : "站內付交易記錄建立失敗，請稍後再試");
  try {
    const tokenData = buildEcpayInSiteTokenData({
      merchantId: gateway.merchantId, tradeNo: merchantTradeNo, tradeDate: tradeDate(),
      amount: order.amount, description: order.description, itemName: order.itemName,
      returnUrl: `${gateway.baseUrl}/api/payments/ecpay/insite/return`,
      resultUrl: `${gateway.baseUrl}/api/payments/ecpay/insite/order-result`,
      method: "Credit", customerPhone: phone || undefined, customerEmail: email || undefined,
    });
    const result = await callEcpayInSiteApi({
      merchantId: gateway.merchantId, hashKey: gateway.hashKey, hashIv: gateway.hashIv,
      stage: gateway.stage, endpoint: "GetTokenbyTrade", data: tokenData,
    });
    if (typeof result.Token !== "string" || !result.Token) throw new Error("綠界未提供付款畫面驗證碼");
    const { data: saved, error } = await admin.from("ecpay_insite_attempts").update({
      status: "token_ready", token_expires_at: new Date(Date.now() + 8 * 60_000).toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("merchant_trade_no", merchantTradeNo).eq("attempt_id", attemptId).eq("status", "token_requested")
      .select("merchant_trade_no").maybeSingle();
    if (error || !saved) throw new Error("無法保存站內付交易狀態");
    return { token: result.Token, attemptId, merchantTradeNo, stage: gateway.stage, amount: order.amount };
  } catch (error) {
    await admin.from("ecpay_insite_attempts").update({ status: "token_failed", updated_at: new Date().toISOString() })
      .eq("merchant_trade_no", merchantTradeNo).eq("attempt_id", attemptId).eq("status", "token_requested");
    throw error;
  }
}

export async function submitInSitePayment(input: {
  kind: InSiteKind; merchantTradeNo: string; attemptId: string; payToken: string;
}) {
  const gateway = config();
  const merchantTradeNo = tradeNo(input.merchantTradeNo);
  if (!/^[0-9a-f-]{36}$/i.test(input.attemptId)) throw new Error("付款工作階段錯誤");
  if (typeof input.payToken !== "string" || !input.payToken.trim() || input.payToken.length > 4096)
    throw new Error("付款代碼錯誤");
  await payableOrder(input.kind, merchantTradeNo);
  const admin = getSupabaseAdmin();
  const { data: claimed, error: claimError } = await admin.rpc("ecpay_insite_claim_create", {
    p_merchant_trade_no: merchantTradeNo, p_payment_kind: input.kind, p_attempt_id: input.attemptId,
  });
  if (claimError || claimed !== true) throw new Error("這筆付款已送出或付款畫面已過期；請先查詢付款結果");
  // The claim remains 'creating' on timeout: never retry an ambiguous charge automatically.
  const result = await callEcpayInSiteApi({
    merchantId: gateway.merchantId, hashKey: gateway.hashKey, hashIv: gateway.hashIv,
    stage: gateway.stage, endpoint: "CreatePayment",
    data: { MerchantID: gateway.merchantId, PayToken: input.payToken, MerchantTradeNo: merchantTradeNo },
  });
  const orderInfo = object(result.OrderInfo);
  if (orderInfo.MerchantTradeNo !== merchantTradeNo) throw new Error("綠界交易編號不符，請聯繫客服核對");
  const threeDUrl = object(result.ThreeDInfo || {}).ThreeDURL;
  if (threeDUrl && (typeof threeDUrl !== "string" || new URL(threeDUrl).protocol !== "https:"))
    throw new Error("綠界 3D 驗證網址格式錯誤");
  const { data: saved, error: updateError } = await admin.from("ecpay_insite_attempts").update({
    status: "created", updated_at: new Date().toISOString(),
  }).eq("merchant_trade_no", merchantTradeNo).eq("attempt_id", input.attemptId).eq("status", "creating")
    .select("merchant_trade_no").maybeSingle();
  if (updateError || !saved) throw new Error("交易已建立，但付款狀態保存失敗；請查詢付款結果");
  return { threeDUrl: typeof threeDUrl === "string" ? threeDUrl : null, merchantTradeNo };
}

// Source: https://developers.ecpay.com.tw/9058/ (live checked 2026-09-23).
export async function handleInSiteReturn(envelope: unknown) {
  const gateway = getEcpayConfig();
  const outer = object(envelope);
  if (!gateway.merchantId || outer.MerchantID !== gateway.merchantId || outer.TransCode !== 1 || typeof outer.Data !== "string")
    throw new Error("綠界付款通知外層驗證失敗");
  const data = decryptEcpayInSiteData(outer.Data, gateway.hashKey, gateway.hashIv);
  if (data.MerchantID !== gateway.merchantId) throw new Error("綠界付款通知商店代號不符");
  const notice = parsePaidCreditNotice(data);
  if (!notice) return false;
  const { merchantTradeNo, tradeNo: tradeNoValue, amount } = notice;
  const { data: attempt, error } = await getSupabaseAdmin().from("ecpay_insite_attempts")
    .select("payment_kind,status").eq("merchant_trade_no", merchantTradeNo).maybeSingle();
  if (error || !attempt || !["creating", "created"].includes(attempt.status))
    throw new Error("找不到站內付交易紀錄");
  const rpc = attempt.payment_kind === "service" ? "ecpay_mark_service_paid"
    : attempt.payment_kind === "platform" ? "ecpay_mark_platform_paid"
    : attempt.payment_kind === "merchandise" ? "complete_ecpay_merchandise_order" : null;
  if (!rpc) throw new Error("站內付交易類別錯誤");
  const { error: settleError } = await getSupabaseAdmin().rpc(rpc, {
    p_merchant_trade_no: merchantTradeNo, p_trade_no: tradeNoValue, p_amount: amount,
    p_payment_date: notice.paymentDate,
    p_raw_result: {
      gateway: "ecpay-insite", MerchantTradeNo: merchantTradeNo, TradeNo: tradeNoValue,
      TradeAmt: amount, PaymentType: "Credit", PaymentDate: notice.paymentDate,
    },
  });
  if (settleError) throw new Error(settleError.message || "站內付入帳失敗");
  return true;
}
