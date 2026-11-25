import test from "node:test";
import assert from "node:assert/strict";
import "./helpers/aliasHooks.mjs";

// fetch is stubbed below, so these tests never reach 綠界 or production.
const MERCHANT = "3002607";
const KEY = "pwFHCqoQZGmho4w6";
const IV = "EkRm7iFT261dpevs";
Object.assign(process.env, {
  ECPAY_MERCHANT_ID: MERCHANT, ECPAY_HASH_KEY: KEY, ECPAY_HASH_IV: IV, ECPAY_ENV: "stage",
  ECPAY_PUBLIC_BASE_URL: "https://site.test", ECPAY_ACCEPT_PAYMENTS: "true",
  ECPAY_INSITE_ACCEPT_PAYMENTS: "true", ECPAY_NONCREDIT_ACCEPT_PAYMENTS: "true",
});

const { db } = await import("./helpers/fakeSupabaseAdmin.mjs");
const { createEcpayServiceCheckout, completeEcpayServicePayment } = await import("../lib/ecpay.ts");
const { createInSiteToken, submitInSitePayment, handleInSiteReturn } = await import("../lib/ecpayInSiteCheckout.ts");
const { issueServiceDirect } = await import("../lib/ecpayServiceDirect.ts");
const { checkMacValue, verifyEcpayMac } = await import("../lib/ecpayMac.ts");
const { encryptEcpayInSiteData, decryptEcpayInSiteData } = await import("../lib/ecpayInSite.ts");
const { mayIssueNewServiceAtm, isEcpayAtmAvailableForPayment, ECPAY_ATM_START } = await import("../lib/ecpayAtmSchedule.ts");
const { appDrawTradeTexts, serviceExpiredMessage } = await import("../lib/ecpayServiceKind.ts");

const ORDER = "QD0123456789ABCDEF01";

function row(overrides = {}) {
  return {
    merchant_trade_no: ORDER, organization_code: "qiunai", payment_kind: "draw", amount: 300,
    description: "秋奈扭蛋 x3", status: "pending", created_at: new Date().toISOString(),
    raw_result: null, metadata: { flow: "app", method: "atm" }, ...overrides,
  };
}

