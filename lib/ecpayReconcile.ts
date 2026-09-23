import { getEcpayConfig } from "./ecpay";
import { queryEcpayTrade } from "./ecpayQuery";
import { getSupabaseAdmin } from "./supabaseAdmin";

export async function reconcileEcpayMerchandise(merchantTradeNo: string) {
  const admin = getSupabaseAdmin();
  const { data: order, error } = await admin.from("merchandise_orders")
    .select("platform_order_id,payment_method,status,total_amount,trade_no")
    .eq("platform_order_id", merchantTradeNo).maybeSingle();
  if (error || !order) throw new Error("找不到商品付款單");
  if (order.payment_method !== "綠界支付") throw new Error("此訂單不是綠界付款");
  const remote = await queryEcpayTrade(getEcpayConfig(), merchantTradeNo);
  if (remote.amount !== Number(order.total_amount)) throw new Error("綠界與商品訂單金額不符");
  if (order.status === "paid" && order.trade_no !== remote.tradeNo)
    throw new Error("綠界交易序號與已付款訂單不符");
  if (order.status === "pending" && remote.status === "paid") {
    const { error: completeError } = await admin.rpc("complete_ecpay_merchandise_order", {
      p_merchant_trade_no: merchantTradeNo,
      p_trade_no: remote.tradeNo,
      p_amount: remote.amount,
      p_payment_date: remote.paymentDate,
      p_raw_result: { inquiry: remote.raw },
    });
    if (completeError) throw new Error(completeError.message || "商品付款入帳失敗");
  }
  return { remoteStatus: remote.status, localStatus: order.status === "pending" && remote.status === "paid" ? "paid" : order.status };
}

export async function reconcileEcpayService(merchantTradeNo: string) {
  const admin = getSupabaseAdmin();
  const { data: payment, error } = await admin.from("ecpay_service_payments")
    .select("merchant_trade_no,status,amount,trade_no,organization_code,fulfillment_status")
    .eq("merchant_trade_no", merchantTradeNo).maybeSingle();
  if (error || !payment) throw new Error("找不到服務付款單");
  const remote = await queryEcpayTrade(getEcpayConfig(), merchantTradeNo);
  if (remote.amount !== Number(payment.amount)) throw new Error("綠界與服務付款單金額不符");
  if (payment.status === "paid" && payment.trade_no !== remote.tradeNo)
    throw new Error("綠界交易序號與已付款服務單不符");
  if (payment.status === "pending" && remote.status === "paid") {
    const { error: completeError } = await admin.rpc("ecpay_mark_service_paid", {
      p_merchant_trade_no: merchantTradeNo,
      p_trade_no: remote.tradeNo,
      p_amount: remote.amount,
      p_payment_date: remote.paymentDate,
      p_raw_result: { inquiry: remote.raw },
    });
    if (completeError) throw new Error(completeError.message || "服務付款入帳失敗");
  }
  return {
    remoteStatus: remote.status,
    localStatus: payment.status === "pending" && remote.status === "paid" ? "paid" : payment.status,
    organizationCode: payment.organization_code,
    fulfillmentStatus: payment.fulfillment_status,
  };
}
