"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Gift,
　ReceiptText,
  CalendarClock,
  CheckCircle2,
  Clock,
  Coins,
  Crown,
  Gamepad2,
  Headphones,
  Heart,
  Loader2,
  Lock,
  Moon,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Wallet,
  XCircle,
} from "lucide-react";

type Profile = {
  display_name: string | null;
  role: "customer" | "player" | "staff" | "admin" | string;
  status: string;
  avatar_url: string | null;
  created_at: string;
};

type WalletData = {
  balance: number;
  frozen_balance: number;
  updated_at: string | null;
};

type ApplicationStatus = "pending" | "approved" | "rejected" | "cancelled";

type ApplicationData = {
  status: ApplicationStatus;
  nickname: string;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

type PlayerData = {
  id: string;
  nickname: string;
  is_online: boolean;
  is_accepting_orders: boolean;
  rating_avg: number;
  rating_count: number;
  total_orders: number;
};

const ROLE_LABEL: Record<string, string> = {
  customer: "普通會員",
  player: "陪玩師",
  staff: "客服人員",
  admin: "管理員",
};

const APPLICATION_LABEL: Record<ApplicationStatus, string> = {
  pending: "審核中",
  approved: "已通過",
  rejected: "未通過",
  cancelled: "已取消",
};

export default function MemberDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [error, setError] = useState("");

  const displayName = useMemo(() => {
    return profile?.display_name || userEmail || "深夜會員";
  }, [profile, userEmail]);

  const roleLabel = profile?.role ? ROLE_LABEL[profile.role] || profile.role : "普通會員";

  useEffect(() => {
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
        setLoading(false);
        return;
      }

      setUserEmail(user.email ?? null);

      const { data: profileData, error: profileError } = await supabase
        .from("platform_profiles")
        .select("display_name, role, status, avatar_url, created_at")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setError("讀取會員資料失敗：" + profileError.message);
      } else {
        setProfile(profileData as Profile | null);
      }

      const { data: walletData, error: walletError } = await supabase
        .from("platform_wallets")
        .select("balance, frozen_balance, updated_at")
        .eq("user_id", user.id)
        .maybeSingle();

      if (walletError) {
        setError("讀取錢包資料失敗：" + walletError.message);
      } else {
        setWallet(walletData as WalletData | null);
      }

      const { data: appData } = await supabase
        .from("platform_player_applications")
        .select("status, nickname, review_note, created_at, reviewed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      setApplication(appData as ApplicationData | null);

      const { data: playerData } = await supabase
        .from("platform_players")
        .select(
          "id, nickname, is_online, is_accepting_orders, rating_avg, rating_count, total_orders"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      setPlayer(playerData as PlayerData | null);

      setLoading(false);
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070a14] px-4 py-10 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-300" />
          <span className="text-sm text-slate-300">讀取會員中心中...</span>
        </div>
      </main>
    );
  }

  if (!userEmail && !profile) {
    return (
      <main className="min-h-screen bg-[#070a14] px-4 py-16 text-white">
        <section className="mx-auto max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-500/20 text-violet-100">
            <Lock className="h-8 w-8" />
          </div>
          <p className="text-sm text-violet-200">會員中心</p>
          <h1 className="mt-2 text-3xl font-black">請先登入</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            登入後可以查看 ASD 錢包、訂單、收藏、陪玩師申請狀態與會員資料。
          </p>
          <a
            href="/login?next=/member"
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 font-bold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
          >
            登入 / 註冊會員
            <ArrowRight className="h-5 w-5" />
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070a14] text-white">
      <section className="relative overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute right-[-120px] top-10 h-96 w-96 rounded-full bg-fuchsia-500/15 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-10">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
              {error}
            </div>
          )}

          <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl backdrop-blur-xl">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-[1.7rem] bg-violet-500 blur-lg opacity-30" />
                    <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#111827]">
                      {profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profile.avatar_url}
                          alt={displayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound className="h-9 w-9 text-violet-100" />
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-100">
                      <Sparkles className="h-3.5 w-3.5" />
                      {roleLabel}
                    </p>
                    <h1 className="text-3xl font-black md:text-4xl">
                      歡迎回來，{displayName}
                    </h1>
                    <p className="mt-2 text-sm text-slate-400">
                      {userEmail || "社群登入會員"} ｜ 狀態：
                      {profile?.status === "active" ? "正常" : profile?.status || "正常"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="/wallet/topup"
                    className="inline-flex items-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-400"
                  >
                    <Coins className="h-4 w-4" />
                    儲值 ASD
                  </a>

                  <Link
                    href="/players"
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-bold text-slate-100 transition hover:bg-white/[0.1]"
                  >
                    <Gamepad2 className="h-4 w-4 text-violet-200" />
                    找陪玩
                  </Link>
                </div>
              </div>
            </div>

            <WalletPanel wallet={wallet} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="grid gap-6">
              <ApplicationPanel application={application} player={player} />
              <QuickActions role={profile?.role || "customer"} />
            </div>

            <div className="grid gap-6">
              <OrderOverview />
              <FavoritePlayersPreview />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function WalletPanel({ wallet }: { wallet: WalletData | null }) {
  const balance = wallet?.balance || 0;
  const frozen = wallet?.frozen_balance || 0;

  return (
    <div className="rounded-[2rem] border border-yellow-300/15 bg-gradient-to-br from-yellow-500/12 via-white/[0.06] to-violet-500/10 p-7 shadow-2xl backdrop-blur-xl">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-yellow-100">ASD 錢包</p>
          <h2 className="mt-1 text-2xl font-black">我的餘額</h2>
        </div>

        <div className="flex h-13 w-13 items-center justify-center rounded-3xl bg-yellow-500/15 text-yellow-100">
          <Wallet className="h-6 w-6" />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
        <p className="text-sm text-slate-400">可用 ASD</p>
        <p className="mt-2 text-5xl font-black tracking-tight text-yellow-100">
          {balance.toLocaleString()}
        </p>
        <p className="mt-3 text-xs text-slate-500">
          1 元台幣 = 1 ASD，可用於下單、送禮、語音廳消費。
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <MiniWalletMetric label="凍結中" value={`${frozen.toLocaleString()} ASD`} />
        <MiniWalletMetric
          label="最後更新"
          value={
            wallet?.updated_at
              ? new Date(wallet.updated_at).toLocaleDateString("zh-TW")
              : "尚無紀錄"
          }
        />
      </div>

      <a
        href="/wallet/topup"
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-yellow-300"
      >
        立即儲值
        <ArrowRight className="h-4 w-4" />
      </a>
    </div>
  );
}

function ApplicationPanel({
  application,
  player,
}: {
  application: ApplicationData | null;
  player: PlayerData | null;
}) {
  if (player) {
    return (
      <Panel title="陪玩師身份" icon={<BadgeCheck className="h-5 w-5" />}>
        <div className="rounded-3xl border border-emerald-300/20 bg-emerald-500/10 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-200" />
            <div>
              <p className="font-black text-emerald-100">你已經是陪玩師</p>
              <p className="mt-1 text-sm text-emerald-100/70">
                {player.nickname} ｜ {player.total_orders} 筆訂單 ｜ 評價{" "}
                {Number(player.rating_avg || 0).toFixed(1)}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <StatePill
              label="在線狀態"
              value={player.is_online ? "在線" : "離線"}
              active={player.is_online}
            />
            <StatePill
              label="接單狀態"
              value={player.is_accepting_orders ? "接單中" : "暫停接單"}
              active={player.is_accepting_orders}
            />
          </div>

          <a
            href="/player-center"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-400"
          >
            進入陪玩師中心
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </Panel>
    );
  }

  if (application) {
    const isPending = application.status === "pending";
    const isApproved = application.status === "approved";
    const isRejected = application.status === "rejected";

    return (
      <Panel title="陪玩師申請狀態" icon={<ShieldCheck className="h-5 w-5" />}>
        <div
          className={`rounded-3xl border p-5 ${
            isPending
              ? "border-yellow-300/20 bg-yellow-500/10"
              : isApproved
              ? "border-emerald-300/20 bg-emerald-500/10"
              : isRejected
              ? "border-red-300/20 bg-red-500/10"
              : "border-white/10 bg-white/[0.06]"
          }`}
        >
          <div className="flex items-center gap-3">
            {isPending ? (
              <Clock className="h-6 w-6 text-yellow-200" />
            ) : isApproved ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-200" />
            ) : isRejected ? (
              <XCircle className="h-6 w-6 text-red-200" />
            ) : (
              <CalendarClock className="h-6 w-6 text-slate-300" />
            )}

            <div>
              <p className="font-black">
                {APPLICATION_LABEL[application.status] || application.status}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                申請暱稱：{application.nickname}
              </p>
            </div>
          </div>

          {application.review_note && (
            <div className="mt-4 rounded-2xl bg-black/20 p-4 text-sm text-slate-300">
              審核備註：{application.review_note}
            </div>
          )}

          {isRejected && (
            <a
              href="/apply-player"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-400"
            >
              重新申請
              <ArrowRight className="h-4 w-4" />
            </a>
          )}
        </div>
      </Panel>
    );
  }

  return (
    <Panel title="成為陪玩師" icon={<Crown className="h-5 w-5" />}>
      <div className="rounded-3xl border border-violet-300/20 bg-violet-500/10 p-5">
        <p className="text-xl font-black">想在平台接單嗎？</p>
        <p className="mt-3 text-sm leading-7 text-slate-300">
          申請通過後，你可以建立陪玩師個人頁、設定服務項目、開語音廳、接收訂單並查看收入。
        </p>

        <a
          href="/apply-player"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-400"
        >
          申請成為陪玩師
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </Panel>
  );
}

function QuickActions({ role }: { role: string }) {
  const actions = [
    {
      title: "我的訂單",
      desc: "查看待付款、進行中與已完成訂單。",
      icon: <ReceiptText />,
      href: "/member/orders",
    },
    {
      title: "我的錢包",
      desc: "查看 ASD 餘額與交易紀錄。",
      icon: <Wallet />,
      href: "/wallet",
    },
    {
      title: "儲值 ASD",
      desc: "送出儲值申請，等待管理員確認入帳。",
      icon: <Coins />,
      href: "/wallet/topup",
    },
    {
      title: "送禮打賞",
      desc: "使用 ASD 送禮給喜歡的陪玩師。",
      icon: <Gift />,
      href: "/gifts/send",
    },
    {
      title: "找陪玩",
      desc: "依遊戲、評價、價格尋找陪玩師。",
      icon: <Gamepad2 />,
      href: "/players",
    },
    {
      title: role === "player" ? "陪玩師中心" : "申請陪玩師",
      desc:
        role === "player"
          ? "管理接單、收禮與收入。"
          : "送出入駐申請，等待審核。",
      icon: role === "player" ? <Headphones /> : <Crown />,
      href: role === "player" ? "/player-center" : "/apply-player",
    },
  ];

  return (
    <Panel title="快速入口" icon={<Sparkles className="h-5 w-5" />}>
      <div className="grid gap-3 sm:grid-cols-2">
        {actions.map((action) => (
          <a
            key={action.title}
            href={action.href}
            className="group rounded-3xl border border-white/10 bg-white/[0.05] p-5 transition hover:-translate-y-1 hover:border-violet-300/40 hover:bg-white/[0.08]"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-100 [&_svg]:h-5 [&_svg]:w-5">
              {action.icon}
            </div>
            <p className="font-black">{action.title}</p>
            <p className="mt-2 text-xs leading-6 text-slate-400">
              {action.desc}
            </p>
            <div className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-violet-200">
              前往
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
            </div>
          </a>
        ))}
      </div>
    </Panel>
  );
}

function OrderOverview() {
  return (
    <Panel title="我的訂單" icon={<ReceiptText className="h-5 w-5" />}>
      <div className="grid gap-4 md:grid-cols-3">
        <OrderMetric label="待付款" value="查看" />
        <OrderMetric label="進行中" value="查看" />
        <OrderMetric label="已完成" value="查看" />
      </div>

      <div className="mt-5 rounded-3xl border border-white/10 bg-black/20 p-6 text-center">
        <Moon className="mx-auto mb-3 h-8 w-8 text-violet-200" />
        <p className="font-black">訂單列表已啟用</p>
        <p className="mt-2 text-sm leading-7 text-slate-400">
          你可以查看自己的訂單狀態、付款狀態、陪玩師與訂單詳情。
        </p>

        <a
          href="/member/orders"
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-violet-400"
        >
          查看我的訂單
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </Panel>
  );
}

function FavoritePlayersPreview() {
  return (
    <Panel title="收藏與推薦" icon={<Heart className="h-5 w-5" />}>
      <div className="grid gap-3">
        <RecommendationItem
          title="熱門陪玩師"
          desc="依照評價、接單量與在線狀態推薦。"
          icon={<Star />}
        />
        <RecommendationItem
          title="最近瀏覽"
          desc="之後會記錄你看過的陪玩師與服務。"
          icon={<Clock />}
        />
        <RecommendationItem
          title="語音廳通知"
          desc="收藏的陪玩師開廳時可以收到提醒。"
          icon={<Bell />}
        />
      </div>
    </Panel>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-100">
          {icon}
        </div>
        <h2 className="text-xl font-black">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function MiniWalletMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-slate-100">{value}</p>
    </div>
  );
}

function StatePill({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="rounded-2xl bg-black/20 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-black ${active ? "text-emerald-200" : "text-slate-300"}`}>
        {value}
      </p>
    </div>
  );
}

function OrderMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-black/20 p-5 text-center">
      <p className="text-3xl font-black">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{label}</p>
    </div>
  );
}

function RecommendationItem({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-white/10 bg-black/20 p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-fuchsia-500/15 text-fuchsia-100 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <div>
        <p className="font-black">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">{desc}</p>
      </div>
    </div>
  );
}
