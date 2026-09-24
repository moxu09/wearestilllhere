import { getEcpayConfig } from "@/lib/ecpay";
import { isEcpayAtmAvailable } from "@/lib/ecpayAtmSchedule";
import { createPlatformPayment } from "@/lib/ecpayPlatform";
import { getPlatformAtmInfo, issuePlatformAtm } from "@/lib/ecpayPlatformAtm";

export const runtime = "nodejs";

function token(request: Request) {
  return request.headers.get("authorization")?.replace(/^Bearer /i, "").trim() || "";
}

export async function GET(request: Request) {
  try {
    const orderId = new URL(request.url).searchParams.get("orderId") || "";
    if (orderId && !token(request)) return Response.json({ error: "請先登入會員" }, { status: 401 });
    const info = orderId ? await getPlatformAtmInfo(orderId, token(request)) : null;
    return Response.json({ available: isEcpayAtmAvailable() && getEcpayConfig().nonCreditAvailable,
      payment_info: info }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "查詢虛擬 ATM 失敗" },
      { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 1024)
      return Response.json({ error: "資料過大" }, { status: 413 });
    if (!token(request)) return Response.json({ error: "請先登入會員" }, { status: 401 });
    const raw = await request.text();
    if (raw.length > 1024) return Response.json({ error: "資料過大" }, { status: 413 });
    const { orderId } = JSON.parse(raw) as { orderId?: string };
    const payment = await createPlatformPayment(String(orderId || ""), token(request),
      request.headers.get("origin") || "", "ATM");
    if (!payment.merchantTradeNo) throw new Error("無法取得虛擬 ATM 付款單");
    const info = await issuePlatformAtm(payment.merchantTradeNo);
    return Response.json({ payment_info: info }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "無法取得虛擬 ATM" },
      { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
