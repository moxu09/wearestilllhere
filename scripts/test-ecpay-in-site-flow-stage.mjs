import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import {
  buildEcpayInSiteTokenData, callEcpayInSiteApi, decryptEcpayInSiteData,
  parseInSiteResultOrder, parsePaidCreditNotice,
} from "../lib/ecpayInSite.ts";

// Stage-only diagnostic server. Uses ECPay's published shared test merchant,
// never production credentials or a production database. Stop after testing.
// Sources: https://developers.ecpay.com.tw/9040/ and /9053/ and /9058/ (2026-09-23).
const merchantId = "3002607";
const hashKey = "pwFHCqoQZGmho4w6";
const hashIv = "EkRm7iFT261dpevs";
const port = Number(process.env.ECPAY_STAGE_PREVIEW_PORT || 4178);
const sessions = new Map();

function tradeDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map(item => [item.type, item.value]));
  return `${value.year}/${value.month}/${value.day} ${value.hour}:${value.minute}:${value.second}`;
}

function publicOrigin(request) {
  const host = String(request.headers.host || "");
  if (/^[a-z0-9-]+\.trycloudflare\.com$/.test(host)) return `https://${host}`;
  if (/^(127\.0\.0\.1|localhost):4178$/.test(host)) return `http://${host}`;
  throw new Error("測試網址格式錯誤");
}

async function bodyText(request, limit = 16384) {
  let body = "";
  for await (const chunk of request) {
    body += chunk.toString("utf8");
    if (body.length > limit) throw new Error("要求內容過大");
  }
  return body;
}

function send(response, status, content, type = "text/plain; charset=utf-8") {
  response.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  response.end(content);
}

