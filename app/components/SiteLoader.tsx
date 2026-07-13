"use client";

import { useEffect, useRef, useState } from "react";

export default function SiteLoader() {
  const [show, setShow] = useState(true);
  const [isFlying, setIsFlying] = useState(false);
  const [flyStyle, setFlyStyle] = useState<React.CSSProperties>({});

  const loaderIconRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const startFlyTimer = setTimeout(() => {
      const target = document.getElementById("home-logo-icon");
      const loaderIcon = loaderIconRef.current;

      if (!target || !loaderIcon) {
        setShow(false);
        return;
      }

      const targetRect = target.getBoundingClientRect();
      const loaderRect = loaderIcon.getBoundingClientRect();

      const targetCenterX = targetRect.left + targetRect.width / 2;
      const targetCenterY = targetRect.top + targetRect.height / 2;

      const loaderCenterX = loaderRect.left + loaderRect.width / 2;
      const loaderCenterY = loaderRect.top + loaderRect.height / 2;

      const moveX = targetCenterX - loaderCenterX;
      const moveY = targetCenterY - loaderCenterY;
      const scale = targetRect.width / loaderRect.width;

      setFlyStyle({
        "--target-x": `${moveX}px`,
        "--target-y": `${moveY}px`,
        "--target-scale": `${scale}`,
      } as React.CSSProperties);

      setIsFlying(true);

      setTimeout(() => {
        setShow(false);
      }, 950);
    }, 900);

    return () => clearTimeout(startFlyTimer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-[#050511] text-white">
      {/* 背景光暈 */}
      <div
        className={`pointer-events-none absolute inset-0 ${
          isFlying ? "loader-bg-out" : ""
        }`}
      >
        <div className="absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-yellow-400/20 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[420px] w-[420px] rounded-full bg-violet-600/25 blur-[130px]" />
        <div className="absolute bottom-0 left-0 h-[360px] w-[360px] rounded-full bg-cyan-500/15 blur-[120px]" />
      </div>

      {/* 星星裝飾 */}
      <div
        className={`pointer-events-none absolute inset-0 ${
          isFlying ? "loader-bg-out" : ""
        }`}
      >
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
        <div
          className={`rounded-full border border-yellow-400/70 bg-black/25 px-7 py-2 text-sm font-bold tracking-[0.35em] text-yellow-300 shadow-[0_0_22px_rgba(250,204,21,0.35)] ${
            isFlying ? "loader-text-out" : "loader-text-enter"
          }`}
        >
          深夜不關燈
        </div>

        {/* 會飛到主頁 icon 的 icon */}
        <div
          ref={loaderIconRef}
          style={flyStyle}
          className={`relative mt-6 h-32 w-32 shrink-0 rounded-[2rem] border border-yellow-400/70 bg-black/40 p-2 shadow-[0_0_35px_rgba(250,204,21,0.45)] ${
            isFlying ? "loader-icon-fly" : "loader-icon-enter"
          }`}
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

        {/* 文字 */}
        <p
          className={`mt-10 text-center text-base font-medium tracking-[0.2em] text-white/80 ${
            isFlying ? "loader-text-out" : "loader-text-enter"
          }`}
        >
          正在為你點亮深夜燈光...
        </p>

        {/* 點點 */}
        <div
          className={`mt-5 flex items-center justify-center gap-3 ${
            isFlying ? "loader-text-out" : "loader-text-enter"
          }`}
        >
          <span className="h-3 w-3 animate-bounce rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.9)]" />
          <span className="h-3 w-3 animate-bounce rounded-full bg-yellow-400/70 shadow-[0_0_12px_rgba(250,204,21,0.75)] [animation-delay:120ms]" />
          <span className="h-3 w-3 animate-bounce rounded-full bg-yellow-500/50 shadow-[0_0_12px_rgba(250,204,21,0.55)] [animation-delay:240ms]" />
        </div>
      </div>

      <style jsx>{`
        .loader-icon-enter {
          animation: loaderIconEnter 0.45s ease-out both;
        }

        .loader-icon-fly {
          animation: loaderFlyToLogo 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .loader-text-enter {
          animation: loaderTextEnter 0.45s ease-out both;
        }

        .loader-text-out {
          animation: loaderTextOut 0.35s ease-in-out forwards;
        }

        .loader-bg-out {
          animation: loaderBgOut 0.5s ease-in-out forwards;
        }

        @keyframes loaderIconEnter {
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
            transform: translate(0, 0) scale(1);
          }

          100% {
            transform: translate(var(--target-x, 0px), var(--target-y, 0px))
              scale(var(--target-scale, 0.4));
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