import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("../lib/ecpayPlatformAtm.ts", import.meta.url), "utf8");
const migration = readFileSync(new URL("../supabase/migrations/20260924130000_ecpay_platform_atm.sql", import.meta.url), "utf8");

test("會員訂單 ATM 取號不等於付款，只有驗證通知能呼叫核帳 RPC", () => {
  const issue = source.split("export async function issuePlatformAtm(")[1]
    .split("export async function settlePlatformAtm(")[0];
  const settle = source.split("export async function settlePlatformAtm(")[1];
  assert.doesNotMatch(issue, /ecpay_mark_platform_paid|payment_status: "paid"/);
  assert.match(settle, /data\.SimulatePaid === 1/);
  assert.match(settle, /String\(info\.TradeStatus\) !== "1"/);
  assert.match(settle, /issued\.TradeNo !== tradeNo/);
  assert.match(settle, /admin\.rpc\("ecpay_mark_platform_paid"/);
});

test("會員刷卡與 ATM 對應不同的訂單付款方式，核帳函式僅 service_role 可呼叫", () => {
  assert.match(migration, /method = 'Credit' and\s+\(v_order\.payment_method <> 'card'/);
  assert.match(migration, /method = 'ATM' and\s+\(v_order\.payment_method <> 'transfer'/);
  assert.match(migration, /v_order\.paid_amount <> 0/);
  assert.match(migration, /grant execute on function public\.ecpay_mark_platform_paid\([\s\S]*?to service_role;/);
});
