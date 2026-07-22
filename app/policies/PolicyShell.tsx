import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import CommercePolicyLinks from "@/app/components/CommercePolicyLinks";

export default function PolicyShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="public-page-enter home-soft-font min-h-screen bg-[#0d0e10] text-white">
      <header className="border-b border-white/10 bg-[#0d0e10]/95">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between gap-4 px-5 py-2 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/brand-logo-gold-v2.png" alt="深夜不關燈" width={68} height={48} priority className="h-11 w-auto object-contain" />
            <span className="hidden text-sm font-bold sm:inline">深夜不關燈</span>
          </Link>
          <Link href="/merchandise/checkout" className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white">
            <ArrowLeft className="h-4 w-4" />返回商品結帳
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
        <section className="rounded-md border border-white/10 bg-[#15171a] p-6 sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5bd6d0]">{eyebrow}</p>
          <h1 className="home-title-font mt-4 text-4xl leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-white/55">{intro}</p>
          <p className="mt-3 text-xs text-white/35">最後更新：2026 年 7 月 22 日</p>

          <div className="policy-content mt-9 space-y-8 border-t border-white/10 pt-8 text-sm leading-7 text-white/70">
            {children}
          </div>

          <div className="mt-10 rounded-md border border-[#e7ba67]/25 bg-[#e7ba67]/10 p-5">
            <p className="font-bold text-[#f2cf8b]">需要協助？</p>
            <a href="mailto:as.co.service@wearestilllhere.com" className="mt-2 inline-flex items-center gap-2 break-all text-sm font-bold text-white hover:text-[#e7ba67]">
              <Mail className="h-4 w-4 shrink-0" />as.co.service@wearestilllhere.com
            </a>
          </div>
        </section>

        <CommercePolicyLinks className="mt-7" />
      </div>
    </main>
  );
}

export function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
