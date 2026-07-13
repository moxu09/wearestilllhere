"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  AtSign,
  Camera,
  Check,
  Clock3,
  ExternalLink,
  Gamepad2,
  Gem,
  Gift,
  Headphones,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { useState } from "react";
import ThanksWall from "./components/ThanksWall";

const instagramUrl = "https://www.instagram.com/w.a.s.h.co";
const threadsUrl = "https://www.threads.net/@w.a.s.h.co";
const discordUrl = "https://discord.gg/tXNnXWMHbJ";

const priceCards = [
  {
    icon: Gamepad2,
    index: "01",
    title: "遊戲陪玩",
    desc: "特戰英豪、PUBG、三角洲行動與更多遊戲服務",
    type: "games",
  },
  {
    icon: MessageCircle,
    index: "02",
    title: "聊天陪伴",
    desc: "深夜聊天、陪伴、出氣與情緒陪伴服務",
    detailDesc: "適合想找人聊天、放鬆、陪伴，或深夜不想一個人的你。",
    prices: [
      "女生陪伴：210 / 350 / 500 / 650",
      "女生出氣：100 / 250 / 450",
      "男生出氣：80 / 150 / 280",
      "實際方案依客服確認為準",
    ],
  },
  {
    icon: Gift,
    index: "03",
    title: "打賞禮物",
    desc: "浪漫禮物、特殊打賞與專寵獨賞",
    detailDesc: "送給喜歡的陪陪，讓深夜多一點專屬於你們的儀式感。",
    prices: [
      "一般禮物：30 起",
      "特殊打賞｜明燈千里：1999",
      "專寵獨賞：16888",
      "明燈三千：依商品頁為準",
    ],
  },
  {
    icon: Gem,
    index: "04",
    title: "儲值會員",
    desc: "ASD 儲值、星夜聯盟會籍與專屬福利",
    detailDesc: "儲值後可用於下單、打賞與站內消費，會籍進度可在會員中心查看。",
    prices: [
      "1 元台幣 = 1 枚 ASD",
      "錢包餘額即時連動",
      "會員積分與專屬兌換",
      "完整資格依會員中心顯示為準",
    ],
  },
];

const games = [
  {
    title: "特戰英豪",
    desc: "娛樂陪玩、指定陪玩服務",
    detail: "一起排位、娛樂、陪打，讓遊戲體驗不只剩輸贏。",
    prices: [
      "娛樂陪玩：280 / 小時",
      "指定陪玩：依人員公告或客服確認",
      "不提供代打服務",
      "以第一把開局時間做計算",
    ],
  },
  {
    title: "三角洲行動",
    desc: "機密雙護、猛攻護航與保底方案",
    detail: "依地圖、護航類型與保底需求安排適合的隊伍。",
    prices: [
      "機密雙護｜無保：600 / 小時",
      "機密雙護｜保底 1000 萬：800 / 小時",
      "猛攻護航｜無保：700 / 小時",
      "猛攻護航｜保底 1800 萬：1100 / 小時",
    ],
  },
  {
    title: "PUBG",
    desc: "娛樂陪玩、場次制或時數制",
    detail: "可依需求安排單陪、雙陪或多人一起遊玩。",
    prices: [
      "單陪：99 / 289 / 459",
      "雙陪：180 / 499",
      "特殊方案：888",
      "指定陪陪費用另計",
    ],
  },
  {
    title: "其他遊戲",
    desc: "恐怖遊戲、Steam 與多人派對遊戲",
    detail: "沒有看到想玩的遊戲，也可以直接詢問客服安排。",
    prices: [
      "恐怖遊戲：依遊戲與人數報價",
      "Steam 遊戲：依內容報價",
      "多人派對遊戲：依時數報價",
      "特殊需求可洽客服確認",
    ],
  },
];

