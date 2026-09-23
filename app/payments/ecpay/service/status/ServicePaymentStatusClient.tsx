"use client";

import { useEffect, useState } from "react";
import EcpayInstructionsView from "@/app/components/EcpayInstructionsView";
import type { EcpayInstructions } from "@/lib/ecpayPaymentInstructions";

type PaymentStatus = { amount: number; status: string; payment_info: EcpayInstructions | null };

export default function ServicePaymentStatusClient({ order }: { order: string }) {
  const [payment, setPayment] = useState<PaymentStatus | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const check = async () => {
      try {
        const response = await fetch(`/api/payments/ecpay/service/status?order=${encodeURIComponent(order)}`, { cache: "no-store" });
        const result = await response.json() as PaymentStatus & { error?: string };
        if (!response.ok) throw new Error(result.error || "無法查詢付款資訊");
        if (cancelled) return;
        setPayment(result);
        setError("");
        if (result.status === "pending") timer = setTimeout(check, result.payment_info ? 30_000 : 3_000);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "無法查詢付款資訊");
          timer = setTimeout(check, 10_000);
        }
      }
    };
    void check();
    return () => { cancelled = true; if (timer) clearTimeout(timer); };
  }, [order]);
  return <section className="mx-auto max-w-xl rounded-2xl bg-slate-900 p-8 text-center shadow-xl">
    <h1 className="text-3xl font-black">{payment?.status === "paid" ? "付款成功" : payment?.payment_info ? "請依下方資訊繳費" : "正在確認付款資訊"}</h1>
    {payment && <p className="mt-4 text-slate-300">訂單金額：NT$ {Number(payment.amount).toLocaleString("zh-TW")}</p>}
    {payment?.status === "paid" ? <p className="mt-5 text-emerald-300">已完成付款，請回到 Discord 查看後續通知。</p> : payment?.payment_info ? <EcpayInstructionsView info={payment.payment_info} /> : <p className="mt-5 text-slate-400">付款資訊可能需要幾秒鐘才會出現。請勿重複付款。</p>}
    {error && <p role="alert" className="mt-5 text-red-300">{error}</p>}
  </section>;
}
