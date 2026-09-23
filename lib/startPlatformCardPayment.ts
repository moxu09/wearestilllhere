import { supabase } from "@/lib/supabase";

export async function startPlatformCardPayment(orderId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("登入已過期，請重新登入後回到訂單頁刷卡");
  const response = await fetch("/api/payments/ecpay/platform/entry", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    cache: "no-store",
    body: JSON.stringify({ orderId }),
  });
  const result = await response.json() as { insiteUrl?: string; error?: string };
  if (!response.ok || !result.insiteUrl)
    throw new Error(result.error || "無法建立刷卡付款單");
  if (!/^\/payments\/ecpay\/platform\/insite\?order=[A-Za-z0-9]+$/.test(result.insiteUrl))
    throw new Error("刷卡付款網址不正確");
  window.location.assign(result.insiteUrl);
}
