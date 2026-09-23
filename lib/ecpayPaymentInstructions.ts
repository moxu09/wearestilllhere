export type EcpayInstructions = {
  method: "ATM" | "CVS" | "BARCODE";
  expireDate: string;
  bankCode?: string;
  virtualAccount?: string;
  paymentNo?: string;
  barcode?: [string, string, string];
};

export function getEcpayInstructions(raw: unknown): EcpayInstructions | null {
  if (!raw || typeof raw !== "object") return null;
  const fields = raw as Record<string, unknown>;
  const method = String(fields.PaymentType || "").split("_")[0];
  const expireDate = String(fields.ExpireDate || "");
  if (!/^\d{4}\/\d{2}\/\d{2}( \d{2}:\d{2}:\d{2})?$/.test(expireDate)) return null;
  if (method === "ATM" && /^\d{3}$/.test(String(fields.BankCode || "")) && /^\d{6,16}$/.test(String(fields.vAccount || "")))
    return { method, expireDate, bankCode: String(fields.BankCode), virtualAccount: String(fields.vAccount) };
  if (method === "CVS" && /^[A-Za-z0-9]{6,14}$/.test(String(fields.PaymentNo || "")))
    return { method, expireDate, paymentNo: String(fields.PaymentNo) };
  const barcode = [fields.Barcode1, fields.Barcode2, fields.Barcode3].map(value => String(value || ""));
  if (method === "BARCODE" && barcode.every(value => /^[A-Za-z0-9-]{1,20}$/.test(value)))
    return { method, expireDate, barcode: barcode as [string, string, string] };
  return null;
}
