import assert from "node:assert/strict";
import test from "node:test";
import { checkMacValue, verifyEcpayMac } from "../lib/ecpayMac.ts";

const fields = {
  TradeDesc: "促銷方案",
  PaymentType: "aio",
  MerchantTradeDate: "2023/03/12 15:30:23",
  MerchantTradeNo: "ecpay20230312153023",
  MerchantID: "3002607",
  ReturnURL: "https://www.ecpay.com.tw/receive.php",
  ItemName: "Apple iphone 15",
  TotalAmount: "30000",
  ChoosePayment: "ALL",
  EncryptType: "1",
};

test("綠界官方 SHA256 檢查碼範例", () => {
  const mac = checkMacValue(fields, "pwFHCqoQZGmho4w6", "EkRm7iFT261dpevs");
  assert.equal(mac, "6C51C9E6888DE861FD62FB1DD17029FC742634498FD813DC43D4243B5685B840");
  assert.equal(verifyEcpayMac({ ...fields, CheckMacValue: mac }, "pwFHCqoQZGmho4w6", "EkRm7iFT261dpevs"), true);
});

test("交易金額與商店代號遭修改時拒絕回呼", () => {
  const CheckMacValue = checkMacValue(fields, "pwFHCqoQZGmho4w6", "EkRm7iFT261dpevs");
  assert.equal(verifyEcpayMac({ ...fields, TotalAmount: "1", CheckMacValue }, "pwFHCqoQZGmho4w6", "EkRm7iFT261dpevs"), false);
  assert.equal(verifyEcpayMac({ ...fields, MerchantID: "123", CheckMacValue }, "pwFHCqoQZGmho4w6", "EkRm7iFT261dpevs"), false);
  assert.equal(verifyEcpayMac({ ...fields, CheckMacValue: "invalid" }, "pwFHCqoQZGmho4w6", "EkRm7iFT261dpevs"), false);
});
