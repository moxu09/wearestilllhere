"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Sparkles,
  Gamepad2,
  Mic2,
  Clock,
  UserRound,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";

const GAME_OPTIONS = [
  "特戰英豪",
  "Apex",
  "英雄聯盟",
  "三角洲行動",
  "Steam 遊戲",
  "其他遊戲",
];

const SERVICE_OPTIONS = [
  "娛樂陪玩",
  "技術陪玩",
  "大神陪玩",
  "聊天陪伴",
  "唱歌陪伴",
  "掛睡陪伴",
  "出氣包",
  "語音廳主持",
];

const GENDER_OPTIONS = ["女生", "男生", "不公開", "其他"];

const AGE_RANGE_OPTIONS = ["18 以下", "18-20", "21-25", "26-30", "30 以上", "不公開"];

type ApplicationStatus = "pending" | "approved" | "rejected" | "cancelled";

type ExistingApplication = {
  id: string;
  status: ApplicationStatus;
  nickname: string;
  review_note: string | null;
  created_at: string;
};

export default function ApplyPlayerPage() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [existingApplication, setExistingApplication] =
    useState<ExistingApplication | null>(null);

  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("不公開");
  const [ageRange, setAgeRange] = useState("不公開");
  const [discordId, setDiscordId] = useState("");
  const [intro, setIntro] = useState("");
  const [availableTime, setAvailableTime] = useState("");
  const [experience, setExperience] = useState("");
  const [paymentInfo, setPaymentInfo] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [voiceSampleUrl, setVoiceSampleUrl] = useState("");

  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return !submitting;
  }, [submitting]);

  useEffect(() => {
    async function init() {
      setLoading(true);
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        setError("讀取登入狀態失敗，請重新登入。");
        setLoading(false);
        return;
      }

      if (!user) {
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);

      const { data, error: appError } = await supabase
        .from("platform_player_applications")
        .select("id,status,nickname,review_note,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (appError) {
        setError("讀取申請紀錄失敗：" + appError.message);
      } else {
        setExistingApplication(data);
      }

      setLoading(false);
    }

    init();
  }, []);

  async function loginWithDiscord() {
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setError("Discord 登入失敗：" + error.message);
    }
  }

  function toggleArrayValue(value: string, list: string[], setList: (next: string[]) => void) {
    if (list.includes(value)) {
      setList(list.filter((item) => item !== value));
    } else {
      setList([...list, value]);
    }
  }

  async function submitApplication() {
    setError("");
    setMessage("");

    if (!userId) {
      setError("請先登入後再申請成為陪玩師。");
      return;
    }

    const missingFields: string[] = [];

    if (!nickname.trim()) missingFields.push("陪玩師暱稱");
    if (intro.trim().length < 10) missingFields.push("自我介紹至少 10 字"); 
    if (selectedGames.length < 1) missingFields.push("至少選 1 個擅長遊戲");
    if (selectedServices.length < 1) missingFields.push("至少選 1 個可接服務");
    if (!availableTime.trim()) missingFields.push("可接時間");

    if (missingFields.length > 0) {
      setError("請補齊以下欄位：" + missingFields.join("、"));
      return;
    }

    setSubmitting(true);

    const { data: pendingApp } = await supabase
      .from("platform_player_applications")
      .select("id,status")
      .eq("user_id", userId)
      .in("status", ["pending", "approved"])
      .limit(1)
      .maybeSingle();

    if (pendingApp) {
      setSubmitting(false);
      setError(
        pendingApp.status === "pending"
          ? "你已經有一筆審核中的申請，請等待管理員審核。"
          : "你已經是審核通過的陪玩師。"
      );
      return;
    }

    const { error: insertError } = await supabase
      .from("platform_player_applications")
      .insert({
        user_id: userId,
        nickname: nickname.trim(),
        gender,
        age_range: ageRange,
        discord_id: discordId.trim(),
        intro: intro.trim(),
        avatar_url: avatarUrl.trim() || null,
        voice_sample_url: voiceSampleUrl.trim() || null,
        games: selectedGames,
        service_types: selectedServices,
        available_time: availableTime.trim(),
        experience: experience.trim() || null,
        payment_info: paymentInfo.trim() || null,
        status: "pending",
      });

    setSubmitting(false);

    if (insertError) {
      setError("送出申請失敗：" + insertError.message);
      return;
    }

    setMessage("申請已送出，請等待管理員審核。");

    setExistingApplication({
      id: "new",
      status: "pending",
      nickname: nickname.trim(),
      review_note: null,
      created_at: new Date().toISOString(),
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0b1020] px-4 py-10 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-300" />
          <span className="text-sm text-slate-300">讀取中...</span>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-[#0b1020] px-4 py-10 text-white">
        <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-200">
            <UserRound className="h-7 w-7" />
          </div>

          <p className="text-sm text-violet-200">深夜不關燈陪玩平台</p>
          <h1 className="mt-2 text-3xl font-bold">申請成為陪玩師</h1>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            請先使用 Discord 登入，登入後就可以填寫陪玩師入駐申請。
          </p>

          {error && (
            <div className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-left text-sm text-red-200">
              {error}
            </div>
          )}

          <button
            onClick={loginWithDiscord}
            className="mt-7 w-full rounded-2xl bg-violet-500 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400"
          >
            使用 Discord 登入
          </button>
        </section>
      </main>
    );
  }

  if (existingApplication?.status === "pending") {
    return (
      <main className="min-h-screen bg-[#0b1020] px-4 py-10 text-white">
        <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/20 text-yellow-200">
            <Clock className="h-7 w-7" />
          </div>

          <p className="text-sm text-violet-200">陪玩師申請</p>
          <h1 className="mt-2 text-3xl font-bold">審核中</h1>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            你的陪玩師申請已送出，目前正在等待管理員審核。
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4 text-left text-sm text-slate-300">
            <p>
              <span className="text-slate-400">申請暱稱：</span>
              {existingApplication.nickname}
            </p>
            <p className="mt-2">
              <span className="text-slate-400">狀態：</span>
              審核中
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (existingApplication?.status === "approved") {
    return (
      <main className="min-h-screen bg-[#0b1020] px-4 py-10 text-white">
        <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center shadow-2xl">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200">
            <CheckCircle2 className="h-7 w-7" />
          </div>

          <p className="text-sm text-violet-200">陪玩師申請</p>
          <h1 className="mt-2 text-3xl font-bold">你已經是陪玩師</h1>

          <p className="mt-4 text-sm leading-7 text-slate-300">
            你的申請已通過，下一步可以進入陪玩師中心設定服務與接單狀態。
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0b1020] px-4 py-10 text-white">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/[0.06] p-8 shadow-2xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm text-violet-200">
                <Sparkles className="h-4 w-4" />
                深夜不關燈陪玩平台
              </p>
              <h1 className="mt-3 text-3xl font-bold md:text-4xl">
                申請成為陪玩師
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
                填寫你的基本資料、可接服務與可接時間。送出後會進入管理員審核，
                通過後就能出現在平台上並開始接單。
              </p>
            </div>

            <div className="rounded-2xl border border-violet-300/20 bg-violet-500/10 p-4 text-sm text-violet-100">
              <p className="font-semibold">目前階段</p>
              <p className="mt-1 text-violet-200/80">陪玩師入駐申請</p>
            </div>
          </div>
        </div>

        {existingApplication?.status === "rejected" && (
          <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-sm text-red-100">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div>
                <p className="font-semibold">上一筆申請未通過</p>
                <p className="mt-1 leading-6">
                  {existingApplication.review_note || "管理員未填寫原因。"}
                </p>
                <p className="mt-2 text-red-100/70">你可以修改資料後重新送出申請。</p>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-500/10 p-5 text-sm text-red-100">
            {error}
          </div>
        )}

        <div className="grid gap-6">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div className="mb-5 flex items-center gap-2">
              <UserRound className="h-5 w-5 text-violet-200" />
              <h2 className="text-xl font-bold">基本資料</h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-sm text-slate-300">陪玩師暱稱 *</span>
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="例如：小夜"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-violet-300"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">Discord ID / 聯絡方式</span>
                <input
                  value={discordId}
                  onChange={(e) => setDiscordId(e.target.value)}
                  placeholder="例如：Discord ID、IG、Email 或其他可聯絡方式"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-violet-300"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">性別</span>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none transition focus:border-violet-300"
                >
                  {GENDER_OPTIONS.map((item) => (
                    <option key={item} value={item} className="bg-slate-950">
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">年齡區間</span>
                <select
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none transition focus:border-violet-300"
                >
                  {AGE_RANGE_OPTIONS.map((item) => (
                    <option key={item} value={item} className="bg-slate-950">
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm text-slate-300">頭像圖片網址</span>
                <input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="可以先放圖片網址，之後我們再做上傳圖片功能"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-violet-300"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm text-slate-300">聲音試聽網址</span>
                <input
                  value={voiceSampleUrl}
                  onChange={(e) => setVoiceSampleUrl(e.target.value)}
                  placeholder="可以先放雲端連結，之後我們再做音檔上傳"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-violet-300"
                />
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div className="mb-5 flex items-center gap-2">
              <Gamepad2 className="h-5 w-5 text-violet-200" />
              <h2 className="text-xl font-bold">可接項目</h2>
            </div>

            <div>
              <p className="mb-3 text-sm text-slate-300">擅長遊戲 *</p>
              <div className="flex flex-wrap gap-3">
                {GAME_OPTIONS.map((game) => {
                  const active = selectedGames.includes(game);

                  return (
                    <button
                      key={game}
                      type="button"
                      onClick={() =>
                        toggleArrayValue(game, selectedGames, setSelectedGames)
                      }
                      className={`rounded-2xl border px-4 py-2 text-sm transition ${
                        active
                          ? "border-violet-300 bg-violet-500/25 text-violet-100"
                          : "border-white/10 bg-black/20 text-slate-300 hover:border-violet-300/50"
                      }`}
                    >
                      {game}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6">
              <p className="mb-3 text-sm text-slate-300">可接服務 *</p>
              <div className="flex flex-wrap gap-3">
                {SERVICE_OPTIONS.map((service) => {
                  const active = selectedServices.includes(service);

                  return (
                    <button
                      key={service}
                      type="button"
                      onClick={() =>
                        toggleArrayValue(service, selectedServices, setSelectedServices)
                      }
                      className={`rounded-2xl border px-4 py-2 text-sm transition ${
                        active
                          ? "border-violet-300 bg-violet-500/25 text-violet-100"
                          : "border-white/10 bg-black/20 text-slate-300 hover:border-violet-300/50"
                      }`}
                    >
                      {service}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div className="mb-5 flex items-center gap-2">
              <Mic2 className="h-5 w-5 text-violet-200" />
              <h2 className="text-xl font-bold">介紹與經驗</h2>
            </div>

            <div className="grid gap-5">
              <label className="block">
                <span className="text-sm text-slate-300">自我介紹 * 至少 10 字</span>
                <textarea
                  value={intro}
                  onChange={(e) => setIntro(e.target.value)}
                  placeholder="介紹你的個性、陪玩風格、擅長的遊戲或聊天方式"
                  rows={5}
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-7 outline-none transition placeholder:text-slate-500 focus:border-violet-300"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">接單經驗</span>
                <textarea
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="例如：曾經在其他平台接單、擅長帶新手、特戰段位等等"
                  rows={4}
                  className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-7 outline-none transition placeholder:text-slate-500 focus:border-violet-300"
                />
              </label>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-6">
            <div className="mb-5 flex items-center gap-2">
              <Clock className="h-5 w-5 text-violet-200" />
              <h2 className="text-xl font-bold">可接時間與收款</h2>
            </div>

            <div className="grid gap-5">
              <label className="block">
                <span className="text-sm text-slate-300">可接時間 *</span>
                <input
                  value={availableTime}
                  onChange={(e) => setAvailableTime(e.target.value)}
                  placeholder="例如：平日 20:00-02:00，假日可約"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-violet-300"
                />
              </label>

              <label className="block">
                <span className="text-sm text-slate-300">收款方式簡述</span>
                <input
                  value={paymentInfo}
                  onChange={(e) => setPaymentInfo(e.target.value)}
                  placeholder="例如：銀行轉帳 / Line Pay，正式提領前再補完整資料"
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm outline-none transition placeholder:text-slate-500 focus:border-violet-300"
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={submitApplication}
            className="flex items-center justify-center gap-2 rounded-2xl bg-violet-500 px-6 py-4 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                送出中...
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                送出陪玩師申請
              </>
            )}
          </button>
        </div>
      </section>
    </main>
  );
}