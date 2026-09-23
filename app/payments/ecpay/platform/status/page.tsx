import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import PlatformStatusRefresh from "./PlatformStatusRefresh";

export const dynamic = "force-dynamic";
export const metadata = { title: "陪陪訂單付款結果", robots: { index: false, follow: false } };

export default async function PlatformPaymentStatus({ searchParams }: { searchParams: Promise<{ order?: string; result?: string }> }) {
  const { order = "", result } = await searchParams;
  const payment = /^[A-Za-z0-9]{1,20}$/.test(order)
    ? (await getSupabaseAdmin().from("ecpay_platform_payments")
      .select("platform_order_id,status,site_origin").eq("merchant_trade_no", order).maybeSingle()).data
    : null;
  const paid = payment?.status === "paid";
  const failed = !paid && (payment?.status === "failed" || (result === "failed" && payment?.status === "pending"));
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-5 text-white">
    {payment?.status === "pending" && <PlatformStatusRefresh />}
    <section className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-8 text-center shadow-xl">
      <div aria-hidden="true" className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl font-black ${paid ? "bg-emerald-500/15 text-emerald-300" : failed ? "bg-rose-500/15 text-rose-300" : "bg-sky-500/15 text-sky-300"}`}>{paid ? "✓" : failed ? "!" : "…"}</div>
      <h1 className="mt-5 text-3xl font-black">{paid ? "付款成功" : failed ? "付款未成功" : "正在確認付款結果"}</h1>
      <p className="mt-5 text-slate-300">{!payment ? "找不到付款單，請回到原訂單查詢。" :
        paid ? "系統已確認入帳，訂單已完成核帳。" : failed ? "這次付款未完成。若銀行顯示已扣款，請勿再次付款，請提供訂單編號聯絡客服。" :
        "正在等待綠界付款通知；請勿重複刷卡。稍後可重新整理查詢。"}</p>
      {payment && <p className="mt-4 break-all rounded-xl bg-slate-950/70 p-4 text-sm text-slate-400">付款編號：{order}</p>}
      {payment && <a href={`/payments/ecpay/platform/status?order=${encodeURIComponent(order)}`} className="mt-6 inline-block rounded-lg border border-white/20 px-4 py-2 text-white hover:bg-white/10">重新查詢</a>}
      {payment && <Link href={`${payment.site_origin}/orders/${payment.platform_order_id}`} className="ml-4 mt-6 inline-block text-emerald-300 underline">返回訂單</Link>}
    </section>
  </main>;
}
