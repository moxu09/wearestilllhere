export type EcpayNoncreditMethod = "ATM" | "CVS" | "BARCODE";

export function paymentInfoFields(method: "Credit" | EcpayNoncreditMethod, baseUrl: string, kind: "merchandise" | "service"): Record<string, string> {
  if (method === "Credit") return { NeedExtraPaidInfo: "Y" };
  const path = `/api/payments/ecpay/${kind}/payment-info`;
  return {
    PaymentInfoURL: `${baseUrl}${path}`,
    ClientRedirectURL: `${baseUrl}${path}/display`,
    ...(method === "ATM" ? { ExpireDate: "3" } : { StoreExpireDate: method === "CVS" ? "4320" : "3" }),
  };
}
