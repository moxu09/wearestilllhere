"use client";

import { useState } from "react";

const priceCards = [
  {
    icon: "🎮",
    title: "遊戲陪玩",
    desc: "特戰英豪、PUBG、三角洲行動等遊戲服務",
    detailTitle: "遊戲陪玩",
    detailDesc: "依不同遊戲、陪玩類型與保底需求計價。",
    prices: [
      "特戰英豪｜娛樂陪玩：依時段與人員報價",
      "PUBG｜娛樂陪玩：依場次或時數計價",
      "三角洲行動｜保底 / 無保方案另計",
      "其他遊戲可洽客服確認",
    ],
  },
  {
    icon: "💬",
    title: "聊天陪伴",
    desc: "深夜聊天、陪伴、出氣與情緒陪伴服務",
    detailTitle: "聊天陪伴",
    detailDesc: "適合想找人聊天、放鬆、陪伴或深夜不想一個人的你。",
    prices: [
      "女生陪伴：210 / 350 / 500 / 650",
      "女生出氣：100 / 250 / 450",
      "男生出氣：80 / 150 / 280",
      "實際方案依客服確認為準",
    ],
  },
  {
    icon: "🎁",
    title: "打賞禮物",
    desc: "浪漫禮物、特殊打賞與專寵獨賞",
    detailTitle: "打賞禮物",
    detailDesc: "送給喜歡的陪陪，讓深夜多一點儀式感。",
    prices: [
      "一般禮物：30 起",
      "特殊打賞｜明燈千里：1999",
      "專寵獨賞：16888",
      "明燈三千：依商品頁為準",
    ],
  },
  {
    icon: "💎",
    title: "儲值 VIP",
    desc: "ASD 儲值、會員方案與專屬福利",
    detailTitle: "儲值 VIP",
    detailDesc: "儲值後可用於下單、打賞與站內消費。",
    prices: [
      "1 元台幣 = 1 枚 ASD",
      "小夜燈 VIP：149 / 月",
      "星光燈 VIP：399 / 月",
      "永夜燈 VIP：999 / 月",
    ],
  },
];

