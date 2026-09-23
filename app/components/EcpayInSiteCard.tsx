"use client";

import { useRef, useState } from "react";
import type { InSiteKind } from "@/lib/ecpayInSiteCheckout";

type EcpaySdk = {
  initialize: (environment: "Stage" | "Prod", loading: number, callback: (error: string | null) => void) => void;
  createPayment: (token: string, language: string, callback: (error: string | null) => void, version: string) => void;
  getPayToken: (callback: (payment: { PayToken?: string } | null, error: string | null) => void) => void;
};

declare global { interface Window { ECPay?: EcpaySdk } }

function loadScript(src: string, integrity?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-ecpay-src="${src}"]`);
    if (existing?.dataset.loaded === "true") return resolve();
    const script = existing || document.createElement("script");
    script.onload = () => { script.dataset.loaded = "true"; resolve(); };
    script.onerror = () => reject(new Error("綠界付款畫面載入失敗，請稍後再試"));
    if (!existing) {
      script.src = src;
      script.async = false;
      if (integrity) { script.integrity = integrity; script.crossOrigin = "anonymous"; }
      script.dataset.ecpaySrc = src;
      document.head.append(script);
    }
  });
}

function sdkCall(run: (done: (error: string | null) => void) => void): Promise<void> {
  return new Promise((resolve, reject) => run(error => error != null ? reject(new Error(error)) : resolve()));
}

export default function EcpayInSiteCard({ kind, order, initialPhone = "" }: {
  kind: InSiteKind; order: string; initialPhone?: string;
}) {
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "submitting" | "submitted">("idle");
  const [hasAttempt, setHasAttempt] = useState(false);
  const [error, setError] = useState("");
  const attemptId = useRef("");
  const locked = useRef(false);
  const statusHref = kind === "service"
    ? `/payments/ecpay/service/status?order=${encodeURIComponent(order)}`
    : `/merchandise/payment-result?order=${encodeURIComponent(order)}`;

  async function openPayment() {
    if (locked.current) return;
    if (phone && !/^09\d{8}$/.test(phone.replace(/[\s-]/g, ""))) { setError("請填寫正確的台灣手機號碼"); return; }
    if (!phone && !email.trim()) { setError("請填寫手機號碼或電子郵件"); return; }
    locked.current = true;
    setHasAttempt(true);
    setPhase("loading");
    setError("");
    try {
      const response = await fetch("/api/payments/ecpay/insite/token", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ kind, merchantTradeNo: order, phone, email }),
      });
      const result = await response.json() as { token?: string; attemptId?: string; stage?: boolean; error?: string };
      if (!response.ok || !result.token || !result.attemptId) throw new Error(result.error || "無法建立付款畫面");
      attemptId.current = result.attemptId;
      await loadScript("https://code.jquery.com/jquery-3.7.1.min.js", "sha384-1H217gwSVyLSIfaLxHbE7dRb3v4mYCKbpQvzx0cegeju1MVsGrX5xXxAvs/HgeFs");
      await loadScript("https://cdn.jsdelivr.net/npm/node-forge@0.7.0/dist/forge.min.js", "sha384-sgzMi6V7PVuBrH3D+OTG6gR4GjgQCsSSUYFcGoGCNr5ks7Sr3WrS+zNv5H33fTY5");
      await loadScript(`https://${result.stage ? "ecpg-stage" : "ecpg"}.ecpay.com.tw/Scripts/sdk-1.0.0.js?t=20210121100116`);
      const sdk = window.ECPay;
      if (!sdk) throw new Error("綠界付款元件無法啟動");
      // Source: official Web JS SDK flow, https://developers.ecpay.com.tw/8998/.
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      await sdkCall(done => sdk.initialize(result.stage ? "Stage" : "Prod", 1, done));
      await sdkCall(done => sdk.createPayment(result.token!, "zh-TW", done, "V2"));
      setPhase("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "無法建立付款畫面");
      setPhase("idle");
      // A token may have been issued already. Do not request a second token for the same order.
    }
  }

  async function pay() {
    if (phase !== "ready" || !window.ECPay || !attemptId.current) return;
    setPhase("submitting");
    setError("");
    try {
      const payment = await new Promise<{ PayToken?: string }>((resolve, reject) => {
        window.ECPay!.getPayToken((value, sdkError) => {
          if (sdkError != null || !value?.PayToken) reject(new Error(sdkError || "請確認刷卡資料已填寫完整"));
          else resolve(value);
        });
      });
      const response = await fetch("/api/payments/ecpay/insite/create", {
        method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ kind, merchantTradeNo: order, attemptId: attemptId.current, payToken: payment.PayToken }),
      });
      const result = await response.json() as { threeDUrl?: string | null; error?: string };
      if (!response.ok) throw new Error(result.error || "付款結果未確認，請勿重複付款");
      setPhase("submitted");
      if (result.threeDUrl) {
        // Source: https://developers.ecpay.com.tw/9053/ — 3D must be top-level navigation, never an iframe.
        window.location.href = result.threeDUrl;
      } else {
        window.location.href = statusHref;
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "付款結果未確認，請勿重複付款");
      setPhase("submitted");
    }
  }

  return <section className="mx-auto max-w-xl rounded-2xl bg-slate-900 p-7 text-white shadow-xl">
    <h1 className="text-2xl font-black">綠界站內刷卡</h1>
    <p className="mt-2 text-sm text-slate-300">訂單編號：{order}</p>
    <p className="mt-3 text-sm text-slate-300">卡號由綠界安全元件收集，本站不接觸信用卡資料。銀行要求時會前往 3D 驗證頁。</p>
    {phase === "idle" && !hasAttempt && <div className="mt-5 space-y-3">
      <label className="block text-sm">聯絡手機<input type="tel" autoComplete="tel" value={phone} onChange={event => setPhone(event.target.value)} placeholder="09xxxxxxxx" className="mt-1 w-full rounded-lg bg-slate-800 p-3 text-white" /></label>
      <label className="block text-sm">電子郵件（可選填）<input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} className="mt-1 w-full rounded-lg bg-slate-800 p-3 text-white" /></label>
      <button type="button" onClick={openPayment} className="w-full rounded-lg bg-emerald-600 p-3 font-bold hover:bg-emerald-500">開啟刷卡畫面</button>
    </div>}
    {phase !== "idle" && <div className="mt-5 min-h-32 rounded-lg bg-white p-2 text-slate-900" id="ECPayPayment" />}
    {phase === "loading" && <p className="mt-3 text-sm text-slate-300">正在載入綠界付款畫面…</p>}
    {phase === "ready" && <button type="button" onClick={pay} className="mt-4 w-full rounded-lg bg-emerald-600 p-3 font-bold hover:bg-emerald-500">確認付款</button>}
    {phase === "submitting" && <p className="mt-4 text-sm text-slate-300">正在送出付款，請勿關閉或重複操作…</p>}
    {phase === "submitted" && <p className="mt-4 text-sm text-slate-300">請等候付款通知，勿再次刷卡。</p>}
    {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
    <a href={statusHref} className="mt-5 inline-block text-sm text-emerald-300 underline">查詢這筆訂單的付款狀態</a>
  </section>;
}
