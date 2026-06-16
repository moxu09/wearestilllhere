"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  Coins,
  Crown,
  DoorOpen,
  Gift,
  Headphones,
  Loader2,
  Lock,
  Mic2,
  Moon,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  XCircle,
  Zap,
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
  status: "open" | "closed" | "hidden" | "banned";
  started_at: string;
  platform_players?: {
    nickname: string;
    avatar_url: string | null;
    rating_avg: number | string;
    total_orders: number;
  } | null;
};

type MemberStatus = {
  id: string;
  role: string;
  status: string;
};

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

const categoryIcon: Record<VoiceRoom["category"], ReactNode> = {
  chat: <Headphones />,
  game: <Zap />,
  singing: <Mic2 />,
  sleep: <Moon />,
  radio: <Radio />,
  other: <Sparkles />,
};

export default function VoiceRoomDetailPage() {
  const params = useParams();
  const roomId = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [room, setRoom] = useState<VoiceRoom | null>(null);
  const [member, setMember] = useState<MemberStatus | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isOwner = useMemo(() => {
    return !!room && !!currentUserId && room.owner_user_id === currentUserId;
  }, [room, currentUserId]);

  const isJoined = member?.status === "active";

  const capacityPercent = useMemo(() => {
    if (!room) return 0;
    return Math.min(
      100,
      Math.round((room.current_members / Math.max(room.max_members, 1)) * 100)
    );
  }, [room]);

  useEffect(() => {
    if (!roomId) return;
    loadRoom();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  async function loadRoom() {
    setLoading(true);
    setError("");
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setCurrentUserId(user?.id || null);

    const { data: roomData, error: roomError } = await supabase
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
          rating_avg,
          total_orders
        )
      `
      )
      .eq("id", roomId)
      .maybeSingle();

    if (roomError) {
      setError("讀取語音廳失敗：" + roomError.message);
      setLoading(false);
      return;
    }

    if (!roomData) {
      setRoom(null);
      setLoading(false);
      return;
    }

    setRoom(roomData as unknown as VoiceRoom);

    if (user) {
      const { data: memberData } = await supabase
        .from("platform_voice_room_members")
        .select("id, role, status")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .maybeSingle();

      setMember(memberData as MemberStatus | null);
    } else {
      setMember(null);
    }

    setLoading(false);
  }

  async function joinRoom() {
    if (!room) return;

    setBusy(true);
    setError("");
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("請先登入會員才能加入語音廳。");
      setBusy(false);
      return;
    }

    const { error } = await supabase.rpc("platform_join_voice_room", {
      p_room_id: room.id,
    });

    if (error) {
      setError("加入語音廳失敗：" + error.message);
      setBusy(false);
      return;
    }

    setMessage("已加入語音廳。Discord 語音頻道會在下一階段串接。");
    setBusy(false);
    await loadRoom();
  }

  async function leaveRoom() {
    if (!room) return;

    setBusy(true);
    setError("");
    setMessage("");

    const { error } = await supabase.rpc("platform_leave_voice_room", {
      p_room_id: room.id,
    });

    if (error) {
      setError("離開語音廳失敗：" + error.message);
      setBusy(false);
      return;
    }

    setMessage("你已離開語音廳。");
    setBusy(false);
    await loadRoom();
  }

  async function closeRoom() {
    if (!room) return;

    const ok = window.confirm("確定要關閉這個語音廳嗎？");
    if (!ok) return;

    setBusy(true);
    setError("");
    setMessage("");

    const { error } = await supabase.rpc("platform_close_voice_room", {
      p_room_id: room.id,
    });

    if (error) {
      setError("關閉語音廳失敗：" + error.message);
      setBusy(false);
      return;
    }

    setMessage("語音廳已關閉。");
    setBusy(false);
    await loadRoom();
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

  if (!room) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-16 text-slate-950">
        <section className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
            <Mic2 className="h-8 w-8" />
          </div>

          <p className="text-sm font-bold text-violet-600">VOICE ROOM</p>
          <h1 className="mt-2 text-3xl font-black">找不到這個語音廳</h1>
          <p className="mt-4 text-sm leading-7 text-slate-500">
            這個語音廳可能已關閉、被隱藏，或連結不存在。
          </p>

          <a
            href="/voice-rooms"
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
          >
            回語音廳大廳
            <ArrowRight className="h-5 w-5" />
          </a>
        </section>
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
          <a
            href="/voice-rooms"
            className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-white hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" />
            回語音廳大廳
          </a>

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

          <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-2xl backdrop-blur-xl">
            <div className="relative h-72 bg-gradient-to-br from-violet-100 via-fuchsia-50 to-blue-100 md:h-80">
              {room.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={room.cover_url}
                  alt={room.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <>
                  <div className="absolute left-16 top-10 h-44 w-44 rounded-full bg-violet-200/70 blur-3xl" />
                  <div className="absolute right-20 top-16 h-52 w-52 rounded-full bg-fuchsia-200/70 blur-3xl" />
                  <div className="absolute bottom-4 left-1/2 h-40 w-40 rounded-full bg-blue-100 blur-3xl" />
                </>
              )}

              <div className="absolute left-6 top-6 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-black text-violet-700 shadow-sm">
                {categoryIcon[room.category]}
                {categoryLabel[room.category]}
              </div>

              <div
                className={`absolute right-6 top-6 rounded-full px-4 py-2 text-sm font-black shadow-sm ${
                  room.status === "open"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {room.status === "open" ? "開放中" : "已關閉"}
              </div>
            </div>

            <div className="px-6 pb-8 md:px-8">
              <div className="-mt-16 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col gap-5 md:flex-row md:items-end">
                  <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-[2rem] border-4 border-white bg-white text-violet-700 shadow-2xl">
                    {room.platform_players?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={room.platform_players.avatar_url}
                        alt={room.platform_players.nickname}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Mic2 className="h-14 w-14" />
                    )}
                  </div>

                  <div className="pb-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-4xl font-black text-slate-950 md:text-5xl">
                        {room.title}
                      </h1>
                      <BadgeCheck className="h-7 w-7 text-violet-600" />
                    </div>

                    <p className="mt-2 text-sm font-semibold text-slate-500">
                      房主：
                      {room.platform_players?.nickname || "平台會員"} ｜{" "}
                      {typeLabel[room.room_type]} ｜ 開房時間{" "}
                      {new Date(room.started_at).toLocaleString("zh-TW")}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3 pb-2">
                  {isJoined ? (
                    <button
                      onClick={leaveRoom}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
                    >
                      <DoorOpen className="h-4 w-4" />
                      離開房間
                    </button>
                  ) : (
                    <button
                      onClick={joinRoom}
                      disabled={busy || room.status !== "open"}
                      className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:bg-slate-300 disabled:shadow-none"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Headphones className="h-4 w-4" />
                      )}
                      加入語音廳
                    </button>
                  )}

                  {isOwner && room.status === "open" && (
                    <button
                      onClick={closeRoom}
                      disabled={busy}
                      className="inline-flex items-center gap-2 rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-100 transition hover:bg-red-400 disabled:opacity-60"
                    >
                      <XCircle className="h-4 w-4" />
                      關閉房間
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="grid gap-6">
                  <Panel title="房間介紹" icon={<Mic2 className="h-5 w-5" />}>
                    <p className="text-sm leading-8 text-slate-600">
                      {room.description || "這個語音廳還沒有填寫介紹。"}
                    </p>
                  </Panel>

                  <Panel title="房間數據" icon={<Users className="h-5 w-5" />}>
                    <div className="grid grid-cols-3 gap-3">
                      <Metric
                        label="目前人數"
                        value={`${room.current_members}/${room.max_members}`}
                        icon={<Users />}
                      />
                      <Metric
                        label="入場價格"
                        value={
                          room.room_type === "paid"
                            ? `${room.price_per_entry} ASD`
                            : "免費"
                        }
                        icon={<Coins />}
                      />
                      <Metric
                        label="房型"
                        value={typeLabel[room.room_type]}
                        icon={<ShieldCheck />}
                      />
                    </div>

                    <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                      <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">
                        <span>房間容量</span>
                        <span>{capacityPercent}%</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400"
                          style={{ width: `${capacityPercent}%` }}
                        />
                      </div>
                    </div>
                  </Panel>

                  <Panel title="房主資訊" icon={<Crown className="h-5 w-5" />}>
                    <div className="flex items-center gap-4 rounded-3xl bg-slate-50/80 p-4">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white text-violet-700 shadow-sm">
                        {room.platform_players?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={room.platform_players.avatar_url}
                            alt={room.platform_players.nickname}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Crown className="h-7 w-7" />
                        )}
                      </div>

                      <div>
                        <p className="font-black text-slate-950">
                          {room.platform_players?.nickname || "平台會員"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          評價{" "}
                          {Number(room.platform_players?.rating_avg || 0).toFixed(1)}
                          ｜完成 {room.platform_players?.total_orders || 0} 筆訂單
                        </p>
                      </div>
                    </div>
                  </Panel>
                </div>

                <div className="grid gap-6">
                  <VoiceJoinPanel
                    room={room}
                    isJoined={isJoined}
                    busy={busy}
                    onJoin={joinRoom}
                  />

                  <Panel title="Discord 語音串接" icon={<Headphones className="h-5 w-5" />}>
                    {room.discord_channel_id ? (
                      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
                        <p className="font-black text-emerald-700">
                          Discord 語音頻道已建立
                        </p>
                        <p className="mt-2 text-sm leading-7 text-emerald-700/80">
                          Channel ID：{room.discord_channel_id}
                        </p>
                        <a
                          href="#"
                          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-400"
                        >
                          前往 Discord
                          <ArrowRight className="h-4 w-4" />
                        </a>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                        <p className="font-black text-amber-700">
                          Discord Bot 串接準備中
                        </p>
                        <p className="mt-2 text-sm leading-7 text-amber-700/80">
                          下一階段會讓語音廳建立後，自動建立 Discord 語音頻道，並把頻道 ID 寫回這裡。
                        </p>
                      </div>
                    )}
                  </Panel>

                  <Panel title="房間互動" icon={<Gift className="h-5 w-5" />}>
                    <div className="grid gap-3">
                      <ActionLine
                        title="送禮物"
                        desc="之後會接上 ASD 禮物扣款與房主收益。"
                        icon={<Gift />}
                        href={`/gifts?roomId=${room.id}`}
                      />
                      <ActionLine
                        title="查看房主陪玩服務"
                        desc="如果房主是陪玩師，可以查看他的服務與價格。"
                        icon={<Wallet />}
                        href={room.player_id ? `/players/${room.player_id}` : "/players"}
                      />
                    </div>
                  </Panel>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function VoiceJoinPanel({
  room,
  isJoined,
  busy,
  onJoin,
}: {
  room: VoiceRoom;
  isJoined: boolean;
  busy: boolean;
  onJoin: () => void;
}) {
  return (
    <section className="rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6 shadow-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
          <Zap className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-black text-slate-950">加入房間</h2>
      </div>

      <div className="grid gap-3">
        <PreviewLine label="房間狀態" value={room.status === "open" ? "開放中" : "已關閉"} />
        <PreviewLine label="房型" value={typeLabel[room.room_type]} />
        <PreviewLine
          label="入場費"
          value={room.room_type === "paid" ? `${room.price_per_entry} ASD` : "免費"}
        />
        <PreviewLine label="人數" value={`${room.current_members}/${room.max_members}`} />
      </div>

      {isJoined ? (
        <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <BadgeCheck className="mx-auto mb-3 h-8 w-8 text-emerald-600" />
          <p className="font-black text-emerald-700">你已經在房間內</p>
          <p className="mt-2 text-sm leading-7 text-emerald-700/80">
            下一步接上 Discord 後，這裡會顯示進入語音的按鈕。
          </p>
        </div>
      ) : (
        <button
          onClick={onJoin}
          disabled={busy || room.status !== "open"}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:bg-slate-300 disabled:shadow-none"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Headphones className="h-5 w-5" />}
          加入語音廳
        </button>
      )}
    </section>
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
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          {icon}
        </div>
        <h2 className="text-xl font-black text-slate-950">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4 text-center">
      <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-violet-700 shadow-sm [&_svg]:h-4 [&_svg]:w-4">
        {icon}
      </div>
      <p className="text-lg font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-400">{label}</p>
    </div>
  );
}

function PreviewLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-black text-slate-900">{value}</span>
    </div>
  );
}

function ActionLine({
  title,
  desc,
  icon,
  href,
}: {
  title: string;
  desc: string;
  icon: ReactNode;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group flex items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-4 transition hover:border-violet-200 hover:bg-violet-50"
    >
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>
        <div>
          <p className="font-black text-slate-950">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p>
        </div>
      </div>
      <ArrowRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-600" />
    </a>
  );
}