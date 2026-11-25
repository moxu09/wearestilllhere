import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import "./helpers/aliasHooks.mjs";

// The 秋奈 bot (qiunai/utils/ecpayInquiry.js) and app-api call this route. fetch is stubbed:
// no request reaches 綠界 or production.
const MERCHANT = "3002607";
const KEY = "pwFHCqoQZGmho4w6";
const IV = "EkRm7iFT261dpevs";
const SECRET = "test-service-role-key";
Object.assign(process.env, {
  ECPAY_MERCHANT_ID: MERCHANT, ECPAY_HASH_KEY: KEY, ECPAY_HASH_IV: IV, ECPAY_ENV: "stage",
  ECPAY_PUBLIC_BASE_URL: "https://site.test", SUPABASE_SERVICE_ROLE_KEY: SECRET,
});

const { db } = await import("./helpers/fakeSupabaseAdmin.mjs");
const { checkMacValue } = await import("../lib/ecpayMac.ts");
const { resetServiceInquiryCooldown } = await import("../lib/ecpayServiceInquiry.ts");
const { POST } = await import("../app/api/payments/ecpay/service/inquiry/route.ts");

const ORDER = "QD0123456789ABCDEF01";
const queries = [];
let remote = {};

function stubQueryTradeInfo() {
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), "https://payment-stage.ecpay.com.tw/Cashier/QueryTradeInfo/V5");
    const sent = Object.fromEntries(new URLSearchParams(String(init.body)));
    assert.equal(sent.MerchantTradeNo, ORDER);
    assert.equal(sent.CheckMacValue, checkMacValue({ MerchantID: sent.MerchantID, MerchantTradeNo: sent.MerchantTradeNo, TimeStamp: sent.TimeStamp }, KEY, IV));
    queries.push(sent);
    const fields = {
      MerchantID: MERCHANT, MerchantTradeNo: ORDER, TradeNo: "2611260000000009", TradeAmt: "300",
      PaymentDate: "2026/11/26 12:00:00", PaymentType: "ATM_TAISHIN", TradeStatus: "1", ...remote,
    };
    const body = new URLSearchParams({ ...fields, CheckMacValue: checkMacValue(fields, KEY, IV) });
    return new Response(body.toString(), { status: 200 });
  };
}

function row(overrides = {}) {
  return {
    merchant_trade_no: ORDER, organization_code: "qiunai", payment_kind: "draw", amount: 300, status: "pending",
    trade_no: null, fulfillment_status: "pending", created_at: new Date().toISOString(),
    raw_result: { PaymentType: "ATM_TAISHIN", TradeNo: "2611260000000009" }, metadata: { flow: "app" }, ...overrides,
  };
}

function signedRequest(payload, { secret = SECRET, signature } = {}) {
  const body = JSON.stringify({ order: ORDER, source: "manual", userId: "u", channelId: "", timestamp: Math.floor(Date.now() / 1000), ...payload });
  const header = signature ?? createHmac("sha256", secret).update(body).digest("hex");
  return new Request("https://site.test/api/payments/ecpay/service/inquiry", {
    method: "POST", headers: { "Content-Type": "application/json", "X-Ecpay-Bot-Signature": header }, body,
  });
}

async function call(payload, options) {
  const response = await POST(signedRequest(payload, options));
  return { code: response.status, body: await response.json() };
}

const markCalls = () => db.rpcCalls.filter(c => c.name === "ecpay_mark_service_paid");

test.beforeEach(() => {
  db.reset(); queries.length = 0; remote = {}; resetServiceInquiryCooldown();
  stubQueryTradeInfo();
});

test("簽章錯誤、缺少簽章或其他金鑰 → 401，且不查綠界", async () => {
  db.tables.ecpay_service_payments.push(row());
  assert.equal((await call({}, { signature: "" })).code, 401);
  assert.equal((await call({}, { signature: "0".repeat(64) })).code, 401);
  assert.equal((await call({}, { secret: "other" })).code, 401);
  assert.equal(queries.length, 0);
  assert.equal(markCalls().length, 0);
});

