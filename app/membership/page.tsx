"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getAuthCallbackUrl } from "@/lib/authRedirect";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Coins,
  Crown,
  Gift,
  Loader2,
  LogOut,
  Moon,
  Pencil,
  RotateCcw,
  Sparkles,
  Wallet,
  X,
} from "lucide-react";

// API payloads are schema-backed but intentionally heterogeneous across tabs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = Record<string, any>;

async function authFetch(url: string, init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("請先登入");
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "讀取失敗");
  return body;
}

export default function MembershipPage() {
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState("overview");
  const [discountPoints, setDiscountPoints] = useState("100");
  const [memberName, setMemberName] = useState("");
  const [gender, setGender] = useState("undisclosed");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loginWithDiscord() {
    setBusy(true);
    setError("");
    const { error: loginError } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: getAuthCallbackUrl("/membership") },
    });
    if (loginError) {
      setBusy(false);
      setError(`Discord 登入失敗：${loginError.message}`);
    }
  }

  async function load() {
    setLoading(true);
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) {
      setSignedIn(false);
      setLoading(false);
      return;
    }
    setSignedIn(true);
    try {
      const payload = await authFetch("/api/membership/me");
      setData(payload);
      setMemberName(payload.profile.displayName);
      setGender(payload.member.gender || "undisclosed");
      setBirthMonth(payload.member.birth_month ? String(payload.member.birth_month) : "");
      setBirthDay(payload.member.birth_day ? String(payload.member.birth_day) : "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "讀取失敗");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  const progress = useMemo(() => {
    if (!data?.nextTier) return 100;
    const current = Number(data.currentTier?.threshold_points || 0);
    const next = Number(data.nextTier.threshold_points || current + 1);
    return Math.max(
      0,
      Math.min(
        100,
        ((Number(data.member.lifetime_points) - current) / (next - current)) *
          100,
      ),
    );
  }, [data]);

  async function redeem(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await authFetch("/api/membership/redeem", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMessage("兌換申請已送交客服審核。");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "兌換失敗");
    } finally {
      setBusy(false);
    }
  }

  async function saveMemberName(reset = false) {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await authFetch("/api/membership/me", {
        method: "PATCH",
        body: JSON.stringify({ displayName: memberName, reset }),
      });
      setEditingName(false);
      setMessage(reset ? "已恢復使用 Discord 名稱。" : "會員名稱已更新。");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "名稱更新失敗");
    } finally {
      setBusy(false);
    }
  }

  async function saveProfileDetails() {
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await authFetch("/api/membership/me", {
        method: "PATCH",
        body: JSON.stringify({
          action: "update_profile_details",
          gender,
          birthMonth,
          birthDay,
        }),
      });
      setMessage("會員基本資料已更新。");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "基本資料更新失敗");
    } finally {
      setBusy(false);
    }
  }

  const birthdayDays = birthMonth
    ? new Date(2000, Number(birthMonth), 0).getDate()
    : 31;

  if (loading)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d1715] text-[#f4f1e8]">
        <Loader2 className="mr-3 animate-spin text-amber-300" />
        讀取星夜會籍中
      </main>
    );
  if (!signedIn)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0d1715] px-4 py-10 text-[#f4f1e8]">
        <section className="w-full max-w-lg rounded-lg border border-amber-200/20 bg-[#14221e] p-8 text-center shadow-[0_28px_90px_rgba(0,0,0,0.38)] sm:p-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-200/10 text-amber-200">
            <Moon className="h-8 w-8" />
          </span>
          <p className="mt-6 text-xs font-bold tracking-[0.3em] text-amber-200">
            STAR NIGHT ALLIANCE
          </p>
          <h1 className="mt-3 text-3xl font-black text-white">星夜聯盟會員登入</h1>
          <p className="mt-4 text-sm leading-7 text-white/60">
            使用 Discord
            登入後，系統會自動連結深夜與秋奈的會籍、錢包及交易紀錄。
          </p>
          {error && <p className="mt-5 text-sm text-red-200">{error}</p>}
          <button
            disabled={busy}
            onClick={loginWithDiscord}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-md bg-amber-200 px-5 py-3 font-black text-[#17241f] shadow-lg shadow-black/20 transition hover:bg-amber-100 disabled:opacity-60"
          >
            {busy ? "前往 Discord 中" : "使用 Discord 登入"}{" "}
            <ArrowRight size={18} />
          </button>
        </section>
      </main>
    );
  if (!data)
    return (
      <main className="min-h-screen bg-[#0d1715] p-8 text-red-200">
        {error || "會員資料載入失敗"}
      </main>
    );

  return (
    <main className="min-h-screen bg-[#0d1715] text-[#f4f1e8]">
      <header className="border-b border-white/10 bg-[#111f1b]/95 shadow-lg shadow-black/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/icon.png"
              alt="深夜不關燈"
              width={44}
              height={44}
              className="h-11 w-11 rounded-lg object-cover ring-1 ring-amber-200/25"
            />
            <div>
              <p className="font-black text-amber-200">星夜聯盟</p>
              <p className="text-xs text-white/45">深夜不關燈 × 秋奈電競</p>
            </div>
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              location.reload();
            }}
            title="登出"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/10 text-white/55 transition hover:bg-white/10 hover:text-white"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {message && (
          <div className="mb-5 rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-5 rounded-lg border border-red-400/25 bg-red-400/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-lg border border-amber-200/25 bg-[#192a25] p-7 shadow-[0_22px_60px_rgba(0,0,0,0.24)] sm:p-8">
            <div>
              <p className="text-xs font-bold tracking-[0.3em] text-amber-200/75">
                MEMBERSHIP CARD
              </p>
              <div className="mt-5 min-h-10">
                {editingName ? (
                  <div className="flex max-w-sm items-center gap-2">
                    <input
                      autoFocus
                      maxLength={30}
                      value={memberName}
                      onChange={(event) => setMemberName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") void saveMemberName();
                      }}
                      aria-label="會員名稱"
                      className="min-w-0 flex-1 rounded-md border border-amber-200/30 bg-black/20 px-3 py-2 text-sm text-white outline-none transition focus:border-amber-200 focus:ring-2 focus:ring-amber-200/10"
                    />
                    <button
                      disabled={busy}
                      onClick={() => void saveMemberName()}
                      title="儲存會員名稱"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-amber-200/30 text-amber-200 transition hover:bg-amber-200/10 disabled:opacity-50"
                    >
                      <Check size={16} />
                    </button>
                    {data.profile.isCustomName && (
                      <button
                        disabled={busy}
                        onClick={() => void saveMemberName(true)}
                        title="恢復 Discord 名稱"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/15 text-white/65 transition hover:bg-white/10 disabled:opacity-50"
                      >
                        <RotateCcw size={16} />
                      </button>
                    )}
                    <button
                      disabled={busy}
                      onClick={() => {
                        setMemberName(data.profile.displayName);
                        setEditingName(false);
                      }}
                      title="取消"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-white/15 text-white/65 transition hover:bg-white/10 disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-white/50">
                      {data.profile.displayName}
                    </p>
                    <button
                      onClick={() => setEditingName(true)}
                      title="修改會員名稱"
                      className="grid h-8 w-8 place-items-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-amber-200"
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
                )}
              </div>
              <h1 className="mt-2 text-4xl font-black text-amber-100">
                {data.currentTier?.tier_name}
              </h1>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-white/40">會員編號</p>
                <p className="mt-1 font-mono text-sm">
                  {data.profile.discordId}
                </p>
              </div>
              <span className="grid h-16 w-16 place-items-center rounded-full bg-amber-200/10"><Crown className="h-9 w-9 text-amber-200/80" /></span>
            </div>
            <p className="absolute bottom-3 right-4 text-[10px] text-white/25">
              會員卡圖片待上傳
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              icon={<Sparkles />}
              label="累積會籍積分"
              value={`${Number(data.member.lifetime_points).toFixed(2)}`}
            />
            <Stat
              icon={<BadgeCheck />}
              label="本期積分"
              value={`${Number(data.member.period_points).toFixed(2)}`}
            />
            <Stat
              icon={<Coins />}
              label="獎勵積分"
              value={Number(data.member.reward_points).toLocaleString()}
            />
            <Stat
              icon={<Wallet />}
              label="ASD 錢包"
              value={Number(data.walletBalance).toLocaleString()}
            />
            <div className="col-span-2 rounded-lg border border-white/10 bg-white/[0.05] p-5 md:col-span-4">
              <div className="flex justify-between text-sm">
                <span>晉升 {data.nextTier?.tier_name || "尊享會員"}</span>
                <span className="text-amber-200">
                  {data.nextTier
                    ? `尚差 ${(Number(data.nextTier.threshold_points) - Number(data.member.lifetime_points)).toFixed(2)} 點`
                    : "邀請制"}
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-amber-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="mt-4 flex justify-between text-xs text-white/45">
                <span>
                  累積消費{" "}
                  {Number(data.member.qualifying_spend).toLocaleString()} ASD
                </span>
                <span>
                  累積儲值{" "}
                  {Number(data.member.qualifying_topup).toLocaleString()} ASD
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-black text-white">會員基本資料</h2>
              <p className="mt-1 text-sm text-white/45">生日僅保存月份與日期。</p>
            </div>
            <button
              disabled={busy}
              onClick={() => void saveProfileDetails()}
              className="rounded-md bg-amber-200 px-5 py-2.5 text-sm font-black text-[#17241f] transition hover:bg-amber-100 disabled:opacity-50"
            >
              儲存基本資料
            </button>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <label className="text-sm font-bold text-white/70">
              性別
              <select
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                className="mt-2 w-full rounded-md border border-white/15 bg-[#14231e] px-3 py-3 text-white outline-none transition focus:border-amber-200"
              >
                <option value="undisclosed">不公開</option>
                <option value="female">女性</option>
                <option value="male">男性</option>
                <option value="other">其他</option>
              </select>
            </label>
            <label className="text-sm font-bold text-white/70">
              生日月份
              <select
                value={birthMonth}
                onChange={(event) => {
                  const nextMonth = event.target.value;
                  setBirthMonth(nextMonth);
                  if (
                    birthDay &&
                    Number(birthDay) >
                      new Date(2000, Number(nextMonth), 0).getDate()
                  ) {
                    setBirthDay("");
                  }
                }}
                className="mt-2 w-full rounded-md border border-white/15 bg-[#14231e] px-3 py-3 text-white outline-none transition focus:border-amber-200"
              >
                <option value="">不填寫</option>
                {Array.from({ length: 12 }, (_, index) => index + 1).map(
                  (month) => (
                    <option key={month} value={month}>
                      {month} 月
                    </option>
                  ),
                )}
              </select>
            </label>
            <label className="text-sm font-bold text-white/70">
              生日日期
              <select
                value={birthDay}
                disabled={!birthMonth}
                onChange={(event) => setBirthDay(event.target.value)}
                className="mt-2 w-full rounded-md border border-white/15 bg-[#14231e] px-3 py-3 text-white outline-none transition focus:border-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <option value="">不填寫</option>
                {Array.from({ length: birthdayDays }, (_, index) => index + 1).map(
                  (day) => (
                    <option key={day} value={day}>
                      {day} 日
                    </option>
                  ),
                )}
              </select>
            </label>
          </div>
        </section>

        <div className="mt-8 flex gap-1 overflow-x-auto rounded-lg border border-white/10 bg-white/[0.04] p-1.5">
          {[
            ["overview", "積分明細"],
            ["rewards", "兌換商品"],
            ["redemptions", "兌換紀錄"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`shrink-0 rounded-md px-5 py-3 text-sm font-bold transition ${tab === key ? "bg-amber-200 text-[#17241f]" : "text-white/50 hover:bg-white/5 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <section className="py-6">
            <div className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
              {data.ledger.length ? (
                data.ledger.map((item: Data) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-4 transition hover:bg-white/[0.04]"
                  >
                    <div>
                      <p className="font-bold">
                        {item.note || item.source_type}
                      </p>
                      <p className="mt-1 text-xs text-white/40">
                        {new Date(item.created_at).toLocaleString("zh-TW", {
                          timeZone: "Asia/Taipei",
                        })}
                      </p>
                    </div>
                    <p
                      className={
                        Number(item.delta) >= 0
                          ? "text-emerald-300"
                          : "text-red-300"
                      }
                    >
                      {Number(item.delta) >= 0 ? "+" : ""}
                      {Number(item.delta).toFixed(
                        item.point_kind === "membership" ? 2 : 0,
                      )}{" "}
                      {item.point_kind === "membership" ? "會籍點" : "獎勵點"}
                    </p>
                  </div>
                ))
              ) : (
                <Empty text="目前尚無積分紀錄" />
              )}
            </div>
          </section>
        )}

        {tab === "rewards" && (
          <section className="py-6">
            <div className="mb-6 rounded-lg border border-amber-200/20 bg-amber-200/[0.06] p-5 sm:p-6">
              <h2 className="font-black text-amber-100">自訂折價券</h2>
              <p className="mt-2 text-sm text-white/50">
                每 100 獎勵積分折抵 1 ASD，送出後由客服審核。
              </p>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={discountPoints}
                  onChange={(e) => setDiscountPoints(e.target.value)}
                  className="min-w-0 flex-1 rounded-md border border-white/15 bg-black/20 px-4 py-3 outline-none transition focus:border-amber-200 focus:ring-2 focus:ring-amber-200/10"
                />
                <button
                  disabled={busy}
                  onClick={() =>
                    redeem({ discountPoints: Number(discountPoints) })
                  }
                  className="rounded-md bg-amber-200 px-5 py-3 font-black text-[#17241f] transition hover:bg-amber-100 disabled:opacity-50"
                >
                  兌換折價券
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.rewards.map((reward: Data) => (
                <article
                  key={reward.id}
                  className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-amber-200/25"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-amber-200/10 text-amber-200"><Gift className="h-6 w-6" /></span>
                  <h3 className="mt-4 text-lg font-black">{reward.name}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-white/50">
                    {reward.description || "星夜聯盟會員限定兌換"}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="font-bold text-amber-200">
                      {Number(reward.points_cost).toLocaleString()} 點
                    </span>
                    <button
                      disabled={busy}
                      onClick={() => redeem({ rewardId: reward.id })}
                      className="rounded-md border border-amber-200/35 px-4 py-2 text-sm font-bold text-amber-100 transition hover:bg-amber-200 hover:text-[#17241f]"
                    >
                      兌換
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "redemptions" && (
          <section className="py-6">
            <div className="divide-y divide-white/10 overflow-hidden rounded-lg border border-white/10 bg-white/[0.03]">
              {data.redemptions.length ? (
                data.redemptions.map((item: Data) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-4 transition hover:bg-white/[0.04]"
                  >
                    <div>
                      <p className="font-bold">{item.reward_name}</p>
                      <p className="mt-1 text-xs text-white/40">
                        {new Date(item.created_at).toLocaleString("zh-TW", {
                          timeZone: "Asia/Taipei",
                        })}{" "}
                        · {item.points_spent} 點
                      </p>
                      {item.review_note && (
                        <p className="mt-2 text-sm text-white/55">
                          {item.review_note}
                        </p>
                      )}
                    </div>
                    <Status value={item.status} />
                  </div>
                ))
              ) : (
                <Empty text="目前尚無兌換申請" />
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.05] p-5">
      <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-300/10 text-emerald-200 [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs text-white/45">{label}</p>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return <div className="p-10 text-center text-sm text-white/40">{text}</div>;
}
function Status({ value }: { value: string }) {
  const map: Record<string, string> = {
    pending: "審核中",
    approved: "已通過",
    rejected: "已駁回",
    fulfilled: "已完成",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${value === "approved" || value === "fulfilled" ? "bg-emerald-400/15 text-emerald-200" : value === "rejected" ? "bg-red-400/15 text-red-200" : "bg-amber-200/15 text-amber-100"}`}
    >
      {map[value] || value}
    </span>
  );
}
