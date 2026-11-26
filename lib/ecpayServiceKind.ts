// ecpay_service_payments.payment_kind values. 'draw' rows are created by the
// customer APP (app-api) for paid 扭蛋／一番賞 draws; they settle through the same
// ecpay_mark_service_paid path as 'topup' and are fulfilled by the 秋奈 bot.
export const APP_DRAW_PAYMENT_KIND = "draw";
export const APP_DRAW_ITEM_NAME = "APP 抽獎";

export function isAppDrawPayment(payment: { payment_kind?: string | null }): boolean {
  return payment.payment_kind === APP_DRAW_PAYMENT_KIND;
}

/**
 * TradeDesc / ItemName sent to 綠界 for an APP draw row; null for every other
 * kind, so existing kinds keep their original texts unchanged.
 */
export function appDrawTradeTexts(payment: {
  organization_code?: string | null; payment_kind?: string | null;
}): { tradeDesc: string; itemName: string } | null {
  if (!isAppDrawPayment(payment)) return null;
  return {
    tradeDesc: payment.organization_code === "qiunai" ? "秋奈 APP 抽獎付款" : "深夜不關燈 APP 抽獎付款",
    itemName: APP_DRAW_ITEM_NAME,
  };
}

export function serviceExpiredMessage(payment: { payment_kind?: string | null }): string {
  return isAppDrawPayment(payment)
    ? "付款連結已過期，請回到 APP 重新建立抽獎付款"
    : "付款連結已過期，請回到 Discord 重新建立訂單";
}

// APP 超商條碼／超商代碼／ATM 儲值 rows written by app-api (api/src/topupOffline.ts): payment_kind 'topup',
// 秋奈 only, metadata {flow:"app", issue:"direct", method, requestId}, merchant_trade_no QN + 18 upper hex.
// The bot's Discord topups and app-api's credit-card topups (topup.ts) carry no issue/method marker.
export const APP_DIRECT_TOPUP_TRADE_NO = /^QN[0-9A-F]{18}$/;
const APP_DIRECT_TOPUP_METHODS: Record<string, string> = { barcode: "BARCODE", cvs: "CVS", atm: "ATM" };

export function isAppDirectTopupPayment(payment: {
  payment_kind?: string | null; organization_code?: string | null; merchant_trade_no?: string | null; metadata?: unknown;
}): boolean {
  const m = payment.metadata;
  if (!m || typeof m !== "object" || Array.isArray(m)) return false;
  const meta = m as Record<string, unknown>;
  return payment.payment_kind === "topup" && payment.organization_code === "qiunai" &&
    meta.flow === "app" && meta.issue === "direct" &&
    typeof meta.method === "string" && Object.hasOwn(APP_DIRECT_TOPUP_METHODS, meta.method) &&
    typeof meta.requestId === "string" && meta.requestId.length > 0 &&
    APP_DIRECT_TOPUP_TRADE_NO.test(String(payment.merchant_trade_no ?? ""));
}

/** 綠界 AIO PaymentType prefix the APP chose for a direct topup row (ATM / CVS / BARCODE), or null. */
export function appDirectTopupMethod(payment: { metadata?: unknown }): string | null {
  const method = (payment.metadata as Record<string, unknown> | null | undefined)?.method;
  return typeof method === "string" && Object.hasOwn(APP_DIRECT_TOPUP_METHODS, method) ? APP_DIRECT_TOPUP_METHODS[method] : null;
}
