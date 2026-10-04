const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
const moduleResult = { exports: {} };
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require.resolve("../lib/qiunaiCommission.ts"), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: moduleResult.exports, module: moduleResult, Date, Number, String });
const { getQiunaiReviewCommission } = moduleResult.exports;

function mock({ monthly = 10000, yearly = 0, activity = null, error = null } = {}) {
  const calls = [];
  return { calls, from(table) {
    const q = { table, column: "", start: "", end: "" };
    const query = {
      select(v) { q.column = v; return this; }, eq() { return this; }, or() { return this; },
      in(_, v) { q.statuses = v; return this; }, gte(_, v) { q.start = v; return this; },
      lt(_, v) { q.end = v; return this; }, lte() { return this; }, gt() { return this; }, order() { return this; },
      async range() { calls.push(q); return { data: [{ [q.column]: q.column === "staff_salary" ? yearly : monthly }], error }; },
      async maybeSingle() { return { data: activity === null ? null : { activity_rate: activity }, error }; },
    };
    return query;
  } };
}
const staff = { discord_id: "staff", commission_tier: "auto" };
const at = "2026-10-03T16:00:00Z";
test("上月一般訂單加打賞滿一萬，核准薪資使用85%", async () => {
  const db = mock();
  assert.equal(await getQiunaiReviewCommission(db, staff, at, false), 85);
  assert.equal(db.calls[1].column, "order_amount");
  assert.equal(db.calls[1].start, "2026-08-31T16:00:00.000Z");
  assert.equal(db.calls[1].end, "2026-09-30T16:00:00.000Z");
  assert.ok(!db.calls[1].statuses.includes("工時待審核"));
});
test("未達標80%，年度達標90%，手動95%優先", async () => {
  assert.equal(await getQiunaiReviewCommission(mock({ monthly: 9999 }), staff, at, false), 80);
  assert.equal(await getQiunaiReviewCommission(mock({ yearly: 100000 }), staff, at, false), 90);
  assert.equal(await getQiunaiReviewCommission(mock(), { ...staff, commission_tier: "manager_95" }, at, false), 95);
});
test("打賞維持90%，主管打賞95%，活動取較高抽成", async () => {
  assert.equal(await getQiunaiReviewCommission(mock(), staff, at, true), 90);
  assert.equal(await getQiunaiReviewCommission(mock(), { ...staff, commission_tier: "manager_95" }, at, true), 95);
  assert.equal(await getQiunaiReviewCommission(mock({ activity: 90 }), staff, at, false), 90);
});
test("跨年取十二月業績，資料庫失敗不得默默使用80%", async () => {
  const db = mock();
  await getQiunaiReviewCommission(db, staff, "2026-12-31T16:00:00Z", false);
  assert.equal(db.calls[1].start, "2026-11-30T16:00:00.000Z");
  assert.equal(db.calls[1].end, "2026-12-31T16:00:00.000Z");
  await assert.rejects(getQiunaiReviewCommission(mock({ error: new Error("DB unavailable") }), staff, at, false), /DB unavailable/);
});
