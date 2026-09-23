import { apiError, requireSiteAdmin } from "@/lib/serverAuth";
import { getEcpayConfig } from "@/lib/ecpay";
import { checkMacValue } from "@/lib/ecpayMac";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireSiteAdmin(request);
    const query = new URL(request.url).searchParams;
    const kind = query.get("kind");
    const start = query.get("start") || "";
    const end = query.get("end") || "";
    if (kind !== "transactions" && kind !== "credit")
      return Response.json({ error: "對帳檔類型錯誤" }, { status: 400 });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end))
      return Response.json({ error: "請輸入正確的日期" }, { status: 400 });
    const startTime = Date.parse(`${start}T00:00:00+08:00`);
    const endTime = Date.parse(`${end}T00:00:00+08:00`);
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime || endTime - startTime > 30 * 86_400_000)
      return Response.json({ error: "對帳日期最多 31 天" }, { status: 400 });
    const config = getEcpayConfig();
    if (!config.merchantId || !config.hashKey || !config.hashIv || config.stage)
      throw new Error("綠界正式商戶尚未設定，無法下載對帳檔");
    const fields: Record<string, string> = kind === "transactions"
      ? { MerchantID: config.merchantId, DateType: "2", BeginDate: start, EndDate: end, PaymentType: "01", MediaFormated: "2", CharSet: "2" }
      : { MerchantID: config.merchantId, PayDateType: "fund", StartDate: start, EndDate: end, CharSet: "2" };
    fields.CheckMacValue = checkMacValue(fields, config.hashKey, config.hashIv);
    const endpoint = kind === "transactions"
      ? "https://vendor.ecpay.com.tw/PaymentMedia/TradeNoAio"
      : "https://payment.ecpay.com.tw/CreditDetail/FundingReconDetail";
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(fields),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!upstream.ok) throw new Error(`綠界對帳檔下載失敗（HTTP ${upstream.status}）`);
    const bytes = await upstream.arrayBuffer();
    if (bytes.byteLength === 0 || bytes.byteLength > 10_000_000) throw new Error("綠界對帳檔大小異常");
    const preview = new TextDecoder("utf-8").decode(bytes.slice(0, 512)).trimStart().toLowerCase();
    if (preview.startsWith("<!doctype") || preview.startsWith("<html") || preview.startsWith("error"))
      throw new Error("綠界回傳錯誤頁，請檢查 IP 白名單及查詢條件");
    return new Response(bytes, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="ecpay-${kind}-${start}-${end}.csv"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
