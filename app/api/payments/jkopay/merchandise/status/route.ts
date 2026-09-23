import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const platformOrderId = new URL(request.url).searchParams.get("order")?.trim();
  if (!platformOrderId) return Response.json({ error: "缺少訂單編號" }, { status: 400 });
  const { data, error } = await getSupabaseAdmin()
    .from("merchandise_orders")
    .select("order_no,status,total_amount,paid_at")
    .eq("platform_order_id", platformOrderId)
    .maybeSingle();
  if (error || !data) return Response.json({ error: "找不到訂單" }, { status: 404 });
  return Response.json(data, { headers: { "Cache-Control": "no-store" } });
}
