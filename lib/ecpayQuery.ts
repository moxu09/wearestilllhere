import { checkMacValue, verifyEcpayMac } from "./ecpayMac.ts";

type EcpayQueryConfig = {
  merchantId: string;
  hashKey: string;
  hashIv: string;
  stage: boolean;
};

export type EcpayTrade = {
  merchantTradeNo: string;
  tradeNo: string;
  amount: number;
  status: "paid" | "pending" | "failed";
  paymentDate: string | null;
  raw: Record<string, string>;
};

export async function queryEcpayTrade(
  config: EcpayQueryConfig,
  merchantTradeNo: string,
  fetcher: typeof fetch = fetch,
): Promise<EcpayTrade> {
  if (!config.merchantId || !config.hashKey || !config.hashIv) throw new Error("綠界商戶金鑰未設定");
  if (!/^[A-Za-z0-9]{1,20}$/.test(merchantTradeNo)) throw new Error("綠界交易編號格式錯誤");
  const fields: Record<string, string> = {
    MerchantID: config.merchantId,
    MerchantTradeNo: merchantTradeNo,
    TimeStamp: String(Math.floor(Date.now() / 1000)),
  };
  fields.CheckMacValue = checkMacValue(fields, config.hashKey, config.hashIv);
  const endpoint = config.stage
    ? "https://payment-stage.ecpay.com.tw/Cashier/QueryTradeInfo/V5"
    : "https://payment.ecpay.com.tw/Cashier/QueryTradeInfo/V5";
  const response = await fetcher(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(fields),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`綠界查詢失敗（HTTP ${response.status}）`);
  const body = await response.text();
  if (body.length > 16_384) throw new Error("綠界查詢回應過長");
  const returned = Object.fromEntries(new URLSearchParams(body));
  if (
    returned.MerchantID !== config.merchantId ||
    returned.MerchantTradeNo !== merchantTradeNo ||
    !verifyEcpayMac(returned, config.hashKey, config.hashIv)
  ) throw new Error("綠界查詢回應驗證失敗");
  const amount = Number(returned.TradeAmt);
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error("綠界查詢金額無效");
  const status = returned.TradeStatus === "1"
    ? "paid"
    : returned.TradeStatus === "0"
      ? "pending"
      : "failed";
  if (status === "paid" && !returned.TradeNo) throw new Error("綠界查詢缺少交易序號");
  return {
    merchantTradeNo,
    tradeNo: returned.TradeNo || "",
    amount,
    status,
    paymentDate: returned.PaymentDate || null,
    raw: returned,
  };
}
