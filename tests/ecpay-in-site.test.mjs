import test from "node:test";
import assert from "node:assert/strict";
import { encryptEcpayInSiteData, decryptEcpayInSiteData, buildEcpayInSiteTokenData, parsePaidCreditNotice, parseInSiteResultOrder } from "../lib/ecpayInSite.ts";

// Source: ECPay-API-Skill/test-vectors/aes-encryption.json, official ECPG vector.
const key = "pwFHCqoQZGmho4w6";
const iv = "EkRm7iFT261dpevs";

test("站內付 AES 加密符合綠界測試向量", () => {
  const data = { MerchantID: "3002607", RespondType: "JSON" };
  const encrypted = encryptEcpayInSiteData(data, key, iv);
  assert.equal(encrypted, "udqjXgM+7Q6lCrrculcvzUFnN5zv0ibax1glKFxrORoO0sl6pcoib/QDYPKCAP57ME4+3Yo84XmyabVFnxriMTuy9JK/RXS7DtEOvF+PUoU=");
  assert.deepEqual(decryptEcpayInSiteData(encrypted, key, iv), data);
});

test("站內付信用卡與 ATM Token 欄位分離", () => {
  const base = { merchantId: "3002607", tradeNo: "TEST202609231234", tradeDate: "2026/09/23 17:24:00", amount: 100,
    description: "測試", itemName: "測試商品", returnUrl: "https://example.com/notify", resultUrl: "https://example.com/result", customerPhone: "0912345678" };
  const credit = buildEcpayInSiteTokenData({ ...base, method: "Credit" });
  const atm = buildEcpayInSiteTokenData({ ...base, method: "ATM" });
  assert.equal(credit.ChoosePaymentList, "1");
  assert.deepEqual(credit.CardInfo, { OrderResultURL: base.resultUrl });
  assert.equal(atm.ChoosePaymentList, "3");
  assert.deepEqual(atm.ATMInfo, { ExpireDate: 3 });
  assert.equal("CardInfo" in atm, false);
});

test("僅已付款、非模擬的信用卡通知可入帳", () => {
  const info = { MerchantTradeNo: "DN12345", TradeNo: "2400000000000000", TradeAmt: 100,
    TradeStatus: "1", PaymentType: "Credit", PaymentDate: "2026/09/23 17:30:00" };
  assert.deepEqual(parsePaidCreditNotice({ RtnCode: 1, OrderInfo: info }), {
    merchantTradeNo: "DN12345", tradeNo: "2400000000000000", amount: 100,
    paymentDate: "2026/09/23 17:30:00",
  });
  assert.equal(parsePaidCreditNotice({ RtnCode: 1, SimulatePaid: 1, OrderInfo: info }), null);
  assert.equal(parsePaidCreditNotice({ RtnCode: 1, OrderInfo: { ...info, TradeStatus: "0" } }), null);
  assert.equal(parsePaidCreditNotice({ RtnCode: 1, OrderInfo: { ...info, PaymentType: "ATM" } }), null);
  assert.throws(() => parsePaidCreditNotice({ RtnCode: 1, OrderInfo: { ...info, TradeAmt: 0 } }));
});

test("瀏覽器付款結果需驗證外層與內層商店代號，且只擷取交易編號", () => {
  const payload = { MerchantID: "3002607", RtnCode: 1, OrderInfo: { MerchantTradeNo: "DN12345" } };
  const envelope = { MerchantID: "3002607", TransCode: 1, Data: encryptEcpayInSiteData(payload, key, iv) };
  assert.equal(parseInSiteResultOrder(envelope, "3002607", key, iv), "DN12345");
  assert.throws(() => parseInSiteResultOrder({ ...envelope, MerchantID: "9999999" }, "3002607", key, iv));
  assert.throws(() => parseInSiteResultOrder({ ...envelope, TransCode: 0 }, "3002607", key, iv));
  assert.throws(() => parseInSiteResultOrder({ ...envelope, Data: encryptEcpayInSiteData({ ...payload, MerchantID: "9999999" }, key, iv) }, "3002607", key, iv));
  assert.throws(() => parseInSiteResultOrder({ ...envelope, Data: encryptEcpayInSiteData({ ...payload, OrderInfo: { MerchantTradeNo: "INVALID-ORDER" } }, key, iv) }, "3002607", key, iv));
});
