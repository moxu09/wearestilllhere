"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Minus,
  Package,
  Phone,
  Plus,
  Store,
  Trash2,
  UserRound,
} from "lucide-react";
import PendingPaymentMethods from "@/app/components/PendingPaymentMethods";
import CommercePolicyLinks from "@/app/components/CommercePolicyLinks";
import { useMerchandiseCart } from "@/app/components/MerchandiseCartProvider";

type ShippingProvider = "7-ELEVEN" | "全家";

const inputClassName =
  "h-12 w-full rounded-md border border-white/15 bg-[#0d0e10] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#e7ba67]";

export default function CheckoutForm() {
  const {
    items,
    itemCount,
    subtotal,
    shippingFee,
    total,
    updateQuantity,
    removeItem,
  } = useMerchandiseCart();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    provider: "7-ELEVEN" as ShippingProvider,
    storeName: "",
  });

  if (!itemCount) {
    return (
      <section className="mx-auto max-w-2xl rounded-md border border-white/10 bg-[#15171a] px-6 py-14 text-center sm:px-10">
        <Package className="mx-auto h-10 w-10 text-[#e7ba67]" />
        <h1 className="home-title-font mt-5 text-4xl">購物車目前是空的</h1>
        <p className="mt-4 text-sm leading-7 text-white/45">
          請先選擇帆布袋或鑰匙圈並加入購物車，再回來填寫貨運資料。
        </p>
        <Link
          href="/#merchandise"
          className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-md bg-[#e7ba67] px-6 text-sm font-bold text-[#111214] hover:bg-[#f2cf8b]"
        >
          <ArrowLeft className="h-4 w-4" />
          返回周邊商品
        </Link>
      </section>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <aside data-reveal="left" className="rounded-md border border-white/10 bg-[#15171a] p-6 sm:p-8 lg:sticky lg:top-24">
        <p className="text-xs font-bold uppercase text-[#5bd6d0]">Order summary</p>
        <h1 className="home-title-font mt-4 text-4xl leading-tight sm:text-5xl">
          確認購物車
        </h1>

        <div className="mt-7 space-y-3">
          {items.map((item) => (
            <article key={item.slug} className="rounded-md border border-white/10 bg-[#0d0e10] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold">{item.name}</h2>
                  <p className="mt-1 text-xs text-white/40">單價 {money(item.unitPrice)}</p>
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
                    onClick={() => updateQuantity(item.slug, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label={`減少${item.name}數量`}
                    className="grid h-9 w-9 place-items-center text-white/60 hover:text-white disabled:opacity-25"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-10 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.slug, item.quantity + 1)}
                    disabled={item.quantity >= 99}
                    aria-label={`增加${item.name}數量`}
                    className="grid h-9 w-9 place-items-center text-white/60 hover:text-white disabled:opacity-25"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="font-bold text-[#e7ba67]">{money(item.unitPrice * item.quantity)}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 space-y-3 border-t border-white/10 pt-5 text-sm">
          <PriceRow label={`商品金額（${itemCount} 件）`} value={money(subtotal)} />
          <PriceRow label="運費" value={shippingFee ? money(shippingFee) : "免運費"} accent={!shippingFee} />
          <PriceRow label="應付總額" value={money(total)} total />
        </div>

        <p className="mt-5 rounded-md bg-[#e7ba67]/10 px-4 py-3 text-center text-xs font-bold text-[#f2cf8b]">
          {subtotal >= 490
            ? "已達滿 NT$ 490 免運門檻"
            : `再消費 ${money(490 - subtotal)} 即可免運`}
        </p>
      </aside>

      <div className="space-y-8">
        <section data-reveal="right" className="rounded-md border border-white/10 bg-[#15171a] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-[#e7ba67]" />
            <div>
              <p className="text-xs font-bold uppercase text-[#5bd6d0]">Shipping information</p>
              <h2 className="mt-1 text-2xl font-bold">輸入貨運資料詳情</h2>
            </div>
          </div>

          <form className="mt-7 space-y-5" onSubmit={(event) => event.preventDefault()}>
            <Field label="姓名" icon={UserRound}>
              <input
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="請輸入取件人姓名"
                className={inputClassName}
              />
            </Field>

            <Field label="電話" icon={Phone}>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="例如：0912 345 678"
                className={inputClassName}
              />
            </Field>

            <Field label="取件超商" icon={Store}>
              <select
                value={form.provider}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    provider: event.target.value as ShippingProvider,
                  }))
                }
                className={inputClassName}
              >
                <option value="7-ELEVEN">7-ELEVEN</option>
                <option value="全家">全家</option>
              </select>
            </Field>

            <Field label={`${form.provider} 門市名稱`} icon={MapPin}>
              <input
                type="text"
                value={form.storeName}
                onChange={(event) => setForm((current) => ({ ...current, storeName: event.target.value }))}
                placeholder={`請輸入${form.provider}門市名稱`}
                className={inputClassName}
              />
            </Field>
          </form>
        </section>

        <section data-reveal="right" data-reveal-delay="1" className="rounded-md border border-white/10 bg-[#15171a] p-6 text-center sm:p-8">
          <CreditCard className="mx-auto h-7 w-7 text-[#e7ba67]" />
          <h2 className="mt-4 text-xl font-bold">選擇付款方式</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">
            貨運資料會在付款功能正式開放後，與付款資訊一併確認送出。
          </p>
          <div className="mt-6">
            <PendingPaymentMethods />
          </div>
          <p className="mt-5 text-xs leading-6 text-white/35">付款前請先閱讀下列商品訂購政策。</p>
          <CommercePolicyLinks className="mt-3" />
        </section>
      </div>
    </div>
  );
}

function money(value: number) {
  return `NT$ ${value.toLocaleString("zh-TW")}`;
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
      <span className={total ? "font-bold" : "text-white/45"}>{label}</span>
      <span className={total ? "text-lg font-bold text-[#e7ba67]" : accent ? "font-bold text-[#5bd6d0]" : "font-semibold text-white/80"}>
        {value}
      </span>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: typeof UserRound;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-bold text-white/70">
        <Icon className="h-4 w-4 text-[#5bd6d0]" />
        {label}
      </span>
      {children}
    </label>
  );
}
