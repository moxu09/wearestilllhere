"use client";

import PchomePayTopupCard from "./PchomePayTopupCard";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  Coins,
  CreditCard,
  Loader2,
  Lock,
  MessageSquareText,
  ReceiptText,
  ShieldCheck,
  Wallet,
} from "lucide-react";

type WalletData = {
  balance: number;
  frozen_balance: number;
};

type TopupRequest = {
  id: string;
  amount: number;
  payment_method: "transfer" | "card" | "manual";
  status: "pending" | "approved" | "rejected" | "cancelled";
  payer_name: string | null;
  payment_note: string | null;
  review_note: string | null;
  created_at: string;
};

type OnlinePayment = {
  id: string;
  payment_no: string;
  amount: number;
  asd_amount: number;
  status: "pending" | "paid" | "failed" | "expired" | "cancelled";
  provider: string;
  provider_payment_url: string | null;
  created_at: string;
  paid_at: string | null;
};

type PaymentMethod = "transfer" | "card" | "manual";

const paymentMethodLabel: Record<PaymentMethod, string> = {
  transfer: "轉帳 / 匯款",
  card: "刷卡",
  manual: "其他付款",
};

const statusLabel: Record<TopupRequest["status"], string> = {
  pending: "待審核",
  approved: "已入帳",
  rejected: "已拒絕",
  cancelled: "已取消",
};

const onlinePaymentStatusLabel: Record<OnlinePayment["status"], string> = {
  pending: "等待付款",
  paid: "已付款",
  failed: "付款失敗",
  expired: "已逾期",
  cancelled: "已取消",
};

const quickAmounts = [100, 300, 500, 1000, 3000, 5000];

