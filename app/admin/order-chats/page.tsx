"use client";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  role: string | null;
  display_name: string | null;
};

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

type Order = {
  id: string;
  order_no: string;
  title: string;
  total_amount: number;
  payment_status: PaymentStatus;
  status: OrderStatus;
  created_at: string;
  platform_players?: {
    nickname: string;
    avatar_url: string | null;
  } | null;
};

const orderStatusLabel: Record<OrderStatus, string> = {
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

const statusOptions = [
  { value: "all", label: "全部訂單" },
  { value: "pending_payment", label: "待付款" },
  { value: "paid", label: "已付款待接單" },
  { value: "waiting_player", label: "等待陪玩師" },
  { value: "accepted", label: "陪玩師已接單" },
  { value: "in_progress", label: "服務進行中" },
  { value: "completed", label: "已完成" },
];

const subscribeToHydration = () => () => {};

export default function AdminOrderChatsPage() {
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [loading, setLoading] = useState(false);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  const [status, setStatus] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [error, setError] = useState("");

  const isAdmin = profile?.role === "admin" || profile?.role === "staff";

  const filteredOrders = useMemo(() => {
    const cleanKeyword = keyword.trim().toLowerCase();

    return orders.filter((order) => {
      const matchStatus = status === "all" || order.status === status;

      if (!cleanKeyword) {
        return matchStatus;
      }

      const text = [
        order.order_no,
        order.title,
        order.platform_players?.nickname || "",
        order.status,
        order.payment_status,
      ]
        .join(" ")
        .toLowerCase();

      return matchStatus && text.includes(cleanKeyword);
    });
  }, [orders, status, keyword]);

  const summary = useMemo(() => {
    return {
      total: orders.length,
      active: orders.filter(
        (order) =>
          order.status !== "completed" &&
          order.status !== "cancelled" &&
          order.status !== "refunded"
      ).length,
      paid: orders.filter((order) => order.payment_status === "paid").length,
      chatting: orders.filter(
        (order) =>
          order.status === "paid" ||
          order.status === "waiting_player" ||
          order.status === "accepted" ||
          order.status === "in_progress"
      ).length,
    };
  }, [orders]);

  useEffect(() => {
    if (!mounted) return;
    loadOrders();
  }, [mounted]);

  async function loadOrders() {
    setLoading(true);
    setError("");

    try {
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
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("platform_profiles")
        .select("id, role, display_name")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setError("讀取管理員資料失敗：" + profileError.message);
        setLoading(false);
        return;
      }

      setProfile(profileData as Profile | null);

      if (profileData?.role !== "admin" && profileData?.role !== "staff") {
        setLoading(false);
        return;
      }

      const { data: orderRows, error: orderError } = await supabase
        .from("platform_orders")
        .select(
          `
          id,
          order_no,
          title,
          total_amount,
          payment_status,
          status,
          created_at,
          platform_players (
            nickname,
            avatar_url
          )
        `
        )
        .order("created_at", { ascending: false })
        .limit(150);

      if (orderError) {
        setError("讀取訂單資料失敗：" + orderError.message);
        setLoading(false);
        return;
      }

      setOrders((orderRows || []) as unknown as Order[]);
    } catch (err) {
      console.error("[admin order chats] load failed:", err);
      setError(err instanceof Error ? err.message : "讀取訂單聊天室總覽失敗。");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted || loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <section className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm font-bold text-slate-500">
            讀取訂單聊天室中...
          </span>
        </section>
      </main>
    );
  }

  if (!profile) {
    return (
      <AccessCard
        title="請先登入管理員帳號"
        desc="登入後才能查看訂單聊天室總覽。"
        buttonHref="/login?next=/admin/order-chats"
        buttonText="前往登入"
      />
    );
  }

  if (!isAdmin) {
    return (
      <AccessCard
        title="你沒有管理員權限"
        desc="請先到 Supabase 把你的 platform_profiles.role 設為 admin 或 staff。"
        buttonHref="/"
        buttonText="回首頁"
      />
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

          <button
            type="button"
            onClick={loadOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-white/80 px-4 py-2.5 text-sm font-black text-violet-700 shadow-sm transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            重新整理
          </button>
        </div>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-violet-100/70 backdrop-blur-xl md:p-8">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-200/70 blur-3xl" />
          <div className="absolute bottom-[-140px] left-[-120px] h-80 w-80 rounded-full bg-fuchsia-200/60 blur-3xl" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-black text-violet-700 shadow-sm">
              <MessageCircle className="h-4 w-4" />
              ORDER CHAT ADMIN
            </div>

            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                  訂單聊天室總覽
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                  客服可以從這裡進入每一筆訂單聊天室，在官網完成客人、陪玩師與客服的對話，不需要再跳 Discord。
                </p>
              </div>

              <a
                href="/admin/orders"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
              >
                訂單管理
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </section>

        {error && (
          <section className="mt-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </section>
        )}

        <section className="mt-6 grid gap-4 md:grid-cols-4">
          <SummaryCard title="訂單總數" value={String(summary.total)} />
          <SummaryCard title="進行中訂單" value={String(summary.active)} />
          <SummaryCard title="已付款訂單" value={String(summary.paid)} />
          <SummaryCard title="可處理聊天室" value={String(summary.chatting)} />
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
                placeholder="搜尋訂單編號、標題、陪玩師、狀態"
                className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-violet-300"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setKeyword("");
                setStatus("all");
              }}
              className="inline-flex items-center justify-center rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-100"
            >
              清除篩選
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4">
          {filteredOrders.length === 0 ? (
            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
              <TriangleAlert className="mx-auto h-8 w-8 text-amber-600" />
              <p className="mt-4 text-lg font-black text-slate-950">
                沒有符合條件的訂單
              </p>
              <p className="mt-2 text-sm text-slate-500">
                可以換其他狀態或清除搜尋條件。
              </p>
            </section>
          ) : (
            filteredOrders.map((order) => <OrderChatCard key={order.id} order={order} />)
          )}
        </section>
      </section>
    </main>
  );
}

