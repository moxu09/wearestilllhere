"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  Coins,
  Gift,
  Loader2,
  Lock,
  MessageSquareText,
  ReceiptText,
  Search,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";

type GiftOrder = {
  id: string;
  sender_user_id: string;
  receiver_player_id: string | null;
  receiver_user_id: string | null;
  gift_id: string | null;
  gift_name: string;
  gift_icon: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  platform_fee_amount: number;
  player_income_amount: number;
  message: string | null;
  status: "completed" | "cancelled" | "refunded";
  created_at: string;
};

type PlayerInfo = {
  id: string;
  nickname: string;
  avatar_url: string | null;
};

type GiftMeta = {
  id: string;
  image_url: string | null;
  broadcast_type: "none" | "banner" | "fullscreen";
};

type StatusFilter = "all" | GiftOrder["status"];

const statusLabel: Record<GiftOrder["status"], string> = {
  completed: "已完成",
  cancelled: "已取消",
  refunded: "已退款",
};

export default function MemberGiftHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [giftOrders, setGiftOrders] = useState<GiftOrder[]>([]);
  const [players, setPlayers] = useState<Record<string, PlayerInfo>>({});
  const [giftMetas, setGiftMetas] = useState<Record<string, GiftMeta>>({});
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [error, setError] = useState("");

  const filteredGiftOrders = useMemo(() => {
    return giftOrders.filter((order) => {
      const player = order.receiver_player_id
        ? players[order.receiver_player_id]
        : null;

      const text = [
        order.gift_name,
        order.message,
        player?.nickname,
        String(order.total_amount),
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

      return matchKeyword && matchStatus;
    });
  }, [giftOrders, players, keyword, statusFilter]);

  const completedOrders = giftOrders.filter(
    (order) => order.status === "completed"
  );

  const totalSpent = completedOrders.reduce(
    (sum, order) => sum + order.total_amount,
    0
  );

  const totalQuantity = completedOrders.reduce(
    (sum, order) => sum + order.quantity,
    0
  );

  const fullscreenCount = completedOrders.filter((order) => {
    const meta = order.gift_id ? giftMetas[order.gift_id] : null;
    return meta?.broadcast_type === "fullscreen";
  }).length;

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
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

    const { data: giftData, error: giftError } = await supabase
      .from("platform_gift_orders")
      .select(
        `
        id,
        sender_user_id,
        receiver_player_id,
        receiver_user_id,
        gift_id,
        gift_name,
        gift_icon,
        quantity,
        unit_price,
        total_amount,
        platform_fee_amount,
        player_income_amount,
        message,
        status,
        created_at
      `
      )
      .eq("sender_user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (giftError) {
      setError("讀取送禮紀錄失敗：" + giftError.message);
      setLoading(false);
      return;
    }

    const rows = (giftData || []) as GiftOrder[];
    setGiftOrders(rows);

    const playerIds = Array.from(
      new Set(
        rows
          .map((order) => order.receiver_player_id)
          .filter(Boolean) as string[]
      )
    );

    const giftIds = Array.from(
      new Set(rows.map((order) => order.gift_id).filter(Boolean) as string[])
    );

    if (playerIds.length > 0) {
      const { data: playerData } = await supabase
        .from("platform_players")
        .select("id, nickname, avatar_url")
        .in("id", playerIds);

      const playerMap: Record<string, PlayerInfo> = {};
      ((playerData || []) as PlayerInfo[]).forEach((player) => {
        playerMap[player.id] = player;
      });

      setPlayers(playerMap);
    } else {
      setPlayers({});
    }

    if (giftIds.length > 0) {
      const { data: giftMetaData } = await supabase
        .from("platform_gifts")
        .select("id, image_url, broadcast_type")
        .in("id", giftIds);

      const giftMap: Record<string, GiftMeta> = {};
      ((giftMetaData || []) as GiftMeta[]).forEach((gift) => {
        giftMap[gift.id] = gift;
      });

      setGiftMetas(giftMap);
    } else {
      setGiftMetas({});
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取送禮紀錄中...</span>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <AccessCard
        icon={<Lock className="h-8 w-8" />}
        title="請先登入"
        desc="登入會員後才能查看自己的送禮紀錄。"
        buttonText="前往登入"
        buttonHref="/login?next=/member/gifts"
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-950">
      <section className="relative overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-200/70 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 rounded-full bg-amber-100/70 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-10">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
                <Gift className="h-4 w-4" />
                MEMBER GIFTS
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                我的送禮紀錄
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                查看你送出的所有禮物、留言、花費 ASD，以及是否觸發高額禮物播報。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <GiftStat
                label="送禮總額"
                value={totalSpent.toLocaleString()}
                icon={<Coins />}
              />
              <GiftStat
                label="送出數量"
                value={String(totalQuantity)}
                icon={<Gift />}
              />
              <GiftStat
                label="全屏播報"
                value={String(fullscreenCount)}
                icon={<Sparkles />}
              />
            </div>
          </div>

          <section className="mb-8 rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur-xl">
            <div className="grid gap-4 lg:grid-cols-[1fr_220px_auto_auto]">
              <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-violet-300 focus-within:bg-white">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜尋禮物名稱、陪玩師、留言..."
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as StatusFilter)
                }
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-300 focus:bg-white"
              >
                <option value="all">全部狀態</option>
                <option value="completed">已完成</option>
                <option value="cancelled">已取消</option>
                <option value="refunded">已退款</option>
              </select>

              <button
                onClick={loadPage}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                重新整理
              </button>

              <a
                href="/gifts/send"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
              >
                去送禮
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </section>

          {filteredGiftOrders.length === 0 ? (
            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-10 text-center shadow-xl backdrop-blur-xl">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
                <Gift className="h-8 w-8" />
              </div>

              <h2 className="text-2xl font-black text-slate-950">
                目前沒有送禮紀錄
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
                你送出的禮物會顯示在這裡。
              </p>

              <a
                href="/gifts/send"
                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
              >
                去送禮打賞
                <ArrowRight className="h-4 w-4" />
              </a>
            </section>
          ) : (
            <div className="grid gap-6">
              {filteredGiftOrders.map((order) => (
                <GiftOrderCard
                  key={order.id}
                  order={order}
                  player={
                    order.receiver_player_id
                      ? players[order.receiver_player_id]
                      : undefined
                  }
                  giftMeta={
                    order.gift_id ? giftMetas[order.gift_id] : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function GiftOrderCard({
  order,
  player,
  giftMeta,
}: {
  order: GiftOrder;
  player?: PlayerInfo;
  giftMeta?: GiftMeta;
}) {
  const isFullscreen = giftMeta?.broadcast_type === "fullscreen";
  const isBanner = giftMeta?.broadcast_type === "banner";

  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-xl backdrop-blur-xl">
      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <div className="relative bg-gradient-to-br from-violet-100 via-fuchsia-50 to-amber-100 p-6">
          <div className="absolute left-8 top-8 h-28 w-28 rounded-full bg-violet-200/70 blur-3xl" />
          <div className="absolute bottom-10 right-8 h-28 w-28 rounded-full bg-amber-200/70 blur-3xl" />

          <div className="relative">
            <div className="mb-5 flex flex-wrap gap-2">
              <StatusPill status={order.status} />

              {isFullscreen && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 shadow-sm">
                  <Sparkles className="h-3 w-3" />
                  全屏播報
                </span>
              )}

              {isBanner && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-black text-violet-700 shadow-sm">
                  <Sparkles className="h-3 w-3" />
                  小播報
                </span>
              )}
            </div>

            <GiftImage
              imageUrl={giftMeta?.image_url || null}
              icon={order.gift_icon}
              name={order.gift_name}
            />

            <h2 className="mt-5 line-clamp-2 text-3xl font-black text-slate-950">
              {order.gift_name}
            </h2>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              x {order.quantity} ｜單價 {order.unit_price.toLocaleString()} ASD
            </p>

            <p className="mt-4 text-3xl font-black text-violet-700">
              {order.total_amount.toLocaleString()} ASD
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-6 grid gap-4 md:grid-cols-4">
            <InfoBox
              label="送給"
              value={player?.nickname || "陪玩師"}
              icon={<UserRound />}
            />
            <InfoBox
              label="禮物總額"
              value={`${order.total_amount.toLocaleString()} ASD`}
              icon={<Coins />}
            />
            <InfoBox
              label="陪玩師收入"
              value={`${order.player_income_amount.toLocaleString()} ASD`}
              icon={<Wallet />}
            />
            <InfoBox
              label="送禮時間"
              value={new Date(order.created_at).toLocaleDateString("zh-TW")}
              icon={<ReceiptText />}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <section className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-950">你的留言</h3>
              </div>

              <p className="whitespace-pre-wrap rounded-2xl bg-white p-4 text-sm leading-8 text-slate-600 shadow-sm">
                {order.message || "沒有留下留言。"}
              </p>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-950">付款明細</h3>
              </div>

              <div className="grid gap-3">
                <SummaryLine
                  label="禮物金額"
                  value={`${order.total_amount.toLocaleString()} ASD`}
                />
                <SummaryLine
                  label="平台抽成"
                  value={`${order.platform_fee_amount.toLocaleString()} ASD`}
                />
                <SummaryLine
                  label="陪玩師收入"
                  value={`${order.player_income_amount.toLocaleString()} ASD`}
                />
                <SummaryLine
                  label="建立時間"
                  value={new Date(order.created_at).toLocaleString("zh-TW")}
                />
              </div>

              {player?.id && (
                <a
                  href={`/players/${player.id}`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
                >
                  查看陪玩師
                  <ArrowRight className="h-4 w-4" />
                </a>
              )}
            </section>
          </div>
        </div>
      </div>
    </article>
  );
}

function GiftImage({
  imageUrl,
  icon,
  name,
}: {
  imageUrl: string | null;
  icon: string | null;
  name: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className="h-28 w-28 object-contain drop-shadow-xl"
      />
    );
  }

  return (
    <div className="flex h-28 w-28 items-center justify-center rounded-[1.7rem] border-4 border-white bg-white text-6xl shadow-xl">
      {icon || "🎁"}
    </div>
  );
}

function GiftStat({
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

function StatusPill({ status }: { status: GiftOrder["status"] }) {
  const style =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "refunded"
        ? "bg-red-50 text-red-600"
        : "bg-slate-100 text-slate-500";

  return (
    <div
      className={`inline-flex rounded-full px-3 py-1 text-xs font-black shadow-sm ${style}`}
    >
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
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 text-sm shadow-sm">
      <span className="shrink-0 font-semibold text-slate-500">{label}</span>
      <span className="break-all text-right font-black text-slate-900">
        {value}
      </span>
    </div>
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

        <p className="text-sm font-bold text-violet-600">MEMBER GIFTS</p>
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