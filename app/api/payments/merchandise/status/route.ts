import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const order = new URL(request.url).searchParams.get("order")?.trim() || "";
  if (!/^[A-Za-z0-9-]{1,80}$/.test(order))
    return Response.json({ error: "訂單編號錯誤" }, { status: 400 });
  const { data, error } = await getSupabaseAdmin()
    .from("merchandise_orders")
    .select("order_no,status,total_amount,paid_at,payment_method")
    .eq("platform_order_id", order)
    .maybeSingle();
  if (error || !data) return Response.json({ error: "找不到訂單" }, { status: 404 });
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
