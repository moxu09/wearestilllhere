"use client";

import { useState } from "react";
import type { MerchandiseCartItem } from "@/app/components/MerchandiseCartProvider";

type Props = {
  customerName: string;
  phone: string;
  shippingProvider: "7-ELEVEN" | "全家";
  storeName: string;
  items: MerchandiseCartItem[];
  disabled?: boolean;
};

export default function JkopayCheckoutButton(props: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/payments/jkopay/merchandise/entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: props.customerName,
          phone: props.phone,
          shippingProvider: props.shippingProvider,
          storeName: props.storeName,
          items: props.items.map(({ slug, quantity }) => ({ slug, quantity })),
        }),
      });
      const result = (await response.json()) as { paymentUrl?: string; error?: string };
      if (!response.ok || !result.paymentUrl) throw new Error(result.error || "街口付款建立失敗");
      window.location.assign(result.paymentUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "街口付款建立失敗");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={checkout}
        disabled={props.disabled || submitting}
        className="inline-flex h-12 w-full items-center justify-center rounded-md bg-[#ee1b2e] px-4 text-sm font-bold text-white transition hover:bg-[#ff3143] disabled:cursor-not-allowed disabled:opacity-45"
      >
        {submitting ? "正在建立街口付款…" : "使用街口支付付款"}
      </button>
      {error && <p role="alert" className="mt-3 text-sm font-bold text-[#ff806f]">{error}</p>}
    </div>
  );
}
