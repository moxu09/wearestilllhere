"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Camera,
  Headphones,
  ImageIcon,
  Loader2,
  Lock,
  Save,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  UserRound,
} from "lucide-react";

type PlayerData = {
  id: string;
  user_id: string;
  nickname: string;
  gender: string | null;
  intro: string | null;
  avatar_url: string | null;
  voice_sample_url: string | null;
  is_online: boolean;
  is_accepting_orders: boolean;
  status: string;
};

type FormState = {
  nickname: string;
  gender: string;
  intro: string;
  voice_sample_url: string;
  is_online: boolean;
  is_accepting_orders: boolean;
};

const genderOptions = [
  { label: "不公開", value: "secret" },
  { label: "女", value: "female" },
  { label: "男", value: "male" },
  { label: "其他", value: "other" },
];

export default function PlayerProfileEditPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [player, setPlayer] = useState<PlayerData | null>(null);

  const [form, setForm] = useState<FormState>({
    nickname: "",
    gender: "secret",
    intro: "",
    voice_sample_url: "",
    is_online: false,
    is_accepting_orders: false,
  });

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const previewImage = useMemo(() => {
    return avatarPreview || player?.avatar_url || "";
  }, [avatarPreview, player]);

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);
    setError("");
    setMessage("");

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

    const { data, error } = await supabase
      .from("platform_players")
      .select(
        `
        id,
        user_id,
        nickname,
        gender,
        intro,
        avatar_url,
        voice_sample_url,
        is_online,
        is_accepting_orders,
        status
      `
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      setError("讀取陪玩師資料失敗：" + error.message);
      setLoading(false);
      return;
    }

    const playerData = data as PlayerData | null;
    setPlayer(playerData);

    if (playerData) {
      setForm({
        nickname: playerData.nickname || "",
        gender: playerData.gender || "secret",
        intro: playerData.intro || "",
        voice_sample_url: playerData.voice_sample_url || "",
        is_online: !!playerData.is_online,
        is_accepting_orders: !!playerData.is_accepting_orders,
      });
    }

    setLoading(false);
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleAvatarChange(file: File | null) {
    setError("");
    setMessage("");

    if (!file) {
      setAvatarFile(null);
      setAvatarPreview("");
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.type)) {
      setError("圖片格式只支援 PNG、JPG、WEBP、GIF。");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("圖片不能超過 5MB。");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function uploadAvatar() {
    if (!avatarFile || !userId) return player?.avatar_url || null;

    const extension = avatarFile.name.split(".").pop()?.toLowerCase() || "png";
    const filePath = `${userId}/${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("player-avatars")
      .upload(filePath, avatarFile, {
        cacheControl: "3600",
        upsert: true,
        contentType: avatarFile.type,
      });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = supabase.storage
      .from("player-avatars")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function saveProfile() {
    setError("");
    setMessage("");

    if (!player) {
      setError("找不到陪玩師資料。");
      return;
    }

    const nickname = form.nickname.trim();
    const intro = form.intro.trim();
    const voiceSampleUrl = form.voice_sample_url.trim();

    if (!nickname) {
      setError("請輸入暱稱。");
      return;
    }

    if (nickname.length > 30) {
      setError("暱稱最多 30 個字。");
      return;
    }

    if (intro.length > 500) {
      setError("簡介最多 500 個字。");
      return;
    }

    setSaving(true);

    let avatarUrl = player.avatar_url;

    try {
      avatarUrl = await uploadAvatar();
    } catch (uploadError) {
      setError(
        "上傳圖片失敗：" +
          (uploadError instanceof Error ? uploadError.message : "未知錯誤")
      );
      setSaving(false);
      return;
    }

    const { error } = await supabase
      .from("platform_players")
      .update({
        nickname,
        gender: form.gender,
        intro: intro || null,
        avatar_url: avatarUrl,
        voice_sample_url: voiceSampleUrl || null,
        is_online: form.is_online,
        is_accepting_orders: form.is_accepting_orders,
        updated_at: new Date().toISOString(),
      })
      .eq("id", player.id)
      .eq("user_id", player.user_id);

    if (error) {
      setError("儲存失敗：" + error.message);
      setSaving(false);
      return;
    }

    setMessage("個人資料已更新。");
    setAvatarFile(null);
    setAvatarPreview("");

    await loadPage();
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取個人資料中...</span>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <AccessCard
        icon={<Lock className="h-8 w-8" />}
        title="請先登入"
        desc="登入陪玩師帳號後才能編輯個人頁。"
        buttonText="前往登入"
        buttonHref="/login?next=/player-center/profile"
      />
    );
  }

  if (!player) {
    return (
      <AccessCard
        icon={<ShieldCheck className="h-8 w-8" />}
        title="你還不是陪玩師"
        desc="審核通過後，才可以編輯陪玩師公開頁資料。"
        buttonText="申請成為陪玩師"
        buttonHref="/apply-player"
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
          <a
            href="/player-center"
            className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-white hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" />
            回陪玩師中心
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

          <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
                <UserRound className="h-4 w-4" />
                PLAYER PROFILE
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                編輯個人頁
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                這裡可以修改陪玩師公開頁的照片、暱稱、性別、簡介與語音範例連結。
              </p>
            </div>

            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <BadgeCheck className="h-7 w-7" />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-500">公開頁狀態</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">
                    {player.status === "active" ? "已啟用" : player.status}
                  </p>
                </div>
              </div>

              <a
                href={`/players/${player.id}`}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
              >
                查看公開頁
                <ArrowRight className="h-4 w-4" />
              </a>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-slate-950">
                  頭像照片
                </h2>
              </div>

              <div className="rounded-[2rem] border border-slate-100 bg-slate-50/80 p-6 text-center">
                <div className="mx-auto flex h-44 w-44 items-center justify-center overflow-hidden rounded-[2rem] border-4 border-white bg-white text-violet-700 shadow-xl">
                  {previewImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewImage}
                      alt={form.nickname || "陪玩師頭像"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserRound className="h-20 w-20" />
                  )}
                </div>

                <p className="mt-5 text-sm font-semibold text-slate-500">
                  建議使用正方形圖片，大小不要超過 5MB。
                </p>

                <label className="mt-5 inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500">
                  <Camera className="h-5 w-5" />
                  選擇照片
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) =>
                      handleAvatarChange(e.target.files?.[0] || null)
                    }
                  />
                </label>

                {avatarFile && (
                  <p className="mt-3 text-xs font-semibold text-violet-600">
                    已選擇：{avatarFile.name}
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <Headphones className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-slate-950">
                  基本資料
                </h2>
              </div>

              <div className="grid gap-5">
                <label>
                  <span className="text-sm font-bold text-slate-700">
                    陪玩師暱稱
                  </span>
                  <input
                    value={form.nickname}
                    onChange={(e) => updateForm("nickname", e.target.value)}
                    placeholder="輸入你的公開暱稱"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-300"
                  />
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    性別顯示
                  </span>
                  <select
                    value={form.gender}
                    onChange={(e) => updateForm("gender", e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-300"
                  >
                    {genderOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    個人簡介
                  </span>
                  <textarea
                    value={form.intro}
                    onChange={(e) => updateForm("intro", e.target.value)}
                    rows={6}
                    maxLength={500}
                    placeholder="介紹你的個性、擅長遊戲、接單風格、可接時間..."
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-violet-300"
                  />
                  <p className="mt-2 text-right text-xs font-semibold text-slate-400">
                    {form.intro.length}/500
                  </p>
                </label>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    語音範例連結
                  </span>
                  <input
                    value={form.voice_sample_url}
                    onChange={(e) =>
                      updateForm("voice_sample_url", e.target.value)
                    }
                    placeholder="可以放雲端連結、SoundCloud、影片連結等"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-300"
                  />
                </label>

                <section className="grid gap-3 sm:grid-cols-2">
                  <StatusToggle
                    title="在線狀態"
                    desc="開啟後，客人會看到你在線。"
                    value={form.is_online}
                    onClick={() => updateForm("is_online", !form.is_online)}
                  />

                  <StatusToggle
                    title="接單狀態"
                    desc="開啟後，客人可以向你下單。"
                    value={form.is_accepting_orders}
                    onClick={() =>
                      updateForm(
                        "is_accepting_orders",
                        !form.is_accepting_orders
                      )
                    }
                  />
                </section>

                <button
                  onClick={saveProfile}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      儲存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      儲存個人資料
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatusToggle({
  title,
  desc,
  value,
  onClick,
}: {
  title: string;
  desc: string;
  value: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-3xl border p-4 text-left transition ${
        value
          ? "border-emerald-200 bg-emerald-50"
          : "border-slate-200 bg-slate-50"
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-black text-slate-900">{title}</p>
        <div
          className={`flex items-center gap-1 rounded-2xl px-3 py-1 text-xs font-black ${
            value
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          {value ? (
            <ToggleRight className="h-4 w-4" />
          ) : (
            <ToggleLeft className="h-4 w-4" />
          )}
          {value ? "開啟" : "關閉"}
        </div>
      </div>

      <p className="text-xs leading-5 text-slate-500">{desc}</p>
    </button>
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

        <p className="text-sm font-bold text-violet-600">PLAYER PROFILE</p>
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