function AccessCard({
  title,
  desc,
  buttonHref,
  buttonText,
}: {
  title: string;
  desc: string;
  buttonHref: string;
  buttonText: string;
}) {
  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-16 text-slate-950">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
          <ShieldCheck className="h-8 w-8" />
        </div>

        <p className="text-sm font-bold text-violet-600">ORDER CHAT ADMIN</p>
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

function SummaryCard({ title, value }: { title: string; value: string }) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-xl shadow-violet-100/60 backdrop-blur-xl">
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </section>
  );
}

function OrderChatCard({ order }: { order: Order }) {
  const isClosed =
    order.status === "completed" ||
    order.status === "cancelled" ||
    order.status === "refunded";

  const statusStyle = isClosed
    ? "bg-slate-100 text-slate-500"
    : order.status === "pending_payment"
    ? "bg-amber-50 text-amber-700"
    : "bg-emerald-50 text-emerald-700";

  const paymentStyle =
    order.payment_status === "paid"
      ? "bg-emerald-50 text-emerald-700"
      : "bg-amber-50 text-amber-700";

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-xl shadow-violet-100/60 backdrop-blur-xl">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${statusStyle}`}
            >
              {isClosed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              {orderStatusLabel[order.status] || order.status}
            </span>

            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${paymentStyle}`}
            >
              {paymentStatusLabel[order.payment_status] ||
                order.payment_status}
            </span>
          </div>

          <p className="mt-4 break-all text-lg font-black text-slate-950">
            {order.order_no || order.id}
          </p>

          <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-slate-500">
            {order.title || "未命名訂單"}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-500">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-2">
              <UserRound className="h-4 w-4 text-violet-600" />
              {order.platform_players?.nickname || "尚未指定陪玩師"}
            </div>

            <div className="rounded-2xl bg-slate-50 px-3 py-2">
              {Number(order.total_amount || 0).toLocaleString()} ASD
            </div>

            <div className="rounded-2xl bg-slate-50 px-3 py-2">
              {new Date(order.created_at).toLocaleString("zh-TW")}
            </div>
          </div>
        </div>

        <div className="grid shrink-0 gap-2 sm:grid-cols-2 lg:w-[280px] lg:grid-cols-1">
          <a
            href={`/orders/${order.id}/chat`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-100 transition hover:bg-violet-500"
          >
            <MessageCircle className="h-4 w-4" />
            進入聊天室
          </a>

          <a
            href={`/orders/${order.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white px-5 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-50"
          >
            查看訂單
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
