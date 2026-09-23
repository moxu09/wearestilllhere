import EcpayInSiteCard from "@/app/components/EcpayInSiteCard";

export const metadata = { title: "站內刷卡", robots: { index: false, follow: false } };

export default async function ServiceInSitePage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order = "" } = await searchParams;
  return <main className="min-h-screen bg-slate-950 px-5 py-16"><EcpayInSiteCard kind="service" order={order} /></main>;
}
