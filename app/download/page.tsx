import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Download, ShieldCheck, Smartphone } from "lucide-react";

// Update these three together whenever public/downloads/qiunai-app.apk is replaced.
const APK = {
  version: "1.6.0",
  updated: "2026 年 11 月 26 日",
  sizeMb: "7.5",
  sha256: "fca437cb14fb14f0802877651537fa5295ef3e968c4f081ec81f5e2d3c19fb3a",
};
const APK_URL = `/downloads/qiunai-app.apk?v=${APK.version}`;

export const metadata: Metadata = {
  title: "下載 APP",
  description: "秋奈電競陪玩與深夜不關燈的官方 Android APP。下單、聊天、儲值、扭蛋、一番賞都在 APP 裡完成。",
};

const FEATURES = [
  "下單、報價、選陪陪、付款，跟 Discord 同步",
  "訂單對話可直接 @客服",
  "儲值：信用卡、超商條碼、超商代碼、ATM",
  "扭蛋與一番賞（可用綠界直接付款）",
  "秋奈 AI 快速下單，一句話幫你填好需求單",
];

const STEPS = [
  { title: "下載安裝檔", body: "用手機打開這一頁，按下方「下載 Android APP」。" },
  { title: "允許安裝", body: "第一次安裝時，手機會詢問是否允許瀏覽器安裝未知應用程式，請選「允許」。" },
  { title: "打開並登入", body: "安裝完成後開啟 APP，用 Discord 帳號登入即可。之後的新版本可以直接覆蓋安裝，資料不會不見。如果你裝過 1.5.1 以前的版本，請先刪除舊的 APP 再安裝（只需要這一次，帳號資料都在伺服器上）。" },
];

export default function DownloadPage() {
  return (
    <main className="public-page-enter home-soft-font min-h-screen bg-[#0d0e10] text-white">
      <header className="border-b border-white/10 bg-[#0d0e10]/95">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-4 px-5 py-2 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/brand-logo-gold-v2.png" alt="深夜不關燈" width={68} height={48} priority className="h-11 w-auto object-contain" />
            <span className="hidden text-sm font-bold sm:inline">深夜不關燈</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" />回首頁
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="rounded-md border border-white/10 bg-[#15171a] p-6 sm:p-10">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-center">
            <Image src="/app-icon-brand-512.png" alt="APP 圖示" width={112} height={112} className="h-24 w-24 rounded-[28px] border border-white/10 sm:h-28 sm:w-28" />
            <div className="min-w-0">
              <h1 className="home-title-font text-4xl leading-tight sm:text-5xl">秋奈 × 深夜不關燈 APP</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60">
                兩間店一個 APP。下單、聊天、儲值、扭蛋都在手機上完成，只有語音需要到 Discord。
              </p>
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={APK_URL}
              download="qiunai-app.apk"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-[#e7ba67] px-6 py-4 text-base font-black text-[#1a1408] hover:bg-[#f2cf8b] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f2cf8b]"
            >
              <Download className="h-5 w-5" />下載 Android APP
            </a>
            <p className="text-xs leading-6 text-white/45">
              版本 {APK.version}・{APK.sizeMb} MB・更新於 {APK.updated}
              <br />
              iPhone 版準備中
            </p>
          </div>
        </section>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <section className="rounded-md border border-white/10 bg-[#15171a] p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold"><Smartphone className="h-5 w-5 text-[#e7ba67]" />APP 可以做什麼</h2>
            <ul className="mt-4 space-y-2 text-sm leading-7 text-white/70">
              {FEATURES.map((item) => (
                <li key={item} className="flex gap-2"><span aria-hidden="true" className="text-[#e7ba67]">・</span>{item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-md border border-white/10 bg-[#15171a] p-6">
            <h2 className="text-lg font-bold">安裝方式</h2>
            <ol className="mt-4 space-y-4">
              {STEPS.map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#e7ba67]/40 text-xs font-bold text-[#f2cf8b]">{index + 1}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{step.title}</p>
                    <p className="mt-1 text-sm leading-6 text-white/60">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="mt-6 rounded-md border border-[#e7ba67]/25 bg-[#e7ba67]/10 p-6">
          <h2 className="flex items-center gap-2 font-bold text-[#f2cf8b]"><ShieldCheck className="h-5 w-5" />安全提醒</h2>
          <p className="mt-3 text-sm leading-7 text-white/70">
            請只從本網站（wearestilllhere.com）下載。我們不會用私訊傳安裝檔給你，也不會要你提供 Discord 密碼。
          </p>
          <p className="mt-3 break-all text-xs leading-6 text-white/40">SHA-256：{APK.sha256}</p>
        </section>
      </div>
    </main>
  );
}
