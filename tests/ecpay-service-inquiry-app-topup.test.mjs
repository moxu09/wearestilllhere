import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import "./helpers/aliasHooks.mjs";

// APP 超商條碼／超商代碼／ATM 儲值 rows (app-api api/src/topupOffline.ts) through the signed inquiry route.
// fetch is stubbed: no request reaches 綠界 or production.
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
const { resetServiceInquiryLimits } = await import("../lib/ecpayServiceInquiry.ts");
const { isAppDirectTopupPayment } = await import("../lib/ecpayServiceKind.ts");
const { POST } = await import("../app/api/payments/ecpay/service/inquiry/route.ts");

const ORDER = "QN0123456789ABCDEF01";
const TRADE_NO = "2611260000000077";
const USER = "123456789012345678";
const CREATED = "2026-11-26T02:00:00.000Z";
const queries = [];
let remote = {};

function stubQueryTradeInfo() {
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), "https://payment-stage.ecpay.com.tw/Cashier/QueryTradeInfo/V5");
    const sent = Object.fromEntries(new URLSearchParams(String(init.body)));
    queries.push(sent);
    const fields = {
      MerchantID: MERCHANT, MerchantTradeNo: sent.MerchantTradeNo, TradeNo: TRADE_NO, TradeAmt: "500",
      PaymentDate: "2026/11/26 12:00:00", PaymentType: "CVS_CVS", TradeStatus: "1", ...remote,
    };
    const body = new URLSearchParams({ ...fields, CheckMacValue: checkMacValue(fields, KEY, IV) });
    return new Response(body.toString(), { status: 200 });
  };
}

// Exactly the row app-api's offline topup writes, after the website's direct-issue saved the CVS code.
function topup(overrides = {}, metadata = {}) {
  return {
    merchant_trade_no: ORDER, organization_code: "qiunai", payment_kind: "topup", entity_key: "TOP-2026112600",
    user_id: USER, amount: 500, channel_id: "", status: "pending", trade_no: null, fulfillment_status: "pending",
    created_at: CREATED,
    metadata: { topupNo: "TOP-2026112600", guildId: "g", note: "APP 超商／ATM 儲值", flow: "app", method: "cvs", issue: "direct",
      requestId: "11111111-2222-4333-8444-555555555555", ...metadata },
    raw_result: { MerchantTradeNo: ORDER, TradeNo: TRADE_NO, TradeAmt: 500, PaymentType: "CVS", PaymentNo: "LLL22251222", ExpireDate: "2026/11/29 10:00:00" },
    ...overrides,
  };
}

async function call(order = ORDER) {
  const body = JSON.stringify({ order, source: "scheduled", timestamp: Math.floor(Date.now() / 1000) });
  const response = await POST(new Request("https://site.test/api/payments/ecpay/service/inquiry", {
    method: "POST", body,
    headers: { "Content-Type": "application/json", "X-Ecpay-Bot-Signature": createHmac("sha256", SECRET).update(body).digest("hex") },
  }));
  return { code: response.status, body: await response.json() };
}

const markCalls = () => db.rpcCalls.filter(c => c.name === "ecpay_mark_service_paid");
const inquiry = () => db.tables.ecpay_service_inquiries.find(q => q.merchant_trade_no === ORDER);
const reset = () => { db.reset(); Object.assign(db.tables, { wallet_logs: [], bot_manual_topups: [], bot_financial_operations: [] }); };

test.beforeEach(() => {
  reset(); queries.length = 0; remote = {}; resetServiceInquiryLimits();
  stubQueryTradeInfo();
});

test("只接受 APP 直接取號的儲值單；其他儲值（Discord、APP 信用卡、深夜、格式不符）→ 409，不查綠界", async () => {
  assert.equal(isAppDirectTopupPayment(topup()), true);
  for (const method of ["atm", "barcode"]) assert.equal(isAppDirectTopupPayment(topup({}, { method })), true, method);
  const others = {
    discordTopup: topup({ metadata: { topupNo: "TOP-1", guildId: "g" } }),
    appCreditCard: topup({ metadata: { topupNo: "TOP-1", guildId: "g", note: "APP 儲值", flow: "app" } }),
    noIssueFlag: topup({}, { issue: undefined }),
    otherIssue: topup({}, { issue: "checkout" }),
    otherFlow: topup({}, { flow: "self_service" }),
    creditMethod: topup({}, { method: "credit" }),
    noRequestId: topup({}, { requestId: undefined }),
    deepnight: topup({ organization_code: "deepnight" }),
    lowercaseTradeNo: topup({ merchant_trade_no: "QN0123456789abcdef01" }),
    deepnightPrefix: topup({ merchant_trade_no: "DN0123456789ABCDEF01" }),
    order: topup({ payment_kind: "order" }),
    nullMetadata: topup({ metadata: null }),
  };
  for (const [name, row] of Object.entries(others)) {
    assert.equal(isAppDirectTopupPayment(row), false, name);
    reset();
    db.tables.ecpay_service_payments.push(row);
    const result = await call(row.merchant_trade_no);
    assert.equal(result.code, 409, name);
    assert.equal(db.tables.ecpay_service_inquiries.length, 0, name);
  }
  assert.equal(queries.length, 0);
  assert.equal(markCalls().length, 0);
});

