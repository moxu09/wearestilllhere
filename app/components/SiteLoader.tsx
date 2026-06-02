"use client";

import { useEffect, useState } from "react";

export default function SiteLoader() {
  const [show, setShow] = useState(true);
  const [flyStyle, setFlyStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      const target = document.getElementById("home-logo-icon");

      if (!target) {
        setShow(false);
        return;
      }

      const rect = target.getBoundingClientRect();

      setFlyStyle({
        "--target-x": `${rect.left + rect.width / 2 - window.innerWidth / 2}px`,
        "--target-y": `${rect.top + rect.height / 2 - window.innerHeight / 2}px`,
        "--target-scale": `${rect.width / 128}`,
      } as React.CSSProperties);

      setTimeout(() => {
        setShow(false);
      }, 900);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-[#050511] text-white">
      {/* 背景光暈 */}
      <div className="pointer-events-none absolute inset-0 loader-bg">
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-yellow-400/20 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[420px] w-[420px] rounded-full bg-violet-600/25 blur-[130px]" />
        <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-cyan-500/15 blur-[120px]" />
      </div>

      {/* 星星裝飾 */}
      <div className="pointer-events-none absolute inset-0 loader-bg">
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

      {/* 中間內容 */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* 品牌文字 */}
        <div className="loader-text rounded-full border border-yellow-400/70 bg-black/25 px-7 py-2 text-sm font-bold tracking-[0.35em] text-yellow-300 shadow-[0_0_22px_rgba(250,204,21,0.35)]">
          深夜不關燈
        </div>

        {/* 飛到主頁 icon 的 icon */}
        <div
          style={flyStyle}
          className="loader-icon-fly relative mt-6 h-32 w-32 shrink-0 rounded-[2rem] border border-yellow-400/70 bg-black/40 p-2 shadow-[0_0_35px_rgba(250,204,21,0.45)]"
        >
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

        {/* 文字，不會被擋 */}
        <p className="loader-text mt-10 text-center text-base font-medium tracking-[0.2em] text-white/80">
          正在為你點亮深夜燈光...
        </p>

        {/* 點點 */}
        <div className="loader-text mt-5 flex items-center justify-center gap-3">
          <span className="h-3 w-3 animate-bounce rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
          <span className="h-3 w-3 animate-bounce rounded-full bg-yellow-400/70 shadow-[0_0_12px_rgba(250,204,21,0.75)] [animation-delay:120ms]" />
          <span className="h-3 w-3 animate-bounce rounded-full bg-yellow-500/50 shadow-[0_0_12px_rgba(250,204,21,0.55)] [animation-delay:240ms]" />
        </div>
      </div>

      <style jsx>{`
        .loader-icon-fly {
          animation:
            loaderEnter 0.45s ease-out both,
            loaderFlyToLogo 0.9s ease-in-out 0.9s forwards;
        }

        .loader-text {
          animation:
            loaderTextEnter 0.45s ease-out both,
            loaderTextOut 0.45s ease-in-out 0.9s forwards;
        }

        .loader-bg {
          animation: loaderBgOut 0.45s ease-in-out 0.9s forwards;
        }

        @keyframes loaderEnter {
          0% {
            opacity: 0;
            transform: translateY(35px) scale(0.96);
          }

          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes loaderFlyToLogo {
          0% {
            transform: translateY(0) scale(1);
          }

          100% {
            transform: translate(
                var(--target-x, 0px),
                var(--target-y, -260px)
              )
              scale(var(--target-scale, 0.35));
          }
        }

        @keyframes loaderTextEnter {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }

          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes loaderTextOut {
          0% {
            opacity: 1;
          }

          100% {
            opacity: 0;
          }
        }

        @keyframes loaderBgOut {
          0% {
            opacity: 1;
          }

          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}