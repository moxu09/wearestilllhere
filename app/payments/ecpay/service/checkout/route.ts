import { createEcpayServiceCheckout } from "@/lib/ecpay";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character] || character);
}

export async function GET(request: Request) {
  try {
    const order = new URL(request.url).searchParams.get("order") || "";
    const payment = await createEcpayServiceCheckout(order);
    const inputs = Object.entries(payment.fields)
      .map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">`)
      .join("");
    const html = `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>前往綠界付款</title></head><body><main><h1>正在前往綠界安全付款頁</h1><p>請勿關閉此頁；若沒有自動跳轉，請按下方按鈕。</p><form method="post" action="${escapeHtml(payment.action)}">${inputs}<button type="submit">前往綠界付款</button></form></main><script>document.forms[0].submit()</script></body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; form-action https://payment.ecpay.com.tw https://payment-stage.ecpay.com.tw" } });
  } catch (error) {
    return new Response(error instanceof Error ? escapeHtml(error.message) : "無法建立付款頁", { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  }
}
