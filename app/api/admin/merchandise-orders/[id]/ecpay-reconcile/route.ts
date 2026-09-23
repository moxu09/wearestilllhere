import { requireSiteAdmin, apiError } from "@/lib/serverAuth";
import { reconcileEcpayMerchandise } from "@/lib/ecpayReconcile";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { admin } = await requireSiteAdmin(request);
    const { id } = await params;
    if (!/^[0-9a-f-]{36}$/i.test(id)) return Response.json({ error: "訂單編號錯誤" }, { status: 400 });
    const { data: order, error } = await admin.from("merchandise_orders")
      .select("platform_order_id,payment_method")
      .eq("id", id).maybeSingle();
    if (error || !order) return Response.json({ error: "找不到商品訂單" }, { status: 404 });
    if (order.payment_method !== "綠界支付") return Response.json({ error: "此訂單不是綠界付款" }, { status: 400 });
    return Response.json(await reconcileEcpayMerchandise(order.platform_order_id), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
