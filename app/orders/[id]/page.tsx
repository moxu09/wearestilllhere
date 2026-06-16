"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Clock,
  Coins,
  CreditCard,
  Gamepad2,
  Headphones,
  Loader2,
  Lock,
  MessageSquareText,
  PlayCircle,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  Wallet,
} from "lucide-react";

type OrderStatus =
  | "pending_payment"
  | "paid"
  | "waiting_player"
  | "accepted"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "refunded"
  | "disputed";

type PaymentStatus = "unpaid" | "paid" | "refunded" | "cancelled";
type PaymentMethod = "wallet" | "transfer" | "card" | "manual";

type Order = {
  id: string;
  order_no: string;
  customer_user_id: string;
  player_id: string | null;
  player_user_id: string | null;
  title: string;
  note: string | null;
  total_amount: number;
  paid_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  status: OrderStatus;
  started_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  platform_players?: {
    nickname: string;
    avatar_url: string | null;
    rating_avg: number | string;
    total_orders: number;
  } | null;
};

type OrderItem = {
  id: string;
  order_id: string;
  service_name: string;
  unit_name: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
};

type Profile = {
  id: string;
  role: string | null;
};

const statusLabel: Record<OrderStatus, string> = {
  pending_payment: "待付款",
  paid: "已付款待接單",
  waiting_player: "等待陪玩師",
  accepted: "陪玩師已接單",
  in_progress: "服務進行中",
  completed: "訂單已完成",
  cancelled: "訂單已取消",
  refunded: "已退款",
  disputed: "爭議中",
};

const paymentStatusLabel: Record<PaymentStatus, string> = {
  unpaid: "未付款",
  paid: "已付款",
  refunded: "已退款",
  cancelled: "已取消",
};