export default function HomePage() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);

  const currentCard =
    selectedCard === null ? null : priceCards[selectedCard];

  return (
    <main className="min-h-screen overflow-hidden bg-[#050511] text-white">
      {/* 背景 */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-yellow-400/15 blur-[140px]" />
        <div className="absolute right-0 top-1/3 h-[460px] w-[460px] rounded-full bg-violet-600/20 blur-[130px]" />
        <div className="absolute bottom-0 left-0 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />
      </div>

      {/* Navbar */}
      <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#050511]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <img
              id="home-logo-icon"
              src="/icon.png"
              alt="深夜不關燈"
              className="h-10 w-10 rounded-xl object-cover shadow-[0_0_20px_rgba(250,204,21,0.35)] md:h-12 md:w-12"
            />
            <div>
              <p className="text-sm font-bold tracking-[0.25em] text-yellow-300">
                深夜不關燈
              </p>
              <p className="text-xs text-white/45">Night Light Service</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-white/65 md:flex">
            <a href="#home" className="transition hover:text-yellow-300">
              首頁
            </a>
            <a href="#prices" className="transition hover:text-yellow-300">
              價目探索
            </a>
            <a href="#contact" className="transition hover:text-yellow-300">
              聯絡我們
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section
        id="home"
        className="relative flex min-h-screen items-center justify-center px-4 pt-24"
      >
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="mx-auto inline-flex rounded-full border border-yellow-400/50 bg-yellow-300/10 px-5 py-2 text-xs font-bold tracking-[0.35em] text-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.18)]">
            WELCOME TO MIDNIGHT
          </p>

          <h1 className="mt-6 text-4xl font-black leading-tight md:text-6xl">
            深夜也有人陪你
            <span className="block text-yellow-300 drop-shadow-[0_0_18px_rgba(250,204,21,0.45)]">
              把燈亮著
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/65 md:text-lg">
            陪玩、聊天、打賞、儲值與 VIP 服務，一站式深夜陪伴平台。
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <a
              href="#prices"
              className="rounded-full bg-yellow-300 px-7 py-3 text-sm font-black text-black shadow-[0_0_25px_rgba(250,204,21,0.35)] transition hover:-translate-y-1 hover:bg-yellow-200"
            >
              查看價目
            </a>

            <a
              href="#contact"
              className="rounded-full border border-white/15 bg-white/5 px-7 py-3 text-sm font-bold text-white/80 transition hover:-translate-y-1 hover:border-yellow-300/50 hover:text-yellow-300"
            >
              聯絡客服
            </a>
          </div>
        </div>
      </section>

      {/* 價目探索 */}
      <section id="prices" className="relative px-4 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.35em] text-yellow-300/80">
              PRICE EXPLORE
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              價目探索
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/55 md:text-base">
              選擇你想了解的服務，點開後會顯示對應資訊與價目。
            </p>
          </div>

          {/* 2x2 方形卡片 */}
          {selectedCard === null ? (
            <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 md:gap-6">
              {priceCards.map((card, index) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => setSelectedCard(index)}
                  className="group aspect-square rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 text-left shadow-[0_0_25px_rgba(250,204,21,0.08)] transition duration-300 hover:-translate-y-1 hover:border-yellow-300/50 hover:bg-yellow-300/10 md:p-6"
                >
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-300/15 text-2xl shadow-[0_0_18px_rgba(250,204,21,0.12)] md:h-14 md:w-14 md:text-3xl">
                        {card.icon}
                      </div>

                      <h3 className="text-lg font-black text-white md:text-2xl">
                        {card.title}
                      </h3>

                      <p className="mt-2 line-clamp-3 text-xs leading-6 text-white/55 md:text-sm">
                        {card.desc}
                      </p>
                    </div>

                    <p className="text-xs font-bold tracking-[0.25em] text-yellow-300/80">
                      點擊查看
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="mx-auto mt-10 max-w-3xl rounded-[2rem] border border-yellow-300/25 bg-white/[0.06] p-6 shadow-[0_0_35px_rgba(250,204,21,0.12)] md:p-8">
              <button
                type="button"
                onClick={() => setSelectedCard(null)}
                className="mb-6 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs font-bold tracking-[0.2em] text-white/65 transition hover:border-yellow-300/50 hover:text-yellow-300"
              >
                ← 返回價目探索
              </button>

              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-yellow-300/15 text-4xl">
                  {currentCard?.icon}
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white md:text-3xl">
                    {currentCard?.detailTitle}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/55 md:text-base">
                    {currentCard?.detailDesc}
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-3">
                {currentCard?.prices.map((price) => (
                  <div
                    key={price}
                    className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-medium text-white/75"
                  >
                    {price}
                  </div>
                ))}
              </div>

              <p className="mt-6 text-xs leading-6 text-white/40">
                實際價格與接單內容，仍以客服確認與當下公告為準。
              </p>
            </div>
          )}
        </div>
      </section>

      {/* 特色 */}
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-3">
          {[
            {
              title: "快速回覆",
              desc: "客服協助確認需求，快速安排適合的陪陪。",
            },
            {
              title: "多元服務",
              desc: "遊戲、聊天、打賞、儲值與 VIP 服務整合。",
            },
            {
              title: "深夜陪伴",
              desc: "深夜不關燈，讓想被陪伴的人不再一個人。",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6"
            >
              <h3 className="text-xl font-black text-yellow-300">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-white/55">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 聯絡 */}
      <section id="contact" className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl rounded-[2rem] border border-yellow-300/25 bg-yellow-300/10 p-8 text-center shadow-[0_0_35px_rgba(250,204,21,0.12)] md:p-10">
          <p className="text-xs font-bold tracking-[0.35em] text-yellow-300/80">
            CONTACT
          </p>
          <h2 className="mt-3 text-3xl font-black md:text-4xl">
            想下單或詢問價目？
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/60 md:text-base">
            可透過 Discord 官方客服確認服務內容、陪陪安排與付款方式。
          </p>

          <a
            href="#"
            className="mt-7 inline-flex rounded-full bg-yellow-300 px-8 py-3 text-sm font-black text-black shadow-[0_0_25px_rgba(250,204,21,0.35)] transition hover:-translate-y-1 hover:bg-yellow-200"
          >
            前往 Discord
          </a>
        </div>
      </section>

      <footer className="border-t border-white/10 px-4 py-8 text-center text-xs text-white/35">
        © 深夜不關燈 All Rights Reserved.
      </footer>
    </main>
  );
}