import { createMerchandisePayment, type MerchandiseCheckoutRequest } from "@/lib/jkopay";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as MerchandiseCheckoutRequest;
    const payment = await createMerchandisePayment(input);
    return Response.json(payment, { status: 201 });
  } catch (error) {
    console.error("Failed to create JKOPay merchandise payment", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "街口付款建立失敗" },
      { status: 400 },
    );
  }
}