const paymentMethodLabel: Record<PaymentMethod, string> = {
  wallet: "ASD 錢包",
  transfer: "轉帳 / 匯款",
  card: "刷卡",
  manual: "其他付款",
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const isCustomer = !!order && order.customer_user_id === currentUserId;
  const isPlayer = !!order && order.player_user_id === currentUserId;
  const isAdmin = profile?.role === "admin" || profile?.role === "staff";
  const canManage = isPlayer || isAdmin;

  const progressStep = useMemo(() => {
    if (!order) return 0;

    if (order.status === "pending_payment") return 1;
    if (order.status === "paid" || order.status === "waiting_player") return 2;
    if (order.status === "accepted") return 3;
    if (order.status === "in_progress") return 4;
    if (order.status === "completed") return 5;

    return 1;
  }, [order]);

  useEffect(() => {
    if (!orderId) return;
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function loadOrder() {
    setLoading(true);
    setError("");
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    setCurrentUserId(user?.id || null);

    if (!user) {
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from("platform_profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle();

    setProfile(profileData as Profile | null);

    const { data: orderData, error: orderError } = await supabase
      .from("platform_orders")
      .select(
        `
        id,
        order_no,
        customer_user_id,
        player_id,
        player_user_id,
        title,
        note,
        total_amount,
        paid_amount,
        payment_method,
        payment_status,
        status,
        started_at,
        completed_at,
        cancelled_at,
        created_at,
        updated_at,
        platform_players (
          nickname,
          avatar_url,
          rating_avg,
          total_orders
        )
      `
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      setError("讀取訂單失敗：" + orderError.message);
      setLoading(false);
      return;
    }

    if (!orderData) {
      setOrder(null);
      setLoading(false);
      return;
    }

    setOrder(orderData as unknown as Order);

    const { data: itemData, error: itemError } = await supabase
      .from("platform_order_items")
      .select(
        `
        id,
        order_id,
        service_name,
        unit_name,
        unit_price,
        quantity,
        subtotal
      `
      )
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });

    if (itemError) {
      setError("讀取訂單明細失敗：" + itemError.message);
      setLoading(false);
      return;
    }

    setItems((itemData || []) as OrderItem[]);
    setLoading(false);
  }

  async function runOrderAction(action: "accept" | "start" | "complete") {
    if (!order) return;

    setBusy(true);
    setError("");
    setMessage("");

    const rpcName =
      action === "accept"
        ? "platform_accept_order"
        : action === "start"
        ? "platform_start_order"
        : "platform_complete_order";

    const { error } = await supabase.rpc(rpcName, {
      p_order_id: order.id,
    });

    if (error) {
      setError("操作失敗：" + error.message);
      setBusy(false);
      return;
    }

    const actionText =
      action === "accept"
        ? "已接單"
        : action === "start"
        ? "已開始服務"
        : "已完成訂單";

    setMessage(actionText);
    setBusy(false);
    await loadOrder();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取訂單中...</span>
        </div>
      </main>
    );
  }

  if (!currentUserId) {
    return (
      <AccessCard
        icon={<Lock className="h-8 w-8" />}
        title="請先登入會員"
        desc="登入後才能查看訂單詳情。"
        buttonText="前往登入"
        buttonHref={`/login?next=/orders/${orderId}`}
      />
    );
  }

  if (!order) {
    return (
      <AccessCard
        icon={<ReceiptText className="h-8 w-8" />}
        title="找不到這筆訂單"
        desc="這筆訂單可能不存在，或你沒有權限查看。"
        buttonText="回陪玩師大廳"
        buttonHref="/players"
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-950">
      <section className="relative overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-200/70 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-10">
          <a
            href={order.player_id ? `/players/${order.player_id}` : "/players"}
            className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-white hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" />
            回陪玩師資料
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

          <section className="mb-6 rounded-[2rem] border border-white/70 bg-white/80 p-7 shadow-xl backdrop-blur-xl">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700">
                  <Sparkles className="h-4 w-4" />
                  ORDER DETAIL
                </div>

                <h1 className="text-4xl font-black leading-tight text-slate-950 md:text-5xl">
                  {order.title}
                </h1>

                <p className="mt-3 text-sm font-semibold text-slate-500">
                  訂單編號：{order.order_no} ｜ 建立時間{" "}
                  {new Date(order.created_at).toLocaleString("zh-TW")}
                </p>
              </div>

              <div className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5 text-right">
                <p className="text-sm font-bold text-slate-500">訂單金額</p>
                <p className="mt-2 text-4xl font-black text-violet-700">
                  {order.total_amount.toLocaleString()} ASD
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  {paymentStatusLabel[order.payment_status]}
                </p>
              </div>
            </div>
          </section>

          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="grid gap-6">
              <Panel title="訂單狀態" icon={<ReceiptText className="h-5 w-5" />}>
                <StatusBadge status={order.status} />

                <div className="mt-6 grid gap-3">
                  <ProgressStep
                    active={progressStep >= 1}
                    title="建立訂單"
                    desc="會員送出訂單需求。"
                  />
                  <ProgressStep
                    active={progressStep >= 2}
                    title="付款完成"
                    desc="ASD 錢包付款會立即完成；其他付款方式需客服確認。"
                  />
                  <ProgressStep
                    active={progressStep >= 3}
                    title="陪玩師接單"
                    desc="陪玩師確認接單後，訂單會進入等待開始。"
                  />
                  <ProgressStep
                    active={progressStep >= 4}
                    title="服務進行中"
                    desc="陪玩或陪聊正在進行。"
                  />
                  <ProgressStep
                    active={progressStep >= 5}
                    title="訂單完成"
                    desc="服務結束後完成訂單。"
                  />
                </div>
              </Panel>

              <Panel title="陪玩師資訊" icon={<UserRound className="h-5 w-5" />}>
                <div className="flex items-center gap-4 rounded-3xl bg-slate-50/80 p-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white text-violet-700 shadow-sm">
                    {order.platform_players?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={order.platform_players.avatar_url}
                        alt={order.platform_players.nickname}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserRound className="h-8 w-8" />
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-black text-slate-950">
                        {order.platform_players?.nickname || "陪玩師"}
                      </p>
                      <BadgeCheck className="h-5 w-5 text-violet-600" />
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      評價{" "}
                      {Number(order.platform_players?.rating_avg || 0).toFixed(1)}
                      ｜完成 {order.platform_players?.total_orders || 0} 筆訂單
                    </p>
                  </div>
                </div>
              </Panel>

              <Panel title="需求備註" icon={<MessageSquareText className="h-5 w-5" />}>
                <p className="rounded-3xl bg-slate-50/80 p-5 text-sm leading-8 text-slate-600">
                  {order.note || "會員沒有填寫需求備註。"}
                </p>
              </Panel>
            </div>

            <div className="grid gap-6">
              <Panel title="付款資訊" icon={<Wallet className="h-5 w-5" />}>
                <div className="grid gap-3">
                  <InfoLine
                    label="付款方式"
                    value={paymentMethodLabel[order.payment_method]}
                    icon={<CreditCard />}
                  />
                  <InfoLine
                    label="付款狀態"
                    value={paymentStatusLabel[order.payment_status]}
                    icon={<ShieldCheck />}
                  />
                  <InfoLine
                    label="已付金額"
                    value={`${order.paid_amount.toLocaleString()} ASD`}
                    icon={<Coins />}
                  />
                  <InfoLine
                    label="應付金額"
                    value={`${order.total_amount.toLocaleString()} ASD`}
                    icon={<Wallet />}
                  />
                </div>

                {order.payment_status === "unpaid" && (
                  <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50 p-5">
                    <p className="font-black text-amber-700">等待付款確認</p>
                    <p className="mt-2 text-sm leading-7 text-amber-700/80">
                      這筆訂單使用的是非 ASD 錢包付款，下一步會做管理員確認付款功能。
                    </p>
                  </div>
                )}
              </Panel>

              <Panel title="訂單明細" icon={<Gamepad2 className="h-5 w-5" />}>
                <div className="grid gap-3">
                  {items.length === 0 ? (
                    <p className="rounded-3xl bg-slate-50 p-5 text-sm text-slate-500">
                      目前沒有訂單明細。
                    </p>
                  ) : (
                    items.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-3xl border border-slate-100 bg-slate-50/80 p-5"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-black text-slate-950">
                              {item.service_name}
                            </p>
                            <p className="mt-1 text-xs font-bold text-violet-700">
                              {item.unit_name || "次"}
                            </p>
                          </div>

                          <p className="text-right text-lg font-black text-amber-600">
                            {item.subtotal.toLocaleString()} ASD
                          </p>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2">
                          <MiniBox label="單價" value={`${item.unit_price} ASD`} />
                          <MiniBox label="數量" value={String(item.quantity)} />
                          <MiniBox label="小計" value={`${item.subtotal} ASD`} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Panel>

              <OrderActionPanel
                order={order}
                busy={busy}
                canManage={canManage}
                isCustomer={isCustomer}
                onAccept={() => runOrderAction("accept")}
                onStart={() => runOrderAction("start")}
                onComplete={() => runOrderAction("complete")}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function OrderActionPanel({
  order,
  busy,
  canManage,
  isCustomer,
  onAccept,
  onStart,
  onComplete,
}: {
  order: Order;
  busy: boolean;
  canManage: boolean;
  isCustomer: boolean;
  onAccept: () => void;
  onStart: () => void;
  onComplete: () => void;
}) {
  return (
    <section className="rounded-[2rem] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-6 shadow-xl">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
          <Headphones className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-black text-slate-950">訂單操作</h2>
      </div>

      {!canManage && (
        <div className="rounded-3xl border border-slate-100 bg-white/80 p-5">
          <p className="font-black text-slate-900">
            {isCustomer ? "等待陪玩師處理" : "你沒有操作權限"}
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            會員可以查看訂單進度。接單、開始與完成會由陪玩師或管理員操作。
          </p>
        </div>
      )}

      {canManage && order.payment_status !== "paid" && (
        <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-black text-amber-700">訂單尚未付款</p>
          <p className="mt-2 text-sm leading-7 text-amber-700/80">
            付款完成前不能接單。下一步會做管理員確認付款。
          </p>
        </div>
      )}

      {canManage && order.payment_status === "paid" && (
        <div className="grid gap-3">
          {order.status === "paid" || order.status === "waiting_player" ? (
            <button
              onClick={onAccept}
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}
              接受訂單
            </button>
          ) : null}

          {order.status === "accepted" ? (
            <button
              onClick={onStart}
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-indigo-100 transition hover:bg-indigo-500 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <PlayCircle className="h-5 w-5" />
              )}
              開始服務
            </button>
          ) : null}

          {order.status === "accepted" || order.status === "in_progress" ? (
            <button
              onClick={onComplete}
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-400 disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <BadgeCheck className="h-5 w-5" />
              )}
              完成訂單
            </button>
          ) : null}

          {order.status === "completed" ? (
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <BadgeCheck className="mx-auto mb-3 h-8 w-8 text-emerald-600" />
              <p className="font-black text-emerald-700">這筆訂單已完成</p>
            </div>
          ) : null}
        </div>
      )}
    </section>
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

        <p className="text-sm font-bold text-violet-600">ORDER</p>
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

function StatusBadge({ status }: { status: OrderStatus }) {
  const style =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "cancelled" || status === "refunded" || status === "disputed"
      ? "bg-red-50 text-red-600 border-red-200"
      : status === "pending_payment"
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : "bg-violet-50 text-violet-700 border-violet-200";

  return (
    <div className={`inline-flex rounded-2xl border px-4 py-2 text-sm font-black ${style}`}>
      {statusLabel[status]}
    </div>
  );
}

function ProgressStep({
  active,
  title,
  desc,
}: {
  active: boolean;
  title: string;
  desc: string;
}) {
  return (
    <div
      className={`flex gap-4 rounded-3xl border p-4 ${
        active
          ? "border-violet-200 bg-violet-50"
          : "border-slate-100 bg-slate-50/80"
      }`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
          active ? "bg-violet-600 text-white" : "bg-white text-slate-300"
        }`}
      >
        {active ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
      </div>

      <div>
        <p className="font-black text-slate-950">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function InfoLine({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm [&_svg]:h-4 [&_svg]:w-4">
          {icon}
        </div>
        <span className="text-sm font-bold text-slate-500">{label}</span>
      </div>
      <span className="text-sm font-black text-slate-950">{value}</span>
    </div>
  );
}

function MiniBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
      <p className="text-sm font-black text-slate-950">{value}</p>
      <p className="mt-1 text-[11px] font-semibold text-slate-400">
        {label}
      </p>
    </div>
  );
}