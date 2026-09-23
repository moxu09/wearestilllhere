import test from "node:test";
import assert from "node:assert/strict";
import { isEcpayFailedResultCode } from "../lib/ecpayResult.ts";

test("綠界付款結果區分成功、待確認與失敗", () => {
  assert.equal(isEcpayFailedResultCode(1), false);
  assert.equal(isEcpayFailedResultCode("10300066"), false);
  assert.equal(isEcpayFailedResultCode(undefined), false);
  assert.equal(isEcpayFailedResultCode("10100252"), true);
});
