"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Gamepad2,
  Headphones,
  Loader2,
  Lock,
  PlayCircle,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
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

type Profile = {
  id: string;
  role: string | null;
};

type Player = {
  id: string;
  user_id: string;
  nickname: string;
  status: string;
};

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
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
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

export default function PlayerOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const canAccess =
    profile?.role === "player" ||
    profile?.role === "admin" ||
    profile?.role === "staff" ||
    !!player;

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const text = [
        order.order_no,
        order.title,
        order.note,
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

  const waitingCount = orders.filter(
    (order) =>
      order.payment_status === "paid" &&
      (order.status === "paid" || order.status === "waiting_player")
  ).length;

  const activeCount = orders.filter(
    (order) => order.status === "accepted" || order.status === "in_progress"
  ).length;

  const completedCount = orders.filter(
    (order) => order.status === "completed"
  ).length;

  const incomeTotal = orders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + order.total_amount, 0);

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);
    setError("");
    setMessage("");

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
      setProfile(null);
      setPlayer(null);
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from("platform_profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    setProfile(profileData as Profile | null);

    const { data: playerData } = await supabase
      .from("platform_players")
      .select("id, user_id, nickname, status")
      .eq("user_id", user.id)
      .maybeSingle();

    setPlayer(playerData as Player | null);

    const hasAccess =
      profileData?.role === "player" ||
      profileData?.role === "admin" ||
      profileData?.role === "staff" ||
      !!playerData;

    if (!hasAccess) {
      setLoading(false);
      return;
    }

    const { data: orderData, error: orderError } = await supabase
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
        started_at,
        completed_at,
        created_at,
        updated_at
      `
      )
      .eq("player_user_id", user.id)
      .order("created_at", { ascending: false });

    if (orderError) {
      setError("讀取陪玩師訂單失敗：" + orderError.message);
      setLoading(false);
      return;
    }

    setOrders((orderData || []) as Order[]);
    setLoading(false);
  }

  async function runOrderAction(
    order: Order,
    action: "accept" | "start" | "complete"
  ) {
    setBusyId(order.id);
    setError("");
    setMessage("");

    const rpcName =
      action === "accept"
        ? "platform_accept_order"
        : action === "start"
        ? "platform_start_order"
        : "platform_complete_order";

    const { error } = await supabase.rpc(rpcName, {
      p_order_id: order.id,
    });

    if (error) {
      setError("操作失敗：" + error.message);
      setBusyId(null);
      return;
    }

    const actionText =
      action === "accept"
        ? "已接受訂單"
        : action === "start"
        ? "已開始服務"
        : "已完成訂單";

    setMessage(`${order.order_no} ${actionText}`);
    setBusyId(null);
    await loadPage();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取接單列表中...</span>
        </div>
      </main>
    );
  }

  if (!profile && !player) {
    return (
      <AccessCard
        icon={<Lock className="h-8 w-8" />}
        title="請先登入"
        desc="登入陪玩師帳號後才能查看接單列表。"
        buttonText="前往登入"
        buttonHref="/login?next=/player-center/orders"
      />
    );
  }

  if (!canAccess) {
    return (
      <AccessCard
        icon={<ShieldCheck className="h-8 w-8" />}
        title="你還不是陪玩師"
        desc="審核通過後，這裡會顯示指定給你的訂單與接單操作。"
        buttonText="申請成為陪玩師"
        buttonHref="/apply-player"
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-950">
      <section className="relative overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-200/70 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-10">
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

          <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
                <Headphones className="h-4 w-4" />
                PLAYER ORDERS
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                我的接單列表
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                查看指定給你的訂單，確認接單、開始服務與完成訂單。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <PlayerStat label="待接單" value={String(waitingCount)} icon={<Clock />} />
              <PlayerStat label="進行中" value={String(activeCount)} icon={<BadgeCheck />} />
              <PlayerStat label="已完成" value={String(completedCount)} icon={<CheckCircle2 />} />
              <PlayerStat
                label="完成總額"
                value={incomeTotal.toLocaleString()}
                icon={<Coins />}
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
                  placeholder="搜尋訂單編號、備註、狀態..."
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-300 focus:bg-white"
              >
                <option value="all">全部訂單狀態</option>
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
                onClick={loadPage}
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
                目前沒有指定給你的訂單
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
                當會員在你的陪玩師頁面下單後，訂單就會出現在這裡。
              </p>

              <a
                href="/player-center"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
              >
                回陪玩師中心
                <ArrowRight className="h-4 w-4" />
              </a>
            </section>
          ) : (
            <div className="grid gap-6">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  busy={busyId === order.id}
                  onAccept={() => runOrderAction(order, "accept")}
                  onStart={() => runOrderAction(order, "start")}
                  onComplete={() => runOrderAction(order, "complete")}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function OrderCard({
  order,
  busy,
  onAccept,
  onStart,
  onComplete,
}: {
  order: Order;
  busy: boolean;
  onAccept: () => void;
  onStart: () => void;
  onComplete: () => void;
}) {
  const canAccept =
    order.payment_status === "paid" &&
    (order.status === "paid" || order.status === "waiting_player");

  const canStart = order.payment_status === "paid" && order.status === "accepted";

  const canComplete =
    order.payment_status === "paid" &&
    (order.status === "accepted" || order.status === "in_progress");

  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-xl backdrop-blur-xl">
      <div className="grid gap-0 lg:grid-cols-[260px_1fr]">
        <div className="relative bg-gradient-to-br from-violet-100 via-fuchsia-50 to-blue-100 p-6">
          <div className="absolute left-8 top-8 h-28 w-28 rounded-full bg-violet-200/70 blur-3xl" />
          <div className="absolute bottom-10 right-8 h-28 w-28 rounded-full bg-fuchsia-200/70 blur-3xl" />

          <div className="relative">
            <StatusPill status={order.status} />

            <div className="mt-5 flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.7rem] border-4 border-white bg-white text-violet-700 shadow-xl">
              <ReceiptText className="h-10 w-10" />
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
            <InfoBox label="付款方式" value={paymentMethodLabel[order.payment_method]} icon={<CreditCard />} />
            <InfoBox label="付款狀態" value={paymentStatusLabel[order.payment_status]} icon={<Wallet />} />
            <InfoBox label="訂單狀態" value={statusLabel[order.status]} icon={<ShieldCheck />} />
            <InfoBox label="建立時間" value={new Date(order.created_at).toLocaleString("zh-TW")} icon={<Clock />} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <section className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-950">訂單摘要</h3>
              </div>

              <div className="grid gap-3">
                <SummaryLine label="訂單狀態" value={statusLabel[order.status]} />
                <SummaryLine label="付款狀態" value={paymentStatusLabel[order.payment_status]} />
                <SummaryLine label="已付金額" value={`${order.paid_amount.toLocaleString()} ASD`} />
                <SummaryLine label="應付金額" value={`${order.total_amount.toLocaleString()} ASD`} />
              </div>

              {order.note && (
                <div className="mt-4 rounded-2xl bg-white p-4 text-sm leading-7 text-slate-600 shadow-sm">
                  <span className="font-black text-slate-900">備註：</span>
                  {order.note}
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
                  <Headphones className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-950">接單操作</h3>
              </div>

              <div className="grid gap-3">
                <a
                  href={`/orders/${order.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-violet-50 hover:text-violet-700"
                >
                  查看訂單詳情
                  <ArrowRight className="h-4 w-4" />
                </a>

                {order.payment_status !== "paid" && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                    訂單尚未付款，付款完成後才能接單。
                  </div>
                )}

                {canAccept && (
                  <button
                    onClick={onAccept}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    接受訂單
                  </button>
                )}

                {canStart && (
                  <button
                    onClick={onStart}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-500 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <PlayCircle className="h-4 w-4" />
                    )}
                    開始服務
                  </button>
                )}

                {canComplete && (
                  <button
                    onClick={onComplete}
                    disabled={busy}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-400 disabled:opacity-60"
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <BadgeCheck className="h-4 w-4" />
                    )}
                    完成訂單
                  </button>
                )}

                {order.status === "completed" && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-bold text-emerald-700">
                    這筆訂單已完成
                  </div>
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

        <p className="text-sm font-bold text-violet-600">PLAYER CENTER</p>
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

function PlayerStat({
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
      <p className="text-2xl font-black text-slate-950">{value}</p>
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