"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Coins,
  Crown,
  Gamepad2,
  Gift,
  Headphones,
  Loader2,
  Lock,
  Mic2,
  ReceiptText,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  ToggleLeft,
  ToggleRight,
  UserRound,
  Wallet,
} from "lucide-react";

type Player = {
  id: string;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  intro: string | null;
  gender: string | null;
  status: string;
  is_online: boolean;
  is_accepting_orders: boolean;
  total_orders: number | null;
  created_at: string;
};

type DashboardStats = {
  serviceCount: number;
  giftCount: number;
  orderCount: number;
  giftAmount: number;
};

export default function PlayerCenterPage() {
  const [loading, setLoading] = useState(true);
  const [savingOnline, setSavingOnline] = useState(false);
  const [savingAccepting, setSavingAccepting] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    serviceCount: 0,
    giftCount: 0,
    orderCount: 0,
    giftAmount: 0,
  });

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPage() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError("讀取登入狀態失敗：" + userError.message);
        setUserId(null);
        setPlayer(null);
        return;
      }

      if (!user) {
        setUserId(null);
        setPlayer(null);
        return;
      }

      setUserId(user.id);

      const { data: playerData, error: playerError } = await supabase
        .from("platform_players")
        .select(
          `
          id,
          user_id,
          nickname,
          avatar_url,
          intro,
          gender,
          status,
          is_online,
          is_accepting_orders,
          total_orders,
          created_at
        `
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (playerError) {
        setError("讀取陪玩師資料失敗：" + playerError.message);
        setPlayer(null);
        return;
      }

      const currentPlayer = playerData as Player | null;
      setPlayer(currentPlayer);

      if (currentPlayer) {
        loadStats(currentPlayer);
      }
    } catch (err) {
      console.error("[player-center] loadPage failed:", err);
      setError("讀取陪玩師中心失敗，請重新整理或稍後再試。");
    } finally {
      setLoading(false);
    }
  }

  async function loadStats(currentPlayer: Player) {
    try {
      let serviceCount = 0;
      let giftCount = 0;
      let orderCount = currentPlayer.total_orders || 0;
      let giftAmount = 0;

      const servicesResult = await supabase
        .from("platform_player_services")
        .select("id", { count: "exact", head: true })
        .eq("player_id", currentPlayer.id)
        .eq("is_enabled", true);

      if (!servicesResult.error) {
        serviceCount = servicesResult.count || 0;
      } else {
        console.warn("[player-center] service count failed:", servicesResult.error);
      }

      const giftsCountResult = await supabase
        .from("platform_gift_orders")
        .select("id", { count: "exact", head: true })
        .eq("receiver_player_id", currentPlayer.id);

      if (!giftsCountResult.error) {
        giftCount = giftsCountResult.count || 0;
      } else {
        console.warn("[player-center] gift count failed:", giftsCountResult.error);
      }

      const giftsAmountResult = await supabase
        .from("platform_gift_orders")
        .select("total_amount")
        .eq("receiver_player_id", currentPlayer.id)
        .limit(300);

      if (!giftsAmountResult.error && giftsAmountResult.data) {
        giftAmount = giftsAmountResult.data.reduce((sum, row) => {
          const amount = Number(
            (row as { total_amount?: number | null }).total_amount || 0
          );
          return sum + amount;
        }, 0);
      } else if (giftsAmountResult.error) {
        console.warn("[player-center] gift amount failed:", giftsAmountResult.error);
      }

      const ordersResult = await supabase
        .from("platform_orders")
        .select("id", { count: "exact", head: true })
        .eq("player_id", currentPlayer.id);

      if (!ordersResult.error) {
        orderCount = ordersResult.count || orderCount;
      } else {
        console.warn("[player-center] order count failed:", ordersResult.error);
      }

      setStats({
        serviceCount,
        giftCount,
        orderCount,
        giftAmount,
      });
    } catch (err) {
      console.error("[player-center] loadStats failed:", err);

      setStats({
        serviceCount: 0,
        giftCount: 0,
        orderCount: currentPlayer.total_orders || 0,
        giftAmount: 0,
      });
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPage(), 0);
    return () => window.clearTimeout(timer);
    // The player dashboard session is loaded once on entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateOnlineStatus(nextValue: boolean) {
    if (!player) return;

    setSavingOnline(true);
    setError("");
    setMessage("");

    try {
      const { error: updateError } = await supabase
        .from("platform_players")
        .update({
          is_online: nextValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", player.id)
        .eq("user_id", player.user_id);

      if (updateError) {
        setError("更新在線狀態失敗：" + updateError.message);
        return;
      }

      setPlayer({
        ...player,
        is_online: nextValue,
      });

      setMessage(nextValue ? "已切換為在線。" : "已切換為離線。");
    } catch (err) {
      console.error("[player-center] updateOnlineStatus failed:", err);
      setError("更新在線狀態失敗，請稍後再試。");
    } finally {
      setSavingOnline(false);
    }
  }

  async function updateAcceptingStatus(nextValue: boolean) {
    if (!player) return;

    setSavingAccepting(true);
    setError("");
    setMessage("");

    try {
      const { error: updateError } = await supabase
        .from("platform_players")
        .update({
          is_accepting_orders: nextValue,
          updated_at: new Date().toISOString(),
        })
        .eq("id", player.id)
        .eq("user_id", player.user_id);

      if (updateError) {
        setError("更新接單狀態失敗：" + updateError.message);
        return;
      }

      setPlayer({
        ...player,
        is_accepting_orders: nextValue,
      });

      setMessage(nextValue ? "已開啟接單。" : "已關閉接單。");
    } catch (err) {
      console.error("[player-center] updateAcceptingStatus failed:", err);
      setError("更新接單狀態失敗，請稍後再試。");
    } finally {
      setSavingAccepting(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取陪玩師中心中...</span>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <AccessCard
        icon={<Lock className="h-8 w-8" />}
        title="請先登入"
        desc="登入陪玩師帳號後，才能進入陪玩師中心。"
        buttonText="前往登入"
        buttonHref="/login?next=/player-center"
      />
    );
  }

  if (!player) {
    return (
      <AccessCard
        icon={<ShieldCheck className="h-8 w-8" />}
        title="你還不是陪玩師"
        desc="需要先送出陪玩師申請，審核通過後才會開啟陪玩師中心。"
        buttonText="申請成為陪玩師"
        buttonHref="/apply-player"
      />
    );
  }

  const isActive = player.status === "active";

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f3ec] text-slate-950">
      <section className="relative">
        <div className="absolute left-[-160px] top-[-160px] h-[420px] w-[420px] rounded-full bg-violet-200/80 blur-3xl" />
        <div className="absolute right-[-180px] top-20 h-[560px] w-[560px] rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute bottom-20 left-1/2 h-[420px] w-[420px] rounded-full bg-blue-100/80 blur-3xl" />

        <div className="relative mx-auto max-w-[1680px] px-4 py-6 md:px-6 md:py-8">
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

          {!isActive && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold leading-7 text-amber-700">
              你的陪玩師狀態目前不是 active。若公開頁或接單功能沒有正常顯示，請確認後台是否已通過審核並啟用陪玩師資料。
            </div>
          )}

          <DesktopDashboard
            player={player}
            stats={stats}
            savingOnline={savingOnline}
            savingAccepting={savingAccepting}
            onToggleOnline={() => updateOnlineStatus(!player.is_online)}
            onToggleAccepting={() =>
              updateAcceptingStatus(!player.is_accepting_orders)
            }
          />

          <MobileDashboard
            player={player}
            stats={stats}
            savingOnline={savingOnline}
            savingAccepting={savingAccepting}
            onToggleOnline={() => updateOnlineStatus(!player.is_online)}
            onToggleAccepting={() =>
              updateAcceptingStatus(!player.is_accepting_orders)
            }
          />
        </div>
      </section>
    </main>
  );
}

