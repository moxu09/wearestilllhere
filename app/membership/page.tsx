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

  if (loading)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070713] text-white">
        <Loader2 className="mr-3 animate-spin text-yellow-300" />
        讀取星夜會籍中
      </main>
    );
  if (!signedIn)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070713] px-4 text-white">
        <section className="w-full max-w-lg border border-yellow-300/25 bg-[#10101d] p-8 text-center shadow-2xl">
          <Moon className="mx-auto h-12 w-12 text-yellow-300" />
          <p className="mt-5 text-xs font-bold tracking-[0.3em] text-yellow-300">
            STAR NIGHT ALLIANCE
          </p>
          <h1 className="mt-3 text-3xl font-black">星夜聯盟會員登入</h1>
          <p className="mt-4 text-sm leading-7 text-white/60">
            使用 Discord
            登入後，系統會自動連結深夜與秋奈的會籍、錢包及交易紀錄。
          </p>
          {error && <p className="mt-5 text-sm text-red-200">{error}</p>}
          <button
            disabled={busy}
            onClick={loginWithDiscord}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 bg-yellow-300 px-5 py-3 font-black text-black disabled:opacity-60"
          >
            {busy ? "前往 Discord 中" : "使用 Discord 登入"}{" "}
            <ArrowRight size={18} />
          </button>
        </section>
      </main>
    );
  if (!data)
    return (
      <main className="min-h-screen bg-[#070713] p-8 text-red-200">
        {error || "會員資料載入失敗"}
      </main>
    );

  return (
    <main className="min-h-screen bg-[#070713] text-white">
      <header className="border-b border-white/10 bg-[#0b0b18]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/icon.png"
              alt="深夜不關燈"
              width={44}
              height={44}
              className="h-11 w-11 rounded-md object-cover"
            />
            <div>
              <p className="font-black text-yellow-300">星夜聯盟</p>
              <p className="text-xs text-white/45">深夜不關燈 × 秋奈電競</p>
            </div>
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              location.reload();
            }}
            title="登出"
            className="p-2 text-white/55 hover:text-white"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        {message && (
          <div className="mb-5 border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-5 border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-100">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex min-h-[280px] flex-col justify-between overflow-hidden border border-yellow-300/30 bg-[#151421] p-7 shadow-[0_0_35px_rgba(250,204,21,.09)]">
            <div>
              <p className="text-xs font-bold tracking-[0.3em] text-yellow-300/75">
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
                      className="min-w-0 flex-1 border border-yellow-300/35 bg-black/25 px-3 py-2 text-sm text-white outline-none focus:border-yellow-300"
                    />
                    <button
                      disabled={busy}
                      onClick={() => void saveMemberName()}
                      title="儲存會員名稱"
                      className="grid h-9 w-9 shrink-0 place-items-center border border-yellow-300/35 text-yellow-200 disabled:opacity-50"
                    >
                      <Check size={16} />
                    </button>
                    {data.profile.isCustomName && (
                      <button
                        disabled={busy}
                        onClick={() => void saveMemberName(true)}
                        title="恢復 Discord 名稱"
                        className="grid h-9 w-9 shrink-0 place-items-center border border-white/15 text-white/65 disabled:opacity-50"
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
                      className="grid h-9 w-9 shrink-0 place-items-center border border-white/15 text-white/65 disabled:opacity-50"
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
                      className="grid h-8 w-8 place-items-center text-white/40 hover:text-yellow-200"
                    >
                      <Pencil size={15} />
                    </button>
                  </div>
                )}
              </div>
              <h1 className="mt-2 text-4xl font-black text-yellow-200">
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
              <Crown className="h-12 w-12 text-yellow-300/70" />
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
            <div className="col-span-2 border border-white/10 bg-white/[0.04] p-5 md:col-span-4">
              <div className="flex justify-between text-sm">
                <span>晉升 {data.nextTier?.tier_name || "尊享會員"}</span>
                <span className="text-yellow-300">
                  {data.nextTier
                    ? `尚差 ${(Number(data.nextTier.threshold_points) - Number(data.member.lifetime_points)).toFixed(2)} 點`
                    : "邀請制"}
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden bg-white/10">
                <div
                  className="h-full bg-yellow-300"
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

        <div className="mt-8 flex gap-1 overflow-x-auto border-b border-white/10">
          {[
            ["overview", "積分明細"],
            ["rewards", "兌換商品"],
            ["redemptions", "兌換紀錄"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`shrink-0 px-5 py-3 text-sm font-bold ${tab === key ? "border-b-2 border-yellow-300 text-yellow-200" : "text-white/50"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <section className="py-6">
            <div className="divide-y divide-white/10 border border-white/10">
              {data.ledger.length ? (
                data.ledger.map((item: Data) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-4"
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
            <div className="mb-6 border border-yellow-300/20 bg-yellow-300/[0.06] p-5">
              <h2 className="font-black text-yellow-200">自訂折價券</h2>
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
                  className="min-w-0 flex-1 border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-yellow-300"
                />
                <button
                  disabled={busy}
                  onClick={() =>
                    redeem({ discountPoints: Number(discountPoints) })
                  }
                  className="bg-yellow-300 px-5 py-3 font-black text-black disabled:opacity-50"
                >
                  兌換折價券
                </button>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.rewards.map((reward: Data) => (
                <article
                  key={reward.id}
                  className="border border-white/10 bg-white/[0.04] p-5"
                >
                  <Gift className="h-7 w-7 text-yellow-300" />
                  <h3 className="mt-4 text-lg font-black">{reward.name}</h3>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-white/50">
                    {reward.description || "星夜聯盟會員限定兌換"}
                  </p>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="font-bold text-yellow-200">
                      {Number(reward.points_cost).toLocaleString()} 點
                    </span>
                    <button
                      disabled={busy}
                      onClick={() => redeem({ rewardId: reward.id })}
                      className="border border-yellow-300/40 px-4 py-2 text-sm font-bold text-yellow-200 hover:bg-yellow-300 hover:text-black"
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
            <div className="divide-y divide-white/10 border border-white/10">
              {data.redemptions.length ? (
                data.redemptions.map((item: Data) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-4"
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
    <div className="border border-white/10 bg-white/[0.04] p-5">
      <div className="text-yellow-300 [&_svg]:h-5 [&_svg]:w-5">{icon}</div>
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
      className={`shrink-0 px-3 py-1 text-xs font-bold ${value === "approved" || value === "fulfilled" ? "bg-emerald-400/15 text-emerald-200" : value === "rejected" ? "bg-red-400/15 text-red-200" : "bg-yellow-300/15 text-yellow-200"}`}
    >
      {map[value] || value}
    </span>
  );
}
