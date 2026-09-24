import test from "node:test";
import assert from "node:assert/strict";
import { ECPAY_ATM_START, isEcpayAtmAvailableForPayment } from "../lib/ecpayAtmSchedule.ts";

test("所有訂單包含秋奈自助單都在 9/28 才能取得虛擬 ATM", () => {
  const before = ECPAY_ATM_START - 1;
  assert.equal(isEcpayAtmAvailableForPayment({ organization_code: "qiunai", metadata: { flow: "self_service" } }, before), false);
  assert.equal(isEcpayAtmAvailableForPayment({ organization_code: "qiunai", metadata: { flow: "quote" } }, before), false);
  assert.equal(isEcpayAtmAvailableForPayment({ organization_code: "deepnight", metadata: { flow: "self_service" } }, before), false);
  assert.equal(isEcpayAtmAvailableForPayment({ organization_code: "qiunai", metadata: { flow: "quote" } }, ECPAY_ATM_START), true);
});
