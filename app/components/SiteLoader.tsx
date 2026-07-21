"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function SiteLoader() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const leaveTimer = window.setTimeout(() => setLeaving(true), 650);
    const hideTimer = window.setTimeout(() => setVisible(false), 1050);
    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0d0e10] text-white transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-[#e7ba67]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-[#5bd6d0]" />
      <div className="flex flex-col items-center px-6 text-center">
        <Image
          src="/brand-logo-gold-v2.png"
          alt="深夜不關燈"
          width={220}
          height={156}
          priority
          className="h-auto w-52 object-contain"
        />
        <p className="mt-6 text-lg font-black">深夜不關燈</p>
        <p className="mt-2 text-[10px] font-bold uppercase text-[#e7ba67]">
          We are still here
        </p>
        <div className="mt-8 h-px w-40 overflow-hidden bg-white/10">
          <div className="loader-line h-full w-1/2 bg-[#e7ba67]" />
        </div>
      </div>
      <style jsx>{`
        .loader-line {
          animation: loaderLine 0.9s ease-in-out infinite;
        }
        @keyframes loaderLine {
          0% { transform: translateX(-110%); }
          100% { transform: translateX(220%); }
        }
      `}</style>
    </div>
  );
}
