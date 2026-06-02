"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function SiteLoader() {
  const [leaving, setLeaving] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [target, setTarget] = useState({ x: 0, y: 0 });

  useEffect(() => {
    function updateTarget() {
      const el = document.getElementById("hero-icon-target");

      if (!el) {
        setTarget({
          x: window.innerWidth / 2,
          y: window.innerHeight * 0.22,
        });
        return;
      }

      const rect = el.getBoundingClientRect();

      setTarget({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }

    updateTarget();
    window.addEventListener("resize", updateTarget);

    const leaveTimer = setTimeout(() => {
      updateTarget();
      setLeaving(true);
    }, 1300);

    const hideTimer = setTimeout(() => {
      setHidden(true);
    }, 2300);

    return () => {
      window.removeEventListener("resize", updateTarget);
      clearTimeout(leaveTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden bg-[#070711] text-white transition-opacity duration-700 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* 背景光暈 */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="absolute right-[-120px] top-40 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      {/* 背景星星 */}
      <span className="loader-bg-star loader-bg-star-one">✦</span>
      <span className="loader-bg-star loader-bg-star-two">✧</span>
      <span className="loader-bg-star loader-bg-star-three">✦</span>
      <span className="loader-bg-star loader-bg-star-four">✧</span>

      {/* 文字內容 */}
      <div
        className={`absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center transition-all duration-700 ${
          leaving ? "opacity-0 scale-95" : "opacity-100 scale-100"
        }`}
      >
        <p className="rounded-full border border-yellow-300/40 bg-yellow-300/10 px-5 py-2 text-xs font-black tracking-[0.3em] text-yellow-300">
          深夜不關燈
        </p>

        <h2 className="mt-4 text-3xl font-black text-white">點亮中</h2>

        <p className="mt-3 text-sm text-zinc-400">
          正在為你準備深夜的燈光...
        </p>

        <div className="mt-6 flex items-center gap-2">
          <span className="loader-dot" />
          <span className="loader-dot loader-dot-two" />
          <span className="loader-dot loader-dot-three" />
        </div>
      </div>

      {/* 會飛到首頁 icon 實際位置的 icon */}
      <div
        className="fixed z-10 flex h-36 w-36 items-center justify-center transition-all duration-1000 ease-in-out"
        style={{
          left: leaving ? `${target.x}px` : "50%",
          top: leaving ? `${target.y}px` : "50%",
          transform: leaving
            ? "translate(-50%, -50%) scale(0.95)"
            : "translate(-50%, -50%) scale(1)",
        }}
      >
        <div className="loader-icon-glow absolute h-32 w-32 rounded-full bg-yellow-300/25 blur-2xl" />

        <div className="loader-icon-float relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-yellow-300/70 bg-zinc-950 shadow-2xl shadow-yellow-300/20">
          <Image
            src="/icon.png"
            alt="深夜不關燈"
            width={82}
            height={82}
            className="rounded-2xl"
            priority
          />
        </div>

        <span className="loader-star loader-star-one">✦</span>
        <span className="loader-star loader-star-two">✧</span>
        <span className="loader-star loader-star-three">✦</span>
      </div>

      <style>{`
        .loader-icon-float {
          animation: loaderIconFloat 2.6s ease-in-out infinite;
        }

        .loader-icon-glow {
          animation: loaderIconGlow 2.6s ease-in-out infinite;
        }

        .loader-star {
          position: absolute;
          color: #fde047;
          font-size: 20px;
          animation: loaderStarBlink 1.9s ease-in-out infinite;
          text-shadow: 0 0 14px rgba(253, 224, 71, 0.9);
        }

        .loader-star-one {
          top: 14px;
          right: 16px;
        }

        .loader-star-two {
          left: 10px;
          bottom: 26px;
          font-size: 16px;
          animation-delay: 0.4s;
        }

        .loader-star-three {
          right: 8px;
          bottom: 14px;
          font-size: 15px;
          animation-delay: 0.8s;
        }

        .loader-bg-star {
          position: absolute;
          color: rgba(253, 224, 71, 0.55);
          animation: loaderStarBlink 2.4s ease-in-out infinite;
          text-shadow: 0 0 12px rgba(253, 224, 71, 0.7);
        }

        .loader-bg-star-one {
          left: 16%;
          top: 22%;
          font-size: 18px;
        }

        .loader-bg-star-two {
          right: 18%;
          top: 24%;
          font-size: 16px;
          animation-delay: 0.5s;
        }

        .loader-bg-star-three {
          left: 22%;
          bottom: 24%;
          font-size: 14px;
          animation-delay: 0.9s;
        }

        .loader-bg-star-four {
          right: 26%;
          bottom: 20%;
          font-size: 18px;
          animation-delay: 1.2s;
        }

        .loader-dot {
          display: block;
          height: 10px;
          width: 10px;
          border-radius: 9999px;
          background: #fde047;
          animation: loaderDot 1.2s ease-in-out infinite;
          box-shadow: 0 0 14px rgba(253, 224, 71, 0.8);
        }

        .loader-dot-two {
          animation-delay: 0.2s;
        }

        .loader-dot-three {
          animation-delay: 0.4s;
        }

        @keyframes loaderIconFloat {
          0% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(0);
          }
        }

        @keyframes loaderIconGlow {
          0% {
            transform: scale(0.85);
            opacity: 0.18;
          }
          50% {
            transform: scale(1.15);
            opacity: 0.45;
          }
          100% {
            transform: scale(0.85);
            opacity: 0.18;
          }
        }

        @keyframes loaderStarBlink {
          0% {
            opacity: 0.25;
            transform: scale(0.8) rotate(0deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(14deg);
          }
          100% {
            opacity: 0.25;
            transform: scale(0.8) rotate(0deg);
          }
        }

        @keyframes loaderDot {
          0% {
            transform: translateY(0);
            opacity: 0.35;
          }
          50% {
            transform: translateY(-7px);
            opacity: 1;
          }
          100% {
            transform: translateY(0);
            opacity: 0.35;
          }
        }
      `}</style>
    </div>
  );
}