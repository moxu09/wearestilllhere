import { supabase } from "@/lib/supabase";
import type { EcpayInstructions } from "@/lib/ecpayPaymentInstructions";

async function accessToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("登入已過期，請重新登入後回到訂單頁取號");
  return session.access_token;
}

export async function getPlatformAtmPayment(orderId: string): Promise<EcpayInstructions | null> {
  const response = await fetch(`/api/payments/ecpay/platform/atm/entry?orderId=${encodeURIComponent(orderId)}`, {
    headers: { Authorization: `Bearer ${await accessToken()}` }, cache: "no-store",
  });
  const result = await response.json() as { payment_info?: EcpayInstructions | null; error?: string };
  if (!response.ok) throw new Error(result.error || "查詢虛擬 ATM 失敗");
  return result.payment_info || null;
}

export async function startPlatformAtmPayment(orderId: string): Promise<EcpayInstructions> {
  const response = await fetch("/api/payments/ecpay/platform/atm/entry", {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await accessToken()}` },
    cache: "no-store", body: JSON.stringify({ orderId }),
  });
  const result = await response.json() as { payment_info?: EcpayInstructions; error?: string };
  if (!response.ok || result.payment_info?.method !== "ATM")
    throw new Error(result.error || "無法取得虛擬 ATM 帳號，請勿重複下單");
  return result.payment_info;
}
