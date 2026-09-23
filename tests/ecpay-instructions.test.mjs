import test from "node:test";
import assert from "node:assert/strict";
import { getEcpayInstructions } from "../lib/ecpayPaymentInstructions.ts";

test("ATM 虛擬帳號只顯示完整的繳費資料", () => {
  assert.deepEqual(getEcpayInstructions({ PaymentType: "ATM_TAISHIN", BankCode: "812", vAccount: "1234567890123456", ExpireDate: "2026/09/26" }), {
    method: "ATM", bankCode: "812", virtualAccount: "1234567890123456", expireDate: "2026/09/26",
  });
  assert.equal(getEcpayInstructions({ PaymentType: "ATM_TAISHIN", BankCode: "812", ExpireDate: "2026/09/26" }), null);
});

test("超商代碼與三段條碼分別顯示", () => {
  assert.equal(getEcpayInstructions({ PaymentType: "CVS_CVS", PaymentNo: "LLL17355880822", ExpireDate: "2026/09/26 12:00:00" })?.paymentNo, "LLL17355880822");
  assert.deepEqual(getEcpayInstructions({ PaymentType: "BARCODE_BARCODE", Barcode1: "1234567", Barcode2: "12345678", Barcode3: "123456789", ExpireDate: "2026/09/26 12:00:00" })?.barcode, ["1234567", "12345678", "123456789"]);
  assert.equal(getEcpayInstructions({ PaymentType: "BARCODE_BARCODE", Barcode1: "<script>", Barcode2: "123", Barcode3: "456", ExpireDate: "2026/09/26" }), null);
});
