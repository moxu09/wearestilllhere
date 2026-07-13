"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CirclePlay,
  Handshake,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type ActorRole = "customer" | "player" | "staff" | "admin";

type ChatMessage = {
  id: string;
  order_id: string;
  sender_id: string;
  sender_role: "customer" | "player" | "staff" | "admin" | "system";
  sender_name: string;
  sender_profile_role: string | null;
  body: string;
  attachment_url: string | null;
  attachment_type: string | null;
  is_system: boolean;
  is_mine: boolean;
  created_at: string;
  updated_at: string;
};

type OrderInfo = {
  title: string;
  order_no: string;
  status: string;
  payment_status: string;
  total_amount: number;
};

type MessagesResponse = {
  order?: OrderInfo;
  actor_role?: ActorRole;
  messages?: ChatMessage[];
  error?: string;
};

type ActionResponse = {
  ok?: boolean;
  action?: string;
  status?: string;
  message?: string;
  order?: OrderInfo;
  error?: string;
};

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();

  if (!text) {
    return {} as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(
      `API 回傳不是 JSON。狀態碼：${response.status}，內容：${text.slice(
        0,
        300
      )}`
    );
  }
}

function getRoleLabel(role: string) {
  if (role === "admin") return "管理員";
  if (role === "staff") return "客服";
  if (role === "player") return "陪玩師";
  if (role === "system") return "系統";
  return "會員";
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
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

  return labels[status] || status || "未知狀態";
}

function getPaymentStatusLabel(status: string) {
  const labels: Record<string, string> = {
    unpaid: "未付款",
    paid: "已付款",
    refunded: "已退款",
    cancelled: "已取消",
  };

  return labels[status] || status || "未知付款狀態";
}

function canManageOrder(actorRole: string) {
  return actorRole === "admin" || actorRole === "staff" || actorRole === "player";
}

const subscribeToHydration = () => () => {};

