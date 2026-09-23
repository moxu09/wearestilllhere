import { createCipheriv, createDecipheriv } from "node:crypto";

// Source: https://developers.ecpay.com.tw/9103/ (checked 2026-09-23).
// ECPG Data uses URL-encoded JSON inside AES-128-CBC/PKCS7, then standard Base64.
function aesUrlEncode(value: string) {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/~/g, "%7E")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

function aesKey(value: string, name: string) {
  const bytes = Buffer.from(value, "utf8");
  if (bytes.length !== 16) throw new Error(`綠界 ${name} 長度錯誤`);
  return bytes;
}

export function encryptEcpayInSiteData(data: Record<string, unknown>, hashKey: string, hashIv: string) {
  const cipher = createCipheriv("aes-128-cbc", aesKey(hashKey, "HashKey"), aesKey(hashIv, "HashIV"));
  return Buffer.concat([cipher.update(aesUrlEncode(JSON.stringify(data)), "utf8"), cipher.final()]).toString("base64");
}

export function decryptEcpayInSiteData(cipherText: string, hashKey: string, hashIv: string): Record<string, unknown> {
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(cipherText) || !cipherText)
    throw new Error("綠界加密資料格式錯誤");
  const decipher = createDecipheriv("aes-128-cbc", aesKey(hashKey, "HashKey"), aesKey(hashIv, "HashIV"));
  const plain = Buffer.concat([decipher.update(Buffer.from(cipherText, "base64")), decipher.final()]).toString("utf8");
  const decoded: unknown = JSON.parse(decodeURIComponent(plain.replace(/\+/g, "%20")));
  if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) throw new Error("綠界回應資料格式錯誤");
  return decoded as Record<string, unknown>;
}

export type EcpayInSiteMethod = "Credit" | "ATM" | "CVS" | "BARCODE";

// Only a paid, non-simulated server notification may settle an order.
// Source: https://developers.ecpay.com.tw/9058/ (live checked 2026-09-23).
export function parsePaidCreditNotice(data: Record<string, unknown>): {
  merchantTradeNo: string; tradeNo: string; amount: number; paymentDate: string | null;
} | null {
  if (data.RtnCode !== 1 || data.SimulatePaid === 1 || data.SimulatePaid === "1") return null;
  const order = data.OrderInfo;
  if (!order || typeof order !== "object" || Array.isArray(order)) throw new Error("綠界付款通知缺少訂單資料");
  const info = order as Record<string, unknown>;
  if (String(info.TradeStatus) !== "1" || info.PaymentType !== "Credit") return null;
  const merchantTradeNo = String(info.MerchantTradeNo || "");
  const tradeNo = String(info.TradeNo || "");
  const amount = Number(info.TradeAmt);
  if (!/^[A-Za-z0-9]{1,20}$/.test(merchantTradeNo) || !/^[A-Za-z0-9]{1,20}$/.test(tradeNo) ||
      !Number.isSafeInteger(amount) || amount <= 0) throw new Error("綠界付款通知交易資料不完整");
  return { merchantTradeNo, tradeNo, amount, paymentDate: typeof info.PaymentDate === "string" ? info.PaymentDate : null };
}

// The browser result is navigation only; it must never settle an order.
// Source: https://developers.ecpay.com.tw/15076/ (checked 2026-09-23).
export function parseInSiteResultOrder(envelope: unknown, merchantId: string, hashKey: string, hashIv: string): string {
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope))
    throw new Error("綠界付款結果格式錯誤");
  const outer = envelope as Record<string, unknown>;
  if (!merchantId || outer.MerchantID !== merchantId || outer.TransCode !== 1 || typeof outer.Data !== "string")
    throw new Error("綠界付款結果外層驗證失敗");
  const data = decryptEcpayInSiteData(outer.Data, hashKey, hashIv);
  if (data.MerchantID !== merchantId) throw new Error("綠界付款結果商店代號不符");
  const orderInfo = data.OrderInfo;
  if (!orderInfo || typeof orderInfo !== "object" || Array.isArray(orderInfo))
    throw new Error("綠界付款結果缺少訂單資料");
  const merchantTradeNo = (orderInfo as Record<string, unknown>).MerchantTradeNo;
  if (typeof merchantTradeNo !== "string" || !/^[A-Za-z0-9]{1,20}$/.test(merchantTradeNo))
    throw new Error("綠界付款結果交易編號錯誤");
  return merchantTradeNo;
}

