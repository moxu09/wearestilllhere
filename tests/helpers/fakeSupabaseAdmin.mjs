// Minimal in-memory stand-in for the Supabase admin client used by the ECPay libs in tests.
export const db = {
  tables: {},
  rpcCalls: [],
  reset() {
    this.tables = { ecpay_service_payments: [], ecpay_insite_attempts: [], ecpay_service_inquiries: [] };
    this.rpcCalls = [];
    this.markPaidNoop = false;
    this.markPaidHook = null;
  },
};
db.reset();

class Query {
  constructor(table) { this.table = table; this.filters = []; this.patch = null; this.returning = false; }
  rows() { return (db.tables[this.table] ||= []); }
  select() { this.returning = true; return this; }
  eq(key, value) { this.filters.push([key, value]); return this; }
  gte(key, value) { this.filters.push([key, value, "gte"]); return this; }
  limit(n) { return Promise.resolve({ data: this.run().slice(0, n).map(row => ({ ...row })), error: null }); }
  update(patch) { this.patch = patch; return this; }
  insert(row) {
    const rows = this.rows();
    if (rows.some(existing => existing.merchant_trade_no === row.merchant_trade_no))
      return Promise.resolve({ error: { code: "23505", message: "duplicate key" } });
    rows.push({ ...row });
    return Promise.resolve({ error: null });
  }
  run() {
    const matches = this.rows().filter(row => this.filters.every(([key, value, op]) => op === "gte" ? String(row[key]) >= String(value) : row[key] === value));
    if (this.patch) for (const row of matches) Object.assign(row, this.patch);
    return matches;
  }
  maybeSingle() {
    const [first] = this.run();
    return Promise.resolve({ data: first ? { ...first } : null, error: null });
  }
  then(resolve, reject) {
    return Promise.resolve({ data: this.run(), error: null }).then(resolve, reject);
  }
}

const client = {
  from: table => new Query(table),
  rpc(name, args) {
    db.rpcCalls.push({ name, args });
    if (name === "ecpay_insite_claim_create") {
      const attempt = db.tables.ecpay_insite_attempts.find(row =>
        row.merchant_trade_no === args.p_merchant_trade_no && row.payment_kind === args.p_payment_kind &&
        row.attempt_id === args.p_attempt_id && row.status === "token_ready");
      if (!attempt) return Promise.resolve({ data: false, error: null });
      attempt.status = "creating";
      return Promise.resolve({ data: true, error: null });
    }
    if (name === "ecpay_mark_service_paid") {
      const payment = db.tables.ecpay_service_payments.find(row => row.merchant_trade_no === args.p_merchant_trade_no);
      if (payment && db.markPaidHook) db.markPaidHook(payment);
      if (payment && payment.status === "pending" && !db.markPaidNoop)
        Object.assign(payment, { status: "paid", trade_no: args.p_trade_no, fulfillment_status: "pending" });
    }
    return Promise.resolve({ data: null, error: null });
  },
};

export function getSupabaseAdmin() { return client; }
