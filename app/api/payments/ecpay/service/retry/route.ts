import {getEcpayConfig} from "@/lib/ecpay";
import {isMerchantPaymentOrigin} from "@/lib/ecpayRequestOrigin";
import {retryFailedServiceCard} from '@/lib/ecpayServiceCardRetry';
export const runtime='nodejs';
export async function POST(request:Request){
 try{
  if(!isMerchantPaymentOrigin(request.headers.get('origin'),getEcpayConfig().baseUrl)) return Response.json({error:'請從原付款頁操作'},{status:403});
  const raw=await request.text();if(raw.length>256)throw new Error('資料過大');
  const body=JSON.parse(raw);const order=await retryFailedServiceCard(String(body.order||''));
  return Response.json({url:`/payments/ecpay/service/insite?order=${encodeURIComponent(order)}`},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'請稍後再試'},{status:400,headers:{'Cache-Control':'no-store'}});}
}
