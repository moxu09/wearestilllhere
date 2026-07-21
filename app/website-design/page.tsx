import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import WebsiteDesignForm from "./WebsiteDesignForm";

export const metadata: Metadata = {
  title: "網站設計委託",
  description: "輸入網站名稱、風格、色調與聯絡方式，洽談網站設計需求。",
  alternates: {
    canonical: "https://design.wearestilllhere.com",
  },
  openGraph: {
    title: "網站設計委託｜深夜不關燈",
    description: "輸入網站名稱、風格、色調與聯絡方式，洽談網站設計需求。",
    url: "https://design.wearestilllhere.com",
  },
};

export default function WebsiteDesignPage() {
  return (
    <main className="public-page-enter home-soft-font min-h-screen bg-[#0d0e10] text-white">
      <header className="border-b border-white/10 bg-[#0d0e10]/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="https://www.wearestilllhere.com" className="flex items-center gap-3">
            <Image
              src="/brand-logo-gold-v2.png"
              alt="深夜不關燈"
              width={68}
              height={48}
              priority
              className="h-11 w-auto object-contain"
            />
            <span className="text-sm font-bold">深夜不關燈</span>
          </Link>
          <Link
            href="https://www.wearestilllhere.com/#merchandise"
            className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            返回主頁
          </Link>
        </div>
      </header>

      <div data-reveal className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
        <WebsiteDesignForm />
      </div>
    </main>
  );
}