function decodeEnvelope(envelope) {
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope) ||
      envelope.MerchantID !== merchantId || envelope.TransCode !== 1 || typeof envelope.Data !== "string")
    throw new Error("通知外層資料錯誤");
  const data = decryptEcpayInSiteData(envelope.Data, hashKey, hashIv);
  if (data.MerchantID !== merchantId) throw new Error("通知商店代號不符");
  return data;
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", publicOrigin(request));
    if (request.method === "GET" && url.pathname === "/") {
      const origin = publicOrigin(request);
      if (!origin.startsWith("https://")) throw new Error("請由臨時 HTTPS 測試網址開啟");
      const tradeNo = `ST${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString("hex").toUpperCase()}`;
      const data = buildEcpayInSiteTokenData({
        merchantId, tradeNo, tradeDate: tradeDate(), amount: 100,
        description: "測試商品", itemName: "測試商品",
        returnUrl: `${origin}/return`, resultUrl: `${origin}/result`,
        method: "Credit", customerPhone: "0912345678",
      });
      const tokenResult = await callEcpayInSiteApi({
        merchantId, hashKey, hashIv, stage: true, endpoint: "GetTokenbyTrade", data,
      });
      if (typeof tokenResult.Token !== "string" || !tokenResult.Token) throw new Error("綠界未回傳 Token");
      sessions.set(tradeNo, { status: "token_ready", amount: 100 });
      const token = JSON.stringify(tokenResult.Token).replace(/</g, "\\u003c");
      send(response, 200, `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>綠界站內付 Stage 測試</title>
<main style="max-width:600px;margin:3rem auto;font:16px system-ui"><h1>綠界站內付 Stage 測試</h1>
<p>僅使用綠界公開測試商戶，不會扣真實款項。交易編號：${tradeNo}</p><p id="status">正在載入 SDK…</p>
<div id="ECPayPayment" style="min-height:220px;border:1px solid #ddd;padding:16px"></div><pre id="network"></pre>
<button id="pay" disabled style="margin:1rem 0;padding:.7rem 1.2rem">送出測試付款</button></main>
<script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
<script src="https://ecpg-stage.ecpay.com.tw/Scripts/sdk-1.0.0.js?t=20210121100116"></script>
<script>
  const status = document.getElementById('status');
  const button = document.getElementById('pay');
  jQuery(document).ajaxError((event, xhr, settings) => {
    document.getElementById('network').textContent = '綠界元件連線：HTTP ' + xhr.status + ' / ' + new URL(settings.url).pathname;
  });
  if (!window.ECPay) status.textContent = 'SDK 載入失敗';
  else window.ECPay.initialize('Stage', 1, error => {
    if (error != null) { status.textContent = '初始化失敗：' + error; return; }
    window.ECPay.createPayment(${token}, 'zh-TW', error => {
      status.textContent = error != null ? '元件顯示失敗：' + error : '元件已顯示（尚未送出付款）';
      if (error == null) button.disabled = false;
    }, 'V2');
  });
  button.addEventListener('click', () => {
    button.disabled = true;
    status.textContent = '正在取得測試付款代碼…';
    window.ECPay.getPayToken(async (value, error) => {
      if (error != null || !value?.PayToken) { status.textContent = '付款資料不完整：' + (error || '未取得代碼'); button.disabled = false; return; }
      try {
        const response = await fetch('/create', { method:'POST', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({ tradeNo:${JSON.stringify(tradeNo)}, payToken:value.PayToken }) });
        const result = await response.json();
        if (!response.ok) throw Error(result.error || '建立交易失敗');
        status.textContent = result.threeDUrl ? '即將前往測試 3D 驗證…' : '測試交易已建立，等候通知';
        if (result.threeDUrl) location.href = result.threeDUrl;
        else location.href = '/status?tradeNo=${tradeNo}';
      } catch (error) { status.textContent = error.message; }
    });
  });
</script></html>`, "text/html; charset=utf-8");
      return;
    }
    if (request.method === "POST" && url.pathname === "/create") {
      const input = JSON.parse(await bodyText(request));
      const session = sessions.get(input.tradeNo);
      if (!session || session.status !== "token_ready" || typeof input.payToken !== "string" || !input.payToken)
        throw new Error("交易不存在或已送出");
      session.status = "creating"; // Never retry an ambiguous CreatePayment.
      const result = await callEcpayInSiteApi({
        merchantId, hashKey, hashIv, stage: true, endpoint: "CreatePayment",
        data: { MerchantID: merchantId, PayToken: input.payToken, MerchantTradeNo: input.tradeNo },
      });
      if (result.OrderInfo?.MerchantTradeNo !== input.tradeNo) throw new Error("交易編號不符");
      session.status = "created";
      const threeDUrl = result.ThreeDInfo?.ThreeDURL || null;
      if (threeDUrl && (typeof threeDUrl !== "string" || !threeDUrl.startsWith("https://")))
        throw new Error("3D 網址錯誤");
      send(response, 200, JSON.stringify({ threeDUrl }), "application/json");
      return;
    }
    if (request.method === "POST" && url.pathname === "/return") {
      const data = decodeEnvelope(JSON.parse(await bodyText(request)));
      const notice = parsePaidCreditNotice(data);
      const tradeNo = data.OrderInfo?.MerchantTradeNo;
      const session = sessions.get(tradeNo);
      if (!session) throw new Error("找不到測試交易");
      session.returnCode = data.RtnCode;
      session.returnTradeNo = data.OrderInfo?.TradeNo || null;
      if (notice && notice.amount === session.amount && notice.merchantTradeNo === tradeNo) session.status = "paid";
      process.stdout.write(`Stage ReturnURL: ${tradeNo}, RtnCode=${data.RtnCode}, accepted=${session.status === "paid"}\n`);
      send(response, 200, "1|OK");
      return;
    }
    if (request.method === "POST" && url.pathname === "/result") {
      const form = new URLSearchParams(await bodyText(request));
      const tradeNo = parseInSiteResultOrder(JSON.parse(form.get("ResultData") || "{}"), merchantId, hashKey, hashIv);
      const session = sessions.get(tradeNo);
      if (!session) throw new Error("找不到測試交易");
      send(response, 200, `<!doctype html><html lang="zh-Hant"><meta charset="utf-8"><title>測試交易結果</title><main style="font:16px system-ui;margin:3rem"><h1>已返回測試網站</h1><p>交易編號：${tradeNo}</p><p>以伺服器通知為準，瀏覽器返回不代表付款成功。</p><a href="/status?tradeNo=${tradeNo}">查看通知狀態</a></main></html>`, "text/html; charset=utf-8");
      return;
    }
    if (request.method === "GET" && url.pathname === "/status") {
      const session = sessions.get(url.searchParams.get("tradeNo"));
      send(response, session ? 200 : 404, JSON.stringify(session || { error: "找不到測試交易" }), "application/json");
      return;
    }
    send(response, 404, "Not found");
  } catch (error) {
    const message = error instanceof Error ? error.message : "測試失敗";
    process.stderr.write(`Stage preview: ${message}\n`);
    send(response, 400, JSON.stringify({ error: message }), "application/json");
  }
});

server.listen(port, "127.0.0.1", () => process.stdout.write(`Stage preview: http://127.0.0.1:${port}/\n`));
