// Only authenticated, final Credit failures qualify; pending/unknown results never do.
export function parseFinalCardFailure(data: Record<string, unknown>) {
  const info = data.OrderInfo as Record<string, unknown> | undefined;
  const card = data.CardInfo as Record<string, unknown> | undefined;
  if (!info || !Number.isSafeInteger(data.RtnCode) || Number(data.RtnCode) <= 1 || data.RtnCode === 10300066 ||
      data.SimulatePaid === 1 || data.SimulatePaid === '1' || info.PaymentType !== 'Credit' || String(info.TradeStatus) !== '0' ||
      card?.AuthCode || !/^[A-Za-z0-9]{1,20}$/.test(String(info.MerchantTradeNo || '')) ||
      !/^[A-Za-z0-9]{1,20}$/.test(String(info.TradeNo || '')) || !Number.isSafeInteger(info.TradeAmt) || Number(info.TradeAmt) <= 0) return null;
  return {merchantTradeNo:String(info.MerchantTradeNo), tradeNo:String(info.TradeNo), amount:Number(info.TradeAmt), code:Number(data.RtnCode)};
}
