"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type MerchandiseOrder = {
  id: string;
  order_no: string;
  customer_name: string;
  phone: string;
  shipping_provider: string;
  store_name: string;
  items: Array<{ name?: string; slug?: string; quantity?: number }>;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  paid_at: string | null;
};

type Summary = {
  total: number;
  pending: number;
  paid: number;
  failed: number;
  refunded: number;
  paidAmount: number;
};

const statusText: Record<string, string> = {
  pending: "待付款",
  paid: "已付款",
  failed: "付款失敗",
  refunded: "已退款",
};

export default function MerchandiseOrdersPage() {
  const [orders, setOrders] = useState<MerchandiseOrder[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [checkingId, setCheckingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;
      if (!data.session) throw new Error("請先登入管理員帳號");
      const response = await fetch("/api/admin/merchandise-orders", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const result = (await response.json()) as {
        summary?: Summary;
        orders?: MerchandiseOrder[];
        error?: string;
      };
      if (!response.ok) throw new Error(result.error || "讀取官網商品訂單失敗");
      setSummary(result.summary || null);
      setOrders(result.orders || []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "讀取官網商品訂單失敗");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function checkEcpay(order: MerchandiseOrder) {
    setCheckingId(order.id);
    setError("");
    try {
      const { data, error: authError } = await supabase.auth.getSession();
      if (authError) throw authError;
      if (!data.session) throw new Error("請先登入管理員帳號");
      const response = await fetch(`/api/admin/merchandise-orders/${order.id}/ecpay-reconcile`, {
        method: "POST",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const result = (await response.json()) as { error?: string; remoteStatus?: string };
      if (!response.ok) throw new Error(result.error || "綠界查證失敗");
      await load();
      if (result.remoteStatus !== "paid") setError("綠界尚未確認付款，訂單狀態未變更。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "綠界查證失敗");
    } finally {
      setCheckingId(null);
    }
  }

  const visible = useMemo(() => {
    const term = keyword.trim().toLowerCase();
    return term
      ? orders.filter((order) =>
          [order.order_no, order.customer_name, order.phone, order.payment_method]
            .some((value) => value?.toLowerCase().includes(term)),
        )
      : orders;
  }, [orders, keyword]);

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-7xl">
        <Link href="/admin" className="text-sm font-bold text-violet-700">← 返回管理後台</Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">官網商品訂單</h1>
            <p className="mt-2 text-sm text-slate-600">下單後即列入統計；營收僅計入已付款訂單，不把待付款當作收入。</p>
          </div>
          <button onClick={() => void load()} className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white">重新整理</button>
        </div>

        {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
        {loading ? <p className="mt-8 text-slate-600">讀取訂單中…</p> : summary && (
          <>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["全部訂單", summary.total],
                ["待付款", summary.pending],
                ["已付款", summary.paid],
                ["已付款金額", `NT$ ${summary.paidAmount.toLocaleString()}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white p-5 shadow-sm">
                  <p className="text-sm text-slate-500">{label}</p>
                  <p className="mt-2 text-2xl font-black">{value}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-500">付款失敗 {summary.failed} 筆 · 已退款 {summary.refunded} 筆；下方顯示最新 200 筆。</p>
            <label className="mt-6 block max-w-md text-sm font-bold">
              搜尋近期訂單
              <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="訂單編號、姓名、電話或付款方式" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-normal" />
            </label>
            <div className="mt-5 overflow-x-auto rounded-2xl bg-white shadow-sm">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600"><tr>{["下單時間", "訂單編號", "顧客", "電話", "商品", "取貨門市", "付款方式", "狀態", "金額", "綠界查證"].map((title) => <th key={title} className="p-4">{title}</th>)}</tr></thead>
                <tbody>
                  {visible.map((order) => (
                    <tr key={order.id} className="border-t border-slate-100 align-top">
                      <td className="p-4 whitespace-nowrap">{new Date(order.created_at).toLocaleString("zh-TW")}</td>
                      <td className="p-4 font-semibold">{order.order_no}</td>
                      <td className="p-4">{order.customer_name}</td>
                      <td className="p-4 whitespace-nowrap">{order.phone}</td>
                      <td className="p-4">{Array.isArray(order.items) ? order.items.map((item) => `${item.name || item.slug || "商品"} × ${item.quantity || 1}`).join("、") : "—"}</td>
                      <td className="p-4">{order.shipping_provider} · {order.store_name}</td>
                      <td className="p-4">{order.payment_method}</td>
                      <td className="p-4 whitespace-nowrap">{statusText[order.status] || order.status}</td>
                      <td className="p-4 whitespace-nowrap font-bold">NT$ {Number(order.total_amount).toLocaleString()}</td>
                      <td className="p-4 whitespace-nowrap">{order.payment_method === "綠界支付" && order.status === "pending" ? (
                        <button type="button" disabled={checkingId === order.id} onClick={() => void checkEcpay(order)} className="rounded-lg border border-violet-300 px-3 py-2 font-bold text-violet-700 disabled:opacity-50">
                          {checkingId === order.id ? "查證中…" : "向綠界查證"}
                        </button>
                      ) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visible.length === 0 && <p className="p-6 text-center text-slate-500">沒有符合條件的訂單。</p>}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
