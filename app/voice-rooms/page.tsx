"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  BadgeCheck,
  Coins,
  Crown,
  Gamepad2,
  Headphones,
  Loader2,
  Mic2,
  Moon,
  Plus,
  Radio,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";

type VoiceRoom = {
  id: string;
  owner_user_id: string;
  player_id: string | null;
  title: string;
  description: string | null;
  cover_url: string | null;
  room_type: "public" | "private" | "paid";
  category: "chat" | "game" | "singing" | "sleep" | "radio" | "other";
  max_members: number;
  current_members: number;
  price_per_entry: number;
  discord_channel_id: string | null;
  status: string;
  started_at: string;
  platform_players?: {
    nickname: string;
    avatar_url: string | null;
    rating_avg: number | string;
  } | null;
};

type CategoryFilter = "all" | VoiceRoom["category"];
type RoomTypeFilter = "all" | VoiceRoom["room_type"];

const categoryOptions: {
  label: string;
  value: CategoryFilter;
  icon: ReactNode;
}[] = [
  { label: "全部", value: "all", icon: <Sparkles /> },
  { label: "聊天", value: "chat", icon: <Headphones /> },
  { label: "遊戲", value: "game", icon: <Gamepad2 /> },
  { label: "唱歌", value: "singing", icon: <Mic2 /> },
  { label: "掛睡", value: "sleep", icon: <Moon /> },
  { label: "電台", value: "radio", icon: <Radio /> },
];

const typeLabel: Record<VoiceRoom["room_type"], string> = {
  public: "免費公開",
  private: "私人房",
  paid: "付費房",
};

const categoryLabel: Record<VoiceRoom["category"], string> = {
  chat: "聊天",
  game: "遊戲",
  singing: "唱歌",
  sleep: "掛睡",
  radio: "電台",
  other: "其他",
};

