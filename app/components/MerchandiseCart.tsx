"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Minus, Plus, ShoppingCart, Trash2, X } from "lucide-react";
import { useMerchandiseCart } from "./MerchandiseCartProvider";
import CommercePolicyLinks from "./CommercePolicyLinks";

function money(value: number) {
  return `NT$ ${value.toLocaleString("zh-TW")}`;
}

export default function MerchandiseCart() {
  const [open, setOpen] = useState(false);
  const {
    items,
    itemCount,
    subtotal,
    shippingFee,
    total,
    updateQuantity,
    removeItem,
  } = useMerchandiseCart();

  if (!itemCount) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex h-12 items-center gap-2 rounded-full bg-[#e7ba67] px-5 text-sm font-bold text-[#111214] shadow-2xl hover:bg-[#f2cf8b] sm:bottom-7 sm:right-7"
        aria-label={`開啟購物車，目前 ${itemCount} 件商品`}
      >
        <ShoppingCart className="h-4 w-4" />
        購物車
        <span className="grid h-6 min-w-6 place-items-center rounded-full bg-[#111214] px-1.5 text-xs text-white">
          {itemCount}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="merchandise-cart-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="max-h-full w-full max-w-lg overflow-y-auto rounded-md border border-white/15 bg-[#15171a] p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase text-[#5bd6d0]">
                  Shopping cart
                </p>
                <h2
                  id="merchandise-cart-title"
                  className="mt-2 text-2xl font-bold text-white"
                >
                  購物車
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="關閉購物車"
                className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/60 hover:border-white/40 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {items.map((item) => (
                <div
                  key={item.slug}
                  className="rounded-md border border-white/10 bg-[#0d0e10] p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-white">{item.name}</p>
                      <p className="mt-1 text-xs text-white/40">
                        單價 {money(item.unitPrice)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.slug)}
                      aria-label={`移除${item.name}`}
                      className="text-white/35 hover:text-[#ff806f]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="flex items-center rounded-md border border-white/15">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.slug, item.quantity - 1)
                        }
                        aria-label={`減少${item.name}數量`}
                        disabled={item.quantity <= 1}
                        className="grid h-9 w-9 place-items-center text-white/60 hover:text-white disabled:opacity-25"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-10 text-center text-sm font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.slug, item.quantity + 1)
                        }
                        aria-label={`增加${item.name}數量`}
                        disabled={item.quantity >= 99}
                        className="grid h-9 w-9 place-items-center text-white/60 hover:text-white disabled:opacity-25"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="font-bold text-[#e7ba67]">
                      {money(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
              <PriceRow label="商品金額" value={money(subtotal)} />
              <PriceRow
                label="運費"
                value={shippingFee ? money(shippingFee) : "免運費"}
                accent={!shippingFee}
              />
              <PriceRow label="總金額" value={money(total)} total />
            </div>

            <p className="mt-5 rounded-md bg-[#e7ba67]/10 px-4 py-3 text-center text-xs font-bold text-[#f2cf8b]">
              {subtotal >= 490
                ? "已達滿 NT$ 490 免運門檻"
                : `再消費 ${money(490 - subtotal)} 即可免運`}
            </p>

            <Link
              href="/merchandise/checkout"
              onClick={() => setOpen(false)}
              className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#e7ba67] px-5 text-sm font-bold text-[#111214] hover:bg-[#f2cf8b]"
            >
              前往結帳
              <ArrowRight className="h-4 w-4" />
            </Link>
            <CommercePolicyLinks className="mt-4" />
          </div>
        </div>
      )}
    </>
  );
}

function PriceRow({
  label,
  value,
  accent = false,
  total = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  total?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={total ? "font-bold text-white" : "text-white/45"}>
        {label}
      </span>
      <span
        className={
          total
            ? "text-lg font-bold text-[#e7ba67]"
            : accent
              ? "font-bold text-[#5bd6d0]"
              : "font-semibold text-white/80"
        }
      >
        {value}
      </span>
    </div>
  );
}
