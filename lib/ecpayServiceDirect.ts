import { randomUUID } from "node:crypto";
import { getEcpayConfig } from "@/lib/ecpay";
import { decryptEcpayInSiteData, encryptEcpayInSiteData } from "@/lib/ecpayInSite";
import { getEcpayInstructions, type EcpayInstructions } from "@/lib/ecpayPaymentInstructions";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type Method = "ATM" | "CVS" | "BARCODE";
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

function amountAllowed(method: Method, amount: number) {
  const limits = { ATM: [16, 49_999], CVS: [34, 20_000], BARCODE: [18, 20_000] }[method];
  return Number.isSafeInteger(amount) && amount >= limits[0] && amount <= limits[1];
}

function normalizedInstructions(method: Method, result: Json, order: string, amount: number) {
  const info = object(result.OrderInfo);
  if (result.MerchantID !== getEcpayConfig().merchantId || result.RtnCode !== 1 ||
      info.MerchantTradeNo !== order || Number(info.TradeAmt) !== amount ||
      info.PaymentType !== method || String(info.TradeStatus) !== "0" ||
      !/^[A-Za-z0-9]{1,20}$/.test(String(info.TradeNo || "")))
    throw new Error("綠界取號回應與訂單不符");
  const details = object(result[method === "ATM" ? "ATMInfo" : method === "CVS" ? "CVSInfo" : "BarcodeInfo"]);
  const flat: Record<string, unknown> = {
    MerchantTradeNo: order, TradeNo: info.TradeNo, TradeAmt: amount,
    PaymentType: method, ExpireDate: details.ExpireDate,
  };
  if (method === "ATM") { flat.BankCode = details.BankCode; flat.vAccount = details.vAccount; }
  if (method === "CVS") flat.PaymentNo = details.PaymentNo;
  if (method === "BARCODE") {
    flat.Barcode1 = details.Barcode1; flat.Barcode2 = details.Barcode2; flat.Barcode3 = details.Barcode3;
  }
  const instructions = getEcpayInstructions(flat);
  if (!instructions) throw new Error("綠界取號資訊格式不完整，請聯繫客服核對");
  return { flat, instructions };
}

