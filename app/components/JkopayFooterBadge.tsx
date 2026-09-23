import Image from "next/image";

export default function JkopayFooterBadge() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-[#ee1b2e]/40 bg-white px-4 py-3 shadow-lg shadow-black/20">
      <Image
        src="/jkopay-logo.png"
        alt="支援街口支付"
        width={1081}
        height={552}
        className="h-11 w-auto rounded-sm object-contain"
      />
      <span className="text-xs font-black text-[#252525]">支援付款方式｜街口支付</span>
    </div>
  );
}
