"use client";

import { useState } from "react";
import { CreditCard, MapPin, Phone, Store, UserRound } from "lucide-react";
import type { MerchandiseProduct } from "@/lib/merchandiseCatalog";

type Props = {
  product: MerchandiseProduct;
};

type ShippingProvider = "7-ELEVEN" | "全家";

const inputClassName =
  "h-12 w-full rounded-md border border-white/15 bg-[#0d0e10] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#e7ba67]";

export default function ShippingForm({ product }: Props) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    provider: "7-ELEVEN" as ShippingProvider,
    storeName: "",
  });

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
          <h2 className="mt-4 text-xl font-bold text-white">LINE Pay 付款</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">
            貨運資料會在付款功能正式開放後，與付款資訊一併確認送出。
          </p>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="mt-6 inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-md bg-white/10 px-5 text-sm font-bold text-white/30"
          >
            LINE Pay 付款
          </button>
          <p className="mt-3 text-sm font-bold text-[#e7ba67]">
            LINE Pay 串接申請中，成功後開放
          </p>
        </section>
      </div>
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
