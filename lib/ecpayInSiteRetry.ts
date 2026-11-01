import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

// Rotate the browser token only before CreatePayment wins its atomic claim.
// The replaced attempt ID cannot authorize a charge, even from a stale tab.
export async function claimTokenAttempt(db: SupabaseClient, trade: string, kind: string, restart = false) {
  const attemptId = randomUUID();
  const inserted = await db.from('ecpay_insite_attempts').insert({merchant_trade_no:trade,payment_kind:kind,attempt_id:attemptId,status:'token_requested'});
  if (!inserted.error) return attemptId;
  if (inserted.error.code !== '23505') throw new Error('站內付交易記錄建立失敗，請稍後再試');
  if (!restart) throw new Error('已有刷卡畫面；若尚未確認付款，可按「重新輸入／更換信用卡」沿用原訂單');
  const found = await db.from('ecpay_insite_attempts').select('attempt_id,status,payment_kind,updated_at').eq('merchant_trade_no',trade).single();
  if (found.error) throw new Error('無法核對原付款階段，請先查詢付款結果');
  const old = found.data;
  if (old.payment_kind !== kind || !['token_ready','token_failed','token_requested'].includes(old.status))
    throw new Error('付款已送出或仍在確認中，請先查詢結果，不能再次刷卡');
  if (old.status === 'token_requested' && Date.now()-Date.parse(old.updated_at)<60_000)
    throw new Error('付款畫面仍在建立，請稍候一分鐘再重新載入');
  const replaced = await db.from('ecpay_insite_attempts').update({attempt_id:attemptId,status:'token_requested',token_expires_at:null,updated_at:new Date().toISOString()})
    .eq('merchant_trade_no',trade).eq('payment_kind',kind).eq('attempt_id',old.attempt_id).eq('status',old.status).eq('updated_at',old.updated_at)
    .select('attempt_id').maybeSingle();
  if (replaced.error || !replaced.data) throw new Error('付款狀態已更新，請先查詢付款結果');
  return attemptId;
}
