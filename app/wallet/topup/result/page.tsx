"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  XCircle,
} from "lucide-react";
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
  const autoSyncedRef = useRef(false);

  const [paymentNo, setPaymentNo] = useState("");
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const nextPaymentNo = params.get("payment_no") || "";
    const nextFailed = params.get("failed") === "1";

    setPaymentNo(nextPaymentNo);
    setFailed(nextFailed);

    if (!nextPaymentNo) {
      setLoading(false);
      return;
    }

    initResult(nextPaymentNo, nextFailed);
  }, []);

  async function initResult(nextPaymentNo: string, nextFailed: boolean) {
    const currentPayment = await loadPayment(nextPaymentNo, false);

    if (
      !autoSyncedRef.current &&
      !nextFailed &&
      currentPayment?.status !== "paid" &&
      currentPayment?.status !== "failed" &&
      currentPayment?.status !== "expired"
    ) {
      autoSyncedRef.current = true;
      await syncPayment(nextPaymentNo, true);
    }
  }

  async function getFreshAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      return session.access_token;
    }

    const {
      data: { session: refreshedSession },
      error: refreshError,
    } = await supabase.auth.refreshSession();

    if (refreshError || !refreshedSession?.access_token) {
      return null;
    }

    return refreshedSession.access_token;
  }

  async function loadPayment(
    nextPaymentNo: string,
    shouldClearMessage = true
  ): Promise<Payment | null> {
    setLoading(true);
    setError("");

    if (shouldClearMessage) {
      setMessage("");
    }

    const { data, error: paymentError } = await supabase
      .from("platform_payments")
      .select("payment_no, amount, asd_amount, status, created_at, paid_at")
      .eq("payment_no", nextPaymentNo)
      .maybeSingle();

    if (paymentError) {
      setError("讀取付款結果失敗：" + paymentError.message);
      setLoading(false);
      return null;
    }

    const nextPayment = data as Payment | null;
    setPayment(nextPayment);
    setLoading(false);

    return nextPayment;
  }

  async function syncPayment(nextPaymentNo: string, isAuto = false) {
    setSyncing(true);
    setError("");

    if (!isAuto) {
      setMessage("");
    }

    try {
      const accessToken = await getFreshAccessToken();

      if (!accessToken) {
        setError("登入狀態已過期，請重新登入。");
        setSyncing(false);
        return;
      }

      const response = await fetch("/api/payments/pchomepay/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          payment_no: nextPaymentNo,
        }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        status?: string;
        message?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(result.error || "同步付款狀態失敗。");
        setSyncing(false);
        return;
      }

      const nextPayment = await loadPayment(nextPaymentNo, false);

      if (result.status === "paid" || nextPayment?.status === "paid") {
        setMessage("付款成功，ASD 已入帳。");
      } else {
        setMessage(result.message || "已重新確認付款狀態。");
      }
    } catch (err) {
      console.error("[topup result] sync failed:", err);
      setError("同步付款狀態失敗，請稍後再試。");
    } finally {
      setSyncing(false);
    }
  }

  const isPaid = payment?.status === "paid";
  const isFailed =
    failed || payment?.status === "failed" || payment?.status === "expired";

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-16 text-slate-950">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
        <div
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl ${
            loading || syncing
              ? "bg-violet-50 text-violet-700"
              : isPaid
              ? "bg-emerald-50 text-emerald-700"
              : isFailed
              ? "bg-red-50 text-red-600"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {loading || syncing ? (
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
            : syncing
            ? "同步付款狀態中"
            : isPaid
            ? "儲值成功"
            : isFailed
            ? "付款未完成"
            : "等待付款確認"}
        </h1>

        <p className="mt-4 text-sm leading-7 text-slate-500">
          {loading
            ? "正在讀取付款結果，請稍候。"
            : syncing
            ? "正在向 PChomePay 查詢這筆付款狀態。"
            : isPaid
            ? `已成功儲值 ${payment?.asd_amount.toLocaleString()} ASD。`
            : isFailed
            ? "付款失敗或已逾期，請重新建立儲值。"
            : "如果你已完成付款，系統可能還在等待 PChomePay 通知。本機測試時可以按重新確認。"}
        </p>

        {message && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

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

            {payment?.amount && (
              <p>
                <span className="font-black text-slate-700">付款金額：</span>
                {payment.amount.toLocaleString()} TWD
              </p>
            )}

            {payment?.asd_amount && (
              <p>
                <span className="font-black text-slate-700">儲值點數：</span>
                {payment.asd_amount.toLocaleString()} ASD
              </p>
            )}

            {payment?.paid_at && (
              <p>
                <span className="font-black text-slate-700">入帳時間：</span>
                {new Date(payment.paid_at).toLocaleString("zh-TW")}
              </p>
            )}
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
            onClick={() => paymentNo && syncPayment(paymentNo, false)}
            disabled={!paymentNo || syncing || loading}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white px-5 py-3 font-bold text-violet-700 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5" />
            )}
            {syncing ? "確認中..." : "重新確認"}
          </button>
        </div>

        <a
          href="/wallet/topup"
          className="mt-4 inline-flex text-sm font-black text-violet-700"
        >
          回儲值頁
        </a>
      </section>
    </main>
  );
}