import test from 'node:test';
import assert from 'node:assert/strict';
import { inquireEcpayService } from '../lib/ecpayInquiry.ts';
const cfg={}, input={order:'QN123',source:'manual',userId:'u',channelId:'c'};
function db({claim={status:'claimed',lease_token:'lease'},payment={organization_code:'qiunai',user_id:'u',channel_id:'c',amount:100,raw_result:{TradeNo:'123',PaymentType:'ATM'}},finish={status:'paid',fulfillment_status:'pending'}}={}){
 const calls=[];
 return {calls,from(){const q={select(){return q},eq(){return q},async maybeSingle(){return {data:payment,error:null}}};return q},async rpc(name,args){calls.push({name,args});return {data:name==='ecpay_claim_service_inquiry'?claim:finish,error:null}}};
}
const paid={status:'paid',amount:100,tradeNo:'123',paymentDate:'2026/10/26 01:00:00',raw:{PaymentType:'ATM_BOT'}};
test('查單需匹配本人、頻道、店別；限流及已付款不再打綠界',async()=>{
 for(const bad of [{userId:'other'},{channelId:'other'}])await assert.rejects(inquireEcpayService(db(),cfg,{...input,...bad},async()=>{throw Error('不應查詢')}),/不屬於/);
 await assert.rejects(inquireEcpayService(db({payment:{organization_code:'deepnight'}}),cfg,input),/秋奈/);
 for(const status of ['cooldown','paid','needs_review']){
  const d=db({claim:{status}});const r=await inquireEcpayService(d,cfg,input,async()=>{throw Error('不應查詢')});assert.equal(r.status,status);assert.equal(d.calls.length,1);
 }
});
test('成功驗證才提交完成，保留實際付款時間；待付款不冒稱成功',async()=>{
 const d=db();await inquireEcpayService(d,cfg,input,async()=>paid);
 assert.equal(d.calls[1].args.p_remote_status,'paid');assert.equal(d.calls[1].args.p_payment_date,paid.paymentDate);
 const p=db({finish:{status:'pending'}});assert.equal((await inquireEcpayService(p,cfg,input,async()=>({...paid,status:'pending',paymentDate:null}))).status,'pending');
});
test('金額、原交易編號、付款方式、模擬狀態不符皆不提交付款',async()=>{
 for(const extra of [{amount:101},{tradeNo:'other'},{raw:{PaymentType:'CVS_CVS'}},{raw:{PaymentType:'ATM_BOT',SimulatePaid:'1'}}]){
  const d=db({finish:{status:'error'}});await inquireEcpayService(d,cfg,input,async()=>({...paid,...extra}));assert.ok(d.calls[1].args.p_error);assert.equal(d.calls[1].args.p_remote_status,'failed');
 }
});
test('綠界403持久化30分鐘冷卻，網路錯誤不改成已付款',async()=>{
 for(const message of ['綠界查詢失敗（HTTP 403）','timeout']){const d=db({finish:{status:'error'}});await inquireEcpayService(d,cfg,input,async()=>{throw Error(message)});assert.equal(d.calls[1].args.p_rate_limited,message.includes('403'));assert.ok(d.calls[1].args.p_error);}
});
test('超商代碼使用同一驗證與節流路徑，確認後才提交付款',async()=>{
 const d=db({payment:{organization_code:'qiunai',user_id:'u',channel_id:'c',amount:100,raw_result:{TradeNo:'123',PaymentType:'CVS'}}});
 await inquireEcpayService(d,cfg,input,async()=>({...paid,raw:{PaymentType:'CVS_CVS'}}));
 assert.equal(d.calls[1].args.p_remote_status,'paid');assert.equal(d.calls[1].args.p_amount,100);
});
