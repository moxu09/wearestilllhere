import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import {
  getMerchandiseProduct,
  merchandiseSlugs,
} from "@/lib/merchandiseCatalog";
import ShippingForm from "./ShippingForm";

export const dynamicParams = false;

export function generateStaticParams() {
  return merchandiseSlugs.map((slug) => ({ slug }));
}

export default async function MerchandiseShippingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getMerchandiseProduct(slug);

  if (!product) notFound();

  return (
    <main className="home-soft-font min-h-screen bg-[#0d0e10] text-white">
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
            返回周邊商品
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16">
        <ShippingForm product={product} />
      </div>
    </main>
  );
}
