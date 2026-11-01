import {redirect} from "next/navigation";
import {getSupabaseAdmin} from "@/lib/supabaseAdmin";
import EcpayInSiteCard from "@/app/components/EcpayInSiteCard";

export const metadata = { title: "站內刷卡", robots: { index: false, follow: false } };

export default async function ServiceInSitePage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order = "" } = await searchParams;
  if (/^[A-Za-z0-9]{1,20}$/.test(order)) {
    const {data}=await getSupabaseAdmin().from("ecpay_service_payments").select("status,metadata").eq("merchant_trade_no",order).maybeSingle();
    const target=data?.status === "failed" ? data.metadata?.card_retry_to : null;
    if(typeof target === "string" && /^[A-Za-z0-9]{1,20}$/.test(target) && target!==order)redirect(`/payments/ecpay/service/insite?order=${encodeURIComponent(target)}`);
  }
  return <main className="min-h-screen bg-slate-950 px-5 py-16"><EcpayInSiteCard kind="service" order={order} /></main>;
}
