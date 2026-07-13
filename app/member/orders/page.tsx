"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  ReceiptText,
  Search,
  ShieldCheck,
  UserRound,
  Wallet,
} from "lucide-react";

type OrderStatus =
  | "pending_payment"
  | "paid"
  | "waiting_player"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "refunded"
  | "disputed";

type PaymentStatus = "unpaid" | "paid" | "refunded" | "cancelled";
type PaymentMethod = "wallet" | "transfer" | "card" | "manual";

type Order = {
  id: string;
  order_no: string;
  customer_user_id: string;
  player_id: string | null;
  player_user_id: string | null;
  title: string;
  note: string | null;
  total_amount: number;
  paid_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  platform_players?: {
    nickname: string;
    avatar_url: string | null;
    rating_avg: number | string;
    total_orders: number;
  } | null;
};

type StatusFilter = "all" | OrderStatus;
type PaymentFilter = "all" | PaymentStatus;

const statusLabel: Record<OrderStatus, string> = {
  pending_payment: "待付款",
  paid: "已付款待接單",
  waiting_player: "等待陪玩師",
  accepted: "陪玩師已接單",
  in_progress: "服務進行中",
  completed: "訂單已完成",
  cancelled: "訂單已取消",
  refunded: "已退款",
  disputed: "爭議中",
};

const paymentStatusLabel: Record<PaymentStatus, string> = {
  unpaid: "未付款",
  paid: "已付款",
  refunded: "已退款",
  cancelled: "已取消",
};

const paymentMethodLabel: Record<PaymentMethod, string> = {
  wallet: "ASD 錢包",
  transfer: "轉帳 / 匯款",
  card: "刷卡",
  manual: "其他付款",
};

