import test from "node:test";
import assert from "node:assert/strict";
import { ECPAY_ATM_START, isEcpayAtmAvailableForPayment } from "../lib/ecpayAtmSchedule.ts";

test("秋奈自助單可提前取 ATM，其他訂單仍於 9/28 開放", () => {
  const before = ECPAY_ATM_START - 1;
  assert.equal(isEcpayAtmAvailableForPayment({ organization_code: "qiunai", metadata: { flow: "self_service" } }, before), true);
  assert.equal(isEcpayAtmAvailableForPayment({ organization_code: "qiunai", metadata: { flow: "quote" } }, before), false);
  assert.equal(isEcpayAtmAvailableForPayment({ organization_code: "deepnight", metadata: { flow: "self_service" } }, before), false);
  assert.equal(isEcpayAtmAvailableForPayment({ organization_code: "qiunai", metadata: { flow: "quote" } }, ECPAY_ATM_START), true);
});