const choice: Record<EcpayInSiteMethod, string> = { Credit: "1", ATM: "3", CVS: "4", BARCODE: "5" };

export function buildEcpayInSiteTokenData(input: {
  merchantId: string;
  tradeNo: string;
  tradeDate: string;
  amount: number;
  description: string;
  itemName: string;
  returnUrl: string;
  resultUrl: string;
  method: EcpayInSiteMethod;
  customerPhone?: string;
  customerEmail?: string;
}) {
  if (!(input.method in choice)) throw new Error("綠界付款方式不支援");
  if (!/^[A-Za-z0-9]{1,20}$/.test(input.tradeNo)) throw new Error("綠界交易編號格式錯誤");
  if (!Number.isSafeInteger(input.amount) || input.amount <= 0) throw new Error("綠界交易金額錯誤");
  if (!input.customerPhone && !input.customerEmail) throw new Error("綠界付款需要聯絡電話或電子郵件");
  const orderInfo = {
    MerchantTradeDate: input.tradeDate,
    MerchantTradeNo: input.tradeNo,
    TotalAmount: input.amount,
    ReturnURL: input.returnUrl,
    TradeDesc: input.description,
    ItemName: input.itemName,
  };
  // Source: https://developers.ecpay.com.tw/9040/ (checked 2026-09-23).
  return {
    MerchantID: input.merchantId,
    RememberCard: 0,
    PaymentUIType: 2,
    ChoosePaymentList: choice[input.method],
    OrderInfo: orderInfo,
    ...(input.method === "Credit" ? { CardInfo: { OrderResultURL: input.resultUrl } } : {}),
    ...(input.method === "ATM" ? { ATMInfo: { ExpireDate: 3 } } : {}),
    ...(input.method === "CVS" ? { CVSInfo: { StoreExpireDate: 4320 } } : {}),
    ...(input.method === "BARCODE" ? { BarcodeInfo: { StoreExpireDate: 3 } } : {}),
    ConsumerInfo: { ...(input.customerPhone ? { Phone: input.customerPhone } : {}), ...(input.customerEmail ? { Email: input.customerEmail } : {}) },
  };
}

export async function callEcpayInSiteApi(input: {
  merchantId: string;
  hashKey: string;
  hashIv: string;
  stage: boolean;
  endpoint: "GetTokenbyTrade" | "CreatePayment";
  data: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const host = input.stage ? "https://ecpg-stage.ecpay.com.tw" : "https://ecpg.ecpay.com.tw";
  // Source: https://developers.ecpay.com.tw/9040/ and https://developers.ecpay.com.tw/9053/ (checked 2026-09-23).
  const response = await fetch(`${host}/Merchant/${input.endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      MerchantID: input.merchantId,
      RqHeader: { Timestamp: Math.floor(Date.now() / 1000) },
      Data: encryptEcpayInSiteData(input.data, input.hashKey, input.hashIv),
    }),
    // Source: https://developers.ecpay.com.tw/9053/ recommends >=30 seconds for CreatePayment.
    signal: AbortSignal.timeout(input.endpoint === "CreatePayment" ? 35_000 : 15_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`綠界站內付連線失敗（HTTP ${response.status}）`);
  const outer: unknown = await response.json();
  if (!outer || typeof outer !== "object" || Array.isArray(outer)) throw new Error("綠界站內付回應格式錯誤");
  const envelope = outer as Record<string, unknown>;
  if (envelope.MerchantID !== input.merchantId) throw new Error("綠界站內付商店代號不符");
  if (envelope.TransCode !== 1) throw new Error(`綠界站內付傳輸失敗（${String(envelope.TransCode)}）`);
  if (typeof envelope.Data !== "string") throw new Error("綠界站內付缺少回應資料");
  const data = decryptEcpayInSiteData(envelope.Data, input.hashKey, input.hashIv);
  if (data.RtnCode !== 1) throw new Error(`綠界站內付交易失敗（${String(data.RtnCode ?? "未知")}）`);
  return data;
}
