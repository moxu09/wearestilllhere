import { createEcpayMerchandisePayment } from "@/lib/ecpay";
import type { MerchandiseCheckoutRequest } from "@/lib/jkopay";

export async function POST(request: Request) {
  try {
    const payment = await createEcpayMerchandisePayment((await request.json()) as MerchandiseCheckoutRequest);
    return Response.json(payment, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to create ECPay merchandise payment", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "綠界付款建立失敗" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
