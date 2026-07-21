const paymentMethods = ["LINE Pay", "街口支付", "PAYUNI", "全支付"];

export default function PendingPaymentMethods() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {paymentMethods.map((method) => (
        <div
          key={method}
          data-reveal="scale"
          className="interactive-card rounded-md border border-white/10 bg-[#0d0e10] p-3"
        >
          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex h-12 w-full cursor-not-allowed items-center justify-center rounded-md bg-white/10 px-4 text-sm font-bold text-white/30"
          >
            {method} 付款
          </button>
          <p className="mt-2 text-center text-xs font-bold text-[#e7ba67]">
            {method} 申請中，待開放
          </p>
        </div>
      ))}
    </div>
  );
}