const fetchCalls = [];
function stubEcpg(respond) {
  globalThis.fetch = async (url, init) => {
    const target = String(url);
    assert.match(target, /^https:\/\/(ecpg-stage|ecpayment-stage)\.ecpay\.com\.tw\//, "only the stubbed stage host may be addressed");
    const body = JSON.parse(init.body);
    const data = decryptEcpayInSiteData(body.Data, KEY, IV);
    fetchCalls.push({ url: target, data });
    return Response.json({ MerchantID: MERCHANT, TransCode: 1, Data: encryptEcpayInSiteData(respond(target, data), KEY, IV) });
  };
}

test.beforeEach(() => { db.reset(); fetchCalls.length = 0; globalThis.fetch = async () => { throw new Error("network disabled in tests"); }; });

test("draw 列的品名與交易描述使用「APP 抽獎」，其他類別不變", () => {
  assert.deepEqual(appDrawTradeTexts({ organization_code: "qiunai", payment_kind: "draw" }), { tradeDesc: "秋奈 APP 抽獎付款", itemName: "APP 抽獎" });
  assert.deepEqual(appDrawTradeTexts({ organization_code: "deepnight", payment_kind: "draw" }), { tradeDesc: "深夜不關燈 APP 抽獎付款", itemName: "APP 抽獎" });
  for (const kind of ["topup", "order", "tip", null]) assert.equal(appDrawTradeTexts({ payment_kind: kind }), null);
  assert.match(serviceExpiredMessage({ payment_kind: "draw" }), /APP/);
  assert.equal(serviceExpiredMessage({ payment_kind: "topup" }), "付款連結已過期，請回到 Discord 重新建立訂單");
});

test("draw 與 topup 同樣可核發 ATM（9/28 後），人工 order 規則不變", () => {
  assert.equal(mayIssueNewServiceAtm({ payment_kind: "draw", metadata: { flow: "app" } }), true);
  assert.equal(mayIssueNewServiceAtm({ payment_kind: "topup", metadata: { flow: "app" } }), true);
  assert.equal(mayIssueNewServiceAtm({ payment_kind: "order", metadata: { flow: "quote" } }), false);
  assert.equal(isEcpayAtmAvailableForPayment(row(), ECPAY_ATM_START), true);
  assert.equal(isEcpayAtmAvailableForPayment(row(), ECPAY_ATM_START - 1), false);
});

test("全方位金流 checkout：draw 四種付款方式皆可建立，MAC 正確", async () => {
  for (const method of ["Credit", "ATM", "CVS", "BARCODE"]) {
    db.reset();
    db.tables.ecpay_service_payments.push(row());
    const { action, fields } = await createEcpayServiceCheckout(ORDER, method);
    assert.equal(action, "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5");
    assert.equal(fields.ItemName, "APP 抽獎");
    assert.equal(fields.TradeDesc, "秋奈 APP 抽獎付款");
    assert.equal(fields.TotalAmount, "300");
    assert.equal(fields.ChoosePayment, method);
    assert.equal(fields.ReturnURL, "https://site.test/api/payments/ecpay/service/result");
    if (method === "Credit") assert.equal(fields.OrderResultURL, "https://site.test/api/payments/ecpay/service/display");
    else {
      assert.equal(fields.PaymentInfoURL, "https://site.test/api/payments/ecpay/service/payment-info");
      assert.equal(fields.ClientRedirectURL, "https://site.test/api/payments/ecpay/service/payment-info/display");
    }
    assert.equal(verifyEcpayMac(fields, KEY, IV), true);
  }
});

test("全方位金流 checkout：draw 沿用各付款方式金額上下限", async () => {
  const cases = [
    ["Credit", 5, false], ["Credit", 6, true], ["Credit", 199_999, true], ["Credit", 200_000, false],
    ["ATM", 15, false], ["ATM", 16, true], ["ATM", 49_999, true], ["ATM", 50_000, false],
    ["CVS", 33, false], ["CVS", 34, true], ["CVS", 20_000, true], ["CVS", 20_001, false],
    ["BARCODE", 17, false], ["BARCODE", 18, true], ["BARCODE", 20_000, true], ["BARCODE", 20_001, false],
  ];
  for (const [method, amount, ok] of cases) {
    db.reset();
    db.tables.ecpay_service_payments.push(row({ amount }));
    const attempt = createEcpayServiceCheckout(ORDER, method);
    if (ok) await attempt; else await assert.rejects(attempt, /單筆金額須介於/, `${method} ${amount}`);
  }
});

test("全方位金流 checkout：draw 超過 24 小時提示回 APP；topup 品名與訊息不變", async () => {
  db.tables.ecpay_service_payments.push(row({ created_at: new Date(Date.now() - 25 * 3_600_000).toISOString() }));
  await assert.rejects(createEcpayServiceCheckout(ORDER, "CVS"), /請回到 APP/);
  db.reset();
  db.tables.ecpay_service_payments.push(row({ payment_kind: "topup", description: "儲值 300" }));
  const { fields } = await createEcpayServiceCheckout(ORDER, "CVS");
  assert.equal(fields.ItemName, "儲值 300");
  assert.equal(fields.TradeDesc, "秋奈電競服務付款");
  db.reset();
  db.tables.ecpay_service_payments.push(row({ payment_kind: "topup", created_at: new Date(Date.now() - 25 * 3_600_000).toISOString() }));
  await assert.rejects(createEcpayServiceCheckout(ORDER, "CVS"), /請回到 Discord 重新建立訂單/);
});

test("ReturnURL：draw 已付款通知經 MAC 驗證後呼叫 ecpay_mark_service_paid", async () => {
  db.tables.ecpay_service_payments.push(row());
  const notice = { MerchantID: MERCHANT, MerchantTradeNo: ORDER, RtnCode: "1", TradeAmt: "300", TradeNo: "2611260000000001", PaymentDate: "2026/11/26 12:00:00", PaymentType: "CVS_CVS", SimulatePaid: "0" };
  const signed = { ...notice, CheckMacValue: checkMacValue(notice, KEY, IV) };
  assert.equal(await completeEcpayServicePayment(signed), true);
  assert.equal(db.rpcCalls.length, 1);
  assert.equal(db.rpcCalls[0].name, "ecpay_mark_service_paid");
  assert.equal(db.rpcCalls[0].args.p_merchant_trade_no, ORDER);
  assert.equal(db.rpcCalls[0].args.p_amount, 300);
  await assert.rejects(completeEcpayServicePayment({ ...signed, TradeAmt: "1" }), /驗證失敗/);
  assert.equal(await completeEcpayServicePayment({ ...notice, SimulatePaid: "1", CheckMacValue: checkMacValue({ ...notice, SimulatePaid: "1" }, KEY, IV) }), false);
  assert.equal(db.rpcCalls.length, 1);
});

test("站內付 token／create：draw 列可經 APP 轉送，品名為「APP 抽獎」且信用卡上下限不變", async () => {
  stubEcpg((url) => url.endsWith("/GetTokenbyTrade") ? { RtnCode: 1, Token: "tok_test" }
    : { RtnCode: 1, OrderInfo: { MerchantTradeNo: ORDER }, ThreeDInfo: { ThreeDURL: "https://ecpg-stage.ecpay.com.tw/3d" } });
  db.tables.ecpay_service_payments.push(row());
  const token = await createInSiteToken({ kind: "service", merchantTradeNo: ORDER, phone: "0912345678" });
  assert.equal(token.token, "tok_test");
  assert.equal(token.amount, 300);
  assert.equal(fetchCalls[0].data.OrderInfo.ItemName, "APP 抽獎");
  assert.equal(fetchCalls[0].data.OrderInfo.TradeDesc, "秋奈 APP 抽獎付款");
  assert.equal(fetchCalls[0].data.OrderInfo.ReturnURL, "https://site.test/api/payments/ecpay/insite/return");
  const created = await submitInSitePayment({ kind: "service", merchantTradeNo: ORDER, attemptId: token.attemptId, payToken: "pay_test" });
  assert.equal(created.threeDUrl, "https://ecpg-stage.ecpay.com.tw/3d");

  for (const [amount, ok] of [[5, false], [6, true], [199_999, true], [200_000, false]]) {
    db.reset();
    db.tables.ecpay_service_payments.push(row({ amount }));
    const attempt = createInSiteToken({ kind: "service", merchantTradeNo: ORDER, phone: "0912345678" });
    if (ok) await attempt; else await assert.rejects(attempt, /信用卡付款金額不符合綠界限制/);
  }
  db.reset();
  db.tables.ecpay_service_payments.push(row({ created_at: new Date(Date.now() - 25 * 3_600_000).toISOString() }));
  await assert.rejects(createInSiteToken({ kind: "service", merchantTradeNo: ORDER, phone: "0912345678" }), /請回到 APP/);
});

test("站內付 ReturnURL：draw 的 service attempt 入帳走 ecpay_mark_service_paid", async () => {
  db.tables.ecpay_service_payments.push(row());
  db.tables.ecpay_insite_attempts.push({ merchant_trade_no: ORDER, payment_kind: "service", attempt_id: crypto.randomUUID(), status: "created" });
  const data = { MerchantID: MERCHANT, RtnCode: 1, OrderInfo: { MerchantTradeNo: ORDER, TradeNo: "2611260000000002", TradeAmt: 300, TradeStatus: "1", PaymentType: "Credit", PaymentDate: "2026/11/26 12:00:00" } };
  assert.equal(await handleInSiteReturn({ MerchantID: MERCHANT, TransCode: 1, Data: encryptEcpayInSiteData(data, KEY, IV) }), true);
  assert.equal(db.rpcCalls[0].name, "ecpay_mark_service_paid");
  assert.equal(db.rpcCalls[0].args.p_amount, 300);
});

test("站內直接取號（ATM／超商）：draw 可取號且品名為「APP 抽獎」", async () => {
  for (const method of ["ATM", "CVS", "BARCODE"]) {
    db.reset(); fetchCalls.length = 0;
    db.tables.ecpay_service_payments.push(row());
    stubEcpg((_url, data) => ({
      RtnCode: 1, MerchantID: MERCHANT,
      OrderInfo: { MerchantTradeNo: ORDER, TradeNo: "2611260000000003", TradeAmt: 300, PaymentType: method, TradeStatus: "0" },
      ATMInfo: { BankCode: "812", vAccount: "9103522175887271", ExpireDate: "2026/11/29" },
      CVSInfo: { PaymentNo: "LLL22251222", ExpireDate: "2026/11/29 12:00:00" },
      BarcodeInfo: { Barcode1: "1511106A1", Barcode2: "0000000000000000", Barcode3: "1126A1000000300", ExpireDate: "2026/11/29" },
      echo: data,
    }));
    const info = await issueServiceDirect(ORDER, method);
    assert.equal(info.method, method);
    assert.equal(fetchCalls[0].data.OrderInfo.ItemName, "APP 抽獎");
    assert.equal(fetchCalls[0].data.OrderInfo.ReturnURL, "https://site.test/api/payments/ecpay/service/direct-return");
  }
  db.reset();
  db.tables.ecpay_service_payments.push(row({ amount: 20_001 }));
  await assert.rejects(issueServiceDirect(ORDER, "CVS"), /此金額不適用/);
});
