"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, Clock, Loader2, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Payment = {
  payment_no: string;
  amount: number;
  asd_amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
};

export default function PchomePayTopupResultPage() {
  const [paymentNo, setPaymentNo] = useState("");
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextPaymentNo = params.get("payment_no") || "";
    const nextFailed = params.get("failed") === "1";

    setPaymentNo(nextPaymentNo);
    setFailed(nextFailed);

    if (nextPaymentNo) {
      loadPayment(nextPaymentNo);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadPayment(nextPaymentNo: string) {
    setLoading(true);
    setError("");

    const { data, error: paymentError } = await supabase
      .from("platform_payments")
      .select("payment_no, amount, asd_amount, status, created_at, paid_at")
      .eq("payment_no", nextPaymentNo)
      .maybeSingle();

    if (paymentError) {
      setError("讀取付款結果失敗：" + paymentError.message);
    } else {
      setPayment(data as Payment | null);
    }

    setLoading(false);
  }

  const isPaid = payment?.status === "paid";
  const isFailed =
    failed || payment?.status === "failed" || payment?.status === "expired";

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-16 text-slate-950">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl ${
            loading
              ? "bg-violet-50 text-violet-700"
              : isPaid
              ? "bg-emerald-50 text-emerald-700"
              : isFailed
              ? "bg-red-50 text-red-600"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : isPaid ? (
            <CheckCircle2 className="h-8 w-8" />
          ) : isFailed ? (
            <XCircle className="h-8 w-8" />
          ) : (
            <Clock className="h-8 w-8" />
          )}
        </div>

        <p className="text-sm font-bold text-violet-600">PChomePay 支付連</p>

        <h1 className="mt-2 text-3xl font-black">
          {loading
            ? "確認付款中"
            : isPaid
            ? "儲值成功"
            : isFailed
            ? "付款未完成"
            : "等待付款確認"}
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-500">
          {loading
            ? "正在讀取付款結果，請稍候。"
            : isPaid
            ? `已成功儲值 ${payment?.asd_amount.toLocaleString()} ASD。`
            : isFailed
            ? "付款失敗或已逾期，請重新建立儲值。"
            : "如果你已完成付款，系統可能還在等待 PChomePay 通知，稍後可以重新整理確認。"}
        </p>

        {error && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {paymentNo && (
          <div className="mt-5 rounded-2xl bg-slate-50 p-4 text-left text-xs leading-6 text-slate-500">
            <p>
              <span className="font-black text-slate-700">付款編號：</span>
              {paymentNo}
            </p>
            <p>
              <span className="font-black text-slate-700">付款狀態：</span>
              {payment?.status || "查詢中"}
            </p>
          </div>
        )}

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <a
            href="/wallet"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
          >
            回錢包
            <ArrowRight className="h-5 w-5" />
          </a>

          <button
            type="button"
            onClick={() => paymentNo && loadPayment(paymentNo)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white px-5 py-3 font-bold text-violet-700 transition hover:bg-violet-50"
          >
            重新確認
          </button>
        </div>
      </section>
    </main>
  );
}