export default function MemberOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [error, setError] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const text = [
        order.order_no,
        order.title,
        order.note,
        order.platform_players?.nickname,
        paymentMethodLabel[order.payment_method],
        paymentStatusLabel[order.payment_status],
        statusLabel[order.status],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchKeyword = keyword.trim()
        ? text.includes(keyword.trim().toLowerCase())
        : true;

      const matchStatus =
        statusFilter === "all" ? true : order.status === statusFilter;

      const matchPayment =
        paymentFilter === "all" ? true : order.payment_status === paymentFilter;

      return matchKeyword && matchStatus && matchPayment;
    });
  }, [orders, keyword, statusFilter, paymentFilter]);

  const unpaidCount = orders.filter(
    (order) => order.payment_status === "unpaid"
  ).length;

  const activeCount = orders.filter((order) =>
    ["paid", "waiting_player", "accepted", "in_progress"].includes(order.status)
  ).length;

  const completedCount = orders.filter(
    (order) => order.status === "completed"
  ).length;

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setError("讀取登入狀態失敗：" + userError.message);
      setLoading(false);
      return;
    }

    if (!user) {
      setUserId(null);
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("platform_orders")
      .select(
        `
        id,
        order_no,
        customer_user_id,
        player_id,
        player_user_id,
        title,
        note,
        total_amount,
        paid_amount,
        payment_method,
        payment_status,
        status,
        created_at,
        updated_at,
        platform_players (
          nickname,
          avatar_url,
          rating_avg,
          total_orders
        )
      `
      )
      .eq("customer_user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setError("讀取我的訂單失敗：" + error.message);
      setLoading(false);
      return;
    }

    setOrders((data || []) as unknown as Order[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取我的訂單中...</span>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <AccessCard
        icon={<Lock className="h-8 w-8" />}
        title="請先登入會員"
        desc="登入後才能查看你的訂單紀錄。"
        buttonText="前往登入"
        buttonHref="/login?next=/member/orders"
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-950">
      <section className="relative overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-200/70 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-10">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
                <ReceiptText className="h-4 w-4" />
                MY ORDERS
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                我的訂單
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                查看你建立過的陪玩訂單、付款狀態、服務進度與訂單明細。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MemberStat
                label="待付款"
                value={String(unpaidCount)}
                icon={<Clock />}
              />
              <MemberStat
                label="進行中"
                value={String(activeCount)}
                icon={<BadgeCheck />}
              />
              <MemberStat
                label="已完成"
                value={String(completedCount)}
                icon={<CheckCircle2 />}
              />
            </div>
          </div>

          <section className="mb-8 rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur-xl">
            <div className="grid gap-4 lg:grid-cols-[1fr_220px_220px_auto]">
              <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-violet-300 focus-within:bg-white">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜尋訂單編號、陪玩師、備註、狀態..."
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-300 focus:bg-white"
              >
                <option value="all">全部訂單狀態</option>
                <option value="pending_payment">待付款</option>
                <option value="paid">已付款待接單</option>
                <option value="accepted">已接單</option>
                <option value="in_progress">進行中</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as PaymentFilter)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-300 focus:bg-white"
              >
                <option value="all">全部付款狀態</option>
                <option value="unpaid">未付款</option>
                <option value="paid">已付款</option>
                <option value="refunded">已退款</option>
                <option value="cancelled">已取消</option>
              </select>

              <button
                onClick={loadOrders}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                重新整理
              </button>
            </div>
          </section>

          {filteredOrders.length === 0 ? (
            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-10 text-center shadow-xl backdrop-blur-xl">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
                <ReceiptText className="h-8 w-8" />
              </div>

              <h2 className="text-2xl font-black text-slate-950">
                目前沒有訂單
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
                你可以先到陪玩師大廳選擇喜歡的陪玩師並建立訂單。
              </p>

              <Link
                href="/players"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
              >
                前往陪玩師大廳
                <ArrowRight className="h-4 w-4" />
              </Link>
            </section>
          ) : (
            <div className="grid gap-6">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function OrderCard({ order }: { order: Order }) {
  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-xl backdrop-blur-xl">
      <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
        <div className="relative bg-gradient-to-br from-violet-100 via-fuchsia-50 to-blue-100 p-6">
          <div className="absolute left-8 top-8 h-28 w-28 rounded-full bg-violet-200/70 blur-3xl" />
          <div className="absolute bottom-10 right-8 h-28 w-28 rounded-full bg-fuchsia-200/70 blur-3xl" />

          <div className="relative">
            <StatusPill status={order.status} />

            <div className="mt-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.7rem] border-4 border-white bg-white text-violet-700 shadow-xl">
              {order.platform_players?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={order.platform_players.avatar_url}
                  alt={order.platform_players.nickname}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-10 w-10" />
              )}
            </div>

            <h2 className="mt-5 line-clamp-2 text-2xl font-black text-slate-950">
              {order.title}
            </h2>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              {order.order_no}
            </p>

            <p className="mt-4 text-3xl font-black text-violet-700">
              {order.total_amount.toLocaleString()} ASD
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <InfoBox
              label="陪玩師"
              value={order.platform_players?.nickname || "未指定"}
              icon={<UserRound />}
            />
            <InfoBox
              label="付款方式"
              value={paymentMethodLabel[order.payment_method]}
              icon={<CreditCard />}
            />
            <InfoBox
              label="付款狀態"
              value={paymentStatusLabel[order.payment_status]}
              icon={<Wallet />}
            />
            <InfoBox
              label="建立時間"
              value={new Date(order.created_at).toLocaleString("zh-TW")}
              icon={<Clock />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <section className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-950">訂單摘要</h3>
              </div>

              <div className="grid gap-3">
                <SummaryLine
                  label="訂單狀態"
                  value={statusLabel[order.status]}
                />
                <SummaryLine
                  label="付款狀態"
                  value={paymentStatusLabel[order.payment_status]}
                />
                <SummaryLine
                  label="已付金額"
                  value={`${order.paid_amount.toLocaleString()} ASD`}
                />
                <SummaryLine
                  label="應付金額"
                  value={`${order.total_amount.toLocaleString()} ASD`}
                />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-950">操作</h3>
              </div>

              <div className="grid gap-3">
                <a
                  href={`/orders/${order.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
                >
                  查看訂單詳情
                  <ArrowRight className="h-4 w-4" />
                </a>

                {order.player_id && (
                  <a
                    href={`/players/${order.player_id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-violet-50 hover:text-violet-700"
                  >
                    查看陪玩師
                    <ArrowRight className="h-4 w-4" />
                  </a>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </article>
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

        <p className="text-sm font-bold text-violet-600">MEMBER</p>
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

function MemberStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur-xl">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const style =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "cancelled" || status === "refunded" || status === "disputed"
      ? "bg-red-50 text-red-600"
      : status === "pending_payment"
      ? "bg-amber-50 text-amber-700"
      : "bg-violet-50 text-violet-700";

  return (
    <div className={`inline-flex rounded-full px-3 py-1 text-xs font-black shadow-sm ${style}`}>
      {statusLabel[status]}
    </div>
  );
}

function InfoBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </div>
      <p className="text-xs font-bold text-slate-400">{label}</p>
      <p className="mt-1 line-clamp-2 text-sm font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-black text-slate-900">{value}</span>
    </div>
  );
}
