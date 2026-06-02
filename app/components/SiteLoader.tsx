"use client";

import { useEffect, useState } from "react";

export default function SiteLoader() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-[#050511] text-white">
      {/* 背景光暈 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-yellow-400/20 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[420px] w-[420px] rounded-full bg-violet-600/25 blur-[130px]" />
        <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-cyan-500/15 blur-[120px]" />
      </div>

      {/* 星星裝飾 */}
      <div className="pointer-events-none absolute inset-0">
        <span className="absolute left-[17%] top-[23%] animate-pulse text-3xl text-yellow-300/70">
          ✦
        </span>
        <span className="absolute right-[18%] top-[24%] animate-pulse text-xl text-yellow-300/40">
          ✧
        </span>
        <span className="absolute bottom-[18%] left-[23%] animate-pulse text-2xl text-yellow-300/60">
          ✦
        </span>
        <span className="absolute bottom-[15%] right-[27%] animate-pulse text-3xl text-yellow-300/70">
          ✧
        </span>
      </div>

      {/* 主要內容：整組進場上移 */}
      <div className="loader-rise relative z-10 flex flex-col items-center justify-center">
        {/* 品牌文字 */}
        <div className="rounded-full border border-yellow-400/70 bg-black/25 px-7 py-2 text-sm font-bold tracking-[0.35em] text-yellow-300 shadow-[0_0_22px_rgba(250,204,21,0.35)]">
          深夜不關燈
        </div>

        {/* icon：微微上下漂浮 */}
        <div className="loader-float relative mt-6 h-32 w-32 shrink-0 rounded-[2rem] border border-yellow-400/70 bg-black/40 p-2 shadow-[0_0_35px_rgba(250,204,21,0.45)]">
          <span className="pointer-events-none absolute -right-4 -top-2 text-3xl text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]">
            ✦
          </span>

          <span className="pointer-events-none absolute -bottom-5 -right-5 text-2xl text-yellow-300 drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]">
            ✦
          </span>

          <img
            src="/icon.png"
            alt="深夜不關燈"
            className="block h-full w-full rounded-[1.5rem] object-cover"
          />
        </div>

        {/* 文字 */}
        <p className="mt-10 text-center text-base font-medium tracking-[0.2em] text-white/80">
          正在為你點亮深夜燈光...
        </p>

        {/* 小圓點 */}
        <div className="mt-5 flex items-center justify-center gap-3">
          <span className="h-3 w-3 animate-bounce rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
          <span className="h-3 w-3 animate-bounce rounded-full bg-yellow-400/70 shadow-[0_0_12px_rgba(250,204,21,0.75)] [animation-delay:120ms]" />
          <span className="h-3 w-3 animate-bounce rounded-full bg-yellow-500/50 shadow-[0_0_12px_rgba(250,204,21,0.55)] [animation-delay:240ms]" />
        </div>
      </div>

      <style jsx>{`
        .loader-rise {
          animation: loaderRise 0.9s ease-out both;
        }

        .loader-float {
          animation: loaderFloat 1.6s ease-in-out infinite;
        }

        @keyframes loaderRise {
          0% {
            opacity: 0;
            transform: translateY(38px) scale(0.96);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes loaderFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  );
}