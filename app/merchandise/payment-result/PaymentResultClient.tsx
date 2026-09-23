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

export default function PaymentResultClient({ orderId }: { orderId: string }) {
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
  return (
    <section className="mx-auto max-w-xl rounded-md border border-white/10 bg-[#15171a] p-8 text-center sm:p-12">
      <p className="text-xs font-bold uppercase text-[#5bd6d0]">{order?.payment_method || "Payment"}</p>
      <h1 className={`home-title-font mt-4 text-4xl ${paid ? "text-[#5bd6d0]" : "text-[#e7ba67]"}`}>
        {paid ? "付款成功" : order?.status === "failed" ? "付款未完成" : "正在確認付款結果"}
      </h1>
      <p className="mt-5 text-sm leading-7 text-white/55">
        {paid ? "訂單已成立，我們會依你填寫的超商門市安排後續出貨。" : order?.payment_info ? "已取得繳費資訊，完成繳費後才會成立訂單。" : "付款通知可能需要幾秒鐘，頁面會自動重新查詢。"}
      </p>
      {order && <div className="mt-6 rounded-md bg-[#0d0e10] p-4 text-sm text-white/70"><p>訂單編號：{order.order_no}</p><p className="mt-2">訂單金額：NT$ {Number(order.total_amount).toLocaleString("zh-TW")}</p></div>}
      {order?.status === "pending" && order.payment_info && <EcpayInstructionsView info={order.payment_info} />}
      {error && <p role="alert" className="mt-5 text-sm font-bold text-[#ff806f]">{error}</p>}
      <Link href="/" className="mt-7 inline-flex h-12 items-center justify-center rounded-md border border-white/15 px-6 text-sm font-bold text-white/75 hover:border-white/40 hover:text-white">返回官網</Link>
    </section>
  );
}
