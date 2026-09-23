import { createEcpayMerchandisePayment, type EcpayPaymentMethod } from "@/lib/ecpay";
import type { MerchandiseCheckoutRequest } from "@/lib/jkopay";

export async function POST(request: Request) {
  try {
    const input = await request.json() as MerchandiseCheckoutRequest & { ecpayMethod?: EcpayPaymentMethod };
    const inSite = input.ecpayMethod === "Credit" && process.env.ECPAY_INSITE_ACCEPT_PAYMENTS === "true";
    const payment = await createEcpayMerchandisePayment(input, inSite);
    if (inSite) return Response.json({
      merchantTradeNo: payment.merchantTradeNo,
      insiteUrl: `/payments/ecpay/merchandise/insite?order=${encodeURIComponent(payment.merchantTradeNo)}`,
    }, { status: 201, headers: { "Cache-Control": "no-store" } });
    return Response.json(payment, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to create ECPay merchandise payment", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "綠界付款建立失敗" },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
}
