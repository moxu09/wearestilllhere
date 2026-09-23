// Sources: https://developers.ecpay.com.tw/2878/ and https://developers.ecpay.com.tw/15076/
// 10300066 means the result still needs confirmation, not a final card failure.
export function isEcpayFailedResultCode(code: string | number | undefined): boolean {
  const value = String(code ?? "");
  return Boolean(value && value !== "1" && value !== "10300066");
}
