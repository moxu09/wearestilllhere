import { createEcpayServiceCheckout, getEcpayConfig } from "@/lib/ecpay";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] || character);
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const order = url.searchParams.get("order") || "";
    if (!/^[A-Za-z0-9]{1,20}$/.test(order)) throw new Error("付款編號錯誤");
    const method = url.searchParams.get("method");
    if (!method) {
      const { data, error } = await getSupabaseAdmin().from("ecpay_service_payments")
        .select("amount,status,payment_kind").eq("merchant_trade_no", order).maybeSingle();
      if (error || !data || data.status !== "pending") throw new Error("付款單不存在或已完成");
      const amount = Number(data.amount);
      const gateway = getEcpayConfig();
      const methods = [
        { value: "Credit", label: "信用卡刷卡", min: 6, max: 199_999 },
        { value: "ATM", label: "ATM 虛擬帳號", min: 16, max: 49_999 },
        { value: "CVS", label: "超商代碼", min: 34, max: 20_000 },
        { value: "BARCODE", label: "超商條碼", min: 18, max: 20_000 },
      ].filter(item => amount >= item.min && amount <= item.max &&
        (gateway.available || (gateway.inSiteAvailable && item.value === "Credit")) &&
        (data.payment_kind !== "topup" || (item.value !== "CVS" && item.value !== "BARCODE")));
      const links = methods.map(item => {
        const target = item.value === "Credit" && process.env.ECPAY_INSITE_ACCEPT_PAYMENTS === "true"
          ? `/payments/ecpay/service/insite?order=${encodeURIComponent(order)}`
          : `${url.pathname}?order=${encodeURIComponent(order)}&method=${item.value}`;
        return `<a href="${escapeHtml(target)}">${escapeHtml(item.label)}</a>`;
      }).join("");
      const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>選擇綠界付款方式</title><style>body{margin:0;background:#0f172a;color:#fff;font-family:system-ui,sans-serif;min-height:100vh;display:grid;place-items:center}.card{width:min(480px,calc(100% - 40px));padding:32px;border-radius:20px;background:#1e293b}a{display:block;margin-top:12px;padding:16px;border-radius:12px;background:#047857;color:#fff;text-decoration:none;font-weight:700;text-align:center}p{line-height:1.7;color:#cbd5e1}</style></head><body><main class="card"><h1>選擇付款方式</h1><p>應付金額 NT$ ${amount.toLocaleString("zh-TW")}。ATM、超商代碼與條碼取得繳費資訊後，仍須實際繳費才會成立訂單。</p>${links}</main></body></html>`;
      return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'" } });
    }
    const payment = await createEcpayServiceCheckout(order, method);
    const inputs = Object.entries(payment.fields)
      .map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">`)
      .join("");
    const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>前往綠界付款</title></head><body><main><h1>正在前往綠界安全付款頁</h1><p>請勿關閉此頁；若沒有自動跳轉，請按下方按鈕。</p><form method="post" action="${escapeHtml(payment.action)}">${inputs}<button type="submit">前往綠界付款</button></form></main><script>document.forms[0].submit()</script></body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; form-action https://payment.ecpay.com.tw https://payment-stage.ecpay.com.tw" } });
  } catch (error) {
    return new Response(error instanceof Error ? escapeHtml(error.message) : "無法建立付款頁", { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  }
}
