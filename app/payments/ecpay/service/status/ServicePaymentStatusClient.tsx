"use client";

import { useEffect, useState } from "react";
import EcpayInstructionsView from "@/app/components/EcpayInstructionsView";
import type { EcpayInstructions } from "@/lib/ecpayPaymentInstructions";

type PaymentStatus = { amount: number; status: string; payment_info: EcpayInstructions | null };

export default function ServicePaymentStatusClient({ order, gatewayFailed = false }: { order: string; gatewayFailed?: boolean }) {
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
  const paid = payment?.status === "paid";
  const failed = !paid && !payment?.payment_info && (payment?.status === "failed" || (gatewayFailed && payment?.status === "pending"));
  return <section aria-live="polite" className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-slate-900 p-8 text-center shadow-xl sm:p-10">
    <div aria-hidden="true" className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl font-black ${paid ? "bg-emerald-500/15 text-emerald-300" : failed ? "bg-rose-500/15 text-rose-300" : "bg-sky-500/15 text-sky-300"}`}>{paid ? "✓" : failed ? "!" : "…"}</div>
    <h1 className="mt-5 text-3xl font-black">{paid ? "付款成功" : failed ? "付款未成功" : payment?.payment_info ? "請依下方資訊繳費" : "正在確認付款結果"}</h1>
    {payment && <div className="mt-6 rounded-xl bg-slate-950/70 p-4 text-sm text-slate-300"><p>訂單編號：{order}</p><p className="mt-2">訂單金額：NT$ {Number(payment.amount).toLocaleString("zh-TW")}</p></div>}
    {paid ? <p className="mt-6 text-emerald-300">系統已確認入帳。請回到 Discord 查看訂單及後續通知。</p> :
      failed ? <p className="mt-6 text-rose-200">這次付款未完成，訂單尚未入帳。若銀行顯示已扣款，請勿再次付款；本頁仍會自動查核，並請提供訂單編號聯絡客服。</p> :
      payment?.payment_info ? <EcpayInstructionsView info={payment.payment_info} /> :
      <p className="mt-6 text-slate-300">正在等候綠界付款通知，本頁會自動更新。請勿重複付款。</p>}
    {error && <p role="alert" className="mt-5 text-red-300">{error}</p>}
    {payment && <button type="button" onClick={() => window.location.reload()} className="mt-7 rounded-lg border border-white/20 px-5 py-3 text-sm font-bold text-white hover:bg-white/10">重新查詢</button>}
  </section>;
}
