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
