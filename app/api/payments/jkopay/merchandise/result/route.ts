import {
  completeMerchandisePayment,
  getJkopayConfig,
  getRequestIp,
  isAllowedCallbackIp,
} from "@/lib/jkopay";

export async function POST(request: Request) {
  const config = getJkopayConfig();
  const requestIp = getRequestIp(request);
  if (!isAllowedCallbackIp(requestIp, config.callbackIps)) {
    console.warn(`Rejected JKOPay callback IP: ${requestIp || "unknown"}`);
    return Response.json({ ok: false }, { status: 403 });
  }
  try {
    await completeMerchandisePayment((await request.json()) as Record<string, unknown>);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Failed to complete JKOPay merchandise payment", error);
    return Response.json({ ok: false }, { status: 500 });
  }
}
