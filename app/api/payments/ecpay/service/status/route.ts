import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { getEcpayInstructions } from "@/lib/ecpayPaymentInstructions";

export async function GET(request: Request) {
  const order = new URL(request.url).searchParams.get("order") || "";
  if (!/^[A-Za-z0-9]{1,20}$/.test(order)) return Response.json({ error: "付款編號錯誤" }, { status: 400 });
  const { data, error } = await getSupabaseAdmin().from("ecpay_service_payments")
    .select("amount,status,raw_result").eq("merchant_trade_no", order).maybeSingle();
  if (error || !data) return Response.json({ error: "找不到付款單" }, { status: 404 });
  return Response.json({ amount: data.amount, status: data.status, payment_info: data.status === "pending" ? getEcpayInstructions(data.raw_result) : null }, { headers: { "Cache-Control": "no-store" } });
}
