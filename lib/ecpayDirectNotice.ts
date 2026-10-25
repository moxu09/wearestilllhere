import { decryptEcpayInSiteData } from './ecpayInSite.ts';
type Json = Record<string, unknown>;
type Config = { merchantId: string; hashKey: string; hashIv: string };
function object(value: unknown): Json {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('ECPAY_NOTICE_OBJECT_INVALID');
  return value as Json;
}
function identifier(value: unknown) {
  if (typeof value === 'string' && /^\d{1,20}$/.test(value)) return value;
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) return String(value);
  return '';
}
const one = (value: unknown) => value === 1 || value === '1';
// 官方通知格式：https://developers.ecpay.com.tw/28010/（2026-10-26 核對）。
export function parseDirectServiceNotice(envelope: unknown, config: Config) {
  const outer = object(envelope);
  if (!config.merchantId || identifier(outer.MerchantID) !== config.merchantId) throw new Error('ECPAY_NOTICE_OUTER_MERCHANT_MISMATCH');
  if (!one(outer.TransCode)) throw new Error('ECPAY_NOTICE_TRANSPORT_FAILED');
  if (typeof outer.Data !== 'string' || !outer.Data || outer.Data.length > 16384) throw new Error('ECPAY_NOTICE_CIPHERTEXT_INVALID');
  let data: Json;
  try { data = object(decryptEcpayInSiteData(outer.Data, config.hashKey, config.hashIv)); }
  catch { throw new Error('ECPAY_NOTICE_DECRYPT_FAILED'); }
  if (identifier(data.MerchantID) !== config.merchantId) throw new Error('ECPAY_NOTICE_INNER_MERCHANT_MISMATCH');
  if (data.SimulatePaid !== undefined && ![0, '0'].includes(data.SimulatePaid as number | string)) return null;
  if (!one(data.RtnCode)) return null;
  const info = object(data.OrderInfo);
  const order = typeof info.MerchantTradeNo === 'string' ? info.MerchantTradeNo : '';
  const tradeNo = typeof info.TradeNo === 'string' ? info.TradeNo : '';
  const amount = typeof info.TradeAmt === 'number' || typeof info.TradeAmt === 'string' && /^\d+$/.test(info.TradeAmt) ? Number(info.TradeAmt) : NaN;
  if (!/^[A-Za-z0-9]{1,20}$/.test(order) || !/^[A-Za-z0-9]{1,20}$/.test(tradeNo) ||
      !Number.isSafeInteger(amount) || amount <= 0 || !one(info.TradeStatus) || !['ATM','CVS','BARCODE'].includes(String(info.PaymentType)) ||
      typeof info.PaymentDate !== 'string' || !/^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}:\d{2}$/.test(info.PaymentDate)) throw new Error('ECPAY_NOTICE_PAYMENT_FIELDS_INVALID');
  return { order, tradeNo, amount, method: String(info.PaymentType), paymentDate: info.PaymentDate, data };
}
