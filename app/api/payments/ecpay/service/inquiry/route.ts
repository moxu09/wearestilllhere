import { handleServiceInquiry, SERVICE_INQUIRY_MAX_BODY_BYTES } from "@/lib/ecpayServiceInquiry";

export const runtime = "nodejs";

const headers = { "Cache-Control": "no-store" };

// Reads at most `limit` bytes; stops (and cancels the stream) as soon as the cap is passed.
async function readCapped(request: Request, limit: number): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) { await reader.cancel().catch(() => undefined); return null; }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > SERVICE_INQUIRY_MAX_BODY_BYTES)
      return Response.json({ error: "請求過大" }, { status: 413, headers });
    const raw = await readCapped(request, SERVICE_INQUIRY_MAX_BODY_BYTES);
    if (raw === null) return Response.json({ error: "請求過大" }, { status: 413, headers });
    const { httpStatus, body } = await handleServiceInquiry(raw, request.headers.get("x-ecpay-bot-signature"));
    return Response.json(body, { status: httpStatus, headers });
  } catch (error) {
    console.error("ECPay service inquiry route failed", error);
    return Response.json({ status: "error", error: "綠界查詢暫時無法完成" }, { status: 500, headers });
  }
}
