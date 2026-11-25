import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { EcpayReconcileMismatchError, reconcileEcpayService } from "@/lib/ecpayReconcile";
import { isAppDrawPayment } from "@/lib/ecpayServiceKind";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Signed 查單 for APP draw payments. Callers: the 秋奈 bot (qiunai/utils/ecpayInquiry.js, requestEcpayInquiry)
// and app-api. Body {order, source, userId, channelId, timestamp}; header X-Ecpay-Bot-Signature =
// hex HMAC-SHA256(SUPABASE_SERVICE_ROLE_KEY, raw body). Request amounts are never read: paid state comes
// only from a CheckMacValue-verified 綠界 QueryTradeInfo response.
//
// Only payment_kind='draw' is handled. topup/order/extension keep their guarded flow in the bot's
// ecpay_claim_service_inquiry / ecpay_finish_service_inquiry (manual-credit and order-state checks).
//
// Scheduling state lives in public.ecpay_service_inquiries (the bot migration's table), the single source of
// truth that the bot scheduler reads: last_checked_at, next_check_at, lease_*, attempts, last_status,
// review_required are written with the same meaning as the bot's claim/finish functions.
export type ServiceInquiryStatus = "paid" | "pending" | "failed" | "needs_review" | "cooldown" | "error";
export type ServiceInquiryResult = {
  httpStatus: number;
  body: { status?: ServiceInquiryStatus; fulfillment_status?: string | null; retry_after?: number; error?: string };
};

export const SERVICE_INQUIRY_MAX_BODY_BYTES = 2048;
const TIMESTAMP_WINDOW_SECONDS = 300;
const NEXT_CHECK_SECONDS = 300;
const LEASE_SECONDS = 60;
const GLOBAL_LIMIT = 30;
const GLOBAL_WINDOW_MS = 60_000;
const ALLOWED_KEYS = new Set(["order", "source", "userId", "channelId", "timestamp"]);

// Per-process ceiling on QueryTradeInfo calls, on top of the DB-backed per-order schedule.
const globalSlots: number[] = [];

export function resetServiceInquiryLimits() {
  globalSlots.length = 0;
}

function takeGlobalSlot(now: number): number {
  while (globalSlots.length && now - globalSlots[0] >= GLOBAL_WINDOW_MS) globalSlots.shift();
  if (globalSlots.length >= GLOBAL_LIMIT) return Math.max(1, Math.ceil((GLOBAL_WINDOW_MS - (now - globalSlots[0])) / 1000));
  globalSlots.push(now);
  return 0;
}

function releaseGlobalSlot(now: number) {
  const index = globalSlots.lastIndexOf(now);
  if (index >= 0) globalSlots.splice(index, 1);
}

function verifySignature(raw: string, provided: string | null): boolean {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !provided || !/^[a-f0-9]{64}$/.test(provided)) return false;
  const expected = createHmac("sha256", secret).update(raw).digest();
  return timingSafeEqual(Buffer.from(provided, "hex"), expected);
}

function time(value: unknown): number {
  const parsed = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : -Infinity;
}

function localResult(payment: { status: string; fulfillment_status?: string | null }): ServiceInquiryResult {
  const status: ServiceInquiryStatus = payment.status === "paid" ? "paid"
    : payment.status === "failed" ? "failed"
    : payment.status === "pending" ? "pending" : "needs_review";
  return { httpStatus: 200, body: { status, fulfillment_status: payment.fulfillment_status ?? null } };
}

type Claim = { kind: "claimed"; leaseToken: string } | { kind: "cooldown"; retryAfter: number } | { kind: "review" };

async function claimInquiry(order: string, now: number): Promise<Claim> {
  const admin = getSupabaseAdmin();
  const { error: insertError } = await admin.from("ecpay_service_inquiries").insert({ merchant_trade_no: order, attempts: 0 });
  if (insertError && insertError.code !== "23505") throw new Error("查單紀錄建立失敗");
  const { data: current, error } = await admin.from("ecpay_service_inquiries")
    .select("next_check_at,lease_until,attempts,review_required").eq("merchant_trade_no", order).maybeSingle();
  if (error || !current) throw new Error("查單紀錄讀取失敗");
  if (current.review_required) return { kind: "review" };
  const deadline = Math.max(time(current.next_check_at), time(current.lease_until));
  if (deadline > now) return { kind: "cooldown", retryAfter: Math.max(1, Math.ceil((deadline - now) / 1000)) };
  const leaseToken = randomUUID();
  // Compare-and-set on attempts so two concurrent callers cannot both claim the same slot.
  const { data: claimed, error: claimError } = await admin.from("ecpay_service_inquiries").update({
    lease_token: leaseToken, lease_until: new Date(now + LEASE_SECONDS * 1000).toISOString(),
    next_check_at: new Date(now + NEXT_CHECK_SECONDS * 1000).toISOString(),
    last_checked_at: new Date(now).toISOString(), attempts: Number(current.attempts || 0) + 1,
  }).eq("merchant_trade_no", order).eq("attempts", current.attempts).select("merchant_trade_no").maybeSingle();
  if (claimError) throw new Error("查單紀錄更新失敗");
  if (!claimed) return { kind: "cooldown", retryAfter: 1 };
  return { kind: "claimed", leaseToken };
}

