"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type ChatOrder = {
  id: string;
  order_no: string | null;
  title: string | null;
  total_amount: number | null;
  payment_status: string | null;
  status: string | null;
  created_at: string;
  platform_players?: {
    nickname: string | null;
    avatar_url: string | null;
  } | null;
  latest_message?: {
    body: string;
    sender_role: string;
    created_at: string;
  } | null;
};

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

type OrderChatsResponse = {
  orders?: ChatOrder[];
  error?: string;
};

type MessagesResponse = {
  order?: OrderInfo;
  actor_role?: "customer" | "player" | "staff" | "admin";
  messages?: ChatMessage[];
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
        200
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

function getStatusLabel(status: string | null) {
  const labels: Record<string, string> = {
    pending_payment: "待付款",
    paid: "已付款待接單",
    waiting_player: "等待陪玩師",
    accepted: "已接單",
    in_progress: "服務中",
    completed: "已完成",
    cancelled: "已取消",
    refunded: "已退款",
    disputed: "爭議中",
  };

  if (!status) return "未知";
  return labels[status] || status;
}

function getPaymentStatusLabel(status: string | null) {
  const labels: Record<string, string> = {
    unpaid: "未付款",
    paid: "已付款",
    refunded: "已退款",
    cancelled: "已取消",
  };

  if (!status) return "未知";
  return labels[status] || status;
}

const subscribeToHydration = () => () => {};

export default function OrderChatFloatingWidget() {
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const [open, setOpen] = useState(false);

  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const [orders, setOrders] = useState<ChatOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || null,
    [orders, selectedOrderId]
  );

  const canSend = input.trim().length > 0 && !sending && Boolean(selectedOrderId);

  useEffect(() => {
    if (!open) return;

    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open || !selectedOrderId) return;

    loadMessages();

    const timer = window.setInterval(() => {
      loadMessages(false);
    }, 2500);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedOrderId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, open]);

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

  async function loadOrders() {
    setLoadingOrders(true);
    setError("");
    setNotice("");

    try {
      const accessToken = await getFreshAccessToken();

      if (!accessToken) {
        setOrders([]);
        setSelectedOrderId("");
        setError("登入後可以使用訂單聊天室。");
        setLoadingOrders(false);
        return;
      }

      const response = await fetch("/api/me/order-chats", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const result = await readApiJson<OrderChatsResponse>(response);

      if (!response.ok) {
        setError(result.error || "讀取聊天室清單失敗。");
        setLoadingOrders(false);
        return;
      }

      const nextOrders = result.orders || [];
      setOrders(nextOrders);

      if (!selectedOrderId && nextOrders[0]?.id) {
        setSelectedOrderId(nextOrders[0].id);
      }

      if (
        selectedOrderId &&
        !nextOrders.some((order) => order.id === selectedOrderId)
      ) {
        setSelectedOrderId(nextOrders[0]?.id || "");
      }
    } catch (err) {
      console.error("[floating chat] load orders failed:", err);
      setError(err instanceof Error ? err.message : "讀取聊天室清單失敗。");
    } finally {
      setLoadingOrders(false);
    }
  }

  async function loadMessages(showLoading = true) {
    if (!selectedOrderId) return;

    if (showLoading) {
      setLoadingMessages(true);
    }

    setError("");

    try {
      const accessToken = await getFreshAccessToken();

      if (!accessToken) {
        setError("請先登入後再查看聊天室。");
        setLoadingMessages(false);
        return;
      }

      const response = await fetch(`/api/orders/${selectedOrderId}/messages`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });

      const result = await readApiJson<MessagesResponse>(response);

      if (!response.ok) {
        setError(result.error || "讀取聊天室訊息失敗。");
        setLoadingMessages(false);
        return;
      }

      setOrderInfo(result.order || null);
      setMessages(result.messages || []);
    } catch (err) {
      console.error("[floating chat] load messages failed:", err);
      setError(err instanceof Error ? err.message : "讀取聊天室訊息失敗。");
    } finally {
      if (showLoading) {
        setLoadingMessages(false);
      }
    }
  }

  async function sendMessage() {
    if (!selectedOrderId || !canSend) return;

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

      const response = await fetch(`/api/orders/${selectedOrderId}/messages`, {
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
      setNotice("已送出");
      await loadMessages(false);
      await loadOrders();
    } catch (err) {
      console.error("[floating chat] send failed:", err);
      setError(err instanceof Error ? err.message : "送出訊息失敗。");
    } finally {
      setSending(false);
    }
  }

  if (!mounted) {
    return null;
  }

  return (
    <section className="fixed bottom-5 right-5 z-[90]">
      {open && (
        <div className="mb-4 w-[calc(100vw-2.5rem)] max-w-[420px] overflow-hidden rounded-[2rem] border border-white/80 bg-white/95 shadow-2xl shadow-violet-200/60 backdrop-blur-xl">
          <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-fuchsia-500 px-5 py-4 text-white">
            <div className="absolute right-[-40px] top-[-40px] h-28 w-28 rounded-full bg-white/20 blur-2xl" />

            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-black">
                  <MessageCircle className="h-4 w-4" />
                  訂單聊天室
                </div>

                <p className="mt-1 line-clamp-1 text-xs font-semibold text-white/85">
                  在官網完成客服、客人、陪玩師對話
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="border-b border-slate-100 bg-white px-4 py-3">
            {selectedOrder ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrderId("");
                    setOrderInfo(null);
                    setMessages([]);
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 text-sm font-black text-slate-950">
                    {selectedOrder.order_no || selectedOrder.title || "訂單聊天室"}
                  </p>

                  <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-slate-500">
                    {getStatusLabel(orderInfo?.status || selectedOrder.status)} ｜{" "}
                    {getPaymentStatusLabel(
                      orderInfo?.payment_status || selectedOrder.payment_status
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => loadMessages()}
                  disabled={loadingMessages}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-50 text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
                >
                  {loadingMessages ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-black text-slate-950">選擇聊天室</p>

                <button
                  type="button"
                  onClick={loadOrders}
                  disabled={loadingOrders}
                  className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700 transition hover:bg-violet-100 disabled:opacity-50"
                >
                  {loadingOrders ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  更新
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mx-4 mt-3 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-xs font-semibold leading-5 text-red-600">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {notice && !error && (
            <div className="mx-4 mt-3 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{notice}</span>
            </div>
          )}

          {!selectedOrderId ? (
            <div className="max-h-[430px] overflow-y-auto p-4">
              {loadingOrders ? (
                <div className="flex h-48 items-center justify-center text-sm font-bold text-slate-500">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin text-violet-600" />
                  讀取聊天室中...
                </div>
              ) : orders.length === 0 ? (
                <div className="flex h-48 items-center justify-center text-center">
                  <div>
                    <Sparkles className="mx-auto h-8 w-8 text-violet-600" />
                    <p className="mt-3 text-sm font-black text-slate-950">
                      目前沒有可用聊天室
                    </p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      有訂單後，聊天室會出現在這裡。
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3">
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => setSelectedOrderId(order.id)}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition hover:border-violet-200 hover:bg-violet-50"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-black text-slate-950">
                            {order.order_no || order.title || "未命名訂單"}
                          </p>

                          <p className="mt-1 line-clamp-1 text-xs font-semibold text-slate-500">
                            {order.platform_players?.nickname || "尚未指定陪玩師"}
                          </p>
                        </div>

                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-violet-700">
                          {getStatusLabel(order.status)}
                        </span>
                        <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-amber-700">
                          {getPaymentStatusLabel(order.payment_status)}
                        </span>
                      </div>

                      {order.latest_message && (
                        <p className="mt-3 line-clamp-1 text-xs font-semibold text-slate-500">
                          {getRoleLabel(order.latest_message.sender_role)}：
                          {order.latest_message.body}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="h-[420px] overflow-y-auto bg-[#fbf8f2] px-4 py-4">
                {loadingMessages && messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm font-bold text-slate-500">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-violet-600" />
                    讀取訊息中...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center">
                    <div>
                      <MessageCircle className="mx-auto h-8 w-8 text-violet-600" />
                      <p className="mt-3 text-sm font-black text-slate-950">
                        還沒有訊息
                      </p>
                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        可以直接在下方輸入訊息。
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {messages.map((message) => (
                      <FloatingChatBubble key={message.id} message={message} />
                    ))}
                    <div ref={bottomRef} />
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 bg-white p-3">
                <div className="flex gap-2">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="輸入訊息..."
                    rows={1}
                    className="max-h-24 min-h-[44px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
                  />

                  <button
                    type="button"
                    onClick={sendMessage}
                    disabled={!canSend}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-100 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <a
                  href={`/orders/${selectedOrderId}/chat`}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-2.5 text-xs font-black text-violet-700 transition hover:bg-violet-50"
                >
                  打開完整聊天室
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-orange-300 text-white shadow-2xl shadow-pink-200 transition hover:scale-105"
        aria-label="開啟訂單聊天室"
      >
        <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition group-hover:opacity-100" />
        {open ? <X className="h-7 w-7" /> : <MessageCircle className="h-7 w-7" />}
      </button>
    </section>
  );
}

function FloatingChatBubble({ message }: { message: ChatMessage }) {
  const isMine = message.is_mine;
  const isSystem = message.is_system || message.sender_role === "system";

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-[85%] rounded-full bg-violet-100 px-3 py-1.5 text-center text-[11px] font-black text-violet-700">
          {message.body}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] ${isMine ? "text-right" : "text-left"}`}>
        <div
          className={`mb-1 flex items-center gap-1.5 text-[11px] font-bold ${
            isMine ? "justify-end text-violet-700" : "text-slate-500"
          }`}
        >
          <span className="line-clamp-1">{message.sender_name}</span>
          <span className="rounded-full bg-white px-2 py-0.5">
            {getRoleLabel(message.sender_role)}
          </span>
        </div>

        <div
          className={`whitespace-pre-wrap rounded-[1.2rem] px-3.5 py-2.5 text-sm font-semibold leading-6 shadow-sm ${
            isMine
              ? "rounded-br-md bg-violet-600 text-white"
              : "rounded-bl-md border border-slate-100 bg-white text-slate-700"
          }`}
        >
          {message.body}
        </div>

        <p className="mt-1 text-[10px] font-semibold text-slate-400">
          {new Date(message.created_at).toLocaleString("zh-TW", {
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
