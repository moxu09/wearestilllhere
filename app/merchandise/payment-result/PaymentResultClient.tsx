"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import EcpayInstructionsView from "@/app/components/EcpayInstructionsView";
import type { EcpayInstructions } from "@/lib/ecpayPaymentInstructions";

type OrderStatus = {
  order_no: string;
  status: "pending" | "paid" | "failed" | "refunded";
  total_amount: number;
  payment_method: string;
  payment_info?: EcpayInstructions | null;
};

export default function PaymentResultClient({ orderId, gatewayFailed = false }: { orderId: string; gatewayFailed?: boolean }) {
  const [order, setOrder] = useState<OrderStatus | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      try {
        const response = await fetch(`/api/payments/merchandise/status?order=${encodeURIComponent(orderId)}`, { cache: "no-store" });
        const result = (await response.json()) as OrderStatus & { error?: string };
        if (!response.ok) throw new Error(result.error || "無法查詢付款結果");
        if (cancelled) return;
        setOrder(result);
        setError("");
        if (result.status === "pending") timer = setTimeout(check, result.payment_info ? 30_000 : 3_000);
      } catch (statusError) {
        if (!cancelled) {
          setError(statusError instanceof Error ? statusError.message : "無法查詢付款結果");
          timer = setTimeout(check, 10_000);
        }
      }
    };
    void check();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [orderId]);

  const paid = order?.status === "paid";
  const failed = !paid && !order?.payment_info && (order?.status === "failed" || (gatewayFailed && order?.status === "pending"));
  return (
    <section aria-live="polite" className="mx-auto max-w-xl rounded-md border border-white/10 bg-[#15171a] p-8 text-center sm:p-12">
      <p className="text-xs font-bold uppercase text-[#5bd6d0]">{order?.payment_method || "Payment"}</p>
      <div aria-hidden="true" className={`mx-auto mt-5 flex h-16 w-16 items-center justify-center rounded-full text-3xl font-black ${paid ? "bg-[#5bd6d0]/15 text-[#5bd6d0]" : failed ? "bg-red-500/15 text-red-300" : "bg-[#e7ba67]/15 text-[#e7ba67]"}`}>{paid ? "✓" : failed ? "!" : "…"}</div>
      <h1 className={`home-title-font mt-4 text-4xl ${paid ? "text-[#5bd6d0]" : failed ? "text-red-300" : "text-[#e7ba67]"}`}>
        {paid ? "付款成功" : failed ? "付款未成功" : order?.payment_info ? "請依下方資訊繳費" : "正在確認付款結果"}
      </h1>
      <p className="mt-5 text-sm leading-7 text-white/55">
        {paid ? "系統已確認入帳，訂單成立；我們會依你填寫的超商門市安排後續出貨。" : failed ? "這次付款未完成。若銀行顯示已扣款，請勿再次付款；本頁仍會自動查核，並請提供訂單編號聯絡客服。" : order?.payment_info ? "已取得繳費資訊，完成繳費後才會成立訂單。" : "正在等候綠界付款通知，頁面會自動重新查詢。請勿重複付款。"}
      </p>
      {order && <div className="mt-6 rounded-md bg-[#0d0e10] p-4 text-sm text-white/70"><p>訂單編號：{order.order_no}</p><p className="mt-2">訂單金額：NT$ {Number(order.total_amount).toLocaleString("zh-TW")}</p></div>}
      {order?.status === "pending" && order.payment_info && <EcpayInstructionsView info={order.payment_info} />}
      {error && <p role="alert" className="mt-5 text-sm font-bold text-[#ff806f]">{error}</p>}
      {order && <button type="button" onClick={() => window.location.reload()} className="mt-7 inline-flex h-12 items-center justify-center rounded-md border border-white/15 px-6 text-sm font-bold text-white/75 hover:border-white/40 hover:text-white">重新查詢</button>}
      <Link href="/" className="mt-7 ml-3 inline-flex h-12 items-center justify-center rounded-md border border-white/15 px-6 text-sm font-bold text-white/75 hover:border-white/40 hover:text-white">返回官網</Link>
    </section>
  );
}
