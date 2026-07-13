"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Coins,
  Gift,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wallet,
} from "lucide-react";

type WalletData = {
  balance: number;
  frozen_balance: number;
};

type Player = {
  id: string;
  user_id: string;
  nickname: string;
  avatar_url: string | null;
  intro: string | null;
  rating_avg: number | string;
  total_orders: number;
  is_online: boolean;
  is_accepting_orders: boolean;
  status: string;
};

type GiftItem = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  price: number;
  broadcast_type: "none" | "banner" | "fullscreen";
  sort_order: number;
};

export default function SendGiftPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
          <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
            <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
            <span className="text-sm text-slate-500">讀取送禮頁中...</span>
          </div>
        </main>
      }
    >
      <SendGiftPageContent />
    </Suspense>
  );
}

function SendGiftPageContent() {
  const searchParams = useSearchParams();

  const queryPlayerId = searchParams.get("playerId");
  const queryGiftId = searchParams.get("giftId");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gifts, setGifts] = useState<GiftItem[]>([]);

  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedGiftId, setSelectedGiftId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [messageText, setMessageText] = useState("");
  const [keyword, setKeyword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedPlayer = useMemo(() => {
    return players.find((player) => player.id === selectedPlayerId) || null;
  }, [players, selectedPlayerId]);

  const selectedGift = useMemo(() => {
    return gifts.find((gift) => gift.id === selectedGiftId) || null;
  }, [gifts, selectedGiftId]);

  const totalAmount = useMemo(() => {
    if (!selectedGift) return 0;
    return selectedGift.price * Math.max(quantity, 1);
  }, [selectedGift, quantity]);

  const platformFee = Math.floor(totalAmount * 0.1);
  const playerIncome = totalAmount - platformFee;
  const balance = wallet?.balance || 0;
  const insufficient = totalAmount > balance;

  const filteredPlayers = useMemo(() => {
    const text = keyword.trim().toLowerCase();

    if (!text) return players;

    return players.filter((player) =>
      [player.nickname, player.intro]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(text)
    );
  }, [players, keyword]);

  useEffect(() => {
    loadPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const [walletResult, playersResult, giftsResult] = await Promise.all([
      supabase
        .from("platform_wallets")
        .select("balance, frozen_balance")
        .eq("user_id", user.id)
        .maybeSingle(),

      supabase
        .from("platform_players")
        .select(
          `
          id,
          user_id,
          nickname,
          avatar_url,
          intro,
          rating_avg,
          total_orders,
          is_online,
          is_accepting_orders,
          status
        `
        )
        .eq("status", "active")
        .order("is_online", { ascending: false })
        .order("is_accepting_orders", { ascending: false })
        .order("total_orders", { ascending: false }),

      supabase
        .from("platform_gifts")
        .select(
          `
          id,
          name,
          description,
          icon,
          image_url,
          price,
          broadcast_type,
          sort_order
        `
        )
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),
    ]);

    if (walletResult.error) {
      setError("讀取錢包失敗：" + walletResult.error.message);
      setLoading(false);
      return;
    }

    if (playersResult.error) {
      setError("讀取陪玩師失敗：" + playersResult.error.message);
      setLoading(false);
      return;
    }

    if (giftsResult.error) {
      setError("讀取禮物失敗：" + giftsResult.error.message);
      setLoading(false);
      return;
    }

    const playerRows = (playersResult.data || []) as unknown as Player[];
    const giftRows = (giftsResult.data || []) as GiftItem[];

    setWallet(walletResult.data as WalletData | null);
    setPlayers(playerRows);
    setGifts(giftRows);

    const validQueryPlayer = playerRows.find((player) => player.id === queryPlayerId);
    const validQueryGift = giftRows.find((gift) => gift.id === queryGiftId);

    setSelectedPlayerId(validQueryPlayer?.id || playerRows[0]?.id || "");
    setSelectedGiftId(validQueryGift?.id || giftRows[0]?.id || "");

    setLoading(false);
  }

  async function sendGift() {
    setError("");
    setMessage("");

    if (!userId) {
      setError("請先登入會員。");
      return;
    }

    if (!selectedPlayerId) {
      setError("請選擇要送禮的陪玩師。");
      return;
    }

    if (!selectedGiftId) {
      setError("請選擇禮物。");
      return;
    }

    if (quantity <= 0) {
      setError("數量必須大於 0。");
      return;
    }

    if (insufficient) {
      setError("ASD 餘額不足，請先儲值。");
      return;
    }

    const ok = window.confirm(
      `確定要送出「${selectedGift?.name}」x ${quantity}，共 ${totalAmount.toLocaleString()} ASD 嗎？`
    );

    if (!ok) return;

    setSubmitting(true);

    const { error } = await supabase.rpc("platform_send_gift", {
      p_receiver_player_id: selectedPlayerId,
      p_gift_id: selectedGiftId,
      p_quantity: quantity,
      p_message: messageText.trim() || null,
    });

    if (error) {
      setError("送禮失敗：" + error.message);
      setSubmitting(false);
      return;
    }

    setMessage(
      selectedGift?.broadcast_type === "fullscreen"
        ? "禮物已送出，全站播報已觸發。"
        : "禮物已送出。"
    );

    setMessageText("");
    setQuantity(1);
    setSubmitting(false);

    await loadPage();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取送禮頁中...</span>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <AccessCard
        icon={<Lock className="h-8 w-8" />}
        title="請先登入會員"
        desc="登入後才能使用 ASD 送禮給陪玩師。"
        buttonText="前往登入"
        buttonHref="/login?next=/gifts/send"
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
          <Link
            href="/players"
            className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-white hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" />
            回陪玩師大廳
          </Link>

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
                <Gift className="h-4 w-4" />
                SEND GIFT
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                送禮打賞
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                使用 ASD 送禮給陪玩師。高額禮物會觸發全站播報，讓整個平台一起看到你的心意。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <BalanceCard
                title="目前餘額"
                value={`${balance.toLocaleString()} ASD`}
                icon={<Wallet />}
              />
              <BalanceCard
                title="本次金額"
                value={`${totalAmount.toLocaleString()} ASD`}
                icon={<Coins />}
              />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <UserRound className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-slate-950">
                  選擇陪玩師
                </h2>
              </div>

              <div className="mb-4 flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-violet-300 focus-within:bg-white">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="搜尋陪玩師暱稱..."
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="grid max-h-[620px] gap-3 overflow-y-auto pr-1">
                {filteredPlayers.length === 0 ? (
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                    目前沒有找到陪玩師。
                  </div>
                ) : (
                  filteredPlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => setSelectedPlayerId(player.id)}
                      className={`rounded-3xl border p-4 text-left transition ${
                        selectedPlayerId === player.id
                          ? "border-violet-300 bg-violet-50 shadow-lg shadow-violet-100"
                          : "border-slate-100 bg-slate-50/80 hover:border-violet-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white text-violet-700 shadow-sm">
                          {player.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={player.avatar_url}
                              alt={player.nickname}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserRound className="h-7 w-7" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-black text-slate-950">
                              {player.nickname}
                            </p>
                            {player.is_online && (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-black text-emerald-600">
                                在線
                              </span>
                            )}
                            {player.is_accepting_orders && (
                              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-black text-violet-600">
                                可接單
                              </span>
                            )}
                          </div>

                          <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                            {player.intro || "這位陪玩師還沒有填寫介紹。"}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            評價 {Number(player.rating_avg || 0).toFixed(1)} ｜完成{" "}
                            {player.total_orders || 0} 筆
                          </p>
                        </div>

                        {selectedPlayerId === player.id && (
                          <BadgeCheck className="h-5 w-5 shrink-0 text-violet-600" />
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <Gift className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-black text-slate-950">
                  選擇禮物
                </h2>
              </div>

              <div className="grid max-h-[500px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                {gifts.map((gift) => (
                  <button
                    key={gift.id}
                    onClick={() => setSelectedGiftId(gift.id)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      selectedGiftId === gift.id
                        ? "border-violet-300 bg-violet-50 shadow-lg shadow-violet-100"
                        : "border-slate-100 bg-slate-50/80 hover:border-violet-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex gap-4">
                      <GiftImage gift={gift} />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="line-clamp-1 font-black text-slate-950">
                            {gift.name}
                          </p>
                          {selectedGiftId === gift.id && (
                            <BadgeCheck className="h-5 w-5 shrink-0 text-violet-600" />
                          )}
                        </div>

                        <p className="mt-1 text-lg font-black text-amber-600">
                          {gift.price.toLocaleString()} ASD
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {gift.description || "送出一份心意。"}
                        </p>

                        {gift.broadcast_type === "fullscreen" && (
                          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">
                            <Sparkles className="h-3 w-3" />
                            全屏播報
                          </div>
                        )}

                        {gift.broadcast_type === "banner" && (
                          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-[11px] font-black text-violet-700">
                            <Sparkles className="h-3 w-3" />
                            小播報
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-5 rounded-[2rem] border border-slate-100 bg-slate-50/80 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="text-sm font-bold text-slate-700">
                      數量
                    </span>
                    <input
                      value={quantity}
                      min={1}
                      max={99}
                      type="number"
                      onChange={(e) =>
                        setQuantity(Math.max(Number(e.target.value || 1), 1))
                      }
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-300"
                    />
                  </label>

                  <div>
                    <p className="text-sm font-bold text-slate-700">總金額</p>
                    <div className="mt-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-violet-700 shadow-sm">
                      {totalAmount.toLocaleString()} ASD
                    </div>
                  </div>
                </div>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    留言
                  </span>
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={4}
                    placeholder="想對陪玩師說的話..."
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-violet-300"
                  />
                </label>

                <section className="rounded-3xl bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <h3 className="font-black text-slate-950">送禮確認</h3>
                  </div>

                  <div className="grid gap-3">
                    <SummaryLine
                      label="送給"
                      value={selectedPlayer?.nickname || "尚未選擇"}
                    />
                    <SummaryLine
                      label="禮物"
                      value={selectedGift?.name || "尚未選擇"}
                    />
                    <SummaryLine
                      label="數量"
                      value={String(quantity)}
                    />
                    <SummaryLine
                      label="平台抽成"
                      value={`${platformFee.toLocaleString()} ASD`}
                    />
                    <SummaryLine
                      label="陪玩師收入"
                      value={`${playerIncome.toLocaleString()} ASD`}
                    />
                    <SummaryLine
                      label="付款金額"
                      value={`${totalAmount.toLocaleString()} ASD`}
                    />
                  </div>

                  {insufficient && (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
                      ASD 餘額不足，請先儲值。
                    </div>
                  )}

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <a
                      href="/wallet/topup"
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-violet-50 hover:text-violet-700"
                    >
                      先去儲值
                      <ArrowRight className="h-4 w-4" />
                    </a>

                    <button
                      onClick={sendGift}
                      disabled={submitting || insufficient || !selectedGiftId || !selectedPlayerId}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:opacity-60"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          送出中...
                        </>
                      ) : (
                        <>
                          送出禮物
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                </section>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function GiftImage({ gift }: { gift: GiftItem }) {
  if (gift.image_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={gift.image_url}
        alt={gift.name}
        className="h-20 w-20 shrink-0 object-contain"
      />
    );
  }

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white text-4xl shadow-sm">
      {gift.icon || "🎁"}
    </div>
  );
}

function BalanceCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 [&_svg]:h-6 [&_svg]:w-6">
        {icon}
      </div>
      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-3xl font-black text-slate-950">{value}</p>
    </section>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="break-all text-right font-black text-slate-900">
        {value}
      </span>
    </div>
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

        <p className="text-sm font-bold text-violet-600">GIFT</p>
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
