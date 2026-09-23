import test from "node:test";
import assert from "node:assert/strict";
import { paymentInfoFields } from "../lib/ecpayNoncredit.ts";

const base = "https://www.wearestilllhere.com";

for (const kind of ["service", "merchandise"]) {
  test(`${kind} ATM、超商代碼、條碼分開設定取號通知與期限`, () => {
    for (const method of ["ATM", "CVS", "BARCODE"]) {
      const fields = paymentInfoFields(method, base, kind);
      assert.equal(fields.PaymentInfoURL, `${base}/api/payments/ecpay/${kind}/payment-info`);
      assert.equal(fields.ClientRedirectURL, `${base}/api/payments/ecpay/${kind}/payment-info/display`);
      assert.equal(fields.ExpireDate, method === "ATM" ? "3" : undefined);
      assert.equal(fields.StoreExpireDate, method === "CVS" ? "4320" : method === "BARCODE" ? "3" : undefined);
    }
    assert.deepEqual(paymentInfoFields("Credit", base, kind), { NeedExtraPaidInfo: "Y" });
  });
}
