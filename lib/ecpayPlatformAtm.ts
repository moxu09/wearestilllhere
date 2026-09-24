import { randomUUID } from "node:crypto";
import { getEcpayConfig } from "@/lib/ecpay";
import { isEcpayAtmAvailable } from "@/lib/ecpayAtmSchedule";
import { decryptEcpayInSiteData, encryptEcpayInSiteData } from "@/lib/ecpayInSite";
import { getEcpayInstructions, type EcpayInstructions } from "@/lib/ecpayPaymentInstructions";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type Json = Record<string, unknown>;

function object(value: unknown): Json {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("綠界資料格式錯誤");
  return value as Json;
}

function dateTaipei() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${p.year}/${p.month}/${p.day} ${p.hour}:${p.minute}:${p.second}`;
}

export async function getPlatformAtmInfo(orderId: string, accessToken: string): Promise<EcpayInstructions | null> {
  if (!/^[0-9a-f-]{36}$/i.test(orderId)) throw new Error("訂單編號格式錯誤");
  const admin = getSupabaseAdmin();
  const { data: { user }, error: authError } = await admin.auth.getUser(accessToken);
  if (authError || !user) throw new Error("請先登入會員");
  const { data: payment, error } = await admin.from("ecpay_platform_payments")
    .select("customer_user_id,status,method,raw_result").eq("platform_order_id", orderId).maybeSingle();
  if (error) throw new Error("查詢匯款資訊失敗");
  if (!payment) return null;
  if (payment.customer_user_id !== user.id) throw new Error("找不到你的付款單");
  return payment.status === "pending" && payment.method === "ATM"
    ? getEcpayInstructions(payment.raw_result) : null;
}

// Official spec: https://developers.ecpay.com.tw/28005/ and /28010/ (checked 2026-09-24).
export async function issuePlatformAtm(merchantTradeNo: string): Promise<EcpayInstructions> {
  const gateway = getEcpayConfig();
  if (!isEcpayAtmAvailable() || !gateway.nonCreditAvailable)
    throw new Error("綠界虛擬 ATM 將於 9 月 28 日開放");
  if (!/^[A-Za-z0-9]{1,20}$/.test(merchantTradeNo)) throw new Error("付款編號格式錯誤");
  const admin = getSupabaseAdmin();
  const { data: payment, error } = await admin.from("ecpay_platform_payments")
    .select("platform_order_id,amount,status,method,created_at,raw_result")
    .eq("merchant_trade_no", merchantTradeNo).maybeSingle();
  if (error || !payment || payment.status !== "pending" || payment.method !== "ATM")
    throw new Error("虛擬 ATM 付款單不存在或已完成");
  const { data: order, error: orderError } = await admin.from("platform_orders")
    .select("title,total_amount,paid_amount,payment_method,payment_status,status")
    .eq("id", payment.platform_order_id).maybeSingle();
  if (orderError || !order || order.payment_method !== "transfer" || order.payment_status !== "unpaid" ||
      order.status !== "pending_payment" || Number(order.paid_amount) !== 0 ||
      Number(order.total_amount) !== Number(payment.amount))
    throw new Error("這筆訂單不能再次取號");
  const prior = getEcpayInstructions(payment.raw_result);
  if (prior) {
    if (prior.method !== "ATM") throw new Error("付款單已有其他繳費方式");
    return prior;
  }
  if (Date.now() - Date.parse(payment.created_at) > 24 * 60 * 60 * 1000)
    throw new Error("訂單已超過取號期限，請聯絡客服");
  const amount = Number(payment.amount);
  if (!Number.isSafeInteger(amount) || amount < 16 || amount > 49_999)
    throw new Error("虛擬 ATM 金額須介於 NT$16 至 NT$49,999");

  // A gateway timeout is ambiguous; retain the claim and never generate a second account automatically.
  const attemptId = randomUUID();
  const { error: claimError } = await admin.from("ecpay_insite_attempts").insert({
    merchant_trade_no: merchantTradeNo, payment_kind: "platform", attempt_id: attemptId, status: "creating",
  });
  if (claimError) throw new Error("此付款單正在取號；若未顯示帳號，請聯繫客服查詢，勿重複轉帳");
  const data = {
    MerchantID: gateway.merchantId, ChoosePayment: "ATM",
    OrderInfo: {
      MerchantTradeNo: merchantTradeNo, MerchantTradeDate: dateTaipei(), TotalAmount: amount,
      ReturnURL: `${gateway.baseUrl}/api/payments/ecpay/platform/atm/return`,
      TradeDesc: "深夜不關燈陪陪訂單付款",
      ItemName: String(order.title || "陪陪服務付款").replace(/[&<>#\x00-\x1f]/g, " ").slice(0, 100),
    },
    ATMInfo: { ExpireDate: 3 },
  };
  const host = gateway.stage ? "https://ecpayment-stage.ecpay.com.tw" : "https://ecpayment.ecpay.com.tw";
  const response = await fetch(`${host}/1.0.0/Cashier/GenPaymentCode`, {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
    body: JSON.stringify({ MerchantID: gateway.merchantId,
      RqHeader: { Timestamp: Math.floor(Date.now() / 1000) },
      Data: encryptEcpayInSiteData(data, gateway.hashKey, gateway.hashIv) }),
    signal: AbortSignal.timeout(35_000),
  });
  if (!response.ok) throw new Error(`綠界取號連線失敗（HTTP ${response.status}），請聯繫客服核對`);
  const envelope = object(await response.json());
  if (envelope.MerchantID !== gateway.merchantId || envelope.TransCode !== 1 || typeof envelope.Data !== "string")
    throw new Error("綠界取號傳輸失敗，請聯繫客服核對");
  const result = decryptEcpayInSiteData(envelope.Data, gateway.hashKey, gateway.hashIv);
  const info = object(result.OrderInfo);
  const atm = object(result.ATMInfo);
  if (result.MerchantID !== gateway.merchantId || result.RtnCode !== 1 ||
      info.MerchantTradeNo !== merchantTradeNo || Number(info.TradeAmt) !== amount ||
      info.PaymentType !== "ATM" || String(info.TradeStatus) !== "0" ||
      !/^[A-Za-z0-9]{1,20}$/.test(String(info.TradeNo || "")))
    throw new Error("綠界取號回應與網站訂單不符");
  const issued = { MerchantTradeNo: merchantTradeNo, TradeNo: info.TradeNo,
    TradeAmt: amount, PaymentType: "ATM", ExpireDate: atm.ExpireDate,
    BankCode: atm.BankCode, vAccount: atm.vAccount };
  const instructions = getEcpayInstructions(issued);
  if (!instructions || instructions.method !== "ATM")
    throw new Error("綠界虛擬帳號資料不完整，請聯繫客服核對");
  const { data: saved, error: saveError } = await admin.from("ecpay_platform_payments")
    .update({ raw_result: issued, updated_at: new Date().toISOString() })
    .eq("merchant_trade_no", merchantTradeNo).eq("status", "pending")
    .select("merchant_trade_no").maybeSingle();
  if (saveError || !saved) throw new Error("取號成功但保存失敗，請聯繫客服核對，勿重複轉帳");
  await admin.from("ecpay_insite_attempts").update({ status: "created", updated_at: new Date().toISOString() })
    .eq("merchant_trade_no", merchantTradeNo).eq("attempt_id", attemptId);
  return instructions;
}

export async function settlePlatformAtm(envelope: unknown) {
  const gateway = getEcpayConfig();
  const outer = object(envelope);
  if (!gateway.merchantId || outer.MerchantID !== gateway.merchantId || outer.TransCode !== 1 || typeof outer.Data !== "string")
    throw new Error("綠界付款通知驗證失敗");
  const data = decryptEcpayInSiteData(outer.Data, gateway.hashKey, gateway.hashIv);
  if (data.MerchantID !== gateway.merchantId) throw new Error("綠界付款通知商店代號不符");
  if (data.RtnCode !== 1 || data.SimulatePaid === 1 || data.SimulatePaid === "1") return false;
  const info = object(data.OrderInfo);
  const tradeNo = String(info.TradeNo || "");
  const merchantTradeNo = String(info.MerchantTradeNo || "");
  const amount = Number(info.TradeAmt);
  if (!/^[A-Za-z0-9]{1,20}$/.test(merchantTradeNo) || !/^[A-Za-z0-9]{1,20}$/.test(tradeNo) ||
      !Number.isSafeInteger(amount) || info.PaymentType !== "ATM" || String(info.TradeStatus) !== "1")
    throw new Error("綠界 ATM 付款通知資料不完整");
  const admin = getSupabaseAdmin();
  const { data: payment, error } = await admin.from("ecpay_platform_payments")
    .select("amount,method,raw_result,status").eq("merchant_trade_no", merchantTradeNo).maybeSingle();
  if (error || !payment || payment.method !== "ATM" || Number(payment.amount) !== amount)
    throw new Error("綠界 ATM 付款通知與網站訂單不符");
  const issued = object(payment.raw_result);
  if (issued.PaymentType !== "ATM" || issued.TradeNo !== tradeNo ||
      !getEcpayInstructions(issued))
    throw new Error("綠界 ATM 付款通知與取號紀錄不符");
  const { error: settleError } = await admin.rpc("ecpay_mark_platform_paid", {
    p_merchant_trade_no: merchantTradeNo, p_trade_no: tradeNo, p_amount: amount,
    p_payment_date: typeof info.PaymentDate === "string" ? info.PaymentDate : null,
    p_raw_result: { ...issued, ...data, PaymentType: "ATM", gateway: "ecpay-direct" },
  });
  if (settleError) throw new Error(settleError.message || "網站 ATM 付款入帳失敗");
  return true;
}
