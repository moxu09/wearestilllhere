import {encryptEcpayInSiteData,decryptEcpayInSiteData} from './ecpayInSite.ts';
type Config={merchantId:string;hashKey:string;hashIv:string;stage:boolean};
// Official QueryTrade endpoint: https://developers.ecpay.com.tw/9083/.
export async function queryInSiteCredit(config:Config, trade:string, fetcher:typeof fetch=fetch) {
  if(!/^[A-Za-z0-9]{1,20}$/.test(trade))throw new Error('付款編號錯誤');
  const host=config.stage?'https://ecpayment-stage.ecpay.com.tw':'https://ecpayment.ecpay.com.tw';
  const r=await fetcher(`${host}/1.0.0/Cashier/QueryTrade`,{method:'POST',headers:{'Content-Type':'application/json'},cache:'no-store',signal:AbortSignal.timeout(15000),body:JSON.stringify({MerchantID:config.merchantId,RqHeader:{Timestamp:Math.floor(Date.now()/1000)},Data:encryptEcpayInSiteData({MerchantID:config.merchantId,MerchantTradeNo:trade},config.hashKey,config.hashIv)})});
  if(!r.ok)throw new Error('綠界查詢暫時失敗，請稍後再試');
  const outer=await r.json();
  if(outer.MerchantID!==config.merchantId||outer.TransCode!==1||typeof outer.Data!=='string')throw new Error('付款查詢驗證失敗');
  const d=decryptEcpayInSiteData(outer.Data,config.hashKey,config.hashIv);
  const o=d.OrderInfo as Record<string,unknown>|undefined;
  if(d.RtnCode!==1||d.MerchantID!==config.merchantId||o?.MerchantTradeNo!==trade||o.PaymentType!=='Credit'||d.SimulatePaid===1||d.SimulatePaid==='1')throw new Error('付款查詢資料不符');
  return o;
}
