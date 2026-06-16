"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "cancelled";

type Payment = {
  id: string;
  user_id: string | null;
  payment_no: string;
  provider: string;
  purpose: string;
  amount: number;
  currency: string;
  asd_amount: number;
  status: PaymentStatus;
  provider_trade_no: string | null;
  provider_payment_url: string | null;
  raw_response: unknown;
  raw_notify: unknown;
  paid_at: string | null;
  created_at: string;
  updated_at: string | null;
};

const statusOptions = [
  { value: "all", label: "全部" },
  { value: "pending", label: "等待付款" },
  { value: "paid", label: "已付款" },
  { value: "failed", label: "付款失敗" },
  { value: "expired", label: "已逾期" },
  { value: "cancelled", label: "已取消" },
];

const statusLabel: Record<PaymentStatus, string> = {
  pending: "等待付款",
  paid: "已付款",
  failed: "付款失敗",
  expired: "已逾期",
  cancelled: "已取消",
};

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `API 回傳不是 JSON。狀態碼：${response.status}，內容：${text.slice(
        0,
        300
      )}`
    );
  }
}

export default function AdminPchomePayPaymentsPage() {
  const [mounted, setMounted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [syncingNo, setSyncingNo] = useState("");
  const [status, setStatus] = useState("all");
  const [keyword, setKeyword] = useState("");

  const [payments, setPayments] = useState<Payment[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const summary = useMemo(() => {
    return {
      total: payments.length,
      pending: payments.filter((payment) => payment.status === "pending")
        .length,
      paid: payments.filter((payment) => payment.status === "paid").length,
      failed: payments.filter(
        (payment) => payment.status === "failed" || payment.status === "expired"
      ).length,
      paidAmount: payments
        .filter((payment) => payment.status === "paid")
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    };
  }, [payments]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, status]);

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

  async function loadPayments() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const accessToken = await getFreshAccessToken();

      if (!accessToken) {
        setError("請先登入管理員帳號。");
        setLoading(false);
        return;
      }

      const params = new URLSearchParams();
      params.set("status", status);
      params.set("limit", "80");

      if (keyword.trim()) {
        params.set("q", keyword.trim());
      }

      const response = await fetch(
        `/api/admin/pchomepay/payments?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const result = await readApiJson<{
        payments?: Payment[];
        error?: string;
      }>(response);

      if (!response.ok) {
        setError(result.error || "讀取付款紀錄失敗。");
        setLoading(false);
        return;
      }

      setPayments(result.payments || []);
    } catch (err) {
      console.error("[admin pchomepay payments] load failed:", err);
      setError(err instanceof Error ? err.message : "讀取付款紀錄失敗。");
    } finally {
      setLoading(false);
    }
  }

  async function syncPayment(paymentNo: string) {
    setSyncingNo(paymentNo);
    setError("");
    setMessage("");

    try {
      const accessToken = await getFreshAccessToken();

      if (!accessToken) {
        setError("請先登入管理員帳號。");
        setSyncingNo("");
        return;
      }

      const response = await fetch("/api/admin/pchomepay/payments/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          payment_no: paymentNo,
        }),
      });

      const result = await readApiJson<{
        ok?: boolean;
        status?: string;
        message?: string;
        error?: string;
      }>(response);

      if (!response.ok) {
        setError(result.error || "同步付款失敗。");
        setSyncingNo("");
        return;
      }

      setMessage(result.message || "已同步付款狀態。");
      await loadPayments();
    } catch (err) {
      console.error("[admin pchomepay payments] sync failed:", err);
      setError(err instanceof Error ? err.message : "同步付款失敗。");
    } finally {
      setSyncingNo("");
    }
  }

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <section className="mx-auto max-w-7xl">
          <section className="rounded-[2.5rem] border border-white/70 bg-white/80 p-8 shadow-xl shadow-violet-100/70 backdrop-blur-xl">
            <div className="flex items-center justify-center py-20">
              <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
              <span className="text-sm font-bold text-slate-500">
                正在載入 PChomePay 付款紀錄...
              </span>
            </div>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
      <section className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <a
            href="/admin"
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-white hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" />
            回後台
          </a>

          <a
            href="/admin/pchomepay-health"
            className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-white/80 px-4 py-2.5 text-sm font-black text-violet-700 shadow-sm transition hover:bg-violet-50"
          >
            <ShieldCheck className="h-4 w-4" />
            串接健康檢查
          </a>
        </div>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-violet-100/70 backdrop-blur-xl md:p-8">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-200/70 blur-3xl" />
          <div className="absolute bottom-[-140px] left-[-120px] h-80 w-80 rounded-full bg-fuchsia-200/60 blur-3xl" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-black text-violet-700 shadow-sm">
              <CreditCard className="h-4 w-4" />
              PCHOMEPAY PAYMENTS
            </div>

            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                  PChomePay 付款紀錄
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                  查看會員線上儲值紀錄、付款狀態、付款連結，以及手動同步 PChomePay 訂單狀態。
                </p>
              </div>

              <button
                type="button"
                onClick={loadPayments}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
                {loading ? "讀取中..." : "重新整理"}
              </button>
            </div>
          </div>
        </section>

        {message && (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <SummaryCard title="總筆數" value={String(summary.total)} />
          <SummaryCard title="等待付款" value={String(summary.pending)} />
          <SummaryCard title="已付款" value={String(summary.paid)} />
          <SummaryCard
            title="已付款金額"
            value={`${summary.paidAmount.toLocaleString()} TWD`}
          />
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur-xl">
          <div className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none focus:border-violet-300"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    loadPayments();
                  }
                }}
                placeholder="搜尋付款編號 payment_no"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-violet-300"
              />
            </div>

            <button
              type="button"
              onClick={loadPayments}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-100"
            >
              搜尋
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4">
          {loading ? (
            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />
              <p className="mt-4 text-sm font-bold text-slate-500">
                正在讀取付款紀錄...
              </p>
            </section>
          ) : payments.length === 0 ? (
            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
              <TriangleAlert className="mx-auto h-8 w-8 text-amber-600" />
              <p className="mt-4 text-lg font-black text-slate-950">
                沒有付款紀錄
              </p>
              <p className="mt-2 text-sm text-slate-500">
                當會員使用 PChomePay 儲值後，紀錄會出現在這裡。
              </p>
            </section>
          ) : (
            payments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                syncing={syncingNo === payment.payment_no}
                onSync={() => syncPayment(payment.payment_no)}
              />
            ))
          )}
        </section>
      </section>
    </main>
  );
}

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-xl shadow-violet-100/60 backdrop-blur-xl">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </section>
  );
}

function PaymentCard({
  payment,
  syncing,
  onSync,
}: {
  payment: Payment;
  syncing: boolean;
  onSync: () => void;
}) {
  const statusStyle =
    payment.status === "paid"
      ? "bg-emerald-50 text-emerald-700"
      : payment.status === "failed" || payment.status === "expired"
      ? "bg-red-50 text-red-600"
      : payment.status === "cancelled"
      ? "bg-slate-100 text-slate-500"
      : "bg-amber-50 text-amber-700";

  const statusIcon =
    payment.status === "paid" ? (
      <CheckCircle2 className="h-4 w-4" />
    ) : payment.status === "failed" || payment.status === "expired" ? (
      <XCircle className="h-4 w-4" />
    ) : (
      <Clock className="h-4 w-4" />
    );

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-xl shadow-violet-100/60 backdrop-blur-xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${statusStyle}`}
            >
              {statusIcon}
              {statusLabel[payment.status]}
            </span>

            <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700">
              {payment.provider}
            </span>
          </div>

          <p className="mt-4 break-all text-lg font-black text-slate-950">
            {payment.payment_no}
          </p>

          <p className="mt-2 text-sm font-semibold text-slate-500">
            user_id：{payment.user_id || "無"}
          </p>

          <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
            <InfoLine
              title="付款金額"
              value={`${payment.amount.toLocaleString()} ${payment.currency}`}
            />
            <InfoLine
              title="儲值 ASD"
              value={`${payment.asd_amount.toLocaleString()} ASD`}
            />
            <InfoLine
              title="建立時間"
              value={new Date(payment.created_at).toLocaleString("zh-TW")}
            />
          </div>

          {payment.paid_at && (
            <p className="mt-3 text-sm font-bold text-emerald-700">
              入帳時間：{new Date(payment.paid_at).toLocaleString("zh-TW")}
            </p>
          )}
        </div>

        <div className="grid shrink-0 gap-2 sm:grid-cols-2 lg:w-[260px] lg:grid-cols-1">
          {payment.provider_payment_url && payment.status === "pending" && (
            <a
              href={payment.provider_payment_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-100"
            >
              開啟付款頁
            </a>
          )}

          <a
            href={`/wallet/topup/result?payment_no=${payment.payment_no}`}
            className="inline-flex items-center justify-center rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-black text-violet-700"
          >
            查看結果頁
          </a>

          <button
            type="button"
            onClick={onSync}
            disabled={syncing || payment.status === "paid"}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {payment.status === "paid"
              ? "已入帳"
              : syncing
              ? "同步中..."
              : "同步狀態"}
          </button>
        </div>
      </div>
    </section>
  );
}

function InfoLine({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-black text-slate-400">{title}</p>
      <p className="mt-1 break-all font-black text-slate-800">{value}</p>
    </div>
  );
}