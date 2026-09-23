import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "陪陪訂單付款狀態", robots: { index: false, follow: false } };

export default async function PlatformPaymentStatus({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order = "" } = await searchParams;
  const payment = /^[A-Za-z0-9]{1,20}$/.test(order)
    ? (await getSupabaseAdmin().from("ecpay_platform_payments")
      .select("platform_order_id,status,site_origin").eq("merchant_trade_no", order).maybeSingle()).data
    : null;
  return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-5 text-white">
    <section className="w-full max-w-lg rounded-2xl bg-slate-900 p-8">
      <h1 className="text-2xl font-black">陪陪訂單付款狀態</h1>
      <p className="mt-5 text-slate-300">{!payment ? "找不到付款單，請回到原訂單查詢。" :
        payment.status === "paid" ? "已收到綠界付款通知，訂單已完成核帳。" :
        "正在等待綠界付款通知；請勿重複刷卡。稍後可重新整理查詢。"}</p>
      {payment && <Link href={`${payment.site_origin}/orders/${payment.platform_order_id}`} className="mt-6 inline-block text-emerald-300 underline">返回訂單</Link>}
    </section>
  </main>;
}
