"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Phone,
  ShoppingCart,
  Store,
  UserRound,
} from "lucide-react";
import {
  getMerchandiseSlugFromTitle,
  type MerchandiseProduct,
} from "@/lib/merchandiseCatalog";
import type { SiteContentItem } from "@/lib/siteContent";
import {
  calculateShippingFee,
  useMerchandiseCart,
} from "@/app/components/MerchandiseCartProvider";

type Props = {
  product: MerchandiseProduct;
};

type ShippingProvider = "7-ELEVEN" | "全家";

const inputClassName =
  "h-12 w-full rounded-md border border-white/15 bg-[#0d0e10] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#e7ba67]";
const paymentMethods = ["LINE Pay", "街口支付", "PAYUNI", "全支付"];

export default function ShippingForm({ product }: Props) {
  const {
    itemCount,
    subtotal: cartSubtotal,
    shippingFee: cartShippingFee,
    total: cartTotal,
    addItem,
  } = useMerchandiseCart();
  const [unitPrice, setUnitPrice] = useState(product.fallbackPrice);
  const [quantity, setQuantity] = useState(1);
  const [addedMessage, setAddedMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    provider: "7-ELEVEN" as ShippingProvider,
    storeName: "",
  });
  const productSubtotal = unitPrice * quantity;
  const productShippingFee = calculateShippingFee(productSubtotal);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/site-content", { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: { items?: SiteContentItem[] }) => {
        const item = payload.items?.find(
          (entry) =>
            entry.content_type === "merchandise" &&
            getMerchandiseSlugFromTitle(entry.title) === product.slug
        );
        const currentPrice = Number(item?.price);

        if (
          item?.price !== null &&
          item?.price !== undefined &&
          Number.isFinite(currentPrice) &&
          currentPrice >= 0
        ) {
          setUnitPrice(currentPrice);
        }
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Unable to load merchandise price", error);
        }
      });

    return () => controller.abort();
  }, [product.slug]);

  function addProductToCart() {
    addItem({
      slug: product.slug,
      name: product.name,
      unitPrice,
      quantity,
    });
    setAddedMessage(`已將 ${quantity} 件${product.shortName}加入購物車`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
      <aside className="rounded-md border border-white/10 bg-[#15171a] p-6 sm:p-8 lg:sticky lg:top-24">
        <p className="text-xs font-bold uppercase text-[#5bd6d0]">
          Selected product
        </p>
        <h1 className="home-title-font mt-4 text-4xl leading-tight text-white sm:text-5xl">
          {product.shortName}
        </h1>
        <dl className="mt-7 divide-y divide-white/10 border-y border-white/10">
          {product.specifications.map((specification) => (
            <div
              key={specification.label}
              className="grid grid-cols-[7rem_1fr] gap-4 py-4 text-sm"
            >
              <dt className="font-bold text-white/40">{specification.label}</dt>
              <dd className="font-semibold text-white/90">
                {specification.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-6">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-white/45">商品單價</span>
            <span className="font-bold text-[#e7ba67]">
              {money(unitPrice)}
            </span>
          </div>

          <label className="mt-5 block">
            <span className="mb-2 block text-sm font-bold text-white/70">
              商品數量
            </span>
            <input
              type="number"
              min="1"
              max="99"
              step="1"
              inputMode="numeric"
              value={quantity}
              onChange={(event) => {
                const nextQuantity = Number(event.target.value);
                setQuantity(
                  Number.isFinite(nextQuantity)
                    ? Math.max(1, Math.min(99, Math.floor(nextQuantity)))
                    : 1
                );
                setAddedMessage("");
              }}
              className={inputClassName}
            />
          </label>

          <div className="mt-5 space-y-3 rounded-md bg-[#0d0e10] p-4 text-sm">
            <PriceRow label="商品小計" value={money(productSubtotal)} />
            <PriceRow
              label="試算運費"
              value={productShippingFee ? money(productShippingFee) : "免運費"}
              accent={!productShippingFee}
            />
            <PriceRow
              label="試算總額"
              value={money(productSubtotal + productShippingFee)}
              total
            />
          </div>

          <p className="mt-3 text-xs leading-6 text-white/45">
            單次商品金額滿 NT$ 490 免運；未滿需支付運費 NT$ 60。購物車會依所有商品合計重新計算。
          </p>

          <button
            type="button"
            onClick={addProductToCart}
            className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-[#e7ba67] px-5 text-sm font-bold text-[#111214] hover:bg-[#f2cf8b]"
          >
            <ShoppingCart className="h-4 w-4" />
            加入購物車
          </button>

          <Link
            href="/#merchandise"
            className="mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md border border-white/15 text-sm font-bold text-white/70 hover:border-white/40 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            返回主頁
          </Link>

          {addedMessage && (
            <p role="status" className="mt-4 text-center text-sm font-bold text-[#5bd6d0]">
              {addedMessage}
            </p>
          )}
        </div>
      </aside>

      <div className="space-y-8">
        <section className="rounded-md border border-white/10 bg-[#15171a] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-[#e7ba67]" />
            <div>
              <p className="text-xs font-bold uppercase text-[#5bd6d0]">
                Shipping information
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white">
                輸入貨運資料詳情
              </h2>
            </div>
          </div>

          <form className="mt-7 space-y-5" onSubmit={(event) => event.preventDefault()}>
            <Field label="姓名" icon={UserRound}>
              <input
                type="text"
                autoComplete="name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
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
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
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
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    storeName: event.target.value,
                  }))
                }
                placeholder={`請輸入${form.provider}門市名稱`}
                className={inputClassName}
              />
            </Field>
          </form>
        </section>

        <section className="rounded-md border border-white/10 bg-[#15171a] p-6 text-center sm:p-8">
          <CreditCard className="mx-auto h-7 w-7 text-[#e7ba67]" />
          <h2 className="mt-4 text-xl font-bold text-white">選擇付款方式</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">
            貨運資料會在付款功能正式開放後，與付款資訊一併確認送出。
          </p>
          <div className="mt-6 space-y-3 rounded-md bg-[#0d0e10] p-4 text-left text-sm">
            <PriceRow label={`購物車商品（${itemCount} 件）`} value={money(cartSubtotal)} />
            <PriceRow
              label="運費"
              value={
                itemCount === 0
                  ? "尚未加入商品"
                  : cartShippingFee
                    ? money(cartShippingFee)
                    : "免運費"
              }
              accent={itemCount > 0 && !cartShippingFee}
            />
            <PriceRow label="應付總額" value={money(cartTotal)} total />
          </div>
          {itemCount > 0 && (
            <p className="mt-3 text-xs font-bold text-[#5bd6d0]">
              {cartSubtotal >= 490
                ? "已達滿 NT$ 490 免運門檻"
                : `再消費 ${money(490 - cartSubtotal)} 即可免運`}
            </p>
          )}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {paymentMethods.map((method) => (
              <div
                key={method}
                className="rounded-md border border-white/10 bg-[#0d0e10] p-3"
              >
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-md bg-white/10 px-4 text-sm font-bold text-white/30"
                >
                  {method} 付款
                </button>
                <p className="mt-2 text-xs font-bold text-[#e7ba67]">
                  {method} 申請中，待開放
                </p>
              </div>
            ))}
          </div>
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
      <span className={total ? "font-bold text-white" : "text-white/45"}>
        {label}
      </span>
      <span
        className={
          total
            ? "font-bold text-[#e7ba67]"
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
