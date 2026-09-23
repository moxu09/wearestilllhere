"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import type { EcpayInstructions } from "@/lib/ecpayPaymentInstructions";

function Code39({ value }: { value: string }) {
  const svg = useRef<SVGSVGElement>(null);
  useEffect(() => {
    if (!svg.current) return;
    JsBarcode(svg.current, value, { format: "CODE39", width: 2, height: 72, margin: 8, displayValue: false });
  }, [value]);
  return <div className="overflow-x-auto rounded-lg bg-white p-3 text-center text-slate-900">
    <svg ref={svg} className="mx-auto max-w-full" role="img" aria-label={`條碼 ${value}`} />
    <p className="mt-2 font-mono text-sm font-bold tracking-wider">{value}</p>
  </div>;
}

export default function EcpayInstructionsView({ info }: { info: EcpayInstructions }) {
  return <section className="mt-6 rounded-xl border border-emerald-400/40 bg-emerald-950/40 p-5 text-left text-white">
    <h2 className="text-xl font-bold">{info.method === "ATM" ? "ATM 虛擬帳號" : info.method === "CVS" ? "超商繳費代碼" : "超商繳費條碼"}</h2>
    <p className="mt-2 text-sm text-white/75">請在期限前繳費；取得帳號或代碼不代表已付款。系統收到綠界付款通知後才會更新訂單。</p>
    <p className="mt-4 text-sm">繳費期限：<strong>{info.expireDate}</strong></p>
    {info.method === "ATM" && <div className="mt-4 grid gap-2 rounded-lg bg-white/10 p-4">
      <p>銀行代碼：<strong className="font-mono text-lg">{info.bankCode}</strong></p>
      <p>虛擬帳號：<strong className="font-mono text-lg tracking-wider">{info.virtualAccount}</strong></p>
      <p className="text-xs text-white/65">請依頁面顯示的訂單金額轉帳，勿匯入原本的人工匯款帳戶。</p>
    </div>}
    {info.method === "CVS" && <p className="mt-4 rounded-lg bg-white/10 p-4">繳費代碼：<strong className="ml-2 font-mono text-lg tracking-wider">{info.paymentNo}</strong></p>}
    {info.method === "BARCODE" && <div className="mt-4 space-y-3">{info.barcode?.map((value, index) => <Code39 key={`${index}-${value}`} value={value} />)}</div>}
    <button type="button" onClick={() => window.print()} className="mt-5 rounded-lg border border-white/30 px-4 py-2 text-sm font-bold">列印繳費資訊</button>
  </section>;
}
