import { apiError, requireSiteAdmin } from "@/lib/serverAuth";
import { reconcileEcpayService } from "@/lib/ecpayReconcile";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { admin } = await requireSiteAdmin(request);
    const { data, error } = await admin.from("ecpay_service_payments")
      .select("merchant_trade_no,organization_code,payment_kind,entity_key,user_id,amount,status,fulfillment_status,created_at,paid_at")
      .order("created_at", { ascending: false }).limit(200);
    if (error) throw error;
    return Response.json({ payments: data || [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireSiteAdmin(request);
    const body = (await request.json()) as { merchantTradeNo?: string };
    const merchantTradeNo = String(body.merchantTradeNo || "");
    if (!/^[A-Za-z0-9]{1,20}$/.test(merchantTradeNo))
      return Response.json({ error: "綠界交易編號錯誤" }, { status: 400 });
    return Response.json(await reconcileEcpayService(merchantTradeNo), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return apiError(error);
  }
}