export default function VoiceRoomsPage() {
  const [loading, setLoading] = useState(true);
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [roomType, setRoomType] = useState<RoomTypeFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState("");

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const text = [
        room.title,
        room.description,
        room.platform_players?.nickname,
        categoryLabel[room.category],
        typeLabel[room.room_type],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchKeyword = keyword.trim()
        ? text.includes(keyword.trim().toLowerCase())
        : true;

      const matchCategory = category === "all" ? true : room.category === category;
      const matchType = roomType === "all" ? true : room.room_type === roomType;

      return matchKeyword && matchCategory && matchType;
    });
  }, [rooms, keyword, category, roomType]);

  const totalOnline = rooms.reduce((sum, room) => sum + room.current_members, 0);
  const paidCount = rooms.filter((room) => room.room_type === "paid").length;

  useEffect(() => {
    loadRooms();
  }, []);

  async function loadRooms() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("platform_voice_rooms")
      .select(
        `
        id,
        owner_user_id,
        player_id,
        title,
        description,
        cover_url,
        room_type,
        category,
        max_members,
        current_members,
        price_per_entry,
        discord_channel_id,
        status,
        started_at,
        platform_players (
          nickname,
          avatar_url,
          rating_avg
        )
      `
      )
      .eq("status", "open")
      .order("current_members", { ascending: false })
      .order("started_at", { ascending: false });

    if (error) {
      setError("讀取語音廳失敗：" + error.message);
      setLoading(false);
      return;
    }

    setRooms((data || []) as unknown as VoiceRoom[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取語音廳中...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-950">
      <section className="relative overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-200/70 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-10">
          <div className="mb-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
                <Mic2 className="h-4 w-4" />
                VOICE ROOMS
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                語音廳大廳
                <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent">
                  自由開房互動
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                陪玩師可以自由開語音廳，會員可以進入聊天、遊戲、唱歌、掛睡或付費互動。第一版先顯示房間大廳，下一步會接 Discord Bot 自動建立語音頻道。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <LobbyStat label="開放房間" value={String(rooms.length)} icon={<Mic2 />} />
              <LobbyStat label="在線人數" value={String(totalOnline)} icon={<Users />} />
              <LobbyStat label="付費房" value={String(paidCount)} icon={<Coins />} />
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <section className="mb-8 rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur-xl">
            <div className="grid gap-4 lg:grid-cols-[1fr_200px_200px_auto]">
              <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-violet-300 focus-within:bg-white">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜尋語音廳、房主、分類..."
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
                />
              </div>

              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value as RoomTypeFilter)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none focus:border-violet-300 focus:bg-white"
              >
                <option value="all">全部房型</option>
                <option value="public">免費公開</option>
                <option value="paid">付費房</option>
                <option value="private">私人房</option>
              </select>

              <button
                onClick={loadRooms}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                重新整理
              </button>

              <button
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
              >
                <Plus className="h-4 w-4" />
                開語音廳
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {categoryOptions.map((option) => {
                const active = category === option.value;

                return (
                  <button
                    key={option.value}
                    onClick={() => setCategory(option.value)}
                    className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition [&_svg]:h-4 [&_svg]:w-4 ${
                      active
                        ? "bg-violet-600 text-white shadow-lg shadow-violet-200"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-violet-50 hover:text-violet-700"
                    }`}
                  >
                    {option.icon}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          {filteredRooms.length === 0 ? (
            <EmptyState onCreate={() => setCreateOpen(true)} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredRooms.map((room, index) => (
                <VoiceRoomCard key={room.id} room={room} index={index} />
              ))}
            </div>
          )}
        </div>
      </section>

      {createOpen && (
        <CreateVoiceRoomModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            loadRooms();
          }}
        />
      )}
    </main>
  );
}

function VoiceRoomCard({ room, index }: { room: VoiceRoom; index: number }) {
  const percent = Math.min(
    100,
    Math.round((room.current_members / Math.max(room.max_members, 1)) * 100)
  );

  return (
    <article className="group overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-violet-200 hover:bg-white">
      <div className="relative h-44 bg-gradient-to-br from-violet-100 via-fuchsia-50 to-blue-100">
        {room.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={room.cover_url} alt={room.title} className="h-full w-full object-cover" />
        ) : (
          <>
            <div className="absolute left-8 top-8 h-28 w-28 rounded-full bg-violet-200/70 blur-3xl" />
            <div className="absolute right-8 top-8 h-32 w-32 rounded-full bg-fuchsia-200/70 blur-3xl" />
            <div className="absolute bottom-4 left-1/2 h-24 w-24 rounded-full bg-blue-100 blur-3xl" />
          </>
        )}

        <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-black text-violet-700 shadow-sm">
          <Crown className="h-3.5 w-3.5 text-yellow-500" />
          ROOM {index + 1}
        </div>

        <div className="absolute right-5 top-5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700 shadow-sm">
          開放中
        </div>

        <div className="absolute bottom-[-30px] left-6 flex h-18 w-18 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-white text-violet-700 shadow-xl">
          {room.platform_players?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={room.platform_players.avatar_url}
              alt={room.platform_players.nickname}
              className="h-full w-full object-cover"
            />
          ) : (
            <Mic2 className="h-8 w-8" />
          )}
        </div>
      </div>

      <div className="px-6 pb-6 pt-11">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black text-violet-700">
              {categoryLabel[room.category]}｜{typeLabel[room.room_type]}
            </p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{room.title}</h2>
          </div>

          <div className="rounded-2xl bg-violet-50 px-3 py-2 text-right">
            <p className="text-sm font-black text-violet-700">
              {room.current_members}/{room.max_members}
            </p>
            <p className="text-[11px] font-semibold text-slate-400">人數</p>
          </div>
        </div>

        <p className="mt-4 line-clamp-2 min-h-[56px] text-sm leading-7 text-slate-500">
          {room.description || "這個語音廳還沒有填寫介紹。"}
        </p>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>房間容量</span>
            <span>{percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <MiniRoomMetric
            label="房主"
            value={room.platform_players?.nickname || "會員"}
            icon={<BadgeCheck />}
          />
          <MiniRoomMetric
            label="入場"
            value={room.room_type === "paid" ? `${room.price_per_entry} ASD` : "免費"}
            icon={<Coins />}
          />
        </div>

        <a
          href={`/voice-rooms/${room.id}`}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
        >
          進入語音廳
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </article>
  );
}

function CreateVoiceRoomModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [roomType, setRoomType] = useState<VoiceRoom["room_type"]>("public");
  const [category, setCategory] = useState<VoiceRoom["category"]>("chat");
  const [maxMembers, setMaxMembers] = useState(10);
  const [price, setPrice] = useState(0);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function createRoom() {
    setError("");

    if (!title.trim()) {
      setError("請輸入語音廳名稱。");
      return;
    }

    setCreating(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("請先登入會員。");
      setCreating(false);
      return;
    }

    const { error } = await supabase.rpc("platform_create_voice_room", {
      p_title: title.trim(),
      p_description: description.trim() || null,
      p_room_type: roomType,
      p_category: category,
      p_max_members: maxMembers,
      p_price_per_entry: roomType === "paid" ? price : 0,
    });

    if (error) {
      setError("建立語音廳失敗：" + error.message);
      setCreating(false);
      return;
    }

    setCreating(false);
    onCreated();
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm">
      <section className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-[2rem] border border-white bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-violet-700">CREATE ROOM</p>
            <h2 className="mt-1 text-3xl font-black text-slate-950">開新的語音廳</h2>
            <p className="mt-2 text-sm leading-7 text-slate-500">
              第一版會先建立平台語音廳資料，下一步再接 Discord 自動開語音頻道。
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">語音廳名稱</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：深夜陪聊小房間"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold text-slate-700">介紹</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="簡單介紹這個房間在做什麼..."
              rows={4}
              className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 outline-none transition focus:border-violet-300 focus:bg-white"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">房間類型</span>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value as VoiceRoom["room_type"])}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-300 focus:bg-white"
              >
                <option value="public">免費公開</option>
                <option value="paid">付費房</option>
                <option value="private">私人房</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">分類</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VoiceRoom["category"])}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-300 focus:bg-white"
              >
                <option value="chat">聊天</option>
                <option value="game">遊戲</option>
                <option value="singing">唱歌</option>
                <option value="sleep">掛睡</option>
                <option value="radio">電台</option>
                <option value="other">其他</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">人數上限</span>
              <input
                value={maxMembers}
                min={1}
                max={99}
                type="number"
                onChange={(e) => setMaxMembers(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-300 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-bold text-slate-700">入場價格 ASD</span>
              <input
                value={price}
                min={0}
                type="number"
                disabled={roomType !== "paid"}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-violet-300 focus:bg-white disabled:opacity-50"
              />
            </label>
          </div>

          <button
            onClick={createRoom}
            disabled={creating}
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:opacity-60"
          >
            {creating ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                建立中...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5" />
                建立語音廳
              </>
            )}
          </button>
        </div>
      </section>
    </div>
  );
}

function LobbyStat({
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

function MiniRoomMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-center">
      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm [&_svg]:h-3.5 [&_svg]:w-3.5">
        {icon}
      </div>
      <p className="text-sm font-black text-slate-950">{value}</p>
      <p className="mt-1 text-[11px] font-semibold text-slate-400">{label}</p>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-10 text-center shadow-xl backdrop-blur-xl">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
        <Mic2 className="h-8 w-8" />
      </div>

      <h2 className="text-2xl font-black text-slate-950">目前沒有開放中的語音廳</h2>

      <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
        你可以先建立一個語音廳。之後會接上 Discord Bot，建立後自動開 Discord 語音頻道。
      </p>

      <button
        onClick={onCreate}
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
      >
        <Plus className="h-4 w-4" />
        開語音廳
      </button>
    </section>
  );
}
