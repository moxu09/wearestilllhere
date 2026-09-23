import { handleInSiteReturn } from "@/lib/ecpayInSiteCheckout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (Number(request.headers.get("content-length") || 0) > 16384) return new Response("0|ERROR", { status: 413 });
    if (!request.headers.get("content-type")?.includes("application/json")) return new Response("0|ERROR", { status: 415 });
    const raw = await request.text();
    if (raw.length > 16384) return new Response("0|ERROR", { status: 413 });
    await handleInSiteReturn(JSON.parse(raw));
    return new Response("1|OK", { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("ECPay in-site ReturnURL failed", error);
    return new Response("0|ERROR", { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  }
}
