// Virtual ATM becomes available on 2026-09-28 00:00 Asia/Taipei.
export const ECPAY_ATM_START = Date.parse("2026-09-27T16:00:00.000Z");

export function isEcpayAtmAvailable(now = Date.now()): boolean {
  return now >= ECPAY_ATM_START;
}

export function isEcpayAtmAvailableForPayment(
  payment: { organization_code?: string | null; metadata?: unknown },
  now = Date.now(),
): boolean {
  if (isEcpayAtmAvailable(now)) return true;
  const metadata = payment.metadata;
  return payment.organization_code === "qiunai" &&
    metadata !== null && typeof metadata === "object" && !Array.isArray(metadata) &&
    "flow" in metadata && metadata.flow === "self_service";
}
