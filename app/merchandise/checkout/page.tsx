import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import CheckoutForm from "./CheckoutForm";

export const metadata: Metadata = {
  title: "購物車結帳",
  description: "確認商品數量、填寫超商取貨資料並選擇付款方式。",
  alternates: {
    canonical: "/merchandise/checkout",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function MerchandiseCheckoutPage() {
  return (
    <main className="public-page-enter home-soft-font min-h-screen bg-[#0d0e10] text-white">
      <header className="border-b border-white/10 bg-[#0d0e10]/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-3">
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
            href="/#merchandise"
            className="inline-flex items-center gap-2 text-xs font-bold text-white/60 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            繼續選購
          </Link>
        </div>
      </header>

      <div data-reveal className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
        <CheckoutForm />
      </div>
    </main>
  );
}
