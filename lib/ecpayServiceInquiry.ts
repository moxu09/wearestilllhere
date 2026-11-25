import { createHmac, timingSafeEqual } from "node:crypto";
import { EcpayReconcileMismatchError, reconcileEcpayService } from "@/lib/ecpayReconcile";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// Bot/app-api signed 查單: caller is qiunai/utils/ecpayInquiry.js (requestEcpayInquiry).
// Body {order, source, userId, channelId, timestamp}; header X-Ecpay-Bot-Signature =
// hex HMAC-SHA256(SUPABASE_SERVICE_ROLE_KEY, raw body). Amounts in the request are ignored:
// paid state comes only from a CheckMacValue-verified 綠界 QueryTradeInfo response.
export type ServiceInquiryStatus = "paid" | "pending" | "failed" | "needs_review" | "cooldown" | "error";
export type ServiceInquiryResult = {
  httpStatus: number;
  body: { status?: ServiceInquiryStatus; fulfillment_status?: string | null; retry_after?: number; error?: string };
};

const MAX_BODY = 2048;
const TIMESTAMP_WINDOW_SECONDS = 300;
const ORDER_COOLDOWN_MS = 60_000;
// Per-process throttle so a button spam or scheduler loop cannot hammer QueryTradeInfo.
const lastQueried = new Map<string, number>();

export function resetServiceInquiryCooldown() {
  lastQueried.clear();
}

function verifySignature(raw: string, provided: string | null): boolean {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !provided || !/^[a-f0-9]{64}$/.test(provided)) return false;
  const expected = createHmac("sha256", secret).update(raw).digest();
  return timingSafeEqual(Buffer.from(provided, "hex"), expected);
}

export async function handleServiceInquiry(raw: string, signature: string | null, now = Date.now()): Promise<ServiceInquiryResult> {
  if (raw.length > MAX_BODY) return { httpStatus: 413, body: { error: "請求過大" } };
  if (!verifySignature(raw, signature)) return { httpStatus: 401, body: { error: "未授權" } };
  let input: { order?: unknown; timestamp?: unknown };
  try { input = JSON.parse(raw); } catch { return { httpStatus: 400, body: { error: "請求格式錯誤" } }; }
  if (typeof input.timestamp !== "number" || !Number.isInteger(input.timestamp) ||
      Math.abs(Math.floor(now / 1000) - input.timestamp) > TIMESTAMP_WINDOW_SECONDS)
    return { httpStatus: 401, body: { error: "請求已過期" } };
  const order = typeof input.order === "string" ? input.order : "";
  if (!/^[A-Za-z0-9]{1,20}$/.test(order)) return { httpStatus: 400, body: { error: "付款編號錯誤" } };

  const { data: payment, error } = await getSupabaseAdmin().from("ecpay_service_payments")
    .select("status,fulfillment_status").eq("merchant_trade_no", order).maybeSingle();
  if (error) return { httpStatus: 502, body: { status: "error", error: "付款單讀取失敗" } };
  if (!payment) return { httpStatus: 404, body: { error: "找不到付款單" } };
  if (payment.status !== "pending")
    return { httpStatus: 200, body: { status: payment.status === "paid" ? "paid" : "failed", fulfillment_status: payment.fulfillment_status ?? null } };

  const last = lastQueried.get(order);
  if (last !== undefined && now - last < ORDER_COOLDOWN_MS)
    return { httpStatus: 200, body: { status: "cooldown", retry_after: Math.max(1, Math.ceil((ORDER_COOLDOWN_MS - (now - last)) / 1000)) } };
  lastQueried.set(order, now);

  try {
    // Reuses the admin reconcile: verified QueryTradeInfo, amount/trade-no match, then ecpay_mark_service_paid.
    const result = await reconcileEcpayService(order);
    const status: ServiceInquiryStatus = result.localStatus === "paid" ? "paid"
      : result.remoteStatus === "pending" ? "pending" : "failed";
    return { httpStatus: 200, body: { status, fulfillment_status: result.fulfillmentStatus ?? null } };
  } catch (cause) {
    if (cause instanceof EcpayReconcileMismatchError) {
      console.error("ECPay service inquiry mismatch", order, cause.message);
      return { httpStatus: 200, body: { status: "needs_review", error: cause.message } };
    }
    console.error("ECPay service inquiry failed", order, cause);
    return { httpStatus: 502, body: { status: "error", error: "綠界查詢暫時無法完成" } };
  }
}