async function finishInquiry(order: string, leaseToken: string, status: string, error: string | null) {
  const { error: updateError } = await getSupabaseAdmin().from("ecpay_service_inquiries").update({
    lease_token: null, lease_until: null, last_status: status, last_error: error ? error.slice(0, 200) : null,
    ...(status === "needs_review" ? { review_required: true } : {}),
  }).eq("merchant_trade_no", order).eq("lease_token", leaseToken);
  if (updateError) console.error("ECPay service inquiry finish failed", order, updateError.message);
}

export async function handleServiceInquiry(raw: string, signature: string | null, now = Date.now()): Promise<ServiceInquiryResult> {
  if (Buffer.byteLength(raw, "utf8") > SERVICE_INQUIRY_MAX_BODY_BYTES) return { httpStatus: 413, body: { error: "請求過大" } };
  if (!verifySignature(raw, signature)) return { httpStatus: 401, body: { error: "未授權" } };
  let input: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("not an object");
    input = parsed as Record<string, unknown>;
  } catch { return { httpStatus: 400, body: { error: "請求格式錯誤" } }; }
  // The bot does not sign the path, so reject anything that is not exactly an inquiry body
  // (e.g. a direct-issue body {order, method, timestamp} signed with the same key).
  if (Object.keys(input).some(key => !ALLOWED_KEYS.has(key))) return { httpStatus: 400, body: { error: "請求欄位錯誤" } };
  if (typeof input.timestamp !== "number" || !Number.isInteger(input.timestamp) ||
      Math.abs(Math.floor(now / 1000) - input.timestamp) > TIMESTAMP_WINDOW_SECONDS)
    return { httpStatus: 401, body: { error: "請求已過期" } };
  const order = typeof input.order === "string" ? input.order : "";
  if (!/^[A-Za-z0-9]{1,20}$/.test(order)) return { httpStatus: 400, body: { error: "付款編號錯誤" } };

  const admin = getSupabaseAdmin();
  const { data: payment, error } = await admin.from("ecpay_service_payments")
    .select("status,fulfillment_status,payment_kind").eq("merchant_trade_no", order).maybeSingle();
  if (error) return { httpStatus: 502, body: { status: "error", error: "付款單讀取失敗" } };
  if (!payment) return { httpStatus: 404, body: { error: "找不到付款單" } };
  if (!isAppDrawPayment(payment)) return { httpStatus: 409, body: { error: "此付款類型不支援自動查詢" } };
  if (payment.status !== "pending") return localResult(payment);

  const globalWait = takeGlobalSlot(now);
  if (globalWait) return { httpStatus: 200, body: { status: "cooldown", retry_after: globalWait } };
  let claim: Claim;
  try { claim = await claimInquiry(order, now); } catch (cause) {
    releaseGlobalSlot(now);
    console.error("ECPay service inquiry claim failed", order, cause);
    return { httpStatus: 502, body: { status: "error", error: "查單紀錄暫時無法更新" } };
  }
  if (claim.kind !== "claimed") {
    releaseGlobalSlot(now);
    return claim.kind === "review"
      ? { httpStatus: 200, body: { status: "needs_review" } }
      : { httpStatus: 200, body: { status: "cooldown", retry_after: claim.retryAfter } };
  }

  try {
    // Reuses the admin reconcile: verified QueryTradeInfo, amount/trade-no match, then ecpay_mark_service_paid
    // (row-locked and idempotent per trade_no, so a concurrent ReturnURL is safe).
    const reconciled = await reconcileEcpayService(order);
    const { data: after, error: rereadError } = await admin.from("ecpay_service_payments")
      .select("status,fulfillment_status").eq("merchant_trade_no", order).maybeSingle();
    if (rereadError || !after) throw new Error("付款單重新讀取失敗");
    let result: ServiceInquiryResult;
    if (after.status !== "pending") result = localResult(after);
    else if (reconciled.remoteStatus === "paid")
      result = { httpStatus: 200, body: { status: "needs_review", fulfillment_status: after.fulfillment_status ?? null } };
    else result = { httpStatus: 200, body: { status: reconciled.remoteStatus === "pending" ? "pending" : "failed", fulfillment_status: after.fulfillment_status ?? null } };
    await finishInquiry(order, claim.leaseToken, result.body.status || "error",
      result.body.status === "needs_review" ? "綠界已付款但付款單未更新" : null);
    return result;
  } catch (cause) {
    if (cause instanceof EcpayReconcileMismatchError) {
      console.error("ECPay service inquiry mismatch", order, cause.message);
      await finishInquiry(order, claim.leaseToken, "needs_review", cause.message);
      return { httpStatus: 200, body: { status: "needs_review", error: cause.message } };
    }
    console.error("ECPay service inquiry failed", order, cause);
    await finishInquiry(order, claim.leaseToken, "error", cause instanceof Error ? cause.message : "unknown");
    return { httpStatus: 502, body: { status: "error", error: "綠界查詢暫時無法完成" } };
  }
}
