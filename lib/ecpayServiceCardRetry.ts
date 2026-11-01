import {getSupabaseAdmin} from './supabaseAdmin';
import {getEcpayConfig} from './ecpay';
import {parseFinalCardFailure} from './ecpayCardFailure';
import {queryInSiteCredit} from './ecpayInSiteQuery';
export async function recordVerifiedCardFailure(data:Record<string,unknown>) {
  const f=parseFinalCardFailure(data);if(!f)return;
  const {error}=await getSupabaseAdmin().rpc('ecpay_record_final_card_failure',{p_trade:f.merchantTradeNo,p_gateway_trade:f.tradeNo,p_amount:f.amount,p_code:f.code});
  if(error)throw new Error('付款失敗紀錄尚未保存，請先查詢付款結果');
}
export async function retryFailedServiceCard(trade:string) {
  if(!/^[A-Za-z0-9]{1,20}$/.test(trade))throw new Error('付款編號錯誤');
  const db=getSupabaseAdmin();const {data:p,error}=await db.from('ecpay_service_payments').select('status,metadata,amount').eq('merchant_trade_no',trade).maybeSingle();
  if(error||!p)throw new Error('找不到付款單');
  if(p.status==='failed' && typeof p.metadata?.card_retry_to==='string')return p.metadata.card_retry_to;
  if(p.status!=='pending'||!p.metadata?.verified_card_failure)throw new Error('付款結果仍待確認，不能重複付款');
  const remote=await queryInSiteCredit(getEcpayConfig(),trade);
  if(String(remote.TradeStatus)!=='0'||Number(remote.TradeAmt)!==Number(p.amount)||remote.TradeNo!==p.metadata.verified_card_failure.trade_no)throw new Error('銀行付款結果已變更，請重新查詢並聯繫客服，勿重複付款');
  const {data,error:retryError}=await db.rpc('ecpay_retry_failed_service_card',{p_trade:trade,p_gateway_trade:remote.TradeNo,p_amount:remote.TradeAmt});
  if(retryError||!data?.merchant_trade_no)throw new Error(retryError?.message||'無法建立重新付款連結');return String(data.merchant_trade_no);
}
