import type { SupabaseClient } from '@supabase/supabase-js';
import { queryEcpayTrade } from './ecpayQuery.ts';

type Config = Parameters<typeof queryEcpayTrade>[0];
type Input = { order: string; source: 'manual' | 'scheduled'; userId?: string; channelId?: string };

// 規格：https://developers.ecpay.com.tw/2890/，查詢需驗簽；403 後停止查詢 30 分鐘。
export async function inquireEcpayService(db: SupabaseClient, config: Config, input: Input, query = queryEcpayTrade) {
  if (config.stage) throw new Error('測試金流不可用於正式查單補償');
  if (!/^[A-Za-z0-9]{1,20}$/.test(input.order)) throw new Error('付款編號錯誤');
  const { data: payment, error } = await db.from('ecpay_service_payments')
    .select('organization_code,user_id,channel_id,amount,raw_result,metadata')
    .eq('merchant_trade_no', input.order).maybeSingle();
  if (error || !payment || payment.organization_code !== 'qiunai') throw new Error('找不到秋奈付款單');
  if (input.source === 'manual' && (payment.user_id !== input.userId || payment.channel_id !== input.channelId))
    throw new Error('這筆付款不屬於你或此頻道');
  const { data: claim, error: claimError } = await db.rpc('ecpay_claim_service_inquiry', {
    p_merchant_trade_no: input.order, p_interval_seconds: input.source === 'manual' ? 60 : 300,
  });
  if (claimError) throw new Error('無法取得查單權限，請稍後再試');
  if (claim.status !== 'claimed') return claim;
  const args = { p_merchant_trade_no: input.order, p_lease_token: claim.lease_token };
  let remote;
  try {
    remote = await query(config, input.order);
    const method = String(payment.raw_result?.PaymentType || payment.metadata?.ecpay_direct_method || '').split('_')[0];
    if (remote.amount !== Number(payment.amount) || !remote.tradeNo || remote.tradeNo !== payment.raw_result?.TradeNo ||
        remote.raw.SimulatePaid === '1' ||
        (!remote.raw.PaymentType?.startsWith(method + '_') && remote.raw.PaymentType !== method))
      throw new Error('綠界與原繳費資訊不符，停止入帳');
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : '查單失敗';
    const { data, error: finishError } = await db.rpc('ecpay_finish_service_inquiry', {
      ...args, p_remote_status: 'failed', p_error: message, p_rate_limited: /HTTP 403/.test(message),
    });
    if (finishError) throw new Error('查單失敗，請稍後再試');
    return data;
  }
  const { data, error: finishError } = await db.rpc('ecpay_finish_service_inquiry', {
    ...args, p_remote_status: remote.status, p_trade_no: remote.tradeNo, p_amount: remote.amount,
    p_payment_date: remote.paymentDate, p_raw_result: remote.raw,
  });
  if (finishError) throw new Error('付款結果核對失敗，請聯繫客服，勿重複付款');
  return data;
}
