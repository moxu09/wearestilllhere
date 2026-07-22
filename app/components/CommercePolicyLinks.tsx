import Link from "next/link";

const policies = [
  { href: "/policies/returns", label: "退換貨政策" },
  { href: "/policies/privacy", label: "隱私權政策" },
  { href: "/policies/payment", label: "付款說明" },
];

export default function CommercePolicyLinks({ className = "" }: { className?: string }) {
  return (
    <nav aria-label="商品訂購政策" className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs font-bold ${className}`}>
      {policies.map((policy) => (
        <Link key={policy.href} href={policy.href} className="text-white/55 underline decoration-white/20 underline-offset-4 transition hover:text-[#e7ba67] hover:decoration-[#e7ba67]">
          {policy.label}
        </Link>
      ))}
    </nav>
  );
}
