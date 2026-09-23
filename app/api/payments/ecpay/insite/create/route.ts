import { submitInSitePayment, type InSiteKind } from "@/lib/ecpayInSiteCheckout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 8192) return Response.json({ error: "資料過大" }, { status: 413 });
    const raw = await request.text();
    if (raw.length > 8192) return Response.json({ error: "資料過大" }, { status: 413 });
    const body = JSON.parse(raw) as { kind?: InSiteKind; merchantTradeNo?: string; attemptId?: string; payToken?: string };
    if (body.kind !== "service" && body.kind !== "merchandise") throw new Error("付款類別錯誤");
    const result = await submitInSitePayment({
      kind: body.kind, merchantTradeNo: body.merchantTradeNo || "",
      attemptId: body.attemptId || "", payToken: body.payToken || "",
    });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("ECPay in-site CreatePayment failed", error);
    return Response.json({ error: error instanceof Error ? error.message : "綠界付款送出失敗，請先查詢付款結果" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
