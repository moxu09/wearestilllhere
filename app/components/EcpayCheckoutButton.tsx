"use client";

import { useState } from "react";
import type { MerchandiseCartItem } from "@/app/components/MerchandiseCartProvider";
import type { EcpayPaymentMethod } from "@/lib/ecpay";

type Props = {
  customerName: string;
  phone: string;
  shippingProvider: "7-ELEVEN" | "全家";
  storeName: string;
  items: MerchandiseCartItem[];
  disabled?: boolean;
  method?: EcpayPaymentMethod;
};

export default function EcpayCheckoutButton(props: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/payments/ecpay/merchandise/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: props.customerName,
          phone: props.phone,
          shippingProvider: props.shippingProvider,
          storeName: props.storeName,
          items: props.items.map(({ slug, quantity }) => ({ slug, quantity })),
          ecpayMethod: props.method || "Credit",
        }),
      });
      const result = (await response.json()) as { action?: string; fields?: Record<string, string>; insiteUrl?: string; error?: string };
      if (response.ok && result.insiteUrl) {
        if (!result.insiteUrl.startsWith("/payments/ecpay/merchandise/insite?order=")) throw new Error("付款網址不正確");
        window.location.assign(result.insiteUrl);
        return;
      }
      if (!response.ok || !result.action || !result.fields) throw new Error(result.error || "綠界付款建立失敗");
      if (!["https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5", "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5"].includes(result.action))
        throw new Error("付款網址不正確");
      const form = document.createElement("form");
      form.method = "POST";
      form.action = result.action;
      form.style.display = "none";
      for (const [name, value] of Object.entries(result.fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.append(input);
      }
      document.body.append(form);
      form.submit();
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "綠界付款建立失敗");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={checkout} disabled={props.disabled || submitting}
        className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#2d9464] px-4 text-sm font-bold text-white transition hover:bg-[#38a974] disabled:cursor-not-allowed disabled:opacity-45">
        {submitting ? "正在建立綠界付款…" : `使用綠界${({ Credit: "信用卡", ATM: "ATM 虛擬帳號", CVS: "超商代碼", BARCODE: "超商條碼" } as const)[props.method || "Credit"]}付款`}
      </button>
      {error && <p role="alert" className="mt-3 text-sm font-bold text-[#ff806f]">{error}</p>}
    </div>
  );
}