// Sources: https://developers.ecpay.com.tw/27995/ , /28000/ , /28005/ (live checked 2026-09-23).
export async function issueServiceDirect(order: string, method: Method): Promise<EcpayInstructions> {
  const gateway = getEcpayConfig();
  if (!gateway.nonCreditAvailable) throw new Error("綠界 ATM／超商付款尚未開放");
  if (!/^[A-Za-z0-9]{1,20}$/.test(order) || !["ATM", "CVS", "BARCODE"].includes(method))
    throw new Error("付款方式或編號錯誤");
  const admin = getSupabaseAdmin();
  const { data: payment, error } = await admin.from("ecpay_service_payments")
    .select("amount,status,created_at,payment_kind,description,organization_code,raw_result")
    .eq("merchant_trade_no", order).maybeSingle();
  if (error || !payment || payment.status !== "pending") throw new Error("付款單不存在或已完成");
  if (Date.now() - Date.parse(payment.created_at) > 24 * 60 * 60 * 1000) throw new Error("付款單已過期");
  const amount = Number(payment.amount);
  if (!amountAllowed(method, amount)) throw new Error("此金額不適用所選的綠界付款方式");
  if (payment.payment_kind === "topup" && method !== "ATM") throw new Error("儲值僅開放信用卡或 ATM");
  const prior = getEcpayInstructions(payment.raw_result);
  if (prior) {
    if (prior.method !== method) throw new Error("此付款單已選擇其他繳費方式，請使用原資訊");
    return prior;
  }

  // Existing unique key also prevents a simultaneous card token or a second code request.
  const attemptId = randomUUID();
  const { error: claimError } = await admin.from("ecpay_insite_attempts").insert({
    merchant_trade_no: order, payment_kind: "service", attempt_id: attemptId, status: "creating",
  });
  if (claimError) throw new Error("此付款單已開始建立付款資料；請勿重複操作，若未顯示資訊請聯繫客服");

  const description = String(payment.description || "服務付款").replace(/[&<>#\x00-\x1f]/g, " ").slice(0, 100);
  const data = {
    MerchantID: gateway.merchantId, ChoosePayment: method,
    OrderInfo: {
      MerchantTradeNo: order, MerchantTradeDate: dateTaipei(), TotalAmount: amount,
      ReturnURL: `${gateway.baseUrl}/api/payments/ecpay/service/direct-return`,
      TradeDesc: payment.organization_code === "qiunai" ? "秋奈電競服務付款" : "深夜不關燈服務付款",
      ItemName: description || "服務付款",
    },
    ...(method === "ATM" ? { ATMInfo: { ExpireDate: 3 } } : {}),
    ...(method === "CVS" ? { CVSInfo: { ExpireDate: 4320, CVSCode: "CVS" } } : {}),
    ...(method === "BARCODE" ? { BarcodeInfo: { ExpireDate: 3 } } : {}),
  };
  const host = gateway.stage ? "https://ecpayment-stage.ecpay.com.tw" : "https://ecpayment.ecpay.com.tw";
  // A timeout is ambiguous: keep the unique claim and require reconciliation instead of issuing a duplicate code.
  const response = await fetch(`${host}/1.0.0/Cashier/GenPaymentCode`, {
    method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
    body: JSON.stringify({ MerchantID: gateway.merchantId, RqHeader: { Timestamp: Math.floor(Date.now() / 1000) },
      Data: encryptEcpayInSiteData(data, gateway.hashKey, gateway.hashIv) }),
    signal: AbortSignal.timeout(35_000),
  });
  if (!response.ok) throw new Error(`綠界取號連線失敗（HTTP ${response.status}），請聯繫客服核對`);
  const envelope = object(await response.json());
  if (envelope.MerchantID !== gateway.merchantId || envelope.TransCode !== 1 || typeof envelope.Data !== "string")
    throw new Error("綠界取號傳輸失敗，請聯繫客服核對");
  const result = decryptEcpayInSiteData(envelope.Data, gateway.hashKey, gateway.hashIv);
  if (result.RtnCode !== 1)
    throw new Error(`綠界取號未成功（代碼 ${String(result.RtnCode ?? "未知")}），請聯繫客服核對`);
  const { flat, instructions } = normalizedInstructions(method, result, order, amount);
  const { data: saved, error: saveError } = await admin.from("ecpay_service_payments")
    .update({ raw_result: flat, updated_at: new Date().toISOString() })
    .eq("merchant_trade_no", order).eq("status", "pending").select("merchant_trade_no").maybeSingle();
  if (saveError || !saved) throw new Error("取號成功但保存失敗，請聯繫客服核對，勿重複付款");
  await admin.from("ecpay_insite_attempts").update({ status: "created", updated_at: new Date().toISOString() })
    .eq("merchant_trade_no", order).eq("attempt_id", attemptId);
  return instructions;
}

// Source: https://developers.ecpay.com.tw/28010/ (live checked 2026-09-23).
export async function settleServiceDirect(envelope: unknown) {
  const gateway = getEcpayConfig();
  const outer = object(envelope);
  if (!gateway.merchantId || outer.MerchantID !== gateway.merchantId || outer.TransCode !== 1 || typeof outer.Data !== "string")
    throw new Error("綠界付款通知驗證失敗");
  const data = decryptEcpayInSiteData(outer.Data, gateway.hashKey, gateway.hashIv);
  if (data.MerchantID !== gateway.merchantId) throw new Error("綠界付款通知商店代號不符");
  if (data.RtnCode !== 1 || data.SimulatePaid === 1 || data.SimulatePaid === "1") return false;
  const info = object(data.OrderInfo);
  const order = String(info.MerchantTradeNo || "");
  const tradeNo = String(info.TradeNo || "");
  const amount = Number(info.TradeAmt);
  if (!/^[A-Za-z0-9]{1,20}$/.test(order) || !/^[A-Za-z0-9]{1,20}$/.test(tradeNo) ||
      !Number.isSafeInteger(amount) || String(info.TradeStatus) !== "1" ||
      !["ATM", "CVS", "BARCODE"].includes(String(info.PaymentType)))
    throw new Error("綠界付款通知資料不完整");
  const admin = getSupabaseAdmin();
  const { data: payment, error } = await admin.from("ecpay_service_payments")
    .select("amount,raw_result,status").eq("merchant_trade_no", order).maybeSingle();
  if (error || !payment || Number(payment.amount) !== amount) throw new Error("綠界付款通知與訂單金額不符");
  const issued = object(payment.raw_result);
  if (issued.PaymentType !== info.PaymentType || issued.TradeNo !== tradeNo)
    throw new Error("綠界付款通知與取號紀錄不符");
  const { error: settleError } = await admin.rpc("ecpay_mark_service_paid", {
    p_merchant_trade_no: order, p_trade_no: tradeNo, p_amount: amount,
    p_payment_date: typeof info.PaymentDate === "string" ? info.PaymentDate : null,
    p_raw_result: { ...issued, ...data, gateway: "ecpay-direct" },
  });
  if (settleError) throw new Error(settleError.message || "綠界服務付款入帳失敗");
  return true;
}
