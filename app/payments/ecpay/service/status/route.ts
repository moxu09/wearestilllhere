import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(request: Request) {
  const order = new URL(request.url).searchParams.get("order") || "";
  if (!/^[A-Za-z0-9]{1,20}$/.test(order)) return new Response("付款編號錯誤", { status: 400 });
  const { data: payment, error } = await getSupabaseAdmin()
    .from("ecpay_service_payments")
    .select("amount,status")
    .eq("merchant_trade_no", order)
    .maybeSingle();
  if (error || !payment) return new Response("找不到付款單", { status: 404 });
  const paid = payment.status === "paid";
  const title = paid ? "付款成功" : "正在確認付款結果";
  const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="5"><title>${title}</title><style>body{margin:0;background:#111827;color:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;display:grid;place-items:center;min-height:100vh}.card{max-width:520px;margin:24px;padding:36px;border-radius:20px;background:#1f2937;text-align:center}h1{color:${paid ? "#34d399" : "#fbbf24"}}p{line-height:1.8;color:#d1d5db}</style></head><body><main class="card"><h1>${title}</h1><p>${paid ? `已完成 NT$${Number(payment.amount).toLocaleString("zh-TW")} 付款，請回到 Discord 查看。` : "付款通知可能需要幾秒鐘，頁面會自動更新。請勿重複付款。"}</p></main></body></html>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