export default function HomePage() {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<number | null>(null);
  const currentCard = selectedCard === null ? null : priceCards[selectedCard];
  const currentGame = selectedGame === null ? null : games[selectedGame];

  return (
    <main className="min-h-screen overflow-hidden bg-[#0d0e10] text-white">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0d0e10]/90 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
          <a href="#home" className="flex min-w-0 items-center gap-3">
            <Image src="/icon.png" alt="" width={36} height={36} className="h-9 w-9 rounded-md object-cover" />
            <div className="min-w-0">
              <p className="truncate text-sm font-black">深夜不關燈</p>
              <p className="truncate text-[10px] uppercase text-white/40">We are still here</p>
            </div>
          </a>
          <nav className="hidden items-center gap-7 text-xs font-bold text-white/55 md:flex">
            <a href="#services" className="hover:text-white">服務</a>
            <a href="#lottery" className="hover:text-white">活動</a>
            <a href="#contact" className="hover:text-white">聯絡</a>
            <a href="/membership" className="text-[#e7ba67] hover:text-[#f6d792]">會員登入</a>
          </nav>
          <a href={discordUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-2 rounded-md bg-[#e7ba67] px-4 text-xs font-black text-[#111214] hover:bg-[#f2cf8b]">
            Discord <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </header>

      <section id="home" className="relative min-h-[92vh] border-b border-white/10 pt-16">
        <Image
          src="/home/midnight-lounge-v2.png"
          alt="深夜城市中的陪伴空間"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_center] sm:object-center"
        />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative mx-auto flex min-h-[calc(92vh-4rem)] max-w-7xl items-end px-5 pb-16 pt-24 sm:px-8 sm:pb-20 lg:px-12">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 border-l-2 border-[#e7ba67] pl-3 text-xs font-bold uppercase text-[#f2cf8b]">
              <Clock3 className="h-4 w-4" /> Open through the night
            </p>
            <h1 className="mt-6 text-5xl font-black leading-[1.05] sm:text-7xl lg:text-8xl">
              深夜不關燈
            </h1>
            <p className="mt-5 max-w-xl text-lg font-bold text-white/90 sm:text-2xl">
              今晚不只在線，也在你身邊。
            </p>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/65 sm:text-base">
              遊戲、聊天、打賞、儲值與星夜聯盟會籍，讓每一個晚睡的理由，都有更好的陪伴方式。
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#services" className="inline-flex h-12 items-center gap-2 rounded-md bg-[#e7ba67] px-6 text-sm font-black text-[#111214] hover:bg-[#f2cf8b]">
                探索服務 <ArrowRight className="h-4 w-4" />
              </a>
              <a href="/membership" className="inline-flex h-12 items-center gap-2 rounded-md border border-white/30 bg-black/20 px-6 text-sm font-black hover:border-white/70 hover:bg-black/40">
                進入會員中心
              </a>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 right-0 hidden w-[34%] border-l border-t border-white/15 bg-[#0d0e10]/85 p-6 backdrop-blur md:block">
          <div className="grid grid-cols-3 divide-x divide-white/10 text-center">
            {["全年無休", "專人安排", "會員連動"].map((item) => <p key={item} className="text-xs font-bold text-white/65">{item}</p>)}
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#e7ba67] text-[#111214]">
        <div className="mx-auto flex max-w-7xl items-center justify-center overflow-hidden py-4 pl-20 pr-5 sm:justify-start sm:px-8 lg:px-12">
          <p className="shrink-0 text-[10px] font-black uppercase sm:text-xs">Stay late. Stay connected.</p>
          <div className="mx-6 hidden h-px min-w-16 flex-1 bg-black/30 sm:block" />
          <p className="hidden shrink-0 text-xs font-black md:block">深夜有人回應，就是一種安心。</p>
        </div>
      </section>

      <section id="services" className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr]">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-xs font-bold uppercase text-[#5bd6d0]">Service directory</p>
              <h2 className="mt-4 text-4xl font-black sm:text-5xl">想怎麼過今晚？</h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-white/55">
                從一場遊戲到一段對話，選擇你需要的陪伴。我們把價格與服務整理得清楚，客服也會協助確認細節。
              </p>
            </div>

            <div>
              {selectedCard === null ? (
                <div className="border-l border-t border-white/10">
                  {priceCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                      <button key={card.title} type="button" onClick={() => { setSelectedCard(index); setSelectedGame(null); }} className="group grid w-full grid-cols-[3rem_1fr_auto] items-center gap-4 border-b border-r border-white/10 p-5 text-left transition hover:bg-white/[0.04] sm:grid-cols-[4rem_1fr_auto] sm:p-7">
                        <span className="text-xs font-bold text-[#e7ba67]">{card.index}</span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-3 text-xl font-black sm:text-2xl"><Icon className="h-5 w-5 text-[#5bd6d0]" /> {card.title}</span>
                          <span className="mt-2 block text-sm leading-6 text-white/45">{card.desc}</span>
                        </span>
                        <ArrowRight className="h-5 w-5 text-white/35 transition group-hover:translate-x-1 group-hover:text-[#e7ba67]" />
                      </button>
                    );
                  })}
                </div>
              ) : currentCard?.type === "games" && selectedGame === null ? (
                <DetailShell title="遊戲陪玩" description="選擇遊戲，查看目前方案與計價方式。" onBack={() => setSelectedCard(null)}>
                  <div className="grid border-l border-t border-white/10 sm:grid-cols-2">
                    {games.map((game, index) => (
                      <button key={game.title} type="button" onClick={() => setSelectedGame(index)} className="group min-h-40 border-b border-r border-white/10 p-5 text-left hover:bg-white/[0.04] sm:p-6">
                        <Gamepad2 className="h-5 w-5 text-[#5bd6d0]" />
                        <h3 className="mt-8 text-lg font-black">{game.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-white/45">{game.desc}</p>
                      </button>
                    ))}
                  </div>
                </DetailShell>
              ) : (
                <DetailShell
                  title={currentGame?.title || currentCard?.title || "服務詳情"}
                  description={currentGame?.detail || currentCard?.detailDesc || ""}
                  onBack={() => currentGame ? setSelectedGame(null) : setSelectedCard(null)}
                  secondaryBack={currentGame ? () => { setSelectedGame(null); setSelectedCard(null); } : undefined}
                >
                  <div className="border-l border-t border-white/10">
                    {(currentGame?.prices || currentCard?.prices || []).map((price) => (
                      <div key={price} className="flex items-start gap-3 border-b border-r border-white/10 p-4 text-sm text-white/70 sm:p-5">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#e7ba67]" /> {price}
                      </div>
                    ))}
                  </div>
                </DetailShell>
              )}
            </div>
          </div>
        </div>
      </section>

      <section id="lottery" className="border-y border-white/10 bg-[#15171a] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:items-end">
            <div>
              <Trophy className="h-7 w-7 text-[#e7ba67]" />
              <p className="mt-6 text-xs font-bold uppercase text-[#ff806f]">Opening lottery</p>
              <h2 className="mt-4 text-4xl font-black sm:text-6xl">把今晚的幸運，也一起帶走。</h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-white/55 lg:justify-self-end">
              活動期間每消費滿 1,000 元獲得 1 張抽獎券；前 50 筆滿額訂單抽獎券翻倍，限量 100 張。
            </p>
          </div>
          <div className="mt-12 grid border-l border-t border-white/10 md:grid-cols-3">
            {[
              ["活動期間", "6/18 - 8/31", "完成消費即可累積抽獎券"],
              ["抽獎規則", "每千元 1 張", "可依消費金額持續累加"],
              ["開獎日期", "9/10", "中獎與領獎方式依官方公告"],
            ].map(([label, value, desc]) => (
              <div key={label} className="border-b border-r border-white/10 p-6 sm:p-8">
                <p className="text-xs font-bold text-[#e7ba67]">{label}</p>
                <p className="mt-5 text-3xl font-black">{value}</p>
                <p className="mt-3 text-sm leading-6 text-white/45">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {["iPhone 17 Pro Max 512G", "MacBook Air 512G", "iPad Air 11 512G", "AirPods Max / Pro / Nitro"].map((prize, index) => (
              <div key={prize} className="rounded-md border border-white/10 bg-[#0d0e10] p-5">
                <span className="text-xs font-black text-[#5bd6d0]">0{index + 1}</span>
                <p className="mt-8 text-sm font-bold">{prize}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid border-l border-t border-white/10 md:grid-cols-3">
            {[
              [Zap, "快速回覆", "客服協助釐清需求，快速安排適合的陪陪。", "#5bd6d0"],
              [ShieldCheck, "透明流程", "訂單、錢包與會員資格都有清楚的查詢入口。", "#e7ba67"],
              [Headphones, "深夜在線", "遊戲、聊天與更多服務，讓晚睡不必只剩自己。", "#ff806f"],
            ].map(([Icon, title, desc, color]) => {
              const FeatureIcon = Icon as typeof Zap;
              return (
                <div key={title as string} className="min-h-64 border-b border-r border-white/10 p-7 sm:p-8">
                  <FeatureIcon className="h-6 w-6" style={{ color: color as string }} />
                  <h3 className="mt-20 text-2xl font-black">{title as string}</h3>
                  <p className="mt-4 text-sm leading-7 text-white/50">{desc as string}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="contact" className="bg-[#e7ba67] px-5 py-20 text-[#111214] sm:px-8 lg:px-12 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-xs font-black uppercase">The light is on</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-black sm:text-6xl">有想法就來，我們替你把今晚安排好。</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <SocialLink href={discordUrl} label="前往 Discord" icon={ExternalLink} dark />
            <SocialLink href={instagramUrl} label="Instagram" icon={Camera} />
            <SocialLink href={threadsUrl} label="Threads" icon={AtSign} />
          </div>
        </div>
      </section>

      <ThanksWall />

      <footer className="border-t border-white/10 bg-[#090a0c] px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-black text-white/70">深夜不關燈 · WE ARE STILL HERE</p>
          <p>© 2026 深夜不關燈 All Rights Reserved.</p>
        </div>
      </footer>
    </main>
  );
}

function DetailShell({ title, description, onBack, secondaryBack, children }: { title: string; description: string; onBack: () => void; secondaryBack?: () => void; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-8 flex flex-wrap gap-3">
        <button type="button" onClick={onBack} className="inline-flex h-9 items-center gap-2 rounded-md border border-white/15 px-4 text-xs font-bold text-white/65 hover:border-white/40 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> 返回
        </button>
        {secondaryBack && <button type="button" onClick={secondaryBack} className="h-9 rounded-md border border-white/15 px-4 text-xs font-bold text-white/65 hover:text-white">所有服務</button>}
      </div>
      <h3 className="text-3xl font-black sm:text-4xl">{title}</h3>
      <p className="mb-8 mt-4 max-w-xl text-sm leading-7 text-white/50">{description}</p>
      {children}
      <p className="mt-5 text-xs leading-6 text-white/35">實際價格、接單內容與活動資格，仍以客服確認及官方最新公告為準。</p>
    </div>
  );
}

function SocialLink({ href, label, icon: Icon, dark = false }: { href: string; label: string; icon: typeof Sparkles; dark?: boolean }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`flex h-12 items-center justify-between rounded-md border px-5 text-sm font-black transition ${dark ? "border-[#111214] bg-[#111214] text-white hover:bg-[#26282b]" : "border-black/30 hover:border-black"}`}>
      {label} <Icon className="h-4 w-4" />
    </a>
  );
}
