"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Payment = {
  merchant_trade_no: string;
  organization_code: string;
  payment_kind: string;
  entity_key: string;
  user_id: string;
  amount: number;
  status: string;
  fulfillment_status: string;
  created_at: string;
};

export default function EcpayPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState("");
  const [error, setError] = useState("");
  const [reportStart, setReportStart] = useState("");
  const [reportEnd, setReportEnd] = useState("");
  const [downloading, setDownloading] = useState("");

  const getToken = useCallback(async () => {
    const { data, error: authError } = await supabase.auth.getSession();
    if (authError) throw authError;
    if (!data.session) throw new Error("請先登入管理員帳號");
    return data.session.access_token;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch("/api/admin/ecpay-service-payments", {
        cache: "no-store", headers: { Authorization: `Bearer ${token}` },
      });
      const result = (await response.json()) as { payments?: Payment[]; error?: string };
      if (!response.ok) throw new Error(result.error || "無法讀取綠界服務付款單");
      setPayments(result.payments || []);
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "無法讀取綠界服務付款單");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function reconcile(payment: Payment) {
    setChecking(payment.merchant_trade_no);
    try {
      const token = await getToken();
      const response = await fetch("/api/admin/ecpay-service-payments", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ merchantTradeNo: payment.merchant_trade_no }),
      });
      const result = (await response.json()) as { error?: string; remoteStatus?: string };
      if (!response.ok) throw new Error(result.error || "查證失敗");
      await load();
      if (result.remoteStatus !== "paid") setError("綠界尚未確認付款，沒有更新本地付款狀態。");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "查證失敗");
    } finally {
      setChecking("");
    }
  }

  async function downloadReport(kind: "transactions" | "credit") {
    setDownloading(kind);
    setError("");
    try {
      if (!reportStart || !reportEnd) throw new Error("請先選擇對帳日期");
      const token = await getToken();
      const params = new URLSearchParams({ kind, start: reportStart, end: reportEnd });
      const response = await fetch(`/api/admin/ecpay-reports?${params}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        throw new Error(result.error || "下載綠界對帳檔失敗");
      }
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = `ecpay-${kind}-${reportStart}-${reportEnd}.csv`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "下載綠界對帳檔失敗");
    } finally {
      setDownloading("");
    }
  }

  return <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
    <div className="mx-auto max-w-7xl">
      <Link href="/admin" className="text-sm font-bold text-violet-700">← 返回管理後台</Link>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-3xl font-black">綠界服務付款</h1><p className="mt-2 text-sm text-slate-600">顯示最新 200 筆；查證只在綠界確認已付款且金額相符時更新本地狀態。</p></div>
        <button type="button" onClick={() => void load()} className="rounded-xl bg-violet-700 px-5 py-3 text-sm font-bold text-white">重新整理</button>
      </div>
      {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">{error}</p>}
      <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black">綠界對帳檔</h2>
        <p className="mt-1 text-sm text-slate-600">付款交易與信用卡撥款分開下載；撥款資料通常要等銀行工作日結算後才會出現。</p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm font-bold">起始日期<input type="date" value={reportStart} onChange={event => setReportStart(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 font-normal" /></label>
          <label className="text-sm font-bold">結束日期<input type="date" value={reportEnd} onChange={event => setReportEnd(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 px-3 py-2 font-normal" /></label>
          <button type="button" disabled={Boolean(downloading)} onClick={() => void downloadReport("transactions")} className="rounded-lg bg-violet-700 px-4 py-2 font-bold text-white disabled:opacity-50">{downloading === "transactions" ? "下載中…" : "下載付款交易 CSV"}</button>
          <button type="button" disabled={Boolean(downloading)} onClick={() => void downloadReport("credit")} className="rounded-lg border border-violet-300 px-4 py-2 font-bold text-violet-700 disabled:opacity-50">{downloading === "credit" ? "下載中…" : "下載信用卡撥款 CSV"}</button>
        </div>
      </section>
      {loading ? <p className="mt-8">讀取中…</p> : <div className="mt-8 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{["時間", "系統", "項目", "交易編號", "Discord 用戶", "金額", "付款", "交付", "查證"].map(x=><th key={x} className="p-4">{x}</th>)}</tr></thead>
          <tbody>{payments.map(payment => <tr key={payment.merchant_trade_no} className="border-t border-slate-100">
            <td className="p-4 whitespace-nowrap">{new Date(payment.created_at).toLocaleString("zh-TW")}</td>
            <td className="p-4">{payment.organization_code === "qiunai" ? "秋奈" : "深夜"}</td>
            <td className="p-4">{payment.payment_kind} · {payment.entity_key}</td>
            <td className="p-4 font-mono text-xs">{payment.merchant_trade_no}</td>
            <td className="p-4">{payment.user_id}</td>
            <td className="p-4 whitespace-nowrap">NT$ {Number(payment.amount).toLocaleString()}</td>
            <td className="p-4">{payment.status}</td><td className="p-4">{payment.fulfillment_status}</td>
            <td className="p-4">{payment.status === "pending" ? <button type="button" disabled={checking === payment.merchant_trade_no} onClick={() => void reconcile(payment)} className="rounded-lg border border-violet-300 px-3 py-2 font-bold text-violet-700 disabled:opacity-50">{checking === payment.merchant_trade_no ? "查證中…" : "向綠界查證"}</button> : "—"}</td>
          </tr>)}</tbody></table>
        {payments.length === 0 && <p className="p-6 text-center text-slate-500">目前沒有綠界服務付款單。</p>}
      </div>}
    </div>
  </main>;
}
