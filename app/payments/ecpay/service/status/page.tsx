import ServicePaymentStatusClient from "./ServicePaymentStatusClient";

export const metadata = { title: "綠界付款資訊", robots: { index: false, follow: false } };

export default async function ServicePaymentStatusPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order = "" } = await searchParams;
  return <main className="min-h-screen bg-slate-950 px-5 py-16 text-white"><ServicePaymentStatusClient order={order} /></main>;
}
