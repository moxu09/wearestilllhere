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
  LockKeyhole,
  LogOut,
  Moon,
  RotateCcw,
  Sparkles,
  Wallet,
} from "lucide-react";

// API payloads are schema-backed but intentionally heterogeneous across tabs.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data = Record<string, any>;
type ExclusiveCardVariant = "white" | "black";

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
  const [declineConfirm, setDeclineConfirm] = useState(false);
  const [acceptingExclusive, setAcceptingExclusive] = useState(false);
  const [exclusiveCardChoice, setExclusiveCardChoice] =
    useState<ExclusiveCardVariant | null>(null);
  const [confirmingExclusiveCard, setConfirmingExclusiveCard] = useState(false);
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

  async function respondExclusiveInvitation(accepted: boolean) {
    setBusy(true);
    setMessage("");
    setError("");
    if (accepted) setAcceptingExclusive(true);
    try {
      await authFetch("/api/membership/me", {
        method: "PATCH",
        body: JSON.stringify({
          action: "respond_exclusive_invitation",
          accepted,
        }),
      });
      if (accepted) {
        await new Promise((resolve) => window.setTimeout(resolve, 1800));
      }
      setDeclineConfirm(false);
      setMessage(
        accepted
          ? "歡迎成為星盟尊享會員。"
          : "已婉拒本次尊享會員邀請。",
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "邀請回覆失敗");
    } finally {
      setAcceptingExclusive(false);
      setBusy(false);
    }
  }

  async function saveExclusiveCardChoice() {
    if (!exclusiveCardChoice) return;
    setBusy(true);
    setMessage("");
    setError("");
    try {
      await authFetch("/api/membership/me", {
        method: "PATCH",
        body: JSON.stringify({
          action: "select_exclusive_card",
          variant: exclusiveCardChoice,
        }),
      });
      setConfirmingExclusiveCard(false);
      setMessage("尊享會員卡面已確認。此選擇無法更改。");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "卡面選擇失敗");
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

  const isExclusive = data.currentTier?.tier_key === "exclusive";
  const surfaceClass = isExclusive
    ? "border-[#a98643]/45 bg-[#11100d]"
    : "border-white/10 bg-white/[0.04]";
  const fieldClass = isExclusive
    ? "border-[#a98643]/35 bg-[#080806] text-[#f7eed8] focus:border-[#d8b66c]"
    : "border-white/15 bg-[#14231e] text-white focus:border-amber-200";

  return (
    <main
      className={`min-h-screen ${isExclusive ? "exclusive-membership bg-[#070706] text-[#f7eed8]" : "bg-[#0d1715] text-[#f4f1e8]"}`}
    >
      {(data.exclusiveInvitation || acceptingExclusive) && (
        <ExclusiveInvitation
          memberName={data.profile.displayName}
          busy={busy}
          declineConfirm={declineConfirm}
          accepting={acceptingExclusive}
          onAccept={() => void respondExclusiveInvitation(true)}
          onDecline={() => setDeclineConfirm(true)}
          onConfirmDecline={() => void respondExclusiveInvitation(false)}
          onCancelDecline={() => setDeclineConfirm(false)}
        />
      )}
      {isExclusive &&
        !data.member.exclusive_card_variant &&
        !acceptingExclusive && (
          <ExclusiveCardChoice
            value={exclusiveCardChoice}
            confirming={confirmingExclusiveCard}
            busy={busy}
            error={error}
            onSelect={(value) => {
              setExclusiveCardChoice(value);
              setConfirmingExclusiveCard(false);
            }}
            onBeginConfirm={() => setConfirmingExclusiveCard(true)}
            onCancelConfirm={() => setConfirmingExclusiveCard(false)}
            onConfirm={() => void saveExclusiveCardChoice()}
          />
        )}
      {isExclusive && <div className="h-1 bg-[#c7a35c]" />}
      <header
        className={`border-b shadow-lg shadow-black/10 ${isExclusive ? "border-[#a98643]/35 bg-[#0b0b09]/95" : "border-white/10 bg-[#111f1b]/95"}`}
      >
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
              <p className="font-black text-amber-200">
                {isExclusive ? "星盟尊享" : "星夜聯盟"}
              </p>
              <p className="text-xs text-white/45">
                {isExclusive ? "尊享會員私人禮遇" : "深夜不關燈 × 秋奈電競"}
              </p>
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
          <div
            className={`overflow-hidden rounded-lg border shadow-[0_22px_60px_rgba(0,0,0,0.24)] ${isExclusive ? "border-[#c7a35c]/55 bg-[#0f0e0b] shadow-black/50" : "border-amber-200/25 bg-[#192a25]"}`}
          >
            <div className="relative aspect-[640/413] overflow-hidden bg-[#0f1715]">
              {data.currentTier?.card_image_url ? (
                <Image
                  src={data.currentTier.card_image_url}
                  alt={`${data.currentTier.tier_name}會員卡`}
                  fill
                  priority
                  unoptimized
                  sizes="(max-width: 1023px) 100vw, 45vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center bg-[#0c0b09] px-6 text-center">
                  <Crown className="h-14 w-14 text-amber-200/75" />
                  <p className="mt-5 text-xs font-bold tracking-[0.3em] text-amber-200/60">
                    EXCLUSIVE MEMBERSHIP
                  </p>
                  <p className="mt-3 text-3xl font-black text-amber-100">
                    {data.currentTier?.tier_name}
                  </p>
                </div>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat
              icon={<Sparkles />}
              label="累積會籍積分"
              value={`${Number(data.member.lifetime_points).toFixed(2)}`}
              exclusive={isExclusive}
            />
            <Stat
              icon={<BadgeCheck />}
              label="本期積分"
              value={`${Number(data.member.period_points).toFixed(2)}`}
              exclusive={isExclusive}
            />
            <Stat
              icon={<Coins />}
              label="獎勵積分"
              value={Number(data.member.reward_points).toLocaleString()}
              exclusive={isExclusive}
            />
            <Stat
              icon={<Wallet />}
              label="ASD 錢包"
              value={Number(data.walletBalance).toLocaleString()}
              exclusive={isExclusive}
            />
            <div className={`col-span-2 rounded-lg border p-5 md:col-span-4 ${surfaceClass}`}>
              <div className="flex justify-between text-sm">
                <span>
                  {isExclusive
                    ? "星盟尊享會籍"
                    : `晉升 ${data.nextTier?.tier_name || "尊享會員"}`}
                </span>
                <span className="text-amber-200">
                  {isExclusive
                    ? "年度專屬審核"
                    : data.nextTier
                    ? `尚差 ${(Number(data.nextTier.threshold_points) - Number(data.member.lifetime_points)).toFixed(2)} 點`
                    : "邀請制"}
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-amber-200"
                  style={{ width: `${isExclusive ? 100 : progress}%` }}
                />
              </div>
              <div className="mt-4 text-xs text-white/45">
                <span>
                  累積消費{" "}
                  {Number(data.member.qualifying_spend).toLocaleString()} ASD
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className={`mt-6 rounded-lg border p-5 sm:p-6 ${surfaceClass}`}>
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
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-sm font-bold text-white/70">
              會員名稱
              <div className="mt-2 flex gap-2">
                <input
                  maxLength={30}
                  value={memberName}
                  onChange={(event) => setMemberName(event.target.value)}
                  onFocus={() => setEditingName(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void saveMemberName();
                  }}
                  aria-label="會員名稱"
                  className={`min-w-0 flex-1 rounded-md border px-3 py-3 outline-none transition ${fieldClass}`}
                />
                <button
                  disabled={busy || (!editingName && memberName === data.profile.displayName)}
                  onClick={() => void saveMemberName()}
                  title="儲存會員名稱"
                  className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-md bg-amber-200 text-[#17241f] transition hover:bg-amber-100 disabled:opacity-40"
                >
                  <Check size={17} />
                </button>
                {data.profile.isCustomName && (
                  <button
                    disabled={busy}
                    onClick={() => void saveMemberName(true)}
                    title="恢復 Discord 名稱"
                    className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-md border border-white/15 text-white/65 transition hover:bg-white/10 disabled:opacity-40"
                  >
                    <RotateCcw size={16} />
                  </button>
                )}
              </div>
            </label>
            <label className="text-sm font-bold text-white/70">
              性別
              <select
                value={gender}
                onChange={(event) => setGender(event.target.value)}
                className={`mt-2 w-full rounded-md border px-3 py-3 outline-none transition ${fieldClass}`}
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
                className={`mt-2 w-full rounded-md border px-3 py-3 outline-none transition ${fieldClass}`}
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
                className={`mt-2 w-full rounded-md border px-3 py-3 outline-none transition disabled:cursor-not-allowed disabled:opacity-40 ${fieldClass}`}
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

        <div className={`mt-8 flex gap-1 overflow-x-auto rounded-lg border p-1.5 ${surfaceClass}`}>
          {[
            ["overview", "積分明細"],
            ["rewards", "兌換商品"],
            ["redemptions", "兌換紀錄"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`shrink-0 rounded-md px-5 py-3 text-sm font-bold transition ${tab === key ? (isExclusive ? "bg-[#c7a35c] text-[#090806]" : "bg-amber-200 text-[#17241f]") : "text-white/50 hover:bg-white/5 hover:text-white"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <section className="py-6">
            <div className={`divide-y divide-white/10 overflow-hidden rounded-lg border ${surfaceClass}`}>
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
            <div className={`mb-6 rounded-lg border p-5 sm:p-6 ${isExclusive ? "border-[#c7a35c]/45 bg-[#14120d]" : "border-amber-200/20 bg-amber-200/[0.06]"}`}>
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
                  className={`rounded-lg border p-5 shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:border-amber-200/25 ${surfaceClass}`}
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
            <div className={`divide-y divide-white/10 overflow-hidden rounded-lg border ${surfaceClass}`}>
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
  exclusive = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  exclusive?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-5 ${exclusive ? "border-[#a98643]/45 bg-[#11100d]" : "border-white/10 bg-white/[0.05]"}`}
    >
      <div
        className={`grid h-10 w-10 place-items-center rounded-full [&_svg]:h-5 [&_svg]:w-5 ${exclusive ? "bg-[#c7a35c]/15 text-[#e2c681]" : "bg-emerald-300/10 text-emerald-200"}`}
      >
        {icon}
      </div>
      <p className="mt-4 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs text-white/45">{label}</p>
    </div>
  );
}

function ExclusiveInvitation({
  memberName,
  busy,
  declineConfirm,
  accepting,
  onAccept,
  onDecline,
  onConfirmDecline,
  onCancelDecline,
}: {
  memberName: string;
  busy: boolean;
  declineConfirm: boolean;
  accepting: boolean;
  onAccept: () => void;
  onDecline: () => void;
  onConfirmDecline: () => void;
  onCancelDecline: () => void;
}) {
  return (
    <div
      className="exclusive-invite-backdrop fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-[#050504] px-4 py-5"
      role="dialog"
      aria-modal="true"
      aria-label="星盟尊享會員邀請"
    >
      {accepting ? (
        <div className="exclusive-welcome text-center">
          <span className="mx-auto grid h-24 w-24 place-items-center rounded-full border border-[#d6b66d]/70 bg-[#16130d] text-[#e4c77f] shadow-[0_0_60px_rgba(199,163,92,0.22)]">
            <Crown className="h-12 w-12" />
          </span>
          <p className="mt-7 text-xs font-bold tracking-[0.3em] text-[#b99855]">
            STAR ALLIANCE EXCLUSIVE
          </p>
          <h2 className="mt-3 text-3xl font-black text-[#f6e9c9] sm:text-5xl">
            歡迎成為星盟尊享會員
          </h2>
          <p className="mt-4 text-sm text-[#d0c19d]">正在為您開啟尊享會員頁面</p>
        </div>
      ) : (
        <>
          <div className="exclusive-envelope" aria-hidden="true">
            <div className="exclusive-envelope-back" />
            <div className="exclusive-envelope-flap" />
            <div className="exclusive-envelope-pocket" />
            <span className="exclusive-envelope-seal">
              <Crown className="h-5 w-5" />
            </span>
          </div>

          <article className="exclusive-letter-panel max-h-[calc(100vh-2.5rem)] w-full max-w-2xl overflow-y-auto rounded-lg border border-[#c7a35c]/60 bg-[#f4eddd] p-6 text-[#18150f] shadow-[0_30px_100px_rgba(0,0,0,0.72)] sm:p-10">
            <div className="mx-auto h-px w-24 bg-[#9d7935]" />
            <p className="mt-5 text-center text-xs font-bold tracking-[0.3em] text-[#8a6a31]">
              STAR ALLIANCE EXCLUSIVE
            </p>
            <p className="mt-6 text-sm text-[#6d5a37]">親愛的 {memberName}：</p>
            <h1 className="mt-3 text-center text-2xl font-black leading-relaxed text-[#17130d] sm:text-4xl">
              誠心邀請您成為星盟尊享會員
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-center text-sm leading-7 text-[#665a46]">
              這是一份專屬於您的邀請。星夜聯盟誠摯邀請您加入最高級別會籍，與我們展開更尊榮的會員旅程。
            </p>

            <div className="mt-7 border-y border-[#9d7935]/30 py-5">
              <h2 className="text-sm font-black text-[#6f5424]">尊享會員禮遇</h2>
              <ul className="mt-3 grid gap-3 text-sm leading-6 text-[#40382b] sm:grid-cols-2">
                {[
                  "星夜聯盟最高級別邀請制會籍",
                  "深夜不關燈與秋奈電競聯合尊享身分",
                  "有效消費享 2 倍星夜積分",
                  "專屬黑金會員頁面與尊享會員識別",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-start gap-2">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#98742f]" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs leading-5 text-[#756950]">
                尊享會籍採年度專屬審核，實際權益依星夜聯盟最新會籍制度為準。
              </p>
            </div>

            {declineConfirm ? (
              <div className="mt-7 rounded-md border border-[#9d7935]/35 bg-[#ede3cf] p-4 text-center">
                <p className="font-black">確定要放棄這份尊享邀請嗎？</p>
                <p className="mt-1 text-xs text-[#756950]">確認後，本次邀請將標記為婉拒。</p>
                <div className="mt-4 flex flex-col-reverse justify-center gap-3 sm:flex-row">
                  <button
                    disabled={busy}
                    onClick={onCancelDecline}
                    className="rounded-md border border-[#7b6337]/35 px-6 py-2.5 text-sm font-bold transition hover:bg-white/50 disabled:opacity-50"
                  >
                    返回邀請函
                  </button>
                  <button
                    disabled={busy}
                    onClick={onConfirmDecline}
                    className="rounded-md bg-[#241f16] px-6 py-2.5 text-sm font-bold text-[#f6e9c9] transition hover:bg-black disabled:opacity-50"
                  >
                    確定婉拒
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-7 flex flex-col-reverse justify-center gap-3 sm:flex-row">
                <button
                  disabled={busy}
                  onClick={onDecline}
                  className="rounded-md border border-[#7b6337]/40 px-7 py-3 text-sm font-bold text-[#4f422d] transition hover:bg-[#ede3cf] disabled:opacity-50"
                >
                  暫不加入
                </button>
                <button
                  disabled={busy}
                  onClick={onAccept}
                  className="rounded-md bg-[#b59049] px-8 py-3 text-sm font-black text-[#131008] shadow-lg shadow-[#8a6a31]/20 transition hover:bg-[#c9a85f] disabled:opacity-50"
                >
                  同意成為尊享會員
                </button>
              </div>
            )}
          </article>
        </>
      )}

      <style jsx global>{`
        @keyframes exclusive-envelope-arrive {
          0% { opacity: 0; transform: translate(-50%, calc(-50% + 54px)) scale(0.82); }
          35%, 72% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, calc(-50% + 18px)) scale(0.94); }
        }
        @keyframes exclusive-flap-open {
          0%, 42% { transform: rotateX(0deg); z-index: 4; }
          72%, 100% { transform: rotateX(180deg); z-index: 1; }
        }
        @keyframes exclusive-seal-release {
          0%, 38% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          62%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
        }
        @keyframes exclusive-letter-reveal {
          0%, 70% { opacity: 0; transform: translateY(45px) scale(0.94); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes exclusive-welcome-reveal {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .exclusive-envelope {
          animation: exclusive-envelope-arrive 3.2s ease-in-out forwards;
          height: 210px;
          left: 50%;
          perspective: 900px;
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: min(340px, calc(100vw - 48px));
        }
        .exclusive-envelope-back,
        .exclusive-envelope-pocket {
          background: #d8c49b;
          border: 1px solid #9d7935;
          bottom: 0;
          height: 72%;
          position: absolute;
          width: 100%;
        }
        .exclusive-envelope-flap {
          animation: exclusive-flap-open 2.2s ease-in-out forwards;
          border-left: min(170px, calc((100vw - 48px) / 2)) solid transparent;
          border-right: min(170px, calc((100vw - 48px) / 2)) solid transparent;
          border-top: 106px solid #eadbbd;
          filter: drop-shadow(0 1px 0 #9d7935);
          left: 0;
          position: absolute;
          top: 59px;
          transform-origin: top;
          width: 0;
        }
        .exclusive-envelope-pocket {
          background: #cbb485;
          clip-path: polygon(0 0, 50% 58%, 100% 0, 100% 100%, 0 100%);
          z-index: 3;
        }
        .exclusive-envelope-seal {
          animation: exclusive-seal-release 2.2s ease-in-out forwards;
          background: #8e692d;
          border: 1px solid #eed99d;
          border-radius: 999px;
          color: #f5e7bd;
          display: grid;
          height: 48px;
          left: 50%;
          place-items: center;
          position: absolute;
          top: 68%;
          transform: translate(-50%, -50%);
          width: 48px;
          z-index: 5;
        }
        .exclusive-letter-panel {
          animation: exclusive-letter-reveal 3.9s ease-out forwards;
          opacity: 0;
          position: relative;
          z-index: 6;
        }
        .exclusive-welcome {
          animation: exclusive-welcome-reveal 0.8s ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .exclusive-envelope { display: none; }
          .exclusive-letter-panel,
          .exclusive-welcome { animation: none; opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}

function ExclusiveCardChoice({
  value,
  confirming,
  busy,
  error,
  onSelect,
  onBeginConfirm,
  onCancelConfirm,
  onConfirm,
}: {
  value: ExclusiveCardVariant | null;
  confirming: boolean;
  busy: boolean;
  error: string;
  onSelect: (value: ExclusiveCardVariant) => void;
  onBeginConfirm: () => void;
  onCancelConfirm: () => void;
  onConfirm: () => void;
}) {
  const cards: Array<{
    key: ExclusiveCardVariant;
    name: string;
    description: string;
    image: string;
  }> = [
    {
      key: "white",
      name: "月華白",
      description: "溫潤珠光與細緻金線",
      image: "/membership-cards/exclusive.png",
    },
    {
      key: "black",
      name: "永夜黑",
      description: "深邃黑曜與流動金線",
      image: "/membership-cards/exclusive-black.png",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[110] overflow-y-auto bg-[#050504]/98 px-4 py-8 text-[#f7eed8]"
      role="dialog"
      aria-modal="true"
      aria-label="選擇尊享會員卡面"
    >
      <div className="exclusive-card-choice mx-auto flex min-h-full w-full max-w-5xl items-center justify-center">
        <section className="w-full">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.3em] text-[#b99855]">
              PRIVATE RESERVE
            </p>
            <h1 className="mt-3 text-3xl font-black sm:text-5xl">
              選擇您的尊享會員卡
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#cfc3a7]">
              這張卡將成為您的專屬尊享識別，請選擇最符合您的卡面風格。
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {cards.map((card) => {
              const selected = value === card.key;
              return (
                <button
                  key={card.key}
                  type="button"
                  disabled={busy || confirming}
                  onClick={() => onSelect(card.key)}
                  className={`overflow-hidden rounded-lg border bg-[#0d0c0a] text-left transition duration-300 disabled:cursor-not-allowed ${selected ? "border-[#e1c77e] shadow-[0_0_0_2px_rgba(225,199,126,0.2),0_22px_70px_rgba(0,0,0,0.55)]" : "border-white/15 hover:-translate-y-1 hover:border-[#b99855]/70"}`}
                >
                  <div className="relative aspect-[640/413] overflow-hidden bg-black">
                    <Image
                      src={card.image}
                      alt={`尊享會員${card.name}卡面`}
                      fill
                      priority
                      sizes="(max-width: 767px) 100vw, 50vw"
                      className="object-cover"
                    />
                    {selected && (
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[#f1dfad] px-3 py-1.5 text-xs font-black text-[#18130b] shadow-lg">
                        <Check className="h-3.5 w-3.5" /> 已選擇
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4 p-4 sm:p-5">
                    <div>
                      <p className="font-black text-[#f7eed8]">{card.name}</p>
                      <p className="mt-1 text-xs text-white/45">{card.description}</p>
                    </div>
                    <span
                      className={`h-5 w-5 shrink-0 rounded-full border ${selected ? "border-[#f1dfad] bg-[#f1dfad] shadow-[inset_0_0_0_4px_#17120a]" : "border-white/30"}`}
                      aria-hidden="true"
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mx-auto mt-7 max-w-2xl rounded-lg border border-[#b99855]/35 bg-[#17130d] p-4 text-center">
            <p className="flex items-center justify-center gap-2 text-sm font-black text-[#ead49a]">
              <LockKeyhole className="h-4 w-4" /> 會員卡面只能選擇一次
            </p>
            <p className="mt-1 text-xs leading-5 text-[#b9ad91]">
              確認後將永久套用，之後無法自行更改，請確認後再送出。
            </p>
          </div>

          {error && (
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-red-200">
              {error}
            </p>
          )}

          {confirming ? (
            <div className="mx-auto mt-6 max-w-xl rounded-lg border border-[#d3b66d]/55 bg-[#eee4cd] p-5 text-center text-[#1d1810] shadow-2xl">
              <p className="text-lg font-black">
                最後確認使用「{cards.find((card) => card.key === value)?.name}」？
              </p>
              <p className="mt-2 text-sm text-[#6c5c3d]">送出後無法更改卡面。</p>
              <div className="mt-5 flex flex-col-reverse justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  disabled={busy}
                  onClick={onCancelConfirm}
                  className="rounded-md border border-[#7b6337]/35 px-6 py-2.5 text-sm font-bold transition hover:bg-white/50 disabled:opacity-50"
                >
                  返回重選
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={onConfirm}
                  className="rounded-md bg-[#241f16] px-7 py-2.5 text-sm font-black text-[#f6e9c9] transition hover:bg-black disabled:opacity-50"
                >
                  {busy ? "正在確認" : "確定永久使用"}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 text-center">
              <button
                type="button"
                disabled={!value || busy}
                onClick={onBeginConfirm}
                className="rounded-md bg-[#c7a35c] px-9 py-3.5 text-sm font-black text-[#17120a] shadow-lg shadow-black/30 transition hover:bg-[#ddc178] disabled:cursor-not-allowed disabled:opacity-35"
              >
                確認選擇此卡面
              </button>
            </div>
          )}
        </section>
      </div>
      <style jsx>{`
        @keyframes exclusive-card-choice-in {
          from { opacity: 0; transform: translateY(28px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .exclusive-card-choice { animation: exclusive-card-choice-in 0.75s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .exclusive-card-choice { animation: none; }
        }
      `}</style>
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
