import { createInSiteToken, type InSiteKind } from "@/lib/ecpayInSiteCheckout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 4096) return Response.json({ error: "資料過大" }, { status: 413 });
    const raw = await request.text();
    if (raw.length > 4096) return Response.json({ error: "資料過大" }, { status: 413 });
    const body = JSON.parse(raw) as { kind?: InSiteKind; merchantTradeNo?: string; phone?: string; email?: string };
    if (body.kind !== "service" && body.kind !== "merchandise") throw new Error("付款類別錯誤");
    const result = await createInSiteToken({ kind: body.kind, merchantTradeNo: body.merchantTradeNo || "", phone: body.phone, email: body.email });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("ECPay in-site token failed", error);
    return Response.json({ error: error instanceof Error ? error.message : "無法建立站內付畫面" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
}
