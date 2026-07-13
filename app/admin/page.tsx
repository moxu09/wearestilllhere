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
  Crown,
  Gift,
  Headphones,
  Loader2,
  Lock,
  Mic2,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

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
type PaymentMethod = "wallet" | "transfer" | "card" | "manual";

type Order = {
  id: string;
  order_no: string;
  title: string;
  total_amount: number;
  paid_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: OrderStatus;
  created_at: string;
  platform_players?: {
    nickname: string;
    avatar_url: string | null;
  } | null;
};

type Application = {
  id: string;
  user_id: string;
  nickname: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type Player = {
  id: string;
  nickname: string;
  status: string;
  is_online: boolean;
  is_accepting_orders: boolean;
  total_orders: number;
};

type VoiceRoom = {
  id: string;
  title: string;
  status: string;
  current_members: number;
  created_at: string;
};

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

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [voiceRooms, setVoiceRooms] = useState<VoiceRoom[]>([]);
  const [error, setError] = useState("");

  const isAdmin = profile?.role === "admin" || profile?.role === "staff";

  const stats = useMemo(() => {
    const paidOrders = orders.filter((order) => order.payment_status === "paid");
    const completedOrders = orders.filter(
      (order) => order.status === "completed"
    );
    const pendingPaymentOrders = orders.filter(
      (order) => order.status === "pending_payment"
    );

    const pendingApps = applications.filter((app) => app.status === "pending");
    const activePlayers = players.filter((player) => player.status === "active");
    const onlinePlayers = activePlayers.filter((player) => player.is_online);
    const acceptingPlayers = activePlayers.filter(
      (player) => player.is_accepting_orders
    );

    const openRooms = voiceRooms.filter((room) => room.status === "open");

    const paidTotal = paidOrders.reduce(
      (sum, order) => sum + order.total_amount,
      0
    );

    const completedTotal = completedOrders.reduce(
      (sum, order) => sum + order.total_amount,
      0
    );

    const roomMembers = openRooms.reduce(
      (sum, room) => sum + room.current_members,
      0
    );

    return {
      totalOrders: orders.length,
      pendingPaymentOrders: pendingPaymentOrders.length,
      paidTotal,
      completedTotal,
      pendingApps: pendingApps.length,
      activePlayers: activePlayers.length,
      onlinePlayers: onlinePlayers.length,
      acceptingPlayers: acceptingPlayers.length,
      openRooms: openRooms.length,
      roomMembers,
    };
  }, [orders, applications, players, voiceRooms]);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
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

    const [ordersResult, applicationsResult, playersResult, roomsResult] =
      await Promise.all([
        supabase
          .from("platform_orders")
          .select(
            `
            id,
            order_no,
            title,
            total_amount,
            paid_amount,
            payment_method,
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
          .limit(100),

        supabase
          .from("platform_player_applications")
          .select("id, user_id, nickname, status, created_at")
          .order("created_at", { ascending: false })
          .limit(50),

        supabase
          .from("platform_players")
          .select(
            `
            id,
            nickname,
            status,
            is_online,
            is_accepting_orders,
            total_orders
          `
          )
          .order("created_at", { ascending: false })
          .limit(100),

        supabase
          .from("platform_voice_rooms")
          .select("id, title, status, current_members, created_at")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

    if (ordersResult.error) {
      setError("讀取訂單資料失敗：" + ordersResult.error.message);
      setLoading(false);
      return;
    }

    if (applicationsResult.error) {
      setError("讀取陪玩師申請失敗：" + applicationsResult.error.message);
      setLoading(false);
      return;
    }

    if (playersResult.error) {
      setError("讀取陪玩師資料失敗：" + playersResult.error.message);
      setLoading(false);
      return;
    }

    if (roomsResult.error) {
      setError("讀取語音廳資料失敗：" + roomsResult.error.message);
      setLoading(false);
      return;
    }

    setOrders((ordersResult.data || []) as unknown as Order[]);
    setApplications((applicationsResult.data || []) as Application[]);
    setPlayers((playersResult.data || []) as Player[]);
    setVoiceRooms((roomsResult.data || []) as VoiceRoom[]);

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取管理後台中...</span>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <AccessCard
        icon={<Lock className="h-8 w-8" />}
        title="請先登入管理員帳號"
        desc="登入後才能查看管理後台。"
        buttonText="前往登入"
        buttonHref="/login?next=/admin"
      />
    );
  }

  if (!isAdmin) {
    return (
      <AccessCard
        icon={<ShieldCheck className="h-8 w-8" />}
        title="你沒有管理員權限"
        desc="請先到 Supabase 把你的 platform_profiles.role 設為 admin 或 staff。"
        buttonText="回首頁"
        buttonHref="/"
      />
    );
  }

  const recentOrders = orders.slice(0, 5);
  const recentApplications = applications.slice(0, 5);

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-950">
      <section className="relative overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-200/70 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-10">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                ADMIN DASHBOARD
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                管理後台
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                歡迎回來，{profile.display_name || "管理員"}。這裡可以快速查看訂單、陪玩師申請、
                語音廳與平台營收狀態。
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <a
                href="/admin/orders"
                className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
              >
                訂單管理
                <ArrowRight className="h-4 w-4" />
              </a>

              <button
                type="button"
                onClick={loadDashboard}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-white"
              >
                重新整理
              </button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="訂單總數"
              value={String(stats.totalOrders)}
              desc={`待付款 ${stats.pendingPaymentOrders} 筆`}
              icon={<ReceiptText />}
            />
            <StatCard
              title="已付款總額"
              value={`${stats.paidTotal.toLocaleString()} ASD`}
              desc={`完成訂單 ${stats.completedTotal.toLocaleString()} ASD`}
              icon={<Coins />}
            />
            <StatCard
              title="陪玩師申請"
              value={String(stats.pendingApps)}
              desc={`目前 ${stats.activePlayers} 位陪玩師`}
              icon={<Crown />}
            />
            <StatCard
              title="語音廳"
              value={String(stats.openRooms)}
              desc={`目前 ${stats.roomMembers} 人在線`}
              icon={<Mic2 />}
            />
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <SmallStat
              title="在線陪玩師"
              value={String(stats.onlinePlayers)}
              icon={<Headphones />}
            />
            <SmallStat
              title="可接單陪玩師"
              value={String(stats.acceptingPlayers)}
              icon={<BadgeCheck />}
            />
            <SmallStat
              title="待付款訂單"
              value={String(stats.pendingPaymentOrders)}
              icon={<Clock />}
            />
            <SmallStat
              title="後台角色"
              value={profile.role || "admin"}
              icon={<ShieldCheck />}
            />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <Panel
              title="快速入口"
              icon={<Sparkles className="h-5 w-5" />}
              actionHref="/admin/orders"
              actionText="訂單管理"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <QuickLink
                  title="訂單管理"
                  desc="確認付款、取消訂單、查看訂單狀態。"
                  href="/admin/orders"
                  icon={<ReceiptText />}
                />

                <QuickLink
                  title="陪玩師申請"
                  desc="審核會員申請並建立陪玩師資料。"
                  href="/admin/player-applications"
                  icon={<Crown />}
                />

                <QuickLink
                  title="禮物管理"
                  desc="新增禮物、修改價格、設定明燈三千全屏播報。"
                  href="/admin/gifts"
                  icon={<Gift />}
                />

                <QuickLink
                  title="陪玩師大廳"
                  desc="查看目前公開的陪玩師卡片。"
                  href="/players"
                  icon={<UserRound />}
                />

                <QuickLink
                  title="語音廳大廳"
                  desc="查看正在開放的語音廳。"
                  href="/voice-rooms"
                  icon={<Mic2 />}
                />
              </div>
            </Panel>

            <Panel
              title="營運提醒"
              icon={<ShieldCheck className="h-5 w-5" />}
            >
              <div className="grid gap-3">
                <NoticeLine
                  title="人工付款需要確認"
                  desc={`目前有 ${stats.pendingPaymentOrders} 筆待付款訂單，需要到訂單管理確認。`}
                  href="/admin/orders"
                />
                <NoticeLine
                  title="陪玩師申請待審核"
                  desc={`目前有 ${stats.pendingApps} 筆陪玩師申請等待處理。`}
                  href="/admin/player-applications"
                />
                <NoticeLine
                  title="Discord Bot 串接準備"
                  desc="下一階段可以讓訂單付款後自動通知陪玩師，語音廳自動開 Discord 頻道。"
                  href="/player-center/orders"
                />
              </div>
            </Panel>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Panel
              title="最近訂單"
              icon={<ReceiptText className="h-5 w-5" />}
              actionHref="/admin/orders"
              actionText="查看全部"
            >
              {recentOrders.length === 0 ? (
                <EmptyMini text="目前沒有訂單。" />
              ) : (
                <div className="grid gap-3">
                  {recentOrders.map((order) => (
                    <RecentOrderItem key={order.id} order={order} />
                  ))}
                </div>
              )}
            </Panel>

            <Panel
              title="最近陪玩師申請"
              icon={<Crown className="h-5 w-5" />}
              actionHref="/admin/player-applications"
              actionText="查看全部"
            >
              {recentApplications.length === 0 ? (
                <EmptyMini text="目前沒有陪玩師申請。" />
              ) : (
                <div className="grid gap-3">
                  {recentApplications.map((app) => (
                    <RecentApplicationItem key={app.id} app={app} />
                  ))}
                </div>
              )}
            </Panel>
          </div>
        </div>
      </section>
    </main>
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

        <p className="text-sm font-bold text-violet-600">ADMIN</p>
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

function StatCard({
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
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 [&_svg]:h-6 [&_svg]:w-6">
          {icon}
        </div>
        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
      </div>

      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{desc}</p>
    </section>
  );
}

function SmallStat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <section className="flex items-center gap-4 rounded-3xl border border-white/70 bg-white/75 p-4 shadow-lg backdrop-blur-xl">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <div>
        <p className="text-xl font-black text-slate-950">{value}</p>
        <p className="text-xs font-semibold text-slate-500">{title}</p>
      </div>
    </section>
  );
}

function Panel({
  title,
  icon,
  children,
  actionHref,
  actionText,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  actionHref?: string;
  actionText?: string;
}) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            {icon}
          </div>
          <h2 className="text-xl font-black text-slate-950">{title}</h2>
        </div>

        {actionHref && actionText && (
          <a
            href={actionHref}
            className="inline-flex items-center gap-1 text-sm font-bold text-violet-700"
          >
            {actionText}
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
      </div>

      {children}
    </section>
  );
}

function QuickLink({
  title,
  desc,
  href,
  icon,
}: {
  title: string;
  desc: string;
  href: string;
  icon: ReactNode;
}) {
  return (
    <a
      href={href}
      className="group rounded-3xl border border-slate-100 bg-slate-50/80 p-5 transition hover:-translate-y-1 hover:border-violet-200 hover:bg-violet-50"
    >
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <p className="font-black text-slate-950">{title}</p>
      <p className="mt-2 text-xs leading-6 text-slate-500">{desc}</p>
      <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-violet-700">
        前往
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
      </div>
    </a>
  );
}

function NoticeLine({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-violet-200 hover:bg-violet-50"
    >
      <div>
        <p className="font-black text-slate-950">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p>
      </div>
      <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-600" />
    </a>
  );
}

function RecentOrderItem({ order }: { order: Order }) {
  return (
    <a
      href={`/orders/${order.id}`}
      className="group flex items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-violet-200 hover:bg-violet-50"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white text-violet-700 shadow-sm">
          {order.platform_players?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={order.platform_players.avatar_url}
              alt={order.platform_players.nickname}
              className="h-full w-full object-cover"
            />
          ) : (
            <ReceiptText className="h-6 w-6" />
          )}
        </div>

        <div>
          <p className="font-black text-slate-950">{order.order_no}</p>
          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
            {order.title}
          </p>
          <p className="mt-1 text-xs font-bold text-violet-700">
            {paymentMethodLabel[order.payment_method]} ｜{" "}
            {paymentStatusLabel[order.payment_status]}
          </p>
        </div>
      </div>

      <div className="text-right">
        <p className="font-black text-amber-600">
          {order.total_amount.toLocaleString()} ASD
        </p>
        <p className="mt-1 text-xs font-semibold text-slate-400">
          {statusLabel[order.status]}
        </p>
      </div>
    </a>
  );
}

function RecentApplicationItem({ app }: { app: Application }) {
  const style =
    app.status === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : app.status === "rejected"
      ? "bg-red-50 text-red-600"
      : "bg-amber-50 text-amber-700";

  const label =
    app.status === "approved"
      ? "已通過"
      : app.status === "rejected"
      ? "已拒絕"
      : "待審核";

  return (
    <a
      href="/admin/player-applications"
      className="group flex items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-violet-200 hover:bg-violet-50"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
          <UserRound className="h-6 w-6" />
        </div>

        <div>
          <p className="font-black text-slate-950">{app.nickname}</p>
          <p className="mt-1 text-xs text-slate-500">
            {new Date(app.created_at).toLocaleString("zh-TW")}
          </p>
        </div>
      </div>

      <div className={`rounded-full px-3 py-1 text-xs font-black ${style}`}>
        {label}
      </div>
    </a>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-slate-50/80 p-6 text-center text-sm font-semibold text-slate-500">
      {text}
    </div>
  );
}
