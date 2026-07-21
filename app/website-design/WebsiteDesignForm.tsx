"use client";

import { useState } from "react";
import {
  AtSign,
  CreditCard,
  MonitorSmartphone,
  Palette,
  Sparkles,
} from "lucide-react";
import PendingPaymentMethods from "@/app/components/PendingPaymentMethods";

const inputClassName =
  "w-full rounded-md border border-white/15 bg-[#0d0e10] px-4 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#e7ba67]";

export default function WebsiteDesignForm() {
  const [form, setForm] = useState({
    websiteName: "",
    style: "",
    colorTone: "",
    contact: "",
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
      <aside className="rounded-md border border-white/10 bg-[#15171a] p-6 sm:p-8 lg:sticky lg:top-8">
        <p className="text-xs font-bold uppercase text-[#5bd6d0]">
          Website commission
        </p>
        <h1 className="home-title-font mt-4 text-4xl leading-tight text-white sm:text-5xl">
          網站設計委託
        </h1>
        <p className="mt-5 text-sm leading-7 text-white/50">
          告訴我們你想呈現的名稱、風格與色調，我們會依照頁面數量、功能需求與製作範圍進一步討論。
        </p>
        <div className="mt-7 rounded-md border border-[#e7ba67]/30 bg-[#e7ba67]/10 p-5">
          <p className="text-xs font-bold text-white/45">委託價格</p>
          <p className="mt-2 text-2xl font-bold text-[#f2cf8b]">
            洽談後報價
          </p>
        </div>
      </aside>

      <div className="space-y-8">
        <section className="rounded-md border border-white/10 bg-[#15171a] p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <MonitorSmartphone className="h-5 w-5 text-[#e7ba67]" />
            <div>
              <p className="text-xs font-bold uppercase text-[#5bd6d0]">
                Project details
              </p>
              <h2 className="mt-1 text-2xl font-bold text-white">輸入詳情</h2>
            </div>
          </div>

          <form
            className="mt-7 space-y-5"
            onSubmit={(event) => event.preventDefault()}
          >
            <Field label="想要的網站名稱" icon={MonitorSmartphone}>
              <input
                type="text"
                value={form.websiteName}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    websiteName: event.target.value,
                  }))
                }
                placeholder="例如：品牌名稱、工作室名稱"
                className={`${inputClassName} h-12`}
              />
            </Field>

            <Field label="希望的網站風格" icon={Sparkles}>
              <textarea
                rows={4}
                value={form.style}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    style: event.target.value,
                  }))
                }
                placeholder="例如：簡約、科技感、可愛、精品、深色質感"
                className={`${inputClassName} resize-y py-3`}
              />
            </Field>

            <Field label="希望的網站色調" icon={Palette}>
              <input
                type="text"
                value={form.colorTone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    colorTone: event.target.value,
                  }))
                }
                placeholder="例如：黑金、粉紫、奶油白、品牌指定色號"
                className={`${inputClassName} h-12`}
              />
            </Field>

            <Field label="聯絡方式" icon={AtSign}>
              <input
                type="text"
                autoComplete="email"
                value={form.contact}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    contact: event.target.value,
                  }))
                }
                placeholder="Email、LINE、Discord 或電話"
                className={`${inputClassName} h-12`}
              />
            </Field>
          </form>
        </section>

        <section className="rounded-md border border-white/10 bg-[#15171a] p-6 text-center sm:p-8">
          <CreditCard className="mx-auto h-7 w-7 text-[#e7ba67]" />
          <h2 className="mt-4 text-xl font-bold text-white">選擇付款方式</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-white/45">
            確認需求與正式報價後，才會開放適合的付款方式。
          </p>
          <div className="mt-6">
            <PendingPaymentMethods />
          </div>
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
  icon: typeof MonitorSmartphone;
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
