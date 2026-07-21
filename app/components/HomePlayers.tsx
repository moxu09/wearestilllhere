"use client";

import Image from "next/image";
import { ExternalLink, Gamepad2, Sparkles, Trophy } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PublicPlayer = {
  app_key: "deepnight" | "qiunai";
  discord_id: string;
  display_name: string | null;
  avatar_url: string | null;
  intro: string | null;
  invite_url: string | null;
  games: string[] | null;
  is_online: boolean;
  can_take_order: boolean;
  is_featured: boolean;
};

export default function HomePlayers() {
  const [players, setPlayers] = useState<PublicPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("全部");
  const [visibleCount, setVisibleCount] = useState(12);

  useEffect(() => {
    fetch("/api/public-players", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) =>
        setPlayers(Array.isArray(result.players) ? result.players : []),
      )
      .catch(() => setPlayers([]))
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => [
      "全部",
      ...Array.from(
        new Set(players.flatMap((player) => player.games || []).filter(Boolean)),
      ).sort((a, b) => a.localeCompare(b, "zh-Hant")),
    ],
    [players],
  );
  const visiblePlayers = useMemo(
    () =>
      players.filter(
        (player) =>
          category === "全部" || (player.games || []).includes(category),
      ),
    [category, players],
  );

  return (
    <section
      id="players"
      className="site-section border-y border-white/10 bg-[#15171a] px-5 py-20 sm:px-8 lg:px-12 lg:py-28"
    >
      <div className="mx-auto max-w-7xl">
        <div data-reveal className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase text-[#5bd6d0]">
              <Sparkles className="h-4 w-4" /> Meet the players
            </p>
            <h2 className="home-title-font mt-4 text-4xl leading-tight sm:text-6xl">
              陪陪介紹
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-white/55 lg:justify-self-end">
            從遊戲分類找到今晚最對頻的陪伴。金榜陪陪會優先推薦，點擊預約即可前往專屬邀請入口。
          </p>
        </div>

        <div className="mt-10 flex gap-2 overflow-x-auto pb-2" aria-label="遊戲分類">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setCategory(item);
                setVisibleCount(12);
              }}
              className={
                category === item
                  ? "shrink-0 rounded-full bg-[#e7ba67] px-4 py-2 text-xs font-semibold text-[#111214]"
                  : "shrink-0 rounded-full border border-white/15 px-4 py-2 text-xs font-semibold text-white/60 transition hover:border-white/40 hover:text-white"
              }
            >
              {item}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-lg border border-white/10 bg-white/5"
              />
            ))}
          </div>
        ) : visiblePlayers.length ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePlayers.slice(0, visibleCount).map((player) => (
              <article
                key={`${player.app_key}-${player.discord_id}`}
                data-reveal="scale"
                className="interactive-card group overflow-hidden rounded-lg border border-white/10 bg-[#0d0e10]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#22262a]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gamepad2 className="h-12 w-12 text-white/20" />
                  </div>
                  {player.avatar_url ? (
                    <Image
                      src={player.avatar_url}
                      alt={player.display_name || "陪陪頭像"}
                      fill
                      sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 33vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                      unoptimized
                    />
                  ) : (
                    <div className="h-full" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
                  <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xl font-semibold">
                        {player.display_name || "未命名陪陪"}
                      </p>
                      <p className="mt-1 text-xs text-white/55">
                        {player.app_key === "deepnight" ? "深夜不關燈" : "秋奈電競"}
                      </p>
                    </div>
                    <span
                      className={
                        player.is_online && player.can_take_order
                          ? "rounded-full bg-emerald-400 px-2.5 py-1 text-[11px] font-semibold text-emerald-950"
                          : "rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold text-white/65 backdrop-blur"
                      }
                    >
                      {player.is_online && player.can_take_order ? "可接單" : "休息中"}
                    </span>
                  </div>
                  {player.is_featured ? (
                    <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-[#e7ba67] px-3 py-1.5 text-[11px] font-semibold text-[#111214]">
                      <Trophy className="h-3.5 w-3.5" /> 本月金榜
                    </span>
                  ) : null}
                </div>

                <div className="p-5">
                  <p className="min-h-14 text-sm leading-7 text-white/55">
                    {player.intro || "今晚在線，期待和你一起留下好玩的回憶。"}
                  </p>
                  <div className="mt-4 flex min-h-7 flex-wrap gap-1.5">
                    {(player.games || []).slice(0, 4).map((game) => (
                      <span
                        key={game}
                        className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/50"
                      >
                        {game}
                      </span>
                    ))}
                  </div>
                  {player.invite_url ? (
                    <a
                      href={player.invite_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#e7ba67] text-sm font-semibold text-[#111214] transition hover:bg-[#f2cf8b]"
                    >
                      點我預約 <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : (
                    <span className="mt-5 inline-flex h-11 w-full items-center justify-center rounded-md border border-white/10 text-sm font-semibold text-white/35">
                      預約連結準備中
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-lg border border-dashed border-white/15 px-6 py-16 text-center">
            <Gamepad2 className="mx-auto h-8 w-8 text-white/25" />
            <p className="mt-4 text-sm font-semibold text-white/65">
              {category === "全部"
                ? "陪陪資料整理中"
                : "這個分類目前沒有公開陪陪"}
            </p>
          </div>
        )}
        {visiblePlayers.length > visibleCount ? (
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + 12)}
              className="rounded-md border border-white/20 px-6 py-3 text-sm font-semibold text-white/70 transition hover:border-white/45 hover:text-white"
            >
              顯示更多陪陪
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
