import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDirectServiceNotice } from '../lib/ecpayDirectNotice.ts';
import { encryptEcpayInSiteData } from '../lib/ecpayInSite.ts';
const cfg={merchantId:'3002607',hashKey:'pwFHCqoQZGmho4w6',hashIv:'EkRm7iFT261dpevs'};
const data={MerchantID:cfg.merchantId,RtnCode:1,OrderInfo:{MerchantTradeNo:'QN123',TradeNo:'1234567',TradeAmt:100,TradeStatus:'1',PaymentType:'ATM',PaymentDate:'2026/10/26 01:00:00'}};
const envelope=(payload=data,extra={})=>({MerchantID:cfg.merchantId,TransCode:1,Data:encryptEcpayInSiteData(payload,cfg.hashKey,cfg.hashIv),...extra});
test('付款通知接受等值字串狀態與數字商戶代號，仍須成功解密及匹配內外商戶',()=>{
 assert.equal(parseDirectServiceNotice(envelope(),cfg).amount,100);
 assert.equal(parseDirectServiceNotice(envelope({...data,MerchantID:3002607,RtnCode:'1',OrderInfo:{...data.OrderInfo,TradeAmt:'100',TradeStatus:1}},{MerchantID:3002607,TransCode:'1'}),cfg).order,'QN123');
 for(const extra of [{MerchantID:'OTHER'},{TransCode:true},{Data:'forged'}])assert.throws(()=>parseDirectServiceNotice(envelope(data,extra),cfg),/ECPAY_NOTICE_/);
 assert.throws(()=>parseDirectServiceNotice(envelope({...data,MerchantID:'999'}),cfg),/INNER_MERCHANT/);
});
test('模擬付款、非成功與未付款通知不入帳；拒絕無效金額與方法',()=>{
 for(const extra of [{SimulatePaid:1},{SimulatePaid:'1'},{SimulatePaid:true},{RtnCode:2}])assert.equal(parseDirectServiceNotice(envelope({...data,...extra}),cfg),null);
 for(const info of [{TradeAmt:true},{TradeAmt:-1},{TradeStatus:0},{PaymentType:'Credit'},{MerchantTradeNo:'bad-id'},{PaymentDate:null}])
  assert.throws(()=>parseDirectServiceNotice(envelope({...data,OrderInfo:{...data.OrderInfo,...info}}),cfg),/FIELDS_INVALID/);
});
