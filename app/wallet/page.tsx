"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  Coins,
  CreditCard,
  Loader2,
  Lock,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from "lucide-react";

type WalletData = {
  balance: number;
  frozen_balance: number;
};

type Transaction = {
  id: string;
  type: string;
  amount: number;
  before_balance: number;
  after_balance: number;
  note: string | null;
  related_type: string | null;
  created_at: string;
};

const typeLabel: Record<string, string> = {
  topup: "歷史入帳",
  order_payment: "訂單付款",
  gift_payment: "禮物付款",
  voice_room_entry: "語音廳入場",
  refund: "退款",
  admin_add: "管理員調整",
  admin_deduct: "管理員扣款",
  player_income: "陪玩收入",
  withdraw: "提領",
  freeze: "凍結",
  unfreeze: "解除凍結",
};

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUserId(null);
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data: walletData, error: walletError } = await supabase
      .from("platform_wallets")
      .select("balance, frozen_balance")
      .eq("user_id", user.id)
      .maybeSingle();

    if (walletError) {
      setError("讀取錢包失敗：" + walletError.message);
      setLoading(false);
      return;
    }

    setWallet(walletData as WalletData | null);

    const { data: txData, error: txError } = await supabase
      .from("platform_wallet_transactions")
      .select(
        `
        id,
        type,
        amount,
        before_balance,
        after_balance,
        note,
        related_type,
        created_at
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (txError) {
      setError("讀取交易紀錄失敗：" + txError.message);
      setLoading(false);
      return;
    }

    setTransactions((txData || []) as Transaction[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取錢包中...</span>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <AccessCard
        icon={<Lock className="h-8 w-8" />}
        title="請先登入會員"
        desc="登入後才能查看 ASD 錢包與交易紀錄。"
        buttonText="前往登入"
        buttonHref="/login?next=/wallet"
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-950">
      <section className="relative overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-200/70 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-10">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
                <Wallet className="h-4 w-4" />
                ASD WALLET
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                我的 ASD 錢包
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                ASD 可用於陪玩訂單、語音廳入場、送禮與平台服務。
              </p>
            </div>

            <div className="flex gap-3 lg:justify-end">
              <button
                onClick={loadWallet}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                重新整理
              </button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <BalanceCard
              title="可用餘額"
              value={`${(wallet?.balance || 0).toLocaleString()} ASD`}
              desc="可直接用於平台付款"
              icon={<Coins />}
            />
            <BalanceCard
              title="凍結餘額"
              value={`${(wallet?.frozen_balance || 0).toLocaleString()} ASD`}
              desc="待結算或處理中金額"
              icon={<ShieldCheck />}
            />
            <BalanceCard
              title="交易筆數"
              value={String(transactions.length)}
              desc="最近 50 筆紀錄"
              icon={<ReceiptText />}
            />
          </div>

          <section className="mt-8 min-w-0 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-xl backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-slate-950">
                  交易紀錄
                </h2>
              </div>

            </div>

            {transactions.length === 0 ? (
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                目前沒有交易紀錄。
              </div>
            ) : (
              <div className="grid gap-3">
                {transactions.map((tx) => (
                  <TransactionItem key={tx.id} tx={tx} />
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function TransactionItem({ tx }: { tx: Transaction }) {
  const positive = tx.amount > 0;

  return (
    <div className="flex min-w-0 flex-col gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ${
            positive ? "text-emerald-600" : "text-violet-700"
          }`}
        >
          {positive ? <Coins className="h-6 w-6" /> : <CreditCard className="h-6 w-6" />}
        </div>

        <div className="min-w-0">
          <p className="break-words font-black text-slate-950">
            {typeLabel[tx.type] || tx.type}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {new Date(tx.created_at).toLocaleString("zh-TW")}
          </p>
          {tx.note && (
            <p className="mt-1 break-words text-xs font-semibold text-slate-400">
              {tx.note}
            </p>
          )}
        </div>
      </div>

      <div className="min-w-0 text-left sm:shrink-0 sm:text-right">
        <p
          className={`break-all text-lg font-black ${
            positive ? "text-emerald-600" : "text-red-500"
          }`}
        >
          {positive ? "+" : ""}
          {tx.amount.toLocaleString()} ASD
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-400">
          餘額 {tx.after_balance.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function BalanceCard({
  title,
  value,
  desc,
  icon,
}: {
  title: string;
  value: string;
  desc: string;
  icon: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 [&_svg]:h-6 [&_svg]:w-6">
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 break-all text-2xl font-black text-slate-950 sm:text-3xl">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{desc}</p>
    </section>
  );
}

function AccessCard({
  icon,
  title,
  desc,
  buttonText,
  buttonHref,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  buttonText: string;
  buttonHref: string;
}) {
  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-16 text-slate-950">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
          {icon}
        </div>
        <p className="text-sm font-bold text-violet-600">WALLET</p>
        <h1 className="mt-2 text-3xl font-black">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-500">{desc}</p>
        <a
          href={buttonHref}
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
        >
          {buttonText}
          <ArrowRight className="h-5 w-5" />
        </a>
      </section>
    </main>
  );
}