test("綠界已付款 → 以同一 RPC 入帳一次（金額、交易序號）；重查不再查綠界、不重複入帳", async () => {
  db.tables.ecpay_service_payments.push(topup());
  const first = await call();
  assert.equal(first.code, 200);
  assert.deepEqual(first.body, { status: "paid", fulfillment_status: "pending" });
  assert.equal(markCalls().length, 1);
  assert.deepEqual(
    { order: markCalls()[0].args.p_merchant_trade_no, amount: markCalls()[0].args.p_amount, tradeNo: markCalls()[0].args.p_trade_no },
    { order: ORDER, amount: 500, tradeNo: TRADE_NO });
  assert.equal(inquiry().last_status, "paid");
  for (let i = 0; i < 3; i++) assert.equal((await call()).body.status, "paid");
  assert.equal(markCalls().length, 1);
  assert.equal(queries.length, 1);
});

test("綠界尚未付款 → pending，付款單維持待繳費，寫入下次查詢時間", async () => {
  remote = { TradeStatus: "0", TradeNo: "", PaymentDate: "" };
  db.tables.ecpay_service_payments.push(topup());
  const before = Date.now();
  assert.equal((await call()).body.status, "pending");
  assert.equal(db.tables.ecpay_service_payments[0].status, "pending");
  assert.equal(markCalls().length, 0);
  assert.ok(Date.parse(inquiry().next_check_at) >= before + 299_000);
  assert.equal((await call()).body.status, "cooldown");
  assert.equal(queries.length, 1);
});

test("金額不符 → needs_review 並標記待覆核，拒絕入帳", async () => {
  remote = { TradeAmt: "5000" };
  db.tables.ecpay_service_payments.push(topup());
  assert.equal((await call()).body.status, "needs_review");
  assert.equal(markCalls().length, 0);
  assert.equal(inquiry().review_required, true);
  assert.equal(db.tables.ecpay_service_payments[0].status, "pending");
  assert.equal((await call()).body.status, "needs_review");
  assert.equal(queries.length, 1, "待覆核後不再查綠界");
});

test("交易序號或付款方式與取號紀錄不符、沒有取號紀錄 → needs_review，拒絕入帳", async () => {
  const cases = [
    [{}, { TradeNo: "2611269999999999" }],
    [{}, { PaymentType: "ATM_TAISHIN" }],
    [{ raw_result: { MerchantTradeNo: ORDER, TradeNo: TRADE_NO, PaymentType: "ATM", ExpireDate: "2026/11/29" } }, {}],
    [{ raw_result: null }, {}],
  ];
  for (const [overrides, remoteFields] of cases) {
    reset(); resetServiceInquiryLimits(); remote = remoteFields;
    db.tables.ecpay_service_payments.push(topup(overrides));
    assert.equal((await call()).body.status, "needs_review", JSON.stringify({ overrides, remoteFields }));
    assert.equal(markCalls().length, 0);
    assert.equal(inquiry().review_required, true);
  }
});

test("客人已被人工補款（管理員發錢或人工儲值）→ needs_review，不自動入帳、不重複加 ASD", async () => {
  for (const table of ["wallet_logs", "bot_manual_topups"]) {
    reset(); resetServiceInquiryLimits();
    db.tables.ecpay_service_payments.push(topup());
    db.tables[table].push(table === "wallet_logs"
      ? { user_id: USER, amount: 500, type: "管理員發錢", created_at: "2026-11-26T05:00:00.000Z" }
      : { organization_code: "qiunai", user_id: USER, amount: 500, status: "completed", created_at: "2026-11-26T05:00:00.000Z" });
    const result = await call();
    assert.equal(result.body.status, "needs_review", table);
    assert.match(result.body.error, /人工補款/);
    assert.equal(markCalls().length, 0, table);
    assert.equal(db.tables.ecpay_service_payments[0].status, "pending");
  }
});

test("建立儲值單之前的人工補款或其他金額不影響自動入帳", async () => {
  db.tables.ecpay_service_payments.push(topup());
  db.tables.wallet_logs.push({ user_id: USER, amount: 500, type: "管理員發錢", created_at: "2026-11-25T00:00:00.000Z" });
  db.tables.wallet_logs.push({ user_id: USER, amount: 300, type: "管理員發錢", created_at: "2026-11-26T05:00:00.000Z" });
  db.tables.bot_manual_topups.push({ organization_code: "qiunai", user_id: "other", amount: 500, status: "completed", created_at: "2026-11-26T05:00:00.000Z" });
  assert.equal((await call()).body.status, "paid");
  assert.equal(markCalls().length, 1);
});

test("繳費期限已過但綠界回報已付款（通知遺失）→ 仍入帳一次", async () => {
  db.tables.ecpay_service_payments.push(topup({ raw_result: { ...topup().raw_result, ExpireDate: "2026/11/20 10:00:00" } }));
  assert.equal((await call()).body.status, "paid");
  assert.equal(markCalls().length, 1);
});

test("已入帳的儲值單 → 回報本地狀態，不查綠界", async () => {
  db.tables.ecpay_service_payments.push(topup({ status: "paid", trade_no: TRADE_NO, fulfillment_status: "completed" }));
  assert.deepEqual((await call()).body, { status: "paid", fulfillment_status: "completed" });
  assert.equal(queries.length, 0);
  assert.equal(markCalls().length, 0);
});
