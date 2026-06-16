"use client";

import { useState } from "react";
import { CreditCard, Loader2, ShieldCheck, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";

const quickAmounts = [100, 300, 500, 1000, 2000, 5000];

export default function PchomePayTopupCard() {
  const [amount, setAmount] = useState(300);
  const [payType, setPayType] = useState("CARD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  async function startPayment() {
    setError("");

    if (!Number.isInteger(amount) || amount < 30) {
      setError("儲值金額至少需要 30 元。");
      return;
    }

    setLoading(true);

    try {
      const accessToken = await getFreshAccessToken();

      if (!accessToken) {
        setError("登入狀態已過期，請重新登入。");

        setTimeout(() => {
          window.location.href = "/login?next=/wallet/topup";
        }, 900);

        return;
      }

      const response = await fetch("/api/payments/pchomepay/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          amount,
          payType: [payType],
        }),
      });

      const result = (await response.json()) as {
        payment_no?: string;
        payment_url?: string;
        error?: string;
      };

      if (!response.ok || !result.payment_url) {
        setError(result.error || "建立付款失敗，請稍後再試。");
        setLoading(false);
        return;
      }

      window.location.href = result.payment_url;
    } catch (err) {
      console.error("[PChomePay] create payment failed:", err);
      setError("建立付款失敗，請稍後再試。");
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-xl shadow-violet-100/70 backdrop-blur-xl md:p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          <CreditCard className="h-6 w-6" />
        </div>

        <div>
          <p className="text-xs font-black text-violet-600">
            PChomePay 支付連
          </p>
          <h2 className="text-2xl font-black text-slate-950">線上儲值 ASD</h2>
        </div>
      </div>

      <div className="rounded-[1.6rem] bg-violet-50 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
          <p className="text-sm font-semibold leading-7 text-slate-600">
            付款完成後，系統會等待 PChomePay 通知成功，再自動加到你的 ASD 錢包。
          </p>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-3 text-sm font-black text-slate-700">選擇儲值金額</p>

        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {quickAmounts.map((quickAmount) => (
            <button
              key={quickAmount}
              type="button"
              onClick={() => setAmount(quickAmount)}
              className={`rounded-2xl px-3 py-3 text-sm font-black transition ${
                amount === quickAmount
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                  : "bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700"
              }`}
            >
              {quickAmount}
            </button>
          ))}
        </div>

        <div className="mt-3">
          <input
            type="number"
            min={30}
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 outline-none transition focus:border-violet-300"
            placeholder="自訂儲值金額"
          />
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-3 text-sm font-black text-slate-700">付款方式</p>

        <div className="grid gap-2 sm:grid-cols-3">
          <PayTypeButton
            active={payType === "CARD"}
            title="信用卡"
            desc="CARD"
            onClick={() => setPayType("CARD")}
          />
          <PayTypeButton
            active={payType === "ATM"}
            title="ATM"
            desc="虛擬帳號"
            onClick={() => setPayType("ATM")}
          />
          <PayTypeButton
            active={payType === "PI"}
            title="拍錢包"
            desc="PI"
            onClick={() => setPayType("PI")}
          />
        </div>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={startPayment}
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Wallet className="h-5 w-5" />
        )}
        {loading
          ? "建立付款中..."
          : `前往付款，儲值 ${amount.toLocaleString()} ASD`}
      </button>
    </section>
  );
}

function PayTypeButton({
  active,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border p-4 text-left transition ${
        active
          ? "border-violet-300 bg-violet-50 text-violet-700"
          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
      }`}
    >
      <p className="text-sm font-black">{title}</p>
      <p className="mt-1 text-xs font-bold opacity-70">{desc}</p>
    </button>
  );
}