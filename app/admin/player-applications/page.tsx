"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Crown,
  Gamepad2,
  Loader2,
  Lock,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  UserRound,
  XCircle,
} from "lucide-react";

type Profile = {
  id: string;
  role: string | null;
  display_name: string | null;
};

type Application = {
  id: string;
  user_id: string;
  nickname: string;
  discord_id: string | null;
  gender: string | null;
  age_range: string | null;
  avatar_url: string | null;
  voice_sample_url: string | null;
  selected_games: string[] | null;
  selected_services: string[] | null;
  intro: string | null;
  experience: string | null;
  available_time: string | null;
  payment_info: string | null;
  status: "pending" | "approved" | "rejected";
  review_note: string | null;
  created_at: string;
};

export default function AdminPlayerApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isAdmin = profile?.role === "admin" || profile?.role === "staff";

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
      setProfile(null);
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("platform_profiles")
      .select("id, role, display_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setError("讀取管理員資料失敗：" + profileError.message);
      setLoading(false);
      return;
    }

    setProfile(profileData as Profile | null);

    if (profileData?.role !== "admin" && profileData?.role !== "staff") {
      setLoading(false);
      return;
    }

    const { data: applicationData, error: applicationError } = await supabase
      .from("platform_player_applications")
      .select(
        `
        id,
        user_id,
        nickname,
        discord_id,
        gender,
        age_range,
        avatar_url,
        voice_sample_url,
        selected_games,
        selected_services,
        intro,
        experience,
        available_time,
        payment_info,
        status,
        review_note,
        created_at
      `
      )
      .order("created_at", { ascending: false });

    if (applicationError) {
      setError("讀取陪玩師申請失敗：" + applicationError.message);
      setLoading(false);
      return;
    }

    setApplications((applicationData || []) as Application[]);
    setLoading(false);
  }

  async function approveApplication(app: Application) {
    const ok = window.confirm(`確定要通過「${app.nickname}」的陪玩師申請嗎？`);
    if (!ok) return;

    setBusyId(app.id);
    setError("");
    setMessage("");

    const { error: playerError } = await supabase.from("platform_players").upsert(
      {
        user_id: app.user_id,
        nickname: app.nickname,
        gender: app.gender,
        intro: app.intro,
        avatar_url: app.avatar_url,
        voice_sample_url: app.voice_sample_url,
        status: "active",
        is_online: false,
        is_accepting_orders: false,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (playerError) {
      setError("建立陪玩師資料失敗：" + playerError.message);
      setBusyId(null);
      return;
    }

    const { error: profileError } = await supabase
      .from("platform_profiles")
      .update({
        role: "player",
        display_name: app.nickname,
        updated_at: new Date().toISOString(),
      })
      .eq("id", app.user_id);

    if (profileError) {
      setError("更新會員身分失敗：" + profileError.message);
      setBusyId(null);
      return;
    }

    const { error: appError } = await supabase
      .from("platform_player_applications")
      .update({
        status: "approved",
        review_note: reviewNote[app.id] || "審核通過",
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", app.id);

    if (appError) {
      setError("更新申請狀態失敗：" + appError.message);
      setBusyId(null);
      return;
    }

    setMessage(`已通過 ${app.nickname} 的陪玩師申請。`);
    setBusyId(null);
    await loadPage();
  }

  async function rejectApplication(app: Application) {
    const ok = window.confirm(`確定要拒絕「${app.nickname}」的陪玩師申請嗎？`);
    if (!ok) return;

    setBusyId(app.id);
    setError("");
    setMessage("");

    const { error } = await supabase
      .from("platform_player_applications")
      .update({
        status: "rejected",
        review_note: reviewNote[app.id] || "審核未通過",
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile?.id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", app.id);

    if (error) {
      setError("拒絕申請失敗：" + error.message);
      setBusyId(null);
      return;
    }

    setMessage(`已拒絕 ${app.nickname} 的陪玩師申請。`);
    setBusyId(null);
    await loadPage();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取審核頁中...</span>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <AccessCard
        icon={<Lock className="h-8 w-8" />}
        title="請先登入管理員帳號"
        desc="登入後才能查看陪玩師申請審核頁。"
        buttonText="前往登入"
        buttonHref="/login?next=/admin/player-applications"
      />
    );
  }

  if (!isAdmin) {
    return (
      <AccessCard
        icon={<ShieldCheck className="h-8 w-8" />}
        title="你沒有管理員權限"
        desc="請先到 Supabase 把你的 platform_profiles.role 設為 admin 或 staff。"
        buttonText="回首頁"
        buttonHref="/"
      />
    );
  }

  const pendingCount = applications.filter((app) => app.status === "pending").length;
  const approvedCount = applications.filter((app) => app.status === "approved").length;
  const rejectedCount = applications.filter((app) => app.status === "rejected").length;

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-950">
      <section className="relative overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-200/70 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-10">
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
                <ShieldCheck className="h-4 w-4" />
                ADMIN REVIEW
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                陪玩師申請審核
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                查看會員送出的陪玩師申請。通過後會自動建立陪玩師資料，並把會員身分改成 player。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <AdminStat label="待審核" value={String(pendingCount)} icon={<Clock />} />
              <AdminStat label="已通過" value={String(approvedCount)} icon={<CheckCircle2 />} />
              <AdminStat label="已拒絕" value={String(rejectedCount)} icon={<XCircle />} />
            </div>
          </div>

          {applications.length === 0 ? (
            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-10 text-center shadow-xl backdrop-blur-xl">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
                <Crown className="h-8 w-8" />
              </div>

              <h2 className="text-2xl font-black text-slate-950">
                目前沒有陪玩師申請
              </h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
                等會員從申請頁送出後，這裡就會出現申請資料。
              </p>
            </section>
          ) : (
            <div className="grid gap-6">
              {applications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  app={app}
                  busy={busyId === app.id}
                  note={reviewNote[app.id] || ""}
                  onNoteChange={(value) =>
                    setReviewNote((prev) => ({
                      ...prev,
                      [app.id]: value,
                    }))
                  }
                  onApprove={() => approveApplication(app)}
                  onReject={() => rejectApplication(app)}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ApplicationCard({
  app,
  busy,
  note,
  onNoteChange,
  onApprove,
  onReject,
}: {
  app: Application;
  busy: boolean;
  note: string;
  onNoteChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const statusStyle =
    app.status === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : app.status === "rejected"
      ? "bg-red-50 text-red-600"
      : "bg-amber-50 text-amber-700";

  const statusText =
    app.status === "approved"
      ? "已通過"
      : app.status === "rejected"
      ? "已拒絕"
      : "待審核";

  return (
    <article className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-xl backdrop-blur-xl">
      <div className="grid gap-0 lg:grid-cols-[280px_1fr]">
        <div className="relative bg-gradient-to-br from-violet-100 via-fuchsia-50 to-blue-100 p-6">
          <div className="absolute left-8 top-8 h-28 w-28 rounded-full bg-violet-200/70 blur-3xl" />
          <div className="absolute bottom-10 right-8 h-28 w-28 rounded-full bg-fuchsia-200/70 blur-3xl" />

          <div className="relative">
            <div className="mb-5 inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-black text-violet-700 shadow-sm">
              {statusText}
            </div>

            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[1.7rem] border-4 border-white bg-white text-violet-700 shadow-xl">
              {app.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={app.avatar_url}
                  alt={app.nickname}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-10 w-10" />
              )}
            </div>

            <h2 className="mt-5 text-3xl font-black text-slate-950">
              {app.nickname}
            </h2>

            <p className="mt-2 text-sm font-semibold text-slate-500">
              {app.gender || "未填性別"} ｜ {app.age_range || "未填年齡"}
            </p>

            <div className={`mt-4 inline-flex rounded-full px-3 py-1 text-xs font-black ${statusStyle}`}>
              {statusText}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-6 grid gap-4 md:grid-cols-3">
            <InfoBox
              label="送出時間"
              value={new Date(app.created_at).toLocaleString("zh-TW")}
              icon={<Clock />}
            />
            <InfoBox
              label="Discord / 聯絡方式"
              value={app.discord_id || "未填"}
              icon={<MessageSquareText />}
            />
            <InfoBox
              label="聲音試聽"
              value={app.voice_sample_url ? "有提供" : "未提供"}
              icon={<BadgeCheck />}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <InfoPanel title="自我介紹" icon={<Sparkles className="h-5 w-5" />}>
              <p className="text-sm leading-8 text-slate-600">
                {app.intro || "未填寫"}
              </p>
            </InfoPanel>

            <InfoPanel title="接單經驗" icon={<Gamepad2 className="h-5 w-5" />}>
              <p className="text-sm leading-8 text-slate-600">
                {app.experience || "未填寫"}
              </p>
            </InfoPanel>

            <InfoPanel title="擅長遊戲" icon={<Gamepad2 className="h-5 w-5" />}>
              <TagList items={app.selected_games || []} emptyText="未選擇遊戲" />
            </InfoPanel>

            <InfoPanel title="可接服務" icon={<Crown className="h-5 w-5" />}>
              <TagList items={app.selected_services || []} emptyText="未選擇服務" />
            </InfoPanel>

            <InfoPanel title="可接時間" icon={<Clock className="h-5 w-5" />}>
              <p className="text-sm leading-8 text-slate-600">
                {app.available_time || "未填寫"}
              </p>
            </InfoPanel>

            <InfoPanel title="收款資訊" icon={<ShieldCheck className="h-5 w-5" />}>
              <p className="text-sm leading-8 text-slate-600">
                {app.payment_info || "未填寫"}
              </p>
            </InfoPanel>
          </div>

          {app.voice_sample_url && (
            <a
              href={app.voice_sample_url}
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-100"
            >
              開啟聲音試聽
              <ArrowRight className="h-4 w-4" />
            </a>
          )}

          <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
            <label className="block">
              <span className="text-sm font-bold text-slate-700">
                審核備註
              </span>
              <textarea
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                rows={3}
                placeholder="例如：資料完整，審核通過 / 聲音試聽無法開啟，請補件"
                className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-violet-300"
              />
            </label>

            {app.review_note && (
              <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-600">
                <span className="font-black text-slate-800">目前備註：</span>
                {app.review_note}
              </div>
            )}

            {app.status === "pending" ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  onClick={onReject}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-100 transition hover:bg-red-400 disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  拒絕申請
                </button>

                <button
                  onClick={onApprove}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:opacity-60"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  通過申請
                </button>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-white p-4 text-sm font-bold text-slate-500">
                這筆申請已審核完成。
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
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

        <p className="text-sm font-bold text-violet-600">ADMIN</p>
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

function AdminStat({
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

function InfoPanel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
          {icon}
        </div>
        <h3 className="font-black text-slate-950">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function TagList({
  items,
  emptyText,
}: {
  items: string[];
  emptyText: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500">{emptyText}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}