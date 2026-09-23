import { saveEcpayPaymentInfo } from "@/lib/ecpay";

export async function handleEcpayPaymentInfo(
  request: Request,
  kind: "merchandise" | "service",
  display: boolean,
) {
  try {
    const body = await request.text();
    if (body.length > 16_384) return new Response("0|ERROR", { status: 413 });
    const fields = Object.fromEntries(new URLSearchParams(body));
    const { merchantTradeNo } = await saveEcpayPaymentInfo(kind, fields);
    if (display) {
      const path = kind === "merchandise" ? "/merchandise/payment-result" : "/payments/ecpay/service/status";
      const destination = new URL(path, request.url);
      destination.searchParams.set("order", merchantTradeNo);
      return Response.redirect(destination, 303);
    }
    return new Response("1|OK", { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to save ECPay payment instructions", error);
    return new Response("0|ERROR", { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  }
}
