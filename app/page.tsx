"use client";

import Image from "next/image";
import PriceExplorer from "./components/PriceExplorer";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070711] text-white">
      {/* 背景光暈 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-yellow-300/20 blur-3xl" />
        <div className="absolute right-[-120px] top-40 h-96 w-96 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-160px] left-[-120px] h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      {/* 首頁 Hero */}
      <section className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-20 text-center">
        {/* 動畫 Icon */}
        <div className="relative mb-8 flex h-36 w-36 items-center justify-center">
          <div className="icon-glow absolute h-32 w-32 rounded-full bg-yellow-300/25 blur-2xl" />

          <div className="icon-float relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-3xl border border-yellow-300/70 bg-zinc-900 shadow-2xl shadow-yellow-300/20">
            <Image
              src="/icon.png"
              alt="深夜不關燈"
              width={82}
              height={82}
              className="rounded-2xl"
              priority
            />
          </div>

          <span className="star star-one">✦</span>
          <span className="star star-two">✧</span>
          <span className="star star-three">✦</span>
        </div>

        <p className="mb-4 rounded-full border border-yellow-300/40 bg-yellow-300/10 px-5 py-2 text-sm font-bold tracking-[0.3em] text-yellow-300">
          深夜不關燈
        </p>

        <h1 className="max-w-4xl text-5xl font-black leading-tight tracking-tight text-white md:text-7xl">
          夜還很長，
          <br />
          我們陪你到天亮。
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-300 md:text-lg">
          遊戲陪玩、聊天陪伴、專屬打賞、會員儲值與活動抽獎，
          <br className="hidden md:block" />
          這裡是屬於深夜的溫柔燈火。
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="#prices"
            className="rounded-2xl bg-yellow-300 px-8 py-4 text-base font-black text-zinc-950 shadow-xl shadow-yellow-300/20 transition hover:scale-105 hover:bg-yellow-200"
          >
            查看價目表
          </a>

          <a
            href="#services"
            className="rounded-2xl border border-yellow-300/50 bg-white/5 px-8 py-4 text-base font-bold text-yellow-200 backdrop-blur transition hover:scale-105 hover:bg-yellow-300/10"
          >
            查看服務項目
          </a>
        </div>

        <div className="mt-14 grid w-full max-w-3xl grid-cols-3 gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-2xl font-black text-yellow-300">24H</p>
            <p className="mt-1 text-xs text-zinc-400">深夜陪伴</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-2xl font-black text-yellow-300">VIP</p>
            <p className="mt-1 text-xs text-zinc-400">會員制度</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
            <p className="text-2xl font-black text-yellow-300">ASD</p>
            <p className="mt-1 text-xs text-zinc-400">儲值代幣</p>
          </div>
        </div>
      </section>

      {/* 服務區 */}
      <section id="services" className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 text-center">
          <p className="text-sm font-bold tracking-[0.3em] text-yellow-300">
            SERVICES
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">服務項目</h2>
          <p className="mt-4 text-zinc-400">
            不只陪你玩，也陪你度過每一個不想關燈的夜晚。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-7 shadow-2xl shadow-black/20">
            <div className="mb-5 text-4xl">🎮</div>
            <h3 className="text-2xl font-black text-yellow-300">遊戲陪玩</h3>
            <p className="mt-4 leading-7 text-zinc-300">
              VALORANT、LOL、PUBG、三角洲行動等多種遊戲陪玩服務。
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-7 shadow-2xl shadow-black/20">
            <div className="mb-5 text-4xl">🌙</div>
            <h3 className="text-2xl font-black text-yellow-300">聊天陪伴</h3>
            <p className="mt-4 leading-7 text-zinc-300">
              深夜聊天、情緒陪伴、出氣陪聊，讓你不再一個人熬夜。
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-zinc-900/80 p-7 shadow-2xl shadow-black/20">
            <div className="mb-5 text-4xl">🎁</div>
            <h3 className="text-2xl font-black text-yellow-300">打賞禮物</h3>
            <p className="mt-4 leading-7 text-zinc-300">
              專屬禮物、特殊打賞、明燈系列，讓喜歡變得更有儀式感。
            </p>
          </div>
        </div>
      </section>

      {/* 價格區 */}
      <section id="prices" className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="mb-12 text-center">
          <p className="text-sm font-bold tracking-[0.3em] text-yellow-300">
            PRICE
          </p>
          <h2 className="mt-3 text-4xl font-black text-white">價目探索</h2>
          <p className="mt-4 text-zinc-400">
            選擇你想看的服務，快速查看對應價格。
          </p>
        </div>

        <div className="rounded-[2rem] border border-yellow-300/30 bg-zinc-900/70 p-4 shadow-2xl shadow-yellow-300/10 md:p-8">
          <PriceExplorer />
        </div>
      </section>

      {/* 特色區 */}
      <section className="relative mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
            <h3 className="text-3xl font-black text-white">為深夜點一盞燈</h3>
            <p className="mt-5 leading-8 text-zinc-300">
              深夜不關燈希望成為一個溫柔、安心、好玩的陪伴空間。
              無論你是想打遊戲、想找人聊天，或只是想有人陪著，
              都能在這裡找到一盞燈。
            </p>
          </div>

          <div className="rounded-[2rem] border border-yellow-300/30 bg-yellow-300/10 p-8 backdrop-blur">
            <h3 className="text-3xl font-black text-yellow-300">會員與儲值</h3>
            <p className="mt-5 leading-8 text-zinc-200">
              支援 ASD 儲值、VIP 會員、專屬優惠與活動抽獎。
              讓每一次消費都有更多回饋與紀念感。
            </p>
          </div>
        </div>
      </section>

      {/* 底部 */}
      <footer className="relative border-t border-white/10 px-6 py-10 text-center text-sm text-zinc-500">
        © 深夜不關燈 All rights reserved.
      </footer>

      <style>{`
        .icon-float {
          animation: iconFloat 2.6s ease-in-out infinite;
        }

        .icon-glow {
          animation: iconGlow 2.6s ease-in-out infinite;
        }

        .star {
          position: absolute;
          color: #fde047;
          font-size: 20px;
          animation: starBlink 1.9s ease-in-out infinite;
          text-shadow: 0 0 14px rgba(253, 224, 71, 0.9);
        }

        .star-one {
          top: 14px;
          right: 16px;
        }

        .star-two {
          left: 10px;
          bottom: 26px;
          font-size: 16px;
          animation-delay: 0.4s;
        }

        .star-three {
          right: 8px;
          bottom: 14px;
          font-size: 15px;
          animation-delay: 0.8s;
        }

        @keyframes iconFloat {
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

        @keyframes iconGlow {
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

        @keyframes starBlink {
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
      `}</style>
    </main>
  );
}