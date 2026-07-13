"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Coins,
  CreditCard,
  Gamepad2,
  Loader2,
  Lock,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Wallet,
} from "lucide-react";

type Player = {
  id: string;
  user_id: string;
  nickname: string;
  gender: string | null;
  intro: string | null;
  avatar_url: string | null;
  is_online: boolean;
  is_accepting_orders: boolean;
  rating_avg: number | string;
  rating_count: number;
  total_orders: number;
};

type PlayerService = {
  id: string;
  player_id: string;
  custom_price: number | null;
  is_enabled: boolean;
  platform_services?: {
    id: string;
    name: string;
    description: string | null;
    base_price: number;
    pricing_type: string;
    duration_minutes: number | null;
    unit_name: string | null;
    platform_service_categories?: {
      name: string;
      slug: string;
    } | null;
  } | null;
};

type WalletData = {
  balance: number;
};

type PaymentMethod = "wallet" | "transfer" | "manual";

export default function NewOrderPage() {
  return (
    <Suspense fallback={<LoadingView />}>
      <NewOrderContent />
    </Suspense>
  );
}

function NewOrderContent() {
  const searchParams = useSearchParams();
  const playerId = searchParams.get("playerId") || "";
  const serviceIdFromUrl = searchParams.get("serviceId") || "";

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [services, setServices] = useState<PlayerService[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [note, setNote] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedService = useMemo(() => {
    return services.find((service) => service.id === selectedServiceId) || null;
  }, [services, selectedServiceId]);

  const unitPrice = useMemo(() => {
    if (!selectedService) return 0;
    return getServicePrice(selectedService);
  }, [selectedService]);

  const totalAmount = useMemo(() => {
    return unitPrice * Math.max(quantity, 1);
  }, [unitPrice, quantity]);

  const walletEnough = (wallet?.balance || 0) >= totalAmount;

  async function loadPage() {
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUserId(user?.id || null);

    if (!user) {
      setLoading(false);
      return;
    }

    if (!playerId) {
      setError("缺少陪玩師 ID。請從陪玩師頁面進入下單。");
      setLoading(false);
      return;
    }

    const { data: playerData, error: playerError } = await supabase
      .from("platform_players")
      .select(
        `
        id,
        user_id,
        nickname,
        gender,
        intro,
        avatar_url,
        is_online,
        is_accepting_orders,
        rating_avg,
        rating_count,
        total_orders
      `
      )
      .eq("id", playerId)
      .eq("status", "active")
      .maybeSingle();

    if (playerError) {
      setError("讀取陪玩師失敗：" + playerError.message);
      setLoading(false);
      return;
    }

    if (!playerData) {
      setError("找不到這位陪玩師。");
      setLoading(false);
      return;
    }

    setPlayer(playerData as Player);

    const { data: serviceData, error: serviceError } = await supabase
      .from("platform_player_services")
      .select(
        `
        id,
        player_id,
        custom_price,
        is_enabled,
        platform_services (
          id,
          name,
          description,
          base_price,
          pricing_type,
          duration_minutes,
          unit_name,
          platform_service_categories (
            name,
            slug
          )
        )
      `
      )
      .eq("player_id", playerId)
      .eq("is_enabled", true);

    if (serviceError) {
      setError("讀取服務失敗：" + serviceError.message);
      setLoading(false);
      return;
    }

    const serviceRows = (serviceData || []) as unknown as PlayerService[];
    setServices(serviceRows);

    const foundService = serviceRows.find((service) => service.id === serviceIdFromUrl);
    setSelectedServiceId(foundService?.id || serviceRows[0]?.id || "");

    const { data: walletData } = await supabase
      .from("platform_wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle();

    setWallet(walletData as WalletData | null);

    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void loadPage(), 0);
    return () => window.clearTimeout(timer);
    // Reload when the selected player changes; URL service selection is handled inside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  async function submitOrder() {
    setError("");
    setMessage("");

    if (!userId) {
      setError("請先登入會員。");
      return;
    }

    if (!player) {
      setError("找不到陪玩師資料。");
      return;
    }

    if (!selectedService) {
      setError("請選擇服務項目。");
      return;
    }

    if (quantity < 1) {
      setError("數量至少為 1。");
      return;
    }

    if (paymentMethod === "wallet" && !walletEnough) {
      setError("ASD 餘額不足，請改用其他付款方式。");
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.rpc("platform_create_order", {
      p_player_id: player.id,
      p_player_service_id: selectedService.id,
      p_quantity: quantity,
      p_note: note.trim() || null,
      p_payment_method: paymentMethod,
    });

    if (error) {
      setError("建立訂單失敗：" + error.message);
      setSubmitting(false);
      return;
    }

    setMessage("訂單建立成功。");

    const orderId = data as string;
    window.location.href = `/orders/${orderId}`;
  }

  if (loading) {
    return <LoadingView />;
  }

  if (!userId) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-16 text-slate-950">
        <section className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
            <Lock className="h-8 w-8" />
          </div>

          <p className="text-sm font-bold text-violet-600">ORDER</p>
          <h1 className="mt-2 text-3xl font-black">請先登入後下單</h1>
          <p className="mt-4 text-sm leading-7 text-slate-500">
            登入會員後可以使用 ASD 錢包付款、建立訂單、查看訂單進度。
          </p>

          <a
            href={`/login?next=${encodeURIComponent(
              `/orders/new?playerId=${playerId}${
                serviceIdFromUrl ? `&serviceId=${serviceIdFromUrl}` : ""
              }`
            )}`}
            className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
          >
            登入 / 註冊會員
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

        <div className="relative mx-auto max-w-7xl px-4 py-10">
          <a
            href={player ? `/players/${player.id}` : "/players"}
            className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-white hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" />
            回陪玩師資料
          </a>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          <div className="mb-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              CREATE ORDER
            </div>

            <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
              建立陪玩訂單
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
              選擇服務、數量與付款方式。ASD 錢包付款會立即扣款並建立已付款訂單。
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="grid gap-6">
              <Panel title="陪玩師" icon={<UserRound className="h-5 w-5" />}>
                {player ? (
                  <div className="flex items-center gap-4 rounded-3xl bg-slate-50/80 p-4">
                    <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white text-violet-700 shadow-sm">
                      {player.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={player.avatar_url}
                          alt={player.nickname}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound className="h-8 w-8" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xl font-black text-slate-950">
                          {player.nickname}
                        </p>
                        <BadgeCheck className="h-5 w-5 text-violet-600" />
                      </div>
                      <p className="mt-1 text-sm text-slate-500">
                        評價 {Number(player.rating_avg || 0).toFixed(1)} ｜完成{" "}
                        {player.total_orders || 0} 筆訂單
                      </p>
                      <p
                        className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-black ${
                          player.is_accepting_orders
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {player.is_accepting_orders ? "目前可接單" : "目前未開放接單"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">找不到陪玩師。</p>
                )}
              </Panel>

              <Panel title="選擇服務" icon={<Gamepad2 className="h-5 w-5" />}>
                {services.length === 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-6 text-center">
                    <p className="font-black text-slate-950">尚未設定可接服務</p>
                    <p className="mt-2 text-sm text-slate-500">
                      這位陪玩師目前還沒有設定服務。
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {services.map((service) => {
                      const active = selectedServiceId === service.id;
                      const price = getServicePrice(service);

                      return (
                        <button
                          key={service.id}
                          onClick={() => setSelectedServiceId(service.id)}
                          className={`rounded-3xl border p-5 text-left transition ${
                            active
                              ? "border-violet-300 bg-violet-50 shadow-lg shadow-violet-100"
                              : "border-slate-100 bg-slate-50/80 hover:border-violet-200 hover:bg-white"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-black text-slate-950">
                                {service.platform_services?.name || "未命名服務"}
                              </p>
                              <p className="mt-1 text-xs font-bold text-violet-700">
                                {service.platform_services?.platform_service_categories
                                  ?.name || "服務分類"}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-white px-3 py-2 text-right shadow-sm">
                              <p className="text-sm font-black text-amber-600">
                                {price} ASD
                              </p>
                              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                                {service.platform_services?.unit_name || "次"}
                              </p>
                            </div>
                          </div>

                          <p className="mt-3 text-sm leading-7 text-slate-500">
                            {service.platform_services?.description ||
                              "尚未填寫服務介紹。"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Panel>
            </div>

            <div className="grid gap-6">
              <Panel title="訂單設定" icon={<MessageSquareText className="h-5 w-5" />}>
                <div className="grid gap-4">
                  <label>
                    <span className="text-sm font-bold text-slate-700">
                      數量 / 小時 / 次數
                    </span>
                    <input
                      value={quantity}
                      min={1}
                      type="number"
                      onChange={(e) => setQuantity(Number(e.target.value))}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-violet-300 focus:bg-white"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-bold text-slate-700">需求備註</span>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={5}
                      placeholder="例如：想打特戰娛樂、希望語氣輕鬆、預計晚上 10 點開始..."
                      className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 outline-none transition focus:border-violet-300 focus:bg-white"
                    />
                  </label>
                </div>
              </Panel>

              <Panel title="付款方式" icon={<Wallet className="h-5 w-5" />}>
                <div className="grid gap-3">
                  <PaymentButton
                    active={paymentMethod === "wallet"}
                    title="ASD 錢包付款"
                    desc={`目前餘額 ${(wallet?.balance || 0).toLocaleString()} ASD`}
                    icon={<Coins />}
                    onClick={() => setPaymentMethod("wallet")}
                  />

                  <PaymentButton
                    active={paymentMethod === "transfer"}
                    title="轉帳 / 匯款"
                    desc="建立待付款訂單，之後由客服確認收款。"
                    icon={<CreditCard />}
                    onClick={() => setPaymentMethod("transfer")}
                  />

                  <PaymentButton
                    active={paymentMethod === "manual"}
                    title="其他付款方式"
                    desc="適合刷卡、無卡或人工付款流程。"
                    icon={<ShieldCheck />}
                    onClick={() => setPaymentMethod("manual")}
                  />
                </div>

                {paymentMethod === "wallet" && !walletEnough && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-700">
                    ASD 餘額不足，請改用其他付款方式。
                  </div>
                )}
              </Panel>

              <OrderSummary
                selectedService={selectedService}
                unitPrice={unitPrice}
                quantity={quantity}
                totalAmount={totalAmount}
                paymentMethod={paymentMethod}
              />

              <button
                onClick={submitOrder}
                disabled={
                  submitting ||
                  !player ||
                  !selectedService ||
                  services.length === 0 ||
                  (paymentMethod === "wallet" && !walletEnough)
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-4 font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:bg-slate-300 disabled:shadow-none"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    建立訂單中...
                  </>
                ) : (
                  <>
                    送出訂單
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function LoadingView() {
  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
      <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
        <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
        <span className="text-sm text-slate-500">讀取下單頁中...</span>
      </div>
    </main>
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

function PaymentButton({
  active,
  title,
  desc,
  icon,
  onClick,
}: {
  active: boolean;
  title: string;
  desc: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 rounded-3xl border p-4 text-left transition ${
        active
          ? "border-violet-300 bg-violet-50 shadow-lg shadow-violet-100"
          : "border-slate-100 bg-slate-50/80 hover:border-violet-200 hover:bg-white"
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <div>
        <p className="font-black text-slate-950">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p>
      </div>
    </button>
  );
}

function OrderSummary({
  selectedService,
  unitPrice,
  quantity,
  totalAmount,
  paymentMethod,
}: {
  selectedService: PlayerService | null;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
}) {
  const paymentLabel: Record<PaymentMethod, string> = {
    wallet: "ASD 錢包",
    transfer: "轉帳 / 匯款",
    manual: "其他付款",
  };

  return (
    <section className="rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6 shadow-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
          <Star className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-black text-slate-950">訂單摘要</h2>
      </div>

      <div className="grid gap-3">
        <SummaryLine
          label="服務"
          value={selectedService?.platform_services?.name || "尚未選擇"}
        />
        <SummaryLine label="單價" value={`${unitPrice.toLocaleString()} ASD`} />
        <SummaryLine label="數量" value={String(Math.max(quantity, 1))} />
        <SummaryLine label="付款" value={paymentLabel[paymentMethod]} />
      </div>

      <div className="mt-5 rounded-3xl bg-white/80 p-5">
        <p className="text-sm font-bold text-slate-500">應付金額</p>
        <p className="mt-2 text-4xl font-black text-violet-700">
          {totalAmount.toLocaleString()} ASD
        </p>
      </div>
    </section>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/80 px-4 py-3 text-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-black text-slate-900">{value}</span>
    </div>
  );
}

function getServicePrice(service: PlayerService) {
  if (typeof service.custom_price === "number" && service.custom_price > 0) {
    return service.custom_price;
  }

  if (
    typeof service.platform_services?.base_price === "number" &&
    service.platform_services.base_price > 0
  ) {
    return service.platform_services.base_price;
  }

  return 0;
}
