"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Gift,
  Heart,
  Loader2,
  MessageCircle,
  Sparkles,
  Star,
  UserRound,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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

type ServiceCategoryInfo = {
  id: string;
  name: string;
  slug: string | null;
};

type ServiceInfo = {
  id: string;
  name: string;
  base_price: number | null;
  unit: string | null;
  category_id: string | null;
  platform_service_categories?: ServiceCategoryInfo | null;
};

type PlayerServiceRow = {
  id: string;
  player_id: string;
  service_id: string;
  custom_price: number | null;
  price_note: string | null;
  is_enabled: boolean;
  platform_services?: ServiceInfo | null;
};

const genderLabel: Record<string, string> = {
  female: "女陪",
  male: "男陪",
  other: "其他",
  secret: "不公開",
};

export default function PlayerProfilePage() {
  const params = useParams();
  const playerId = Array.isArray(params?.id) ? params.id[0] : params?.id;

  const [loading, setLoading] = useState(true);
  const [player, setPlayer] = useState<Player | null>(null);
  const [services, setServices] = useState<PlayerServiceRow[]>([]);
  const [error, setError] = useState("");

  const joinedDate = player?.created_at
    ? new Date(player.created_at).toLocaleDateString("zh-TW")
    : "";

  const totalServiceCount = services.length;

  const minPrice = useMemo(() => {
    const prices = services
      .map((service) => {
        return (
          service.custom_price ??
          service.platform_services?.base_price ??
          null
        );
      })
      .filter((price): price is number => typeof price === "number");

    if (prices.length === 0) return null;
    return Math.min(...prices);
  }, [services]);

  async function loadPlayer(id: string) {
    setLoading(true);
    setError("");

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
      .eq("id", id)
      .maybeSingle();

    if (playerError) {
      setError("讀取陪玩師資料失敗：" + playerError.message);
      setLoading(false);
      return;
    }

    if (!playerData) {
      setError("找不到這位陪玩師。");
      setLoading(false);
      return;
    }

    const nextPlayer = playerData as Player;
    setPlayer(nextPlayer);

    const { data: serviceData, error: serviceError } = await supabase
      .from("platform_player_services")
      .select(
        `
        id,
        player_id,
        service_id,
        custom_price,
        price_note,
        is_enabled,
        platform_services (
          id,
          name,
          base_price,
          unit,
          category_id,
          platform_service_categories (
            id,
            name,
            slug
          )
        )
      `
      )
      .eq("player_id", id)
      .eq("is_enabled", true);

    if (serviceError) {
      setError("讀取陪玩師服務失敗：" + serviceError.message);
      setLoading(false);
      return;
    }

    setServices((serviceData || []) as unknown as PlayerServiceRow[]);
    setLoading(false);
  }

  useEffect(() => {
    if (!playerId) return;
    const timer = window.setTimeout(() => void loadPlayer(playerId), 0);
    return () => window.clearTimeout(timer);
  }, [playerId]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取陪玩師資料中...</span>
        </div>
      </main>
    );
  }

  if (error || !player) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <section className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
            <UserRound className="h-8 w-8" />
          </div>

          <h1 className="text-2xl font-black text-slate-950">
            找不到陪玩師
          </h1>

          <p className="mt-3 text-sm leading-7 text-slate-500">
            {error || "這位陪玩師資料不存在，或目前沒有公開。"}
          </p>

          <Link
            href="/players"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200"
          >
            回陪玩師大廳
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    );
  }

  const gender = player.gender
    ? genderLabel[player.gender] || player.gender
    : "陪玩師";

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f3ec] text-slate-950">
      <section className="relative">
        <div className="absolute left-[-160px] top-[-160px] h-[420px] w-[420px] rounded-full bg-violet-200/80 blur-3xl" />
        <div className="absolute right-[-180px] top-20 h-[560px] w-[560px] rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute bottom-20 left-1/2 h-[420px] w-[420px] rounded-full bg-blue-100/80 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-6 md:py-10">
          <Link
            href="/players"
            className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm font-black text-slate-600 shadow-sm transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            回陪玩師大廳
          </Link>

          <section className="overflow-hidden rounded-[2.4rem] border border-white/70 bg-white/80 shadow-2xl shadow-violet-100/70 backdrop-blur-xl">
            <div className="relative h-48 overflow-hidden bg-gradient-to-br from-violet-100 via-fuchsia-50 to-blue-100 md:h-60">
              <div className="absolute left-[-80px] top-[-80px] h-64 w-64 rounded-full bg-violet-300/50 blur-3xl" />
              <div className="absolute right-[-80px] bottom-[-80px] h-72 w-72 rounded-full bg-fuchsia-300/40 blur-3xl" />

              <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-xs font-black text-violet-700 shadow-sm backdrop-blur md:left-8 md:top-8">
                <Sparkles className="h-4 w-4" />
                認證陪玩師
              </div>

              <div className="absolute right-5 top-5 md:right-8 md:top-8">
                <span
                  className={`rounded-full px-4 py-2 text-xs font-black shadow-sm ${
                    player.is_online
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {player.is_online ? "在線" : "離線"}
                </span>
              </div>
            </div>

            <div className="relative px-5 pb-6 md:px-8 md:pb-8">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-4 md:flex-row md:items-end">
                  <div className="-mt-14 flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[2rem] border-4 border-white bg-violet-50 text-violet-700 shadow-xl md:h-32 md:w-32">
                    {player.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={player.avatar_url}
                        alt={player.nickname}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-14 w-14" />
                    )}
                  </div>

                  <div className="pb-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-3xl font-black text-slate-950 md:text-5xl">
                        {player.nickname}
                      </h1>

                      <BadgeCheck className="h-7 w-7 text-violet-600" />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm font-bold text-slate-500">
                      <span>{gender}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>加入平台 {joinedDate}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                      <span>{player.total_orders || 0} 筆完成紀錄</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-50">
                    <Heart className="h-4 w-4" />
                    收藏
                  </button>

                  <a
                    href={`/orders/new?playerId=${player.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
                  >
                    立即下單
                    <ArrowRight className="h-4 w-4" />
                  </a>

                  <a
                    href={`/gifts/send?playerId=${player.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-3 text-sm font-black text-amber-700 shadow-sm transition hover:bg-amber-100"
                  >
                    <Gift className="h-4 w-4" />
                    送禮打賞
                  </a>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-violet-100/70 backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <UserRound className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-950">
                  陪玩師介紹
                </h2>
              </div>

              <p className="min-h-[120px] whitespace-pre-line text-sm leading-8 text-slate-600">
                {player.intro ||
                  "這位陪玩師還沒有填寫介紹，歡迎直接查看可接服務或下單詢問。"}
              </p>
            </section>

            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-violet-100/70 backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <Wallet className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-black text-slate-950">
                  可接服務與價格
                </h2>
              </div>

              {services.length === 0 ? (
                <div className="rounded-[1.6rem] border border-slate-100 bg-slate-50 p-6 text-center">
                  <p className="text-sm font-bold text-slate-500">
                    這位陪玩師尚未公開可接服務。
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </section>
          </section>

          <section className="mt-6 grid gap-4 md:grid-cols-3">
            <InfoCard
              icon={<Star />}
              title="完成訂單"
              value={`${player.total_orders || 0} 單`}
              desc="平台累積服務紀錄"
            />
            <InfoCard
              icon={<MessageCircle />}
              title="接單狀態"
              value={player.is_accepting_orders ? "可接單" : "暫停接單"}
              desc="以陪玩師目前設定為準"
            />
            <InfoCard
              icon={<CalendarDays />}
              title="參考起價"
              value={minPrice === null ? "另議" : `${minPrice} ASD`}
              desc={`目前公開 ${totalServiceCount} 項服務`}
            />
          </section>
        </div>
      </section>
    </main>
  );
}

function ServiceCard({ service }: { service: PlayerServiceRow }) {
  const serviceInfo = service.platform_services;
  const categoryName =
    serviceInfo?.platform_service_categories?.name || "其他服務";

  const price = service.custom_price ?? serviceInfo?.base_price ?? null;
  const unit = serviceInfo?.unit || "次";

  return (
    <section className="rounded-[1.6rem] border border-violet-100 bg-gradient-to-r from-violet-50 to-fuchsia-50 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-black text-slate-950">
            {categoryName}｜{serviceInfo?.name || "未命名服務"}
          </p>

          <p className="mt-2 text-xs font-black text-violet-600">
            {serviceInfo?.name || categoryName}
          </p>

          {service.price_note && (
            <p className="mt-4 whitespace-pre-line text-sm leading-7 text-slate-500">
              {service.price_note}
            </p>
          )}
        </div>

        <div className="shrink-0 rounded-2xl bg-white px-5 py-4 text-right shadow-sm">
          <p className="text-2xl font-black text-orange-600">
            {price === null ? "另議" : `${price} ASD`}
          </p>

          {price !== null && (
            <p className="mt-1 text-xs font-bold text-slate-400">/ {unit}</p>
          )}
        </div>
      </div>
    </section>
  );
}

function InfoCard({
  icon,
  title,
  value,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  desc: string;
}) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-violet-100/70 backdrop-blur-xl">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 [&_svg]:h-6 [&_svg]:w-6">
        {icon}
      </div>

      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{desc}</p>
    </section>
  );
}
