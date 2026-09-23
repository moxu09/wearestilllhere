import EcpayInSiteCard from "@/app/components/EcpayInSiteCard";

export const metadata = { title: "陪陪訂單站內刷卡", robots: { index: false, follow: false } };

export default async function PlatformInSitePage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order = "" } = await searchParams;
  return <main className="min-h-screen bg-slate-950 px-5 py-16"><EcpayInSiteCard kind="platform" order={order} /></main>;
}
