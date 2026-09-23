import { createPlatformPayment } from "@/lib/ecpayPlatform";
import { getEcpayConfig } from "@/lib/ecpay";

export const runtime = "nodejs";

export async function GET() {
  return Response.json({ available: getEcpayConfig().inSiteAvailable },
    { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 1024)
      return Response.json({ error: "資料過大" }, { status: 413 });
    const accessToken = request.headers.get("authorization")?.replace(/^Bearer /i, "").trim() || "";
    if (!accessToken) return Response.json({ error: "請先登入會員" }, { status: 401 });
    const raw = await request.text();
    if (raw.length > 1024) return Response.json({ error: "資料過大" }, { status: 413 });
    const body = JSON.parse(raw) as { orderId?: string };
    const result = await createPlatformPayment(String(body.orderId || ""), accessToken, request.headers.get("origin") || "");
    return Response.json(result, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "無法建立刷卡付款單" },
      { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