function DesktopDashboard({
  player,
  stats,
  savingOnline,
  savingAccepting,
  onToggleOnline,
  onToggleAccepting,
}: {
  player: Player;
  stats: DashboardStats;
  savingOnline: boolean;
  savingAccepting: boolean;
  onToggleOnline: () => void;
  onToggleAccepting: () => void;
}) {
  return (
    <section className="hidden min-h-[calc(100vh-7rem)] gap-6 lg:grid lg:grid-cols-[270px_minmax(0,1fr)_340px]">
      <aside className="overflow-hidden rounded-[2.4rem] bg-gradient-to-b from-violet-950 via-violet-900 to-indigo-950 p-5 text-white shadow-2xl shadow-violet-200/70">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <Gamepad2 className="h-7 w-7" />
          </div>

          <div>
            <p className="text-xs font-black text-white/45">WE ARE</p>
            <h1 className="text-xl font-black">STILL HERE</h1>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/10 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-[1.3rem] bg-white/10 text-white">
              {player.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={player.avatar_url}
                  alt={player.nickname}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-8 w-8" />
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-lg font-black">{player.nickname}</p>
              <StatusPill status={player.status} />
            </div>
          </div>
        </div>

        <nav className="mt-6 grid gap-2">
          <PosterMenuItem active icon={<BarChart3 />} title="首頁總覽" />
          <a href="/player-center/orders">
            <PosterMenuItem icon={<ReceiptText />} title="訂單管理" />
          </a>
          <a href="/player-center/services">
            <PosterMenuItem icon={<SlidersHorizontal />} title="服務設定" />
          </a>
          <a href="/player-center/gifts">
            <PosterMenuItem icon={<Gift />} title="收禮紀錄" />
          </a>
          <a href="/player-center/income">
            <PosterMenuItem icon={<Wallet />} title="收入統計" />
          </a>
          <a href="/player-center/profile">
            <PosterMenuItem icon={<UserRound />} title="個人資料" />
          </a>
        </nav>

        <div className="mt-6 rounded-[2rem] bg-white/10 p-4">
          <p className="text-sm font-black text-white">今日提醒</p>
          <p className="mt-2 text-xs leading-6 text-white/55">
            記得確認自己的在線狀態、接單狀態與可接服務，讓客人更快找到你。
          </p>
        </div>
      </aside>

      <main className="grid min-w-0 gap-6">
        <section className="relative overflow-hidden rounded-[2.8rem] border border-white/80 bg-[#f7f2ff] p-8 shadow-2xl shadow-violet-100/70">
          <div className="absolute right-[-120px] top-[-120px] h-[320px] w-[320px] rounded-full bg-violet-300/40 blur-3xl" />
          <div className="absolute bottom-[-140px] left-[-120px] h-[320px] w-[320px] rounded-full bg-indigo-300/30 blur-3xl" />

          <div className="relative flex items-start justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-2 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-700 text-white">
                  <Crown className="h-5 w-5" />
                </div>
                <span className="text-sm font-black text-violet-700">
                  PLAYER CENTER
                </span>
              </div>

              <h2 className="mt-6 text-5xl font-black leading-tight tracking-tight text-slate-950">
                歡迎回來，
                <span className="text-violet-700">{player.nickname}</span>
              </h2>

              <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-slate-600">
                這裡是你的陪玩師營運中心，可以管理接單狀態、可接服務、訂單、收禮與收入。
              </p>

              <div className="mt-6 flex gap-3">
                <a
                  href={`/players/${player.id}`}
                  className="rounded-2xl bg-violet-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200"
                >
                  查看公開頁
                </a>

                <a
                  href="/player-center/profile"
                  className="rounded-2xl border border-violet-200 bg-white px-5 py-3 text-sm font-black text-violet-700"
                >
                  編輯資料
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white/80 p-5 text-right shadow-xl">
              <p className="text-sm font-black text-slate-400">目前狀態</p>
              <p className="mt-2 text-2xl font-black text-violet-700">
                {player.is_accepting_orders ? "接單中" : "暫停接單"}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {player.is_online ? "目前在線" : "目前離線"}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-4 gap-4">
          <PosterMetric
            title="累積訂單"
            value={stats.orderCount.toLocaleString()}
            plus="接單數"
          />
          <PosterMetric
            title="可接服務"
            value={stats.serviceCount.toLocaleString()}
            plus="已開啟"
          />
          <PosterMetric
            title="收禮次數"
            value={stats.giftCount.toLocaleString()}
            plus="禮物"
          />
          <PosterMetric
            title="收禮金額"
            value={stats.giftAmount.toLocaleString()}
            plus="ASD"
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
          <section className="rounded-[2.2rem] border border-white/80 bg-white/85 p-6 shadow-xl shadow-violet-100/60">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-violet-600">
                  STATUS CONTROL
                </p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">
                  接單狀態控制
                </h3>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                <Headphones className="h-6 w-6" />
              </div>
            </div>

            <div className="rounded-[2rem] bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-950 p-5">
              <div className="grid gap-3">
                <StatusControlRow
                  title="在線狀態"
                  desc="客人會看到你目前是否在線。"
                  enabled={player.is_online}
                  loading={savingOnline}
                  onClick={onToggleOnline}
                />

                <StatusControlRow
                  title="接單狀態"
                  desc="開啟後，客人可以指定你下單。"
                  enabled={player.is_accepting_orders}
                  loading={savingAccepting}
                  onClick={onToggleAccepting}
                />
              </div>
            </div>
          </section>

          <section className="rounded-[2.2rem] border border-white/80 bg-white/85 p-6 shadow-xl shadow-violet-100/60">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-black text-violet-600">
                  ORDER FLOW
                </p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">
                  最近營運流程
                </h3>
              </div>

              <BarChart3 className="h-7 w-7 text-violet-700" />
            </div>

            <div className="grid gap-3">
              <PosterOrderRow
                icon={<Gamepad2 />}
                title="客人建立訂單"
                desc="從陪玩大廳或你的公開頁進入下單。"
                tag="下單"
              />
              <PosterOrderRow
                icon={<CalendarClock />}
                title="確認服務時間"
                desc="確認遊戲、時段、價格與備註。"
                tag="確認"
              />
              <PosterOrderRow
                icon={<CheckCircle2 />}
                title="完成服務結算"
                desc="服務完成後同步收入與紀錄。"
                tag="完成"
              />
            </div>
          </section>
        </section>

        <section className="rounded-[2.2rem] border border-white/80 bg-white/85 p-6 shadow-xl shadow-violet-100/60">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-black text-violet-600">DATA TREND</p>
              <h3 className="mt-1 text-2xl font-black text-slate-950">
                本週接單趨勢
              </h3>
            </div>

            <p className="rounded-full bg-violet-50 px-4 py-2 text-xs font-black text-violet-700">
              Demo Preview
            </p>
          </div>

          <div className="flex h-40 items-end gap-3 rounded-[2rem] bg-violet-50 p-5">
            {[36, 62, 44, 78, 58, 92, 70].map((height, index) => (
              <div
                key={index}
                className="flex flex-1 items-end rounded-full bg-white shadow-sm"
              >
                <div
                  className="w-full rounded-full bg-gradient-to-t from-violet-700 to-fuchsia-500"
                  style={{ height: `${height}%` }}
                />
              </div>
            ))}
          </div>
        </section>
      </main>

      <aside className="grid gap-4">
        <PosterFeatureCard
          icon={<Gamepad2 />}
          title="線上下單"
          desc="客人快速選擇陪玩師與服務項目。"
        />
        <PosterFeatureCard
          icon={<SlidersHorizontal />}
          title="服務設定"
          desc="自己管理可接遊戲、價格備註與服務內容。"
        />
        <PosterFeatureCard
          icon={<Headphones />}
          title="陪玩接單"
          desc="在線接單、即時切換接單狀態。"
        />
        <PosterFeatureCard
          icon={<Gift />}
          title="收禮打賞"
          desc="查看會員送禮、打賞金額與留言。"
        />
        <PosterFeatureCard
          icon={<Wallet />}
          title="收入統計"
          desc="訂單收入、禮物收入清楚可查。"
        />
      </aside>
    </section>
  );
}

function MobileDashboard({
  player,
  stats,
  savingOnline,
  savingAccepting,
  onToggleOnline,
  onToggleAccepting,
}: {
  player: Player;
  stats: DashboardStats;
  savingOnline: boolean;
  savingAccepting: boolean;
  onToggleOnline: () => void;
  onToggleAccepting: () => void;
}) {
  return (
    <section className="grid gap-5 lg:hidden">
      <section className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-900 via-violet-800 to-indigo-950 p-5 text-white shadow-2xl shadow-violet-200">
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-[1.6rem] bg-white/10 text-white">
            {player.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.avatar_url}
                alt={player.nickname}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-10 w-10" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-black text-white/60">PLAYER CENTER</p>
            <h1 className="mt-1 truncate text-2xl font-black">
              {player.nickname}
            </h1>
            <StatusPill status={player.status} />
          </div>
        </div>

        <p className="mt-5 text-sm leading-7 text-white/70">
          {player.intro || "尚未填寫簡介，可以到編輯個人頁補上自我介紹。"}
        </p>

        <div className="mt-5 grid gap-3">
          <StatusControlRow
            title="在線狀態"
            desc="顯示給客人看的在線狀態。"
            enabled={player.is_online}
            loading={savingOnline}
            onClick={onToggleOnline}
          />

          <StatusControlRow
            title="接單狀態"
            desc="控制是否開放客人指定下單。"
            enabled={player.is_accepting_orders}
            loading={savingAccepting}
            onClick={onToggleAccepting}
          />
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <MiniCard
          title="累積訂單"
          value={stats.orderCount.toLocaleString()}
          icon={<ReceiptText />}
        />
        <MiniCard
          title="可接服務"
          value={stats.serviceCount.toLocaleString()}
          icon={<SlidersHorizontal />}
        />
        <MiniCard
          title="收禮次數"
          value={stats.giftCount.toLocaleString()}
          icon={<Gift />}
        />
        <MiniCard
          title="收禮金額"
          value={`${stats.giftAmount.toLocaleString()} ASD`}
          icon={<Coins />}
        />
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur-xl">
        <h2 className="text-xl font-black text-slate-950">快捷入口</h2>

        <div className="mt-4 grid gap-3">
          <MobileAction
            href={`/players/${player.id}`}
            icon={<Star />}
            title="查看公開頁"
          />
          <MobileAction
            href="/player-center/profile"
            icon={<UserRound />}
            title="編輯個人頁"
          />
          <MobileAction
            href="/player-center/services"
            icon={<SlidersHorizontal />}
            title="可接服務設定"
          />
          <MobileAction
            href="/player-center/orders"
            icon={<ReceiptText />}
            title="我的接單"
          />
          <MobileAction
            href="/player-center/gifts"
            icon={<Gift />}
            title="收禮紀錄"
          />
          <MobileAction
            href="/player-center/income"
            icon={<Wallet />}
            title="收入紀錄"
          />
          <MobileAction
            href="/player-center/voice-rooms"
            icon={<Mic2 />}
            title="語音廳"
          />
        </div>
      </section>
    </section>
  );
}

function PosterMenuItem({
  icon,
  title,
  active = false,
}: {
  icon: ReactNode;
  title: string;
  active?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black ${
        active
          ? "bg-violet-600 text-white shadow-lg shadow-violet-950/30"
          : "text-white/55 transition hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span>
      {title}
    </div>
  );
}

function PosterMetric({
  title,
  value,
  plus,
}: {
  title: string;
  value: string;
  plus: string;
}) {
  return (
    <section className="rounded-[1.6rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-violet-100/70">
      <p className="text-xs font-bold text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-black text-emerald-600">{plus}</p>
    </section>
  );
}

function PosterOrderRow({
  icon,
  title,
  desc,
  tag,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  tag: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[1.4rem] bg-slate-50 p-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-950">{title}</p>
        <p className="mt-1 truncate text-xs text-slate-500">{desc}</p>
      </div>

      <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">
        {tag}
      </span>
    </div>
  );
}

function PosterFeatureCard({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <section className="flex items-center gap-4 rounded-[1.6rem] border border-white/80 bg-white/90 p-4 shadow-xl shadow-violet-100/70">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 [&_svg]:h-7 [&_svg]:w-7">
        {icon}
      </div>

      <div>
        <p className="text-xl font-black text-violet-800">{title}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
          {desc}
        </p>
      </div>
    </section>
  );
}

function StatusPill({ status }: { status: string }) {
  const label =
    status === "active"
      ? "已啟用"
      : status === "pending"
      ? "審核中"
      : status === "suspended"
      ? "已停權"
      : status;

  const style =
    status === "active"
      ? "bg-emerald-100 text-emerald-700"
      : status === "pending"
      ? "bg-amber-100 text-amber-700"
      : status === "suspended"
      ? "bg-red-100 text-red-600"
      : "bg-slate-100 text-slate-600";

  return (
    <span
      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${style}`}
    >
      {label}
    </span>
  );
}

function StatusControlRow({
  title,
  desc,
  enabled,
  loading,
  onClick,
}: {
  title: string;
  desc: string;
  enabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`flex items-center justify-between gap-4 rounded-2xl p-4 text-left transition disabled:opacity-60 ${
        enabled ? "bg-emerald-400/15" : "bg-white/10"
      }`}
    >
      <div>
        <p className="text-sm font-black text-white">{title}</p>
        <p className="mt-1 text-xs leading-5 text-white/55">{desc}</p>
      </div>

      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-black ${
          enabled
            ? "bg-emerald-100 text-emerald-700"
            : "bg-white/10 text-white/60"
        }`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : enabled ? (
          <ToggleRight className="h-4 w-4" />
        ) : (
          <ToggleLeft className="h-4 w-4" />
        )}
        {enabled ? "開啟" : "關閉"}
      </span>
    </button>
  );
}

function MiniCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <section className="rounded-[1.6rem] border border-white/70 bg-white/80 p-4 shadow-xl backdrop-blur-xl">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{title}</p>
    </section>
  );
}

function MobileAction({
  href,
  icon,
  title,
}: {
  href: string;
  icon: ReactNode;
  title: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/80 p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>
        <p className="text-sm font-black text-slate-950">{title}</p>
      </div>

      <ArrowRight className="h-4 w-4 text-violet-600" />
    </a>
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
