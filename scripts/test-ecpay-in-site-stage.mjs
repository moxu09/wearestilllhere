import { randomBytes } from "node:crypto";
import { buildEcpayInSiteTokenData, callEcpayInSiteApi } from "../lib/ecpayInSite.ts";

// Official shared stage credentials; never run this script against production.
const merchantId = "3002607";
const hashKey = "pwFHCqoQZGmho4w6";
const hashIv = "EkRm7iFT261dpevs";
const now = new Date();
const date = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
}).formatToParts(now);
const part = Object.fromEntries(date.map(item => [item.type, item.value]));
const tradeDate = `${part.year}/${part.month}/${part.day} ${part.hour}:${part.minute}:${part.second}`;
const tradeNo = `ST${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString("hex").toUpperCase()}`;
const data = buildEcpayInSiteTokenData({
  merchantId, tradeNo, tradeDate, amount: 100, description: "測試商品", itemName: "測試商品",
  returnUrl: "https://example.com/ecpay/notify", resultUrl: "https://example.com/ecpay/result",
  method: "Credit", customerPhone: "0912345678",
});
try {
  const result = await callEcpayInSiteApi({ merchantId, hashKey, hashIv, stage: true, endpoint: "GetTokenbyTrade", data });
  if (typeof result.Token !== "string" || !result.Token) throw new Error("未取得付款 Token");
  process.stdout.write(`stage token 成功；RtnCode=${result.RtnCode}；交易編號=${tradeNo}\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : "未知錯誤"}\n`);
  process.exitCode = 1;
}