export default function OrderChatPage() {
  const params = useParams();
  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState("");

  const [input, setInput] = useState("");

  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [actorRole, setActorRole] = useState<ActorRole | "">("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [
    input,
    sending,
  ]);

  const availableActions = useMemo(() => {
    if (!order || !canManageOrder(actorRole)) {
      return [];
    }

    if (order.payment_status !== "paid") {
      return [];
    }

    if (
      order.status === "completed" ||
      order.status === "cancelled" ||
      order.status === "refunded"
    ) {
      return [];
    }

    if (
      order.status === "paid" ||
      order.status === "waiting_player" ||
      order.status === "pending_payment"
    ) {
      return [
        {
          action: "accept",
          label: "接單",
          desc: "確認由陪玩師 / 客服承接這筆訂單",
          icon: <Handshake className="h-4 w-4" />,
        },
      ];
    }

    if (order.status === "accepted") {
      return [
        {
          action: "start",
          label: "開始服務",
          desc: "開始計算服務流程",
          icon: <CirclePlay className="h-4 w-4" />,
        },
        {
          action: "complete",
          label: "完成訂單",
          desc: "如果服務已完成，也可以直接結單",
          icon: <CheckCircle2 className="h-4 w-4" />,
        },
      ];
    }

    if (order.status === "in_progress") {
      return [
        {
          action: "complete",
          label: "完成訂單",
          desc: "服務完成後按這裡結單",
          icon: <CheckCircle2 className="h-4 w-4" />,
        },
      ];
    }

    return [];
  }, [order, actorRole]);

  useEffect(() => {
    if (!mounted || !orderId) return;

    loadMessages();

    const timer = window.setInterval(() => {
      loadMessages(false);
    }, 2500);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, orderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function getFreshAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      return session.access_token;
    }

    const {
      data: { session: refreshedSession },
      error: refreshError,
    } = await supabase.auth.refreshSession();

    if (refreshError || !refreshedSession?.access_token) {
      return null;
    }

    return refreshedSession.access_token;
  }

  async function loadMessages(showLoading = true) {
    if (!orderId) return;

    if (showLoading) {
      setLoading(true);
    }

    setError("");

    try {
      const accessToken = await getFreshAccessToken();

      if (!accessToken) {
        setError("請先登入後再查看訂單聊天室。");
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/orders/${orderId}/messages`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const result = await readApiJson<MessagesResponse>(response);

      if (!response.ok) {
        setError(result.error || "讀取聊天室失敗。");
        setLoading(false);
        return;
      }

      setOrder(result.order || null);
      setActorRole(result.actor_role || "");
      setMessages(result.messages || []);
    } catch (err) {
      console.error("[order chat] load failed:", err);
      setError(err instanceof Error ? err.message : "讀取聊天室失敗。");
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }

  async function sendMessage() {
    if (!orderId || !canSend) return;

    const messageBody = input.trim();

    setSending(true);
    setError("");
    setNotice("");

    try {
      const accessToken = await getFreshAccessToken();

      if (!accessToken) {
        setError("請先登入後再送出訊息。");
        setSending(false);
        return;
      }

      const response = await fetch(`/api/orders/${orderId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          body: messageBody,
        }),
      });

      const result = await readApiJson<{
        message?: ChatMessage;
        error?: string;
      }>(response);

      if (!response.ok) {
        setError(result.error || "送出訊息失敗。");
        setSending(false);
        return;
      }

      if (result.message) {
        setMessages((current) => [...current, result.message as ChatMessage]);
      }

      setInput("");
      setNotice("訊息已送出");
      await loadMessages(false);
    } catch (err) {
      console.error("[order chat] send failed:", err);
      setError(err instanceof Error ? err.message : "送出訊息失敗。");
    } finally {
      setSending(false);
    }
  }

  async function runOrderAction(action: string) {
    if (!orderId || acting) return;

    setActing(action);
    setError("");
    setNotice("");

    try {
      const accessToken = await getFreshAccessToken();

      if (!accessToken) {
        setError("請先登入後再操作訂單。");
        setActing("");
        return;
      }

      const response = await fetch(`/api/orders/${orderId}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          action,
        }),
      });

      const result = await readApiJson<ActionResponse>(response);

      if (!response.ok) {
        setError(result.error || "操作訂單失敗。");
        setActing("");
        return;
      }

      if (result.order) {
        setOrder((current) => ({
          ...(current || {
            title: "",
            order_no: "",
            status: "",
            payment_status: "",
            total_amount: 0,
          }),
          ...result.order,
        }));
      }

      setNotice(result.message || "訂單狀態已更新。");
      await loadMessages(false);
    } catch (err) {
      console.error("[order chat] action failed:", err);
      setError(err instanceof Error ? err.message : "操作訂單失敗。");
    } finally {
      setActing("");
    }
  }

  if (!mounted) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <section className="mx-auto max-w-5xl rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-violet-600" />
          <p className="mt-4 text-sm font-bold text-slate-500">
            正在載入訂單聊天室...
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-8 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <a
            href={orderId ? `/orders/${orderId}` : "/orders"}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-white hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" />
            回訂單
          </a>

          <button
            type="button"
            onClick={() => loadMessages()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-white/80 px-4 py-2.5 text-sm font-black text-violet-700 shadow-sm transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            重新整理
          </button>
        </div>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-violet-100/70 backdrop-blur-xl">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-200/70 blur-3xl" />
          <div className="absolute bottom-[-140px] left-[-120px] h-80 w-80 rounded-full bg-fuchsia-200/60 blur-3xl" />

          <div className="relative">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-xs font-black text-violet-700 shadow-sm">
              <MessageCircle className="h-4 w-4" />
              ORDER CHAT
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
                  訂單聊天室
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  客人、客服、陪玩師都可以在這裡完成訂單溝通，不需要再移動到 Discord。
                </p>
              </div>

              <div className="rounded-2xl bg-violet-50 px-4 py-3 text-sm font-black text-violet-700">
                你的身分：{getRoleLabel(actorRole)}
              </div>
            </div>

            {order && (
              <section className="mt-5 grid gap-3 md:grid-cols-3">
                <InfoCard
                  title="訂單"
                  value={order.order_no || order.title || "未命名訂單"}
                />
                <InfoCard title="狀態" value={getStatusLabel(order.status)} />
                <InfoCard
                  title="付款"
                  value={`${getPaymentStatusLabel(
                    order.payment_status
                  )}｜${order.total_amount.toLocaleString()} ASD`}
                />
              </section>
            )}

            {availableActions.length > 0 && (
              <section className="mt-5 rounded-[1.8rem] border border-violet-100 bg-white/75 p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-violet-600" />
                  訂單操作
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  {availableActions.map((item) => (
                    <button
                      key={item.action}
                      type="button"
                      onClick={() => runOrderAction(item.action)}
                      disabled={Boolean(acting)}
                      className="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-left transition hover:-translate-y-0.5 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div className="flex items-center gap-2 text-sm font-black text-violet-700">
                        {acting === item.action ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          item.icon
                        )}
                        {acting === item.action ? "處理中..." : item.label}
                      </div>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                        {item.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </section>

        {error && (
          <section className="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </section>
        )}

        {notice && !error && (
          <section className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <span>{notice}</span>
          </section>
        )}

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-xl shadow-violet-100/60 backdrop-blur-xl">
          <div className="border-b border-slate-100 bg-white/80 px-5 py-4">
            <div className="flex items-center gap-2 text-sm font-black text-slate-700">
              <ShieldCheck className="h-4 w-4 text-violet-600" />
              官網即時對話
            </div>
          </div>

          <div className="h-[58vh] overflow-y-auto px-4 py-5 md:px-6">
            {loading && messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm font-bold text-slate-500">
                <Loader2 className="mr-2 h-5 w-5 animate-spin text-violet-600" />
                讀取訊息中...
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="max-w-sm text-center">
                  <Sparkles className="mx-auto h-8 w-8 text-violet-600" />
                  <p className="mt-3 text-lg font-black text-slate-950">
                    還沒有訊息
                  </p>
                  <p className="mt-2 text-sm leading-7 text-slate-500">
                    可以直接在下方輸入需求、付款問題、接單安排或服務細節。
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4">
                {messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 bg-white/90 p-4">
            <div className="flex gap-3">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="輸入訊息，Enter 送出，Shift + Enter 換行"
                rows={2}
                className="min-h-[56px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
              />

              <button
                type="button"
                onClick={sendMessage}
                disabled={!canSend}
                className="inline-flex w-[92px] items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-violet-100 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                送出
              </button>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function InfoCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/75 p-4 shadow-sm">
      <p className="text-xs font-black text-slate-400">{title}</p>
      <p className="mt-1 break-all text-sm font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isMine = message.is_mine;
  const isSystem = message.is_system || message.sender_role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[80%] rounded-full bg-violet-50 px-4 py-2 text-center text-xs font-bold text-violet-700">
          {message.body}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] ${isMine ? "text-right" : "text-left"}`}>
        <div
          className={`mb-1 flex items-center gap-2 text-xs font-bold ${
            isMine ? "justify-end text-violet-700" : "text-slate-500"
          }`}
        >
          <span>{message.sender_name}</span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5">
            {getRoleLabel(message.sender_role)}
          </span>
        </div>

        <div
          className={`whitespace-pre-wrap rounded-[1.4rem] px-4 py-3 text-sm font-semibold leading-7 shadow-sm ${
            isMine
              ? "rounded-br-md bg-violet-600 text-white"
              : "rounded-bl-md border border-slate-100 bg-slate-50 text-slate-700"
          }`}
        >
          {message.body}
        </div>

        <p className="mt-1 text-xs font-semibold text-slate-400">
          {new Date(message.created_at).toLocaleString("zh-TW")}
        </p>
      </div>
    </div>
  );
}
