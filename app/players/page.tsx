"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  BadgeCheck,
  Crown,
  Gamepad2,
  Gift,
  Headphones,
  Loader2,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Zap,
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

type PlayerWithServices = Player & {
  services: PlayerServiceRow[];
};

const genderLabel: Record<string, string> = {
  female: "女陪",
  male: "男陪",
  other: "其他",
  secret: "不公開",
};

export default function PlayersPage() {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<PlayerWithServices[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [error, setError] = useState("");

  const onlineCount = useMemo(
    () => players.filter((player) => player.is_online).length,
    [players]
  );

  const acceptingCount = useMemo(
    () => players.filter((player) => player.is_accepting_orders).length,
    [players]
  );

  const categories = useMemo(() => {
    const names = new Set<string>();

    players.forEach((player) => {
      player.services.forEach((service) => {
        const categoryName =
          service.platform_services?.platform_service_categories?.name || "其他";
        names.add(categoryName);
      });
    });

    return ["全部", ...Array.from(names)];
  }, [players]);

  const filteredPlayers = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    return players.filter((player) => {
      const serviceText = player.services
        .map((service) => {
          const serviceName = service.platform_services?.name || "";
          const categoryName =
            service.platform_services?.platform_service_categories?.name || "";
          const note = service.price_note || "";

          return `${serviceName} ${categoryName} ${note}`;
        })
        .join(" ")
        .toLowerCase();

      const playerText = [
        player.nickname,
        player.intro,
        player.gender,
        player.is_online ? "在線" : "離線",
        player.is_accepting_orders ? "可接單" : "暫停接單",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchKeyword =
        !keyword ||
        playerText.includes(keyword) ||
        serviceText.includes(keyword);

      const matchCategory =
        selectedCategory === "全部" ||
        player.services.some(
          (service) =>
            service.platform_services?.platform_service_categories?.name ===
            selectedCategory
        );

      return matchKeyword && matchCategory;
    });
  }, [players, searchText, selectedCategory]);

  useEffect(() => {
    loadPlayers();
  }, []);

  async function loadPlayers() {
    setLoading(true);
    setError("");

    const { data: playersData, error: playersError } = await supabase
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
      .eq("status", "active")
      .order("is_online", { ascending: false })
      .order("is_accepting_orders", { ascending: false })
      .order("created_at", { ascending: false });

    if (playersError) {
      setError("讀取陪玩師資料失敗：" + playersError.message);
      setLoading(false);
      return;
    }

    const playerRows = (playersData || []) as Player[];

    if (playerRows.length === 0) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    const playerIds = playerRows.map((player) => player.id);

    const { data: servicesData, error: servicesError } = await supabase
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
      .in("player_id", playerIds)
      .eq("is_enabled", true);

    if (servicesError) {
      setError("讀取陪玩師服務失敗：" + servicesError.message);
      setLoading(false);
      return;
    }

    const serviceRows = (servicesData || []) as unknown as PlayerServiceRow[];

    const nextPlayers = playerRows.map((player) => ({
      ...player,
      services: serviceRows.filter((service) => service.player_id === player.id),
    }));

    setPlayers(nextPlayers);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取陪玩大廳中...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f3ec] text-slate-950">
      <section className="relative">
        <div className="absolute left-[-160px] top-[-160px] h-[420px] w-[420px] rounded-full bg-violet-200/80 blur-3xl" />
        <div className="absolute right-[-180px] top-20 h-[560px] w-[560px] rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute bottom-20 left-1/2 h-[420px] w-[420px] rounded-full bg-blue-100/80 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-6 md:py-10">
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <HeroSection
            totalPlayers={players.length}
            onlineCount={onlineCount}
            acceptingCount={acceptingCount}
          />

          <section className="mt-6 grid gap-3 md:mt-10 md:grid-cols-3 md:gap-4">
            <FeatureBadge
              icon={<Zap />}
              title="快速下單"
              desc="找到喜歡的陪玩師，直接進入訂單流程。"
            />
            <FeatureBadge
              icon={<ShieldCheck />}
              title="在線狀態"
              desc="公開顯示在線與接單狀態，選人更清楚。"
            />
            <FeatureBadge
              icon={<Sparkles />}
              title="服務分類"
              desc="特戰、Apex、Steam、聊天陪伴都能篩選。"
            />
          </section>

          <section
            id="players-list"
            className="mt-8 rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-2xl shadow-violet-100/70 backdrop-blur-xl md:mt-12 md:rounded-[2.4rem] md:p-7"
          >
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-xs font-black text-violet-700 md:text-sm">
                  <Crown className="h-4 w-4" />
                  推薦陪玩
                </div>

                <h2 className="mt-3 text-2xl font-black text-slate-950 md:text-4xl">
                  今天想找誰一起玩？
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  可以搜尋陪玩師、遊戲、服務類型或價格備註。
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 lg:max-w-xl">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="搜尋陪玩師、遊戲、服務..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-12 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-300"
                  />
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${
                        selectedCategory === category
                          ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                          : "bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700"
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {filteredPlayers.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredPlayers.map((player) => (
                  <PlayerCard key={player.id} player={player} />
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

function HeroSection({
  totalPlayers,
  onlineCount,
  acceptingCount,
}: {
  totalPlayers: number;
  onlineCount: number;
  acceptingCount: number;
}) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur-xl md:rounded-[2.5rem] md:p-8 lg:p-10">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-black text-violet-700 shadow-sm">
            <Gamepad2 className="h-4 w-4" />
            深夜不關燈｜陪玩大廳
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
            找到你的
            <span className="bg-gradient-to-r from-violet-700 via-fuchsia-600 to-indigo-700 bg-clip-text text-transparent">
              遊戲搭子
            </span>
            ，深夜也有人陪
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
            查看陪玩師的在線狀態、可接服務、價格備註與個人介紹，快速下單或送禮打賞。
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#players-list"
              className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
            >
              立即找陪玩
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="/gifts/send"
              className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-white px-6 py-3 text-sm font-black text-violet-700 shadow-sm transition hover:bg-violet-50"
            >
              <Gift className="h-4 w-4" />
              送禮打賞
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          <HeroStat
            title="陪玩師"
            value={totalPlayers.toLocaleString()}
            icon={<UserRound />}
          />
          <HeroStat
            title="在線陪玩"
            value={onlineCount.toLocaleString()}
            icon={<Headphones />}
          />
          <HeroStat
            title="可接單"
            value={acceptingCount.toLocaleString()}
            icon={<BadgeCheck />}
          />
        </div>
      </div>
    </section>
  );
}

function PlayerCard({ player }: { player: PlayerWithServices }) {
  const firstService = player.services[0];
  const displayPrice =
    firstService?.custom_price ??
    firstService?.platform_services?.base_price ??
    null;

  const displayUnit = firstService?.platform_services?.unit || "次";

  const serviceNames = player.services
    .slice(0, 3)
    .map((service) => service.platform_services?.name)
    .filter(Boolean) as string[];

  const gender = player.gender
    ? genderLabel[player.gender] || player.gender
    : "陪玩師";

  return (
    <section className="group overflow-hidden rounded-[2rem] border border-slate-100 bg-white shadow-xl shadow-violet-100/70 transition hover:-translate-y-1 hover:shadow-2xl">
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-violet-100 via-fuchsia-50 to-indigo-100 md:h-48">
        <div className="absolute left-[-40px] top-[-40px] h-32 w-32 rounded-full bg-violet-300/60 blur-2xl" />
        <div className="absolute right-[-40px] bottom-[-40px] h-32 w-32 rounded-full bg-fuchsia-300/60 blur-2xl" />

        <div className="absolute left-4 top-4 z-10 flex gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-black shadow-sm ${
              player.is_online
                ? "bg-emerald-100 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {player.is_online ? "在線" : "離線"}
          </span>

          <span
            className={`rounded-full px-3 py-1 text-xs font-black shadow-sm ${
              player.is_accepting_orders
                ? "bg-violet-100 text-violet-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {player.is_accepting_orders ? "可接單" : "暫停接單"}
          </span>
        </div>

        <div className="absolute right-4 top-4 z-10 rounded-full bg-white/85 px-3 py-1 text-xs font-black text-amber-600 shadow-sm backdrop-blur">
          <Star className="mr-1 inline h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {player.total_orders || 0} 單
        </div>

        <div className="absolute inset-x-0 bottom-0 flex justify-center">
          <div className="flex h-28 w-28 translate-y-8 items-center justify-center overflow-hidden rounded-[2rem] border-4 border-white bg-white text-violet-700 shadow-2xl md:h-32 md:w-32">
            {player.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={player.avatar_url}
                alt={player.nickname}
                className="h-full w-full object-cover"
              />
            ) : (
              <UserRound className="h-14 w-14 md:h-16 md:w-16" />
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pb-5 pt-11 text-center md:px-5 md:pt-12">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-xl font-black text-slate-950 md:text-2xl">
            {player.nickname}
          </h3>

          <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-black text-violet-700">
            {gender}
          </span>
        </div>

        <p className="mx-auto mt-3 line-clamp-2 min-h-[3.5rem] max-w-sm text-sm leading-7 text-slate-500">
          {player.intro || "這位陪玩師還沒有填寫簡介，歡迎查看公開頁了解更多。"}
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {serviceNames.length > 0 ? (
            serviceNames.map((serviceName) => (
              <span
                key={serviceName}
                className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600"
              >
                {serviceName}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
              尚未設定服務
            </span>
          )}
        </div>

        <div className="mt-5 rounded-3xl bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4">
          <p className="text-xs font-bold text-slate-500">參考價格</p>

          <p className="mt-1 text-2xl font-black text-violet-700">
            {displayPrice === null
              ? "另議"
              : `${displayPrice.toLocaleString()} ASD`}
            {displayPrice !== null && (
              <span className="ml-1 text-xs font-bold text-slate-500">
                / {displayUnit}
              </span>
            )}
          </p>

          {firstService?.price_note && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
              {firstService.price_note}
            </p>
          )}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <a
            href={`/players/${player.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
          >
            查看資料
            <ArrowRight className="h-4 w-4" />
          </a>

          <a
            href={`/gifts/send?playerId=${player.id}`}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-black text-amber-700 transition hover:bg-amber-100"
          >
            <Gift className="h-4 w-4" />
            送禮
          </a>
        </div>

        <a
          href={`/orders/new?playerId=${player.id}`}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-white px-4 py-3 text-sm font-black text-violet-700 transition hover:bg-violet-50"
        >
          <MessageCircle className="h-4 w-4" />
          立即下單
        </a>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="rounded-[2rem] border border-slate-100 bg-slate-50/80 p-8 text-center md:p-10">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
        <Search className="h-8 w-8" />
      </div>

      <h3 className="text-2xl font-black text-slate-950">
        找不到符合條件的陪玩師
      </h3>
      <p className="mt-3 text-sm leading-7 text-slate-500">
        可以換個關鍵字，或改選其他服務分類看看。
      </p>
    </section>
  );
}

function HeroStat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-white/70 bg-white p-5 shadow-lg">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-slate-500">{title}</p>
    </section>
  );
}

function FeatureBadge({
  icon,
  title,
  desc,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <section className="rounded-[1.8rem] border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur-xl md:rounded-[2rem]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 [&_svg]:h-6 [&_svg]:w-6">
        {icon}
      </div>

      <p className="text-lg font-black text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
    </section>
  );
}