import type { Metadata } from "next";
import PaymentResultClient from "./PaymentResultClient";

export const metadata: Metadata = { title: "付款結果", robots: { index: false, follow: false } };

export default async function PaymentResultPage({ searchParams }: { searchParams: Promise<{ order?: string; result?: string }> }) {
  const { order = "", result } = await searchParams;
  return <main className="public-page-enter home-soft-font min-h-screen bg-[#0d0e10] px-5 py-16 text-white"><PaymentResultClient orderId={order} gatewayFailed={result === "failed"} /></main>;
}
