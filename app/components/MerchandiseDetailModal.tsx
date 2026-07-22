"use client";

import Link from "next/link";
import { ArrowRight, Package, X } from "lucide-react";
import type { SiteContentItem } from "@/lib/siteContent";
import type { MerchandiseProduct } from "@/lib/merchandiseCatalog";
import CommercePolicyLinks from "./CommercePolicyLinks";

type Props = {
  item: SiteContentItem;
  product: MerchandiseProduct;
  onClose: () => void;
};

export default function MerchandiseDetailModal({
  item,
  product,
  onClose,
}: Props) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="merchandise-detail-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="max-h-full w-full max-w-xl overflow-y-auto rounded-md border border-white/15 bg-[#15171a] shadow-2xl">
        {item.image_url ? (
          <div
            role="img"
            aria-label={item.title}
            className="relative aspect-[16/9] overflow-hidden border-b border-white/10 bg-[#0d0e10]"
          >
            <div className="absolute inset-0 grid place-items-center">
              <Package className="h-10 w-10 text-white/20" />
            </div>
            <div
              className="absolute inset-0 bg-contain bg-center bg-no-repeat"
              style={{ backgroundImage: `url(${JSON.stringify(item.image_url)})` }}
            />
          </div>
        ) : (
          <div className="grid aspect-[16/9] place-items-center border-b border-white/10 bg-[#0d0e10]">
            <Package className="h-10 w-10 text-white/20" />
          </div>
        )}

        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-xs font-bold uppercase text-[#5bd6d0]">
                Product details
              </p>
              <h2
                id="merchandise-detail-title"
                className="mt-3 text-2xl font-bold text-white"
              >
                {item.title || product.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="關閉商品詳情"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 text-white/60 hover:border-white/40 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {item.price !== null && (
            <p className="mt-5 text-xl font-bold text-[#e7ba67]">
              NT$ {Number(item.price).toLocaleString("zh-TW")}
            </p>
          )}

          <dl className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {product.specifications.map((specification) => (
              <div
                key={specification.label}
                className="grid grid-cols-[7rem_1fr] gap-4 py-4 text-sm"
              >
                <dt className="font-bold text-white/45">
                  {specification.label}
                </dt>
                <dd className="font-semibold text-white/90">
                  {specification.value}
                </dd>
              </div>
            ))}
          </dl>

          <Link
            href={`/merchandise/${product.slug}/shipping`}
            className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#e7ba67] px-5 text-sm font-bold text-[#111214] hover:bg-[#f2cf8b]"
          >
            輸入貨運資料詳情
            <ArrowRight className="h-4 w-4" />
          </Link>
          <CommercePolicyLinks className="mt-5" />
        </div>
      </div>
    </div>
  );
}
