import { issueServiceDirect } from "@/lib/ecpayServiceDirect";
import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 2048) return Response.json({ error: "請求過大" }, { status: 413 });
    const raw = await request.text();
    if (raw.length > 2048) return Response.json({ error: "請求過大" }, { status: 413 });
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const provided = request.headers.get("x-ecpay-bot-signature") || "";
    if (!secret || !/^[a-f0-9]{64}$/.test(provided)) return Response.json({ error: "未授權" }, { status: 401 });
    const expected = createHmac("sha256", secret).update(raw).digest();
    if (!timingSafeEqual(Buffer.from(provided, "hex"), expected)) return Response.json({ error: "未授權" }, { status: 401 });
    const input = JSON.parse(raw) as { order?: string; method?: "ATM" | "CVS" | "BARCODE"; timestamp?: number };
    if (!Number.isInteger(input.timestamp) || Math.abs(Math.floor(Date.now() / 1000) - input.timestamp!) > 300)
      return Response.json({ error: "請求已過期" }, { status: 401 });
    if (!input.order || !input.method) return Response.json({ error: "缺少付款資料" }, { status: 400 });
    const instructions = await issueServiceDirect(input.order, input.method);
    return Response.json({ payment_info: instructions }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "無法取得繳費資訊" },
      { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
