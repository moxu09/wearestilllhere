// Virtual ATM becomes available on 2026-09-28 00:00 Asia/Taipei.
export const ECPAY_ATM_START = Date.parse("2026-09-27T16:00:00.000Z");

export function isEcpayAtmAvailable(now = Date.now()): boolean {
  return now >= ECPAY_ATM_START;
}
