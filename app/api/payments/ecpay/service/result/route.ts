import { completeEcpayServicePayment, verifyEcpayCallback } from "@/lib/ecpay";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (body.length > 16_384) return new Response("0|ERROR", { status: 413 });
    const fields = Object.fromEntries(new URLSearchParams(body));
    if (!verifyEcpayCallback(fields)) return new Response("0|ERROR", { status: 403 });
    await completeEcpayServicePayment(fields);
    return new Response("1|OK", { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Failed to complete ECPay service payment", error);
    return new Response("0|ERROR", { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
