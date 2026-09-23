import test from "node:test";
import assert from "node:assert/strict";
import { queryEcpayTrade } from "../lib/ecpayQuery.ts";
import { checkMacValue } from "../lib/ecpayMac.ts";

const config = { merchantId: "1234567", hashKey: "1234567890123456", hashIv: "ABCDEFGHIJKLMNOP", stage: false };
const tradeNo = "DNWTEST123";

function fakeResponse(overrides = {}) {
  const fields = {
    MerchantID: config.merchantId,
    MerchantTradeNo: tradeNo,
    TradeNo: "987654321",
    TradeAmt: "100",
    TradeStatus: "1",
    PaymentDate: "2026/09/23 12:00:00",
    ...overrides,
  };
  fields.CheckMacValue = checkMacValue(fields, config.hashKey, config.hashIv);
  return new Response(new URLSearchParams(fields).toString());
}

test("查單需驗證綠界回應檢查碼、交易編號與金額", async () => {
  const result = await queryEcpayTrade(config, tradeNo, async (url, options) => {
    assert.equal(url, "https://payment.ecpay.com.tw/Cashier/QueryTradeInfo/V5");
    assert.equal(options.method, "POST");
    assert.equal(new URLSearchParams(options.body).get("MerchantTradeNo"), tradeNo);
    return fakeResponse();
  });
  assert.equal(result.status, "paid");
  assert.equal(result.amount, 100);
  assert.equal(result.tradeNo, "987654321");
});

test("拒絕偽造的查單回應", async () => {
  const forged = fakeResponse();
  const fields = new URLSearchParams(await forged.text());
  fields.set("TradeAmt", "1");
  await assert.rejects(
    queryEcpayTrade(config, tradeNo, async () => new Response(fields.toString())),
    /驗證失敗/,
  );
});

test("拒絕不同訂單的查單回應", async () => {
  await assert.rejects(
    queryEcpayTrade(config, tradeNo, async () => fakeResponse({ MerchantTradeNo: "OTHER" })),
    /驗證失敗/,
  );
});
