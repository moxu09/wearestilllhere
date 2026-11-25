import test from "node:test";
import assert from "node:assert/strict";
import "./helpers/aliasHooks.mjs";

// insite/create for APP draw rows: 402 {declined:true} only for an explicit 綠界 decline on an unpaid row;
// every post-submit uncertainty is 502 without declined. Other kinds keep the old 400 response.
// fetch is stubbed: nothing reaches 綠界 or production.
const MERCHANT = "3002607";
const KEY = "pwFHCqoQZGmho4w6";
const IV = "EkRm7iFT261dpevs";
Object.assign(process.env, {
  ECPAY_MERCHANT_ID: MERCHANT, ECPAY_HASH_KEY: KEY, ECPAY_HASH_IV: IV, ECPAY_ENV: "stage",
  ECPAY_PUBLIC_BASE_URL: "https://site.test", ECPAY_INSITE_ACCEPT_PAYMENTS: "true",
});

const { db } = await import("./helpers/fakeSupabaseAdmin.mjs");
const { encryptEcpayInSiteData } = await import("../lib/ecpayInSite.ts");
const { POST } = await import("../app/api/payments/ecpay/insite/create/route.ts");

const ORDER = "QD0123456789ABCDEF01";
const ATTEMPT = "11111111-2222-4333-8444-555555555555";

function setup(overrides = {}) {
  db.reset();
  db.tables.ecpay_service_payments.push({
    merchant_trade_no: ORDER, organization_code: "qiunai", payment_kind: "draw", amount: 300, status: "pending",
    description: "x", created_at: new Date().toISOString(), ...overrides,
  });
  db.tables.ecpay_insite_attempts.push({ merchant_trade_no: ORDER, payment_kind: "service", attempt_id: ATTEMPT, status: "token_ready" });
}

function ecpgReturns(data, { onCall } = {}) {
  globalThis.fetch = async (url) => {
    assert.equal(String(url), "https://ecpg-stage.ecpay.com.tw/Merchant/CreatePayment");
    onCall?.();
    return Response.json({ MerchantID: MERCHANT, TransCode: 1, Data: encryptEcpayInSiteData(data, KEY, IV) });
  };
}

async function create() {
  const response = await POST(new Request("https://site.test/api/payments/ecpay/insite/create", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "service", merchantTradeNo: ORDER, attemptId: ATTEMPT, payToken: "pay_test" }),
  }));
  return { code: response.status, body: await response.json() };
}

test.beforeEach(() => { globalThis.fetch = async () => { throw new Error("network disabled in tests"); }; });

test("draw：綠界明確拒絕刷卡且本地未付款 → 402 declined", async () => {
  setup();
  ecpgReturns({ RtnCode: 10100248, RtnMsg: "拒絕交易" });
  const result = await create();
  assert.equal(result.code, 402);
  assert.equal(result.body.declined, true);
  assert.match(result.body.error, /綠界站內付交易失敗/);
});

test("draw：綠界拒絕但付款單已是 paid → 502，不得標示 declined", async () => {
  setup();
  ecpgReturns({ RtnCode: 10100248 }, { onCall: () => { db.tables.ecpay_service_payments[0].status = "paid"; } });
  const result = await create();
  assert.equal(result.code, 502);
  assert.equal(result.body.declined, undefined);
});

test("draw：網路錯誤、逾時 → 502，不得標示 declined", async () => {
  setup();
  globalThis.fetch = async () => { throw new DOMException("timeout", "TimeoutError"); };
  const result = await create();
  assert.equal(result.code, 502);
  assert.equal(result.body.declined, undefined);
});

test("draw：綠界 HTTP 錯誤或傳輸失敗或無法解密 → 502，不得標示 declined", async () => {
  for (const respond of [
    () => new Response("", { status: 500 }),
    () => Response.json({ MerchantID: MERCHANT, TransCode: 2, Data: "" }),
    () => Response.json({ MerchantID: MERCHANT, TransCode: 1, Data: "not-base64-cipher" }),
    () => Response.json({ MerchantID: MERCHANT, TransCode: 1, Data: encryptEcpayInSiteData({ RtnMsg: "no code" }, KEY, IV) }),
  ]) {
    setup();
    globalThis.fetch = async () => respond();
    const result = await create();
    assert.equal(result.code, 502);
    assert.equal(result.body.declined, undefined);
  }
});

test("draw：綠界已受理但本地保存失敗 → 502，不得標示 declined", async () => {
  setup();
  ecpgReturns({ RtnCode: 1, OrderInfo: { MerchantTradeNo: ORDER } }, {
    onCall: () => { db.tables.ecpay_insite_attempts[0].status = "lost"; },
  });
  const result = await create();
  assert.equal(result.code, 502);
  assert.equal(result.body.declined, undefined);
  assert.match(result.body.error, /交易已建立，但付款狀態保存失敗/);
});

test("draw：綠界交易編號不符 → 502，不得標示 declined", async () => {
  setup();
  ecpgReturns({ RtnCode: 1, OrderInfo: { MerchantTradeNo: "QDOTHER" } });
  const result = await create();
  assert.equal(result.code, 502);
  assert.equal(result.body.declined, undefined);
});

test("draw：成功 → 200 並回傳 3D 網址", async () => {
  setup();
  ecpgReturns({ RtnCode: 1, OrderInfo: { MerchantTradeNo: ORDER }, ThreeDInfo: { ThreeDURL: "https://ecpg-stage.ecpay.com.tw/3d" } });
  const result = await create();
  assert.equal(result.code, 200);
  assert.deepEqual(result.body, { threeDUrl: "https://ecpg-stage.ecpay.com.tw/3d", merchantTradeNo: ORDER });
});

test("非 draw（topup）：拒絕與保存失敗維持原本 400 回應，沒有 declined 欄位", async () => {
  setup({ payment_kind: "topup" });
  ecpgReturns({ RtnCode: 10100248 });
  const declined = await create();
  assert.deepEqual({ code: declined.code, body: declined.body }, { code: 400, body: { error: "綠界站內付交易失敗（10100248）" } });
  setup({ payment_kind: "topup" });
  ecpgReturns({ RtnCode: 1, OrderInfo: { MerchantTradeNo: ORDER } }, { onCall: () => { db.tables.ecpay_insite_attempts[0].status = "lost"; } });
  const lost = await create();
  assert.deepEqual({ code: lost.code, body: lost.body }, { code: 400, body: { error: "交易已建立，但付款狀態保存失敗；請查詢付款結果" } });
});

test("draw：送出前的檢查錯誤維持原本 400（尚未送出刷卡）", async () => {
  setup({ status: "paid" });
  const result = await create();
  assert.equal(result.code, 400);
  assert.equal(result.body.declined, undefined);
});