test("時間戳超過 5 分鐘 → 401", async () => {
  db.tables.ecpay_service_payments.push(row());
  assert.equal((await call({ timestamp: Math.floor(Date.now() / 1000) - 301 })).code, 401);
  assert.equal((await call({ timestamp: "x" })).code, 401);
  assert.equal(queries.length, 0);
});

test("綠界回報已付款 → 呼叫 ecpay_mark_service_paid 一次，重查不再入帳", async () => {
  db.tables.ecpay_service_payments.push(row());
  const first = await call({});
  assert.equal(first.code, 200);
  assert.equal(first.body.status, "paid");
  assert.equal(markCalls().length, 1);
  assert.deepEqual(
    { order: markCalls()[0].args.p_merchant_trade_no, amount: markCalls()[0].args.p_amount, tradeNo: markCalls()[0].args.p_trade_no },
    { order: ORDER, amount: 300, tradeNo: "2611260000000009" });
  resetServiceInquiryCooldown();
  const second = await call({});
  assert.equal(second.body.status, "paid");
  assert.equal(markCalls().length, 1);
  assert.equal(queries.length, 1, "已付款的單不再查綠界");
});

test("綠界尚未付款 → pending，不入帳；同單短時間重查 → cooldown", async () => {
  remote = { TradeStatus: "0", TradeNo: "", PaymentDate: "" };
  db.tables.ecpay_service_payments.push(row());
  const first = await call({});
  assert.equal(first.code, 200);
  assert.equal(first.body.status, "pending");
  const again = await call({});
  assert.equal(again.body.status, "cooldown");
  assert.ok(again.body.retry_after >= 1);
  assert.equal(queries.length, 1);
  assert.equal(markCalls().length, 0);
});

test("綠界回報非 0／1 狀態 → failed，不入帳", async () => {
  remote = { TradeStatus: "10200095", TradeNo: "" };
  db.tables.ecpay_service_payments.push(row());
  const result = await call({});
  assert.equal(result.body.status, "failed");
  assert.equal(markCalls().length, 0);
});

test("金額不符 → needs_review，拒絕入帳（不採信請求內金額）", async () => {
  remote = { TradeAmt: "30" };
  db.tables.ecpay_service_payments.push(row());
  const result = await call({ amount: 30 });
  assert.equal(result.body.status, "needs_review");
  assert.equal(markCalls().length, 0);
  assert.equal(db.tables.ecpay_service_payments[0].status, "pending");
});

test("模擬付款 → needs_review，不入帳", async () => {
  remote = { SimulatePaid: "1" };
  db.tables.ecpay_service_payments.push(row());
  const result = await call({});
  assert.equal(result.body.status, "needs_review");
  assert.equal(markCalls().length, 0);
});

test("所有付款類別與兩個品牌都可查單", async () => {
  for (const [payment_kind, organization_code] of [["topup", "qiunai"], ["order", "qiunai"], ["draw", "deepnight"]]) {
    db.reset(); resetServiceInquiryCooldown();
    db.tables.ecpay_service_payments.push(row({ payment_kind, organization_code }));
    const result = await call({});
    assert.equal(result.body.status, "paid", `${organization_code} ${payment_kind}`);
  }
  assert.equal(markCalls().length, 1);
});

test("找不到付款單 → 404；編號格式錯誤 → 400", async () => {
  assert.equal((await call({})).code, 404);
  assert.equal((await call({ order: "bad-order!" })).code, 400);
  assert.equal(queries.length, 0);
});

test("綠界連線失敗 → 502 error，不入帳", async () => {
  db.tables.ecpay_service_payments.push(row());
  globalThis.fetch = async () => new Response("", { status: 503 });
  const result = await call({});
  assert.equal(result.code, 502);
  assert.equal(result.body.status, "error");
  assert.equal(markCalls().length, 0);
});
