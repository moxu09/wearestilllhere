"use client";

import { useState } from "react";


const instagramUrl = "https://www.instagram.com/w.a.s.h.co";
const threadsUrl = "https://www.threads.net/@w.a.s.h.co";
const discordUrl = "#";

const priceCards = [
  {
    icon: "🎮",
    title: "遊戲陪玩",
    desc: "特戰英豪、PUBG、三角洲行動等遊戲服務",
    type: "games",
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

const gameCards = [
  {
    icon: "🔫",
    title: "特戰英豪",
    desc: "娛樂陪玩、技術陪玩、指定陪玩服務",
    detailTitle: "特戰英豪",
    detailDesc: "適合想找人一起排位、娛樂、陪打或提升遊戲體驗的闆闆。",
    prices: [
      "娛樂陪玩：230 / 小時",
      "技術陪玩：250 / 小時",
      "指定陪玩：依人員公告或客服確認",
      "不提供代打服務",
      "以第一把開局時間做計算",
      "若時間到但對局未結束，當局仍計算保底內",
    ],
  },
  {
    icon: "🪖",
    title: "三角洲行動",
    desc: "機密雙護、猛攻護航、保底與無保方案",
    detailTitle: "三角洲行動",
    detailDesc: "依照地圖、護航類型與保底需求不同，價格會有所調整。",
    prices: [
      "機密雙護｜無保：600 / 小時",
      "機密雙護｜保底 1000 萬：800 / 小時",
      "猛攻護航｜無保：700 / 小時",
      "猛攻護航｜保底 1800 萬：1100 / 小時",
      "時間內未達到保底，重新計算",
    ],
  },
  {
    icon: "🍳",
    title: "PUBG",
    desc: "娛樂陪玩、場次制或時數制",
    detailTitle: "PUBG",
    detailDesc: "可依需求安排娛樂陪、雙陪或多人一起遊玩。",
    prices: [
      "單陪：99 / 289 / 459",
      "雙陪：180 / 499",
      "特殊方案：888",
      "可指定陪陪，指定費另計",
      "實際方案以當下公告為準",
    ],
  },
  {
    icon: "🎲",
    title: "其他遊戲",
    desc: "恐怖遊戲、Steam 遊戲、多人派對遊戲",
    detailTitle: "其他遊戲",
    detailDesc: "若沒有看到想玩的遊戲，可以先詢問客服是否可安排。",
    prices: [
      "恐怖遊戲：依遊戲與人數報價",
      "Steam 遊戲：依遊戲內容報價",
      "多人派對遊戲：依時數報價",
      "特殊需求可洽客服確認",
    ],
  },
];

export default function HomePage() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);

  const currentCard = selectedCard === null ? null : priceCards[selectedCard];
  const currentGame = selectedGame === null ? null : gameCards[selectedGame];

  function backToPriceCards() {
    setSelectedCard(null);
    setSelectedGame(null);
  }

  function backToGameCards() {
    setSelectedGame(null);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050511] text-white">
      {/* 背景 */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#050511]">
        {/* 深夜漸層光暈 */}
        <div className="absolute left-1/2 top-[-120px] h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-yellow-400/18 blur-[150px]" />
        <div className="absolute right-[-160px] top-[22%] h-[560px] w-[560px] rounded-full bg-violet-600/22 blur-[150px]" />
        <div className="absolute bottom-[-140px] left-[-140px] h-[520px] w-[520px] rounded-full bg-cyan-500/12 blur-[140px]" />
        <div className="absolute bottom-[15%] right-[18%] h-[260px] w-[260px] rounded-full bg-yellow-300/10 blur-[90px]" />

        {/* 細緻格紋 */}
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:52px_52px]" />

        {/* 深色遮罩 */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(5,5,17,0.35)_45%,rgba(5,5,17,0.92)_100%)]" />

        {/* 月亮 */}
        <div className="absolute right-[12%] top-[18%] hidden h-20 w-20 rounded-full bg-yellow-200/80 shadow-[0_0_45px_rgba(254,240,138,0.55)] md:block">
          <div className="absolute -right-3 -top-1 h-20 w-20 rounded-full bg-[#050511]" />
        </div>

        {/* 流星 */}
        <div className="shooting-star absolute left-[12%] top-[24%] h-[2px] w-28 rotate-[-28deg] rounded-full bg-gradient-to-r from-transparent via-yellow-200 to-transparent opacity-80" />
        <div className="shooting-star-delay absolute right-[22%] top-[52%] h-[2px] w-24 rotate-[-28deg] rounded-full bg-gradient-to-r from-transparent via-cyan-200 to-transparent opacity-60" />

        {/* 星星 */}
        <span className="absolute left-[14%] top-[18%] text-2xl text-yellow-200/70">
          ✦
        </span>
        <span className="absolute left-[26%] top-[34%] text-sm text-yellow-100/50">
          ✧
        </span>
        <span className="absolute right-[28%] top-[26%] text-xl text-yellow-200/60">
          ✦
        </span>
        <span className="absolute right-[14%] top-[62%] text-2xl text-yellow-100/50">
          ✧
        </span>
        <span className="absolute bottom-[20%] left-[20%] text-xl text-cyan-100/40">
          ✦
        </span>
        <span className="absolute bottom-[28%] right-[34%] text-sm text-yellow-100/50">
          ✧
        </span>

        {/* 漂浮燈點 */}
        <div className="float-light absolute bottom-[28%] left-[9%] h-3 w-3 rounded-full bg-yellow-300/70 shadow-[0_0_20px_rgba(250,204,21,0.8)]" />
        <div className="float-light-delay absolute bottom-[34%] right-[12%] h-2.5 w-2.5 rounded-full bg-cyan-200/60 shadow-[0_0_20px_rgba(165,243,252,0.7)]" />
        <div className="float-light-slow absolute left-[45%] top-[22%] h-2 w-2 rounded-full bg-yellow-100/60 shadow-[0_0_18px_rgba(254,249,195,0.7)]" />
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
            <a href="#lottery" className="transition hover:text-yellow-300">
              抽獎活動
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
              href="#lottery"
              className="rounded-full border border-yellow-300/35 bg-yellow-300/10 px-7 py-3 text-sm font-bold text-yellow-200 transition hover:-translate-y-1 hover:border-yellow-300/70 hover:bg-yellow-300/15"
            >
              開幕抽獎
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
      <section id="prices" className="relative z-10 px-4 py-16 md:py-20">
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

          {/* 第一層：四大分類 */}
          {selectedCard === null && (
            <div className="mx-auto mt-10 grid max-w-3xl grid-cols-2 gap-4 md:gap-6">
              {priceCards.map((card, index) => (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => {
                    setSelectedCard(index);
                    setSelectedGame(null);
                  }}
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
          )}

          {/* 第二層：遊戲清單 */}
          {selectedCard !== null &&
            currentCard?.type === "games" &&
            selectedGame === null && (
              <div className="mx-auto mt-10 max-w-3xl rounded-[2rem] border border-yellow-300/25 bg-white/[0.06] p-6 shadow-[0_0_35px_rgba(250,204,21,0.12)] md:p-8">
                <button
                  type="button"
                  onClick={backToPriceCards}
                  className="mb-6 rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs font-bold tracking-[0.2em] text-white/65 transition hover:border-yellow-300/50 hover:text-yellow-300"
                >
                  ← 返回價目探索
                </button>

                <div className="mb-7">
                  <h3 className="text-2xl font-black text-white md:text-3xl">
                    遊戲陪玩
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white/55 md:text-base">
                    選擇遊戲後，會顯示該遊戲的詳細方案與價目。
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {gameCards.map((game, index) => (
                    <button
                      key={game.title}
                      type="button"
                      onClick={() => setSelectedGame(index)}
                      className="aspect-square rounded-[1.5rem] border border-white/10 bg-black/20 p-4 text-left transition hover:-translate-y-1 hover:border-yellow-300/50 hover:bg-yellow-300/10"
                    >
                      <div className="flex h-full flex-col justify-between">
                        <div>
                          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-300/15 text-2xl">
                            {game.icon}
                          </div>
                          <h4 className="text-base font-black text-white md:text-xl">
                            {game.title}
                          </h4>
                          <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/50">
                            {game.desc}
                          </p>
                        </div>

                        <p className="text-xs font-bold tracking-[0.2em] text-yellow-300/80">
                          查看詳細
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* 第三層：單一遊戲詳細 */}
          {selectedCard !== null &&
            currentCard?.type === "games" &&
            selectedGame !== null && (
              <div className="mx-auto mt-10 max-w-3xl rounded-[2rem] border border-yellow-300/25 bg-white/[0.06] p-6 shadow-[0_0_35px_rgba(250,204,21,0.12)] md:p-8">
                <div className="mb-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={backToGameCards}
                    className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs font-bold tracking-[0.2em] text-white/65 transition hover:border-yellow-300/50 hover:text-yellow-300"
                  >
                    ← 返回遊戲清單
                  </button>

                  <button
                    type="button"
                    onClick={backToPriceCards}
                    className="rounded-full border border-white/10 bg-black/25 px-4 py-2 text-xs font-bold tracking-[0.2em] text-white/65 transition hover:border-yellow-300/50 hover:text-yellow-300"
                  >
                    回到價目探索
                  </button>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-yellow-300/15 text-4xl">
                    {currentGame?.icon}
                  </div>

                  <div>
                    <h3 className="text-2xl font-black text-white md:text-3xl">
                      {currentGame?.detailTitle}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-white/55 md:text-base">
                      {currentGame?.detailDesc}
                    </p>
                  </div>
                </div>

                <div className="mt-7 grid gap-3">
                  {currentGame?.prices.map((price) => (
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

          {/* 第二層：其他一般分類詳細 */}
          {selectedCard !== null &&
            currentCard?.type !== "games" &&
            selectedGame === null && (
              <div className="mx-auto mt-10 max-w-3xl rounded-[2rem] border border-yellow-300/25 bg-white/[0.06] p-6 shadow-[0_0_35px_rgba(250,204,21,0.12)] md:p-8">
                <button
                  type="button"
                  onClick={backToPriceCards}
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
                  {currentCard?.prices?.map((price) => (
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

      {/* 抽獎活動 */}
      <section id="lottery" className="relative z-10 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <p className="text-xs font-bold tracking-[0.35em] text-yellow-300/80">
              OPENING LOTTERY
            </p>
            <h2 className="mt-3 text-3xl font-black md:text-5xl">
              開幕抽獎活動
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/55 md:text-base">
              消費越多，抽獎券越多。深夜不關燈陪你玩，也陪你把好禮帶回家。
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-[2rem] border border-yellow-300/25 bg-yellow-300/10 p-6 shadow-[0_0_30px_rgba(250,204,21,0.12)]">
              <p className="text-xs font-bold tracking-[0.25em] text-yellow-300/80">
                活動期間
              </p>
              <h3 className="mt-3 text-2xl font-black text-white">
                6/18－8/31
              </h3>
              <p className="mt-3 text-sm leading-7 text-white/55">
                活動期間內完成消費，即可累積抽獎券。
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
              <p className="text-xs font-bold tracking-[0.25em] text-yellow-300/80">
                抽獎券規則
              </p>
              <h3 className="mt-3 text-2xl font-black text-white">
                每 1000 元 1 張
              </h3>
              <p className="mt-3 text-sm leading-7 text-white/55">
                每消費滿 1000 元即可獲得 1 張抽獎券，可累加計算。
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6">
              <p className="text-xs font-bold tracking-[0.25em] text-yellow-300/80">
                開獎日期
              </p>
              <h3 className="mt-3 text-2xl font-black text-white">9/10 開獎</h3>
              <p className="mt-3 text-sm leading-7 text-white/55">
                中獎名單與領獎方式，將依官方公告為準。
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] border border-yellow-300/30 bg-black/25 p-6 md:p-8">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold tracking-[0.35em] text-yellow-300/80">
                  LIMITED BONUS
                </p>
                <h3 className="mt-3 text-2xl font-black text-white md:text-3xl">
                  前 50 筆訂單，抽獎券翻倍！
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/55">
                  小編幫各位爭取到福利啦！前 50 筆滿額訂單可享抽獎券翻倍，
                  總量限量 100 張，送完為止。
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-yellow-300/25 bg-yellow-300/10 px-6 py-5 text-center">
                <p className="text-sm font-bold text-yellow-300">限量</p>
                <p className="mt-1 text-4xl font-black text-white">100</p>
                <p className="mt-1 text-xs text-white/45">張翻倍券</p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 md:p-8">
            <h3 className="text-xl font-black text-yellow-300">獎項門檻</h3>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {[
                "滿 3000 張：iPhone 17 Pro Max 512G",
                "滿 2000 張：MacBook Air 512G",
                "滿 1000 張：iPad Air 11 512G",
                "滿 700 張：AirPods Max",
                "滿 500 張：AirPods Pro",
                "滿 200 張：AirPods",
                "滿 100 張：Nitro 一年",
                "滿 50 張：Nitro 一個月",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-sm font-medium text-white/75"
                >
                  {item}
                </div>
              ))}
            </div>

            <p className="mt-5 text-xs leading-6 text-white/40">
              實際獎項、抽獎資格與活動規則，依深夜不關燈官方最新公告為準。
            </p>
          </div>
        </div>
      </section>

      {/* 特色 */}
      <section className="relative z-10 px-4 py-16 md:py-20">
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
      <section id="contact" className="relative z-10 px-4 py-16 md:py-20">
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

          <div className="mt-7 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href={discordUrl}
            className="inline-flex w-full items-center justify-center rounded-full bg-yellow-300 px-8 py-3 text-sm font-black text-black shadow-[0_0_25px_rgba(250,204,21,0.35)] transition hover:-translate-y-1 hover:bg-yellow-200 sm:w-auto"
          >
           前往 Discord
          </a>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-pink-300/40 bg-pink-300/10 px-8 py-3 text-sm font-bold text-pink-100 transition hover:-translate-y-1 hover:border-pink-300/70 hover:bg-pink-300/15 sm:w-auto"
          >
            <span className="text-lg">📷</span>
            Instagram
          </a>

          <a
            href={threadsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-8 py-3 text-sm font-bold text-white transition hover:-translate-y-1 hover:border-white/50 hover:bg-white/15 sm:w-auto"
          >
            <span className="text-lg">＠</span>
            Threads
          </a>
        </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-4 py-8 text-center text-xs text-white/35">
        © 深夜不關燈 All Rights Reserved.
      </footer>

      <style jsx>{`
        .shooting-star {
          animation: shootingStar 4.5s ease-in-out infinite;
        }

        .shooting-star-delay {
          animation: shootingStar 6s ease-in-out infinite;
          animation-delay: 1.8s;
        }

        .float-light {
          animation: floatLight 3.8s ease-in-out infinite;
        }

        .float-light-delay {
          animation: floatLight 4.6s ease-in-out infinite;
          animation-delay: 1s;
        }

        .float-light-slow {
          animation: floatLight 5.2s ease-in-out infinite;
          animation-delay: 0.5s;
        }

        @keyframes shootingStar {
          0% {
            opacity: 0;
            transform: translate(0, 0) rotate(-28deg);
          }

          12% {
            opacity: 1;
          }

          35% {
            opacity: 0;
            transform: translate(180px, 90px) rotate(-28deg);
          }

          100% {
            opacity: 0;
            transform: translate(180px, 90px) rotate(-28deg);
          }
        }

        @keyframes floatLight {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.45;
          }

          50% {
            transform: translateY(-18px);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}