export default function WalletTopupPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [requests, setRequests] = useState<TopupRequest[]>([]);
  const [payments, setPayments] = useState<OnlinePayment[]>([]);

  const [amount, setAmount] = useState(500);
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("transfer");
  const [payerName, setPayerName] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const pendingRequests = useMemo(() => {
    return requests.filter((request) => request.status === "pending");
  }, [requests]);

  const pendingOnlinePayments = useMemo(() => {
    return payments.filter((payment) => payment.status === "pending");
  }, [payments]);

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);
    setError("");
    setMessage("");

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

    const { data: requestData, error: requestError } = await supabase
      .from("platform_topup_requests")
      .select(
        `
        id,
        amount,
        payment_method,
        status,
        payer_name,
        payment_note,
        review_note,
        created_at
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (requestError) {
      setError("讀取儲值紀錄失敗：" + requestError.message);
      setLoading(false);
      return;
    }

    setRequests((requestData || []) as TopupRequest[]);

    const { data: paymentData, error: paymentError } = await supabase
      .from("platform_payments")
      .select(
        `
        id,
        payment_no,
        amount,
        asd_amount,
        status,
        provider,
        provider_payment_url,
        created_at,
        paid_at
      `
      )
      .eq("user_id", user.id)
      .eq("purpose", "wallet_topup")
      .order("created_at", { ascending: false })
      .limit(20);

    if (paymentError) {
      setError("讀取線上儲值紀錄失敗：" + paymentError.message);
      setLoading(false);
      return;
    }

    setPayments((paymentData || []) as OnlinePayment[]);
    setLoading(false);
  }

  async function submitTopup() {
    setError("");
    setMessage("");

    if (!userId) {
      setError("請先登入會員。");
      return;
    }

    if (!amount || amount <= 0) {
      setError("請輸入大於 0 的儲值金額。");
      return;
    }

    if (amount < 10) {
      setError("最低儲值金額為 10 ASD。");
      return;
    }

    setSubmitting(true);

    const { error } = await supabase.rpc("platform_create_topup_request", {
      p_amount: amount,
      p_payment_method: paymentMethod,
      p_payer_name: payerName.trim() || null,
      p_payment_note: paymentNote.trim() || null,
    });

    if (error) {
      setError("送出儲值申請失敗：" + error.message);
      setSubmitting(false);
      return;
    }

    setMessage("儲值申請已送出，等待管理員確認入帳。");
    setPayerName("");
    setPaymentNote("");
    setSubmitting(false);
    await loadPage();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取儲值頁中...</span>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <AccessCard
        icon={<Lock className="h-8 w-8" />}
        title="請先登入會員"
        desc="登入後才能送出 ASD 儲值申請。"
        buttonText="前往登入"
        buttonHref="/login?next=/wallet/topup"
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-950">
      <section className="relative overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-200/70 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-10">
          <a
            href="/wallet"
            className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-white hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" />
            回我的錢包
          </a>

          {message && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="mb-6">
            <PchomePayTopupCard />
          </div>

          <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
                <Coins className="h-4 w-4" />
                TOPUP ASD
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                儲值 ASD
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                可以使用 PChomePay 線上儲值，也可以使用人工儲值申請。
                線上付款完成後，系統會自動確認並加到你的 ASD 錢包。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-2">
              <BalanceCard
                title="目前餘額"
                value={`${(wallet?.balance || 0).toLocaleString()} ASD`}
                icon={<Wallet />}
              />
              <BalanceCard
                title="待審核申請"
                value={String(pendingRequests.length)}
                icon={<ReceiptText />}
              />
              <BalanceCard
                title="待付款線上單"
                value={String(pendingOnlinePayments.length)}
                icon={<CreditCard />}
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <CreditCard className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-slate-950">
                  人工儲值申請
                </h2>
              </div>

              <div className="grid gap-5">
                <div>
                  <p className="mb-3 text-sm font-bold text-slate-700">
                    快速金額
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {quickAmounts.map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setAmount(value)}
                        className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                          amount === value
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                            : "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-violet-50 hover:text-violet-700"
                        }`}
                      >
                        {value} ASD
                      </button>
                    ))}
                  </div>
                </div>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    自訂儲值金額
                  </span>
                  <input
                    value={amount}
                    min={10}
                    type="number"
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white"
                  />
                </label>

                <div>
                  <p className="mb-3 text-sm font-bold text-slate-700">
                    付款方式
                  </p>
                  <div className="grid gap-3">
                    <PaymentButton
                      active={paymentMethod === "transfer"}
                      title="轉帳 / 匯款"
                      desc="送出後由管理員確認收款。"
                      icon={<CreditCard />}
                      onClick={() => setPaymentMethod("transfer")}
                    />

                    <PaymentButton
                      active={paymentMethod === "card"}
                      title="刷卡"
                      desc="如果要自動刷卡入帳，建議使用上方 PChomePay 線上儲值。"
                      icon={<ShieldCheck />}
                      onClick={() => setPaymentMethod("card")}
                    />

                    <PaymentButton
                      active={paymentMethod === "manual"}
                      title="其他付款"
                      desc="適合無卡、人工付款、特殊付款流程。"
                      icon={<MessageSquareText />}
                      onClick={() => setPaymentMethod("manual")}
                    />
                  </div>
                </div>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    付款人名稱 / 匯款後五碼
                  </span>
                  <input
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="例如：許文星 / 12345"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    付款備註
                  </span>
                  <textarea
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    rows={4}
                    placeholder="例如：已於 03:20 匯款、末五碼 12345、付款方式為無卡..."
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 outline-none transition focus:border-violet-300 focus:bg-white"
                  />
                </label>

                <button
                  type="button"
                  onClick={submitTopup}
                  disabled={submitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      送出中...
                    </>
                  ) : (
                    <>
                      送出人工儲值申請
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-slate-950">
                  儲值紀錄
                </h2>
              </div>

              <div className="mb-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-black text-violet-600">
                      PCHOMEPAY
                    </p>
                    <h3 className="text-lg font-black text-slate-950">
                      線上儲值紀錄
                    </h3>
                  </div>

                  <a
                    href="/wallet/topup/result"
                    className="rounded-full bg-violet-50 px-4 py-2 text-xs font-black text-violet-700"
                  >
                    查詢結果
                  </a>
                </div>

                {payments.length === 0 ? (
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5 text-center">
                    <p className="text-sm font-bold text-slate-500">
                      目前沒有 PChomePay 線上儲值紀錄。
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {payments.map((payment) => (
                      <OnlinePaymentItem
                        key={payment.id}
                        payment={payment}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="my-6 h-px bg-slate-100" />

              <div className="mb-4">
                <p className="text-xs font-black text-violet-600">MANUAL</p>
                <h3 className="text-lg font-black text-slate-950">
                  人工儲值申請紀錄
                </h3>
              </div>

              {requests.length === 0 ? (
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8 text-center">
                  <ReceiptText className="mx-auto mb-3 h-8 w-8 text-violet-600" />
                  <p className="font-black text-slate-950">
                    目前沒有人工儲值申請
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    送出儲值申請後，紀錄會顯示在這裡。
                  </p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {requests.map((request) => (
                    <TopupRequestItem key={request.id} request={request} />
                  ))}
                </div>
              )}

              <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                <p className="font-black text-amber-700">提醒</p>
                <p className="mt-2 text-sm leading-7 text-amber-700/80">
                  人工儲值仍可使用；PChomePay 線上儲值付款完成後，會由系統自動確認並入帳。
                </p>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function PaymentButton({
  active,
  title,
  desc,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  desc: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-4 rounded-3xl border p-4 text-left transition ${
        active
          ? "border-violet-300 bg-violet-50 shadow-lg shadow-violet-100"
          : "border-slate-100 bg-slate-50/80 hover:border-violet-200 hover:bg-white"
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <div>
        <p className="font-black text-slate-950">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p>
      </div>
    </button>
  );
}

function OnlinePaymentItem({ payment }: { payment: OnlinePayment }) {
  const style =
    payment.status === "paid"
      ? "bg-emerald-50 text-emerald-700"
      : payment.status === "failed" || payment.status === "expired"
      ? "bg-red-50 text-red-600"
      : payment.status === "cancelled"
      ? "bg-slate-100 text-slate-500"
      : "bg-amber-50 text-amber-700";

  return (
    <div className="rounded-3xl border border-violet-100 bg-violet-50/50 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xl font-black text-slate-950">
            {payment.asd_amount.toLocaleString()} ASD
          </p>

          <p className="mt-1 truncate text-xs font-bold text-slate-500">
            {payment.payment_no}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {new Date(payment.created_at).toLocaleString("zh-TW")}
          </p>
        </div>

        <div
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-black ${style}`}
        >
          {onlinePaymentStatusLabel[payment.status]}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {payment.status === "pending" && payment.provider_payment_url && (
          <a
            href={payment.provider_payment_url}
            className="inline-flex items-center justify-center rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-100"
          >
            繼續付款
          </a>
        )}

        <a
          href={`/wallet/topup/result?payment_no=${payment.payment_no}`}
          className="inline-flex items-center justify-center rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-black text-violet-700"
        >
          查看 / 重新確認
        </a>
      </div>

      {payment.paid_at && (
        <p className="mt-3 text-xs font-bold text-emerald-700">
          入帳時間：{new Date(payment.paid_at).toLocaleString("zh-TW")}
        </p>
      )}
    </div>
  );
}

function TopupRequestItem({ request }: { request: TopupRequest }) {
  const style =
    request.status === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : request.status === "rejected"
      ? "bg-red-50 text-red-600"
      : request.status === "cancelled"
      ? "bg-slate-100 text-slate-500"
      : "bg-amber-50 text-amber-700";

  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xl font-black text-slate-950">
            {request.amount.toLocaleString()} ASD
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {paymentMethodLabel[request.payment_method]}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {new Date(request.created_at).toLocaleString("zh-TW")}
          </p>
        </div>

        <div className={`rounded-full px-3 py-1 text-xs font-black ${style}`}>
          {statusLabel[request.status]}
        </div>
      </div>

      {request.payer_name && (
        <p className="mt-4 rounded-2xl bg-white p-3 text-sm font-semibold text-slate-600 shadow-sm">
          付款資訊：{request.payer_name}
        </p>
      )}

      {request.payment_note && (
        <p className="mt-3 rounded-2xl bg-white p-3 text-sm leading-7 text-slate-600 shadow-sm">
          {request.payment_note}
        </p>
      )}

      {request.review_note && (
        <p className="mt-3 rounded-2xl bg-violet-50 p-3 text-sm leading-7 text-violet-700">
          審核備註：{request.review_note}
        </p>
      )}
    </div>
  );
}

function BalanceCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 [&_svg]:h-6 [&_svg]:w-6">
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
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
        <p className="text-sm font-bold text-violet-600">TOPUP</p>
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