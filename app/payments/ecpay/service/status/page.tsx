import ServicePaymentStatusClient from "./ServicePaymentStatusClient";

export const metadata = { title: "綠界付款結果", robots: { index: false, follow: false } };

export default async function ServicePaymentStatusPage({ searchParams }: { searchParams: Promise<{ order?: string; result?: string }> }) {
  const { order = "", result } = await searchParams;
  return <main className="min-h-screen bg-slate-950 px-5 py-16 text-white"><ServicePaymentStatusClient order={order} gatewayFailed={result === "failed"} /></main>;
}
