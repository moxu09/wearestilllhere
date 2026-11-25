import { handleServiceInquiry } from "@/lib/ecpayServiceInquiry";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 2048) return Response.json({ error: "請求過大" }, { status: 413 });
    const raw = await request.text();
    const { httpStatus, body } = await handleServiceInquiry(raw, request.headers.get("x-ecpay-bot-signature"));
    return Response.json(body, { status: httpStatus, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("ECPay service inquiry route failed", error);
    return Response.json({ status: "error", error: "綠界查詢暫時無法完成" }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
