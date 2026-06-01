const discordLink = "https://discord.gg/tXNnXWMHbJ";

const serviceCards = [
  {
    title: "聊天陪伴",
    tag: "CHAT",
    text: "不想一個人待著的時候，可以找人聊天、聽你說話、陪你度過深夜。",
    accent: "from-purple-400/30 to-pink-400/10",
    href: "#price-chat",
  },
  {
    title: "遊戲陪玩",
    tag: "GAME",
    text: "提供 Steam、PUBG、特戰英豪、三角洲行動等多種陪玩與護航服務。",
    accent: "from-blue-400/30 to-purple-400/10",
    href: "#price-game",
  },
  {
    title: "打賞禮物",
    tag: "GIFT",
    text: "用一份心意點亮對方的夜晚，支援特殊打賞、專屬禮物與浪漫品項。",
    accent: "from-pink-400/30 to-yellow-400/10",
    href: "#price-gift",
  },
  {
    title: "VIP 尊享",
    tag: "VIP",
    text: "累積消費與單次儲值皆可升級，解鎖專屬頻道、折價券、周邊與冠名福利。",
    accent: "from-yellow-300/30 to-purple-400/10",
    href: "#vip",
  },
];

const companions = [
  {
    name: "小夜燈",
    role: "聊天陪伴",
    time: "20:00 - 02:00",
    tags: ["溫柔陪聊", "情緒陪伴", "深夜在線"],
    desc: "適合想找人說說話、放鬆情緒、安靜陪伴的夜晚。",
    status: "推薦",
    gradient: "from-purple-400/40 via-pink-300/20 to-blue-400/20",
    href: "#price-chat",
  },
  {
    name: "星光陪陪",
    role: "娛樂陪玩",
    time: "依當日排班",
    tags: ["PUBG", "Steam", "輕鬆玩"],
    desc: "不追求壓力，只想一起開心玩、有人互動的首選。",
    status: "熱門",
    gradient: "from-blue-400/40 via-purple-300/20 to-pink-400/20",
    href: "#price-game",
  },
  {
    name: "技術陪陪",
    role: "特戰 / 護航",
    time: "需洽客服",
    tags: ["特戰英豪", "三角洲", "技術服務"],
    desc: "依段位、模式與需求安排，適合需要穩定配合的玩家。",
    status: "技術",
    gradient: "from-red-400/40 via-purple-300/20 to-orange-300/20",
    href: "#price-game",
  },
  {
    name: "專屬小管家",
    role: "VIP / 打賞",
    time: "客製安排",
    tags: ["VIP", "冠名", "專屬服務"],
    desc: "冠名、專屬語音、禮物區、活動福利與高階會員尊享內容。",
    status: "尊享",
    gradient: "from-yellow-300/40 via-pink-300/20 to-purple-400/20",
    href: "#vip",
  },
];

const priceSections = [
  {
    id: "price-chat",
    title: "聊天陪伴",
    subtitle: "你說話，我聽著；你沉默，我陪著。",
    items: [
      ["男生 半小時", "160 元"],
      ["男生 一小時", "300 元"],
      ["男生 90 分鐘", "450 元"],
      ["男生 兩小時", "550 元"],
      ["女生 半小時", "210 元"],
      ["女生 一小時", "350 元"],
      ["女生 90 分鐘", "500 元"],
      ["女生 兩小時", "650 元"],
    ],
  },
  {
    id: "price-chat",
    title: "出氣陪伴",
    subtitle: "情緒出口，盡情傾訴，我會好好接住你。",
    items: [
      ["男生 10 分鐘", "100 元"],
      ["男生 30 分鐘", "250 元"],
      ["男生 一小時", "450 元"],
      ["女生 10 分鐘", "100 元"],
      ["女生 30 分鐘", "250 元"],
      ["女生 一小時", "450 元"],
      ["臨時頭像更換", "20 元"],
    ],
  },
  {
    id: "price-game",
    title: "PUBG 娛樂陪玩",
    subtitle: "娛樂性質，不保證勝率與 KD。遊戲開始即算一場。",
    items: [
      ["娛樂單陪 1 場", "99 元"],
      ["娛樂單陪 3 場", "289 元"],
      ["娛樂單陪 5 場", "459 元"],
      ["娛樂雙陪 1 場", "180 元"],
      ["娛樂雙陪 3 場", "499 元"],
      ["娛樂雙陪 5 場", "888 元"],
      ["深夜加成 300 元以下", "10%"],
      ["深夜加成 300 元以上", "5%"],
    ],
  },
  {
    id: "price-game",
    title: "特戰英豪",
    subtitle: "依段位與服務類型計價，超凡以上可洽詢技術陪陪。",
    items: [
      ["一般場", "250 / hr"],
      ["黃金含以下", "250 / hr"],
      ["白金", "260 / hr"],
      ["鑽石", "270 / hr"],
      ["超凡", "310 / hr"],
      ["技術陪 黃金含以下", "260 / hr"],
      ["技術陪 白金", "180 / 局"],
      ["技術陪 鑽石", "210 / 局"],
      ["技術陪 超凡", "240 / 局"],
      ["技術陪 神話", "300 / 局"],
    ],
  },
  {
    id: "price-game",
    title: "Steam 遊戲陪玩",
    subtitle: "深夜不關燈擁有最終解釋權，任何問題請洽客服。",
    items: [
      ["恐怖遊戲", "250 / hr"],
      ["肉鴿遊戲", "240 / hr"],
      ["派對遊戲", "230 / hr"],
      ["生存遊戲", "260 / hr"],
    ],
  },
  {
    id: "price-game",
    title: "三角洲行動",
    subtitle: "專業護航、純綠安全、效率穩定、客戶至上。",
    items: [
      ["機密雙護 基本無保", "600 / 小時"],
      ["機密雙護 有保底", "800 / 小時"],
      ["機密雙護 保底金額", "1000 萬"],
      ["猛攻護航 基本無保", "700 / 小時"],
      ["猛攻護航 有保底", "1100 / 小時"],
      ["猛攻護航 保底金額", "1800 萬"],
      ["一般陪玩", "280 / 小時"],
    ],
  },
  {
    id: "price-gift",
    title: "打賞禮物",
    subtitle: "用一份心意，點亮對方的夜晚。",
    items: [
      ["特殊打賞", "依品項公告"],
      ["明燈千里", "1999 元"],
      ["專寵獨賞", "16888 元"],
      ["明燈三千", "請洽客服"],
    ],
  },
];

const vipTiers = [
  {
    level: "VIP 1",
    need: "累積消費 5,000 或單次儲值 3,000 ASD",
    rewards: ["獲得 150 ASD"],
  },
  {
    level: "VIP 2",
    need: "累積消費 8,000 或單次儲值 7,000 ASD",
    rewards: ["獲得 300 ASD", "解鎖尊享頻道"],
  },
  {
    level: "VIP 3",
    need: "累積消費 15,000 或單次儲值 13,500 ASD",
    rewards: ["獲得 1,000 ASD", "獲得 1 個月自定義 TAG + 身分組圖標", "獲得 95 折券 × 1"],
  },
  {
    level: "VIP 4",
    need: "累積消費 30,000 或單次儲值 27,500 ASD",
    rewards: ["獲得 1,314 ASD", "自定義指定陪玩冠名 3 日", "獲得個人語音頻道", "獲得 9 折券 × 1"],
  },
  {
    level: "VIP 5",
    need: "累積消費 50,000 或單次儲值 45,000 ASD",
    rewards: ["獲得 5,200 ASD", "獲得 8 折折價券 × 1", "永久自定義 TAG + 身分組圖標", "每季定期周邊好禮 × 1"],
  },
];

const vvipTiers = [
  {
    level: "VVIP 1",
    need: "累積消費 66,666 或單次儲值 60,000 ASD",
    rewards: ["獲得 6,666 ASD", "闆闆個人聊天區", "尊享專區", "8 折折價券 × 1", "500 元禮品卡", "每月定期周邊好禮"],
  },
  {
    level: "VVIP 2",
    need: "累積消費 88,888 或單次儲值 80,000 ASD",
    rewards: ["獲得 8,888 ASD", "7 折折價券 × 1", "闆闆專屬禮物區", "訂製專屬冠名圖", "專屬客服一位", "每月限定大禮包"],
  },
  {
    level: "VVIP 3",
    need: "累積消費 99,999 或單次儲值 90,000 ASD",
    rewards: ["獲得 9,999 ASD", "7 折折價券 × 1", "闆闆專屬派單房", "陪玩冠名 3 日券 × 2", "限定節假日好禮"],
  },
  {
    level: "VVIP 4",
    need: "累積消費 131,420 或單次儲值 120,000 ASD",
    rewards: ["獲得 11,111 ASD", "陪玩前綴一週券 × 2", "7 折折價券 × 2", "陪玩冠名 7 日券 × 2", "專屬客服冠名一年"],
  },
  {
    level: "VVIP 5",
    need: "累積消費 521,314 或單次儲值 450,000 ASD",
    rewards: ["獲得 66,666 ASD", "闆闆全體專屬特別播報", "6 折折價券", "永久自定義 TAG + 身分組圖標", "訂製專屬禮物圖", "每月現實尊寵大禮包"],
  },
];

const prizes = [
  ["3000 張", "iPhone 17 Pro Max 512G", "價值約 52,900 元"],
  ["2000 張", "MacBook Air 512G", "價值約 35,900 元"],
  ["1000 張", "iPad Air 11 吋 512G", "價值約 30,400 元"],
  ["700 張", "AirPods Max 1 副", "價值約 17,990 元"],
  ["500 張", "AirPods Pro 1 副", "價值約 7,490 元"],
  ["200 張", "AirPods 1 副", "價值約 4,990 元"],
  ["100 張", "Discord Nitro 一年", "價值約 3,200 元"],
  ["50 張", "Discord Nitro 一個月", "開幕限定小確幸"],
];

const faqs = [
  ["如何下單？", "請加入 Discord 伺服器，依照點單系統選擇服務項目、陪陪、時段與付款方式，客服會協助確認訂單。"],
  ["可以指定陪陪嗎？", "可以，指定陪陪需依照陪陪當下接單狀態與時間安排為主。若指定人員無法接單，客服會協助媒合其他合適人選。"],
  ["付款方式有哪些？", "目前付款方式請以 Discord 內公告為準。若已儲值 ASD，也可以使用儲值卡餘額付款。"],
  ["遊戲陪玩會保證勝率嗎？", "一般娛樂陪玩不保證勝率、KD、段位、掉落物或任務結果。若為保底或特殊服務，請依照該服務規則與客服說明為準。"],
  ["訂單中途有問題怎麼辦？", "若遇到陪陪離線、時間爭議、付款問題或其他異常，請立即聯絡客服，不要私下爭執，客服會協助處理。"],
];

function SectionTitle({
  tag,
  title,
  text,
}: {
  tag: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="mb-12 text-center">
      <p className="mb-4 text-sm tracking-[0.35em] text-purple-300">{tag}</p>
      <h2 className="text-3xl font-black tracking-tight md:text-5xl">{title}</h2>
      {text && <p className="mx-auto mt-4 max-w-2xl text-zinc-400">{text}</p>}
    </div>
  );
}

function PriceCard({
  id,
  title,
  subtitle,
  items,
}: {
  id: string;
  title: string;
  subtitle: string;
  items: string[][];
}) {
  return (
    <div id={id} className="glass-card scroll-mt-28 rounded-3xl border border-white/10 bg-black/40 p-7">
      <h3 className="mb-2 text-2xl font-bold">{title}</h3>
      <p className="mb-6 text-sm leading-relaxed text-zinc-500">{subtitle}</p>

      <ul className="space-y-4">
        {items.map(([name, price]) => (
          <li
            key={`${title}-${name}`}
            className="flex justify-between gap-4 border-b border-white/5 pb-3 text-sm text-zinc-300"
          >
            <span>{name}</span>
            <span className="shrink-0 font-bold text-white">{price}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TierCard({
  level,
  need,
  rewards,
  vvip = false,
}: {
  level: string;
  need: string;
  rewards: string[];
  vvip?: boolean;
}) {
  return (
    <div
      className={`vip-card rounded-3xl border p-7 ${
        vvip ? "border-purple-400/20 bg-purple-500/10" : "border-white/10 bg-white/5"
      }`}
    >
      <p className={`mb-3 text-sm tracking-[0.3em] ${vvip ? "text-pink-300" : "text-purple-300"}`}>
        {vvip ? "VVIP" : "VIP"}
      </p>

      <h3 className="mb-3 text-2xl font-black">{level}</h3>
      <p className="mb-5 text-sm leading-relaxed text-zinc-300">{need}</p>

      <ul className="space-y-3 text-sm text-zinc-400">
        {rewards.map((reward) => (
          <li key={`${level}-${reward}`} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-300" />
            <span>{reward}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08080c] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="float-light absolute left-[-120px] top-20 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="float-light absolute right-[-120px] top-72 h-96 w-96 rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute bottom-[-180px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/35 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#home" className="flex items-center gap-2 text-lg font-black">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-300 shadow-[0_0_18px_rgba(216,180,254,0.9)]" />
            深夜不關燈
          </a>

          <nav className="hidden gap-6 text-sm text-zinc-300 md:flex">
            <a href="#services" className="hover:text-white">服務</a>
            <a href="#companions" className="hover:text-white">陪陪</a>
            <a href="#price" className="hover:text-white">價目</a>
            <a href="#vip" className="hover:text-white">VIP</a>
            <a href="#event" className="hover:text-white">活動</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
          </nav>

          <a
            href={discordLink}
            target="_blank"
            className="glow-button rounded-full bg-gradient-to-r from-purple-300 to-pink-300 px-5 py-2 text-sm font-bold text-black"
          >
            加入 Discord
          </a>
        </div>
      </header>

      <section id="home" className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 pt-28">
        <div className="grid w-full items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="text-center lg:text-left">
            <p className="soft-glow mb-6 inline-flex rounded-full border border-purple-300/20 bg-purple-300/10 px-5 py-2 text-sm tracking-[0.35em] text-purple-200">
              WE ARE STILL HERE
            </p>

            <h1 className="text-glow bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-6xl font-black leading-tight tracking-tight text-transparent md:text-8xl">
              深夜不關燈
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300 md:text-xl">
              不是每個夜晚都需要很熱鬧，
              <br />
              但至少可以有人在。
            </p>

            <p className="mt-5 max-w-2xl leading-relaxed text-zinc-400">
              聊天陪伴、遊戲陪玩、打賞禮物、VIP 尊享與開幕活動，
              為每一個不想獨自度過的深夜，留一盞微光。
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <a
                href={discordLink}
                target="_blank"
                className="glow-button rounded-full bg-gradient-to-r from-purple-200 to-pink-200 px-8 py-3 font-black text-black"
              >
                立即加入 Discord
              </a>

              <a
                href="#price"
                className="rounded-full border border-white/20 bg-white/5 px-8 py-3 font-bold backdrop-blur transition hover:scale-105 hover:bg-white/10"
              >
                查看服務價目
              </a>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 text-sm md:hidden">
              {[
                ["服務項目", "#services"],
                ["人氣陪陪", "#companions"],
                ["價目表", "#price"],
                ["VIP 福利", "#vip"],
              ].map(([name, link]) => (
                <a key={name} href={link} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-center text-zinc-300">
                  {name}
                </a>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 rounded-[48px] bg-gradient-to-br from-purple-500/30 to-pink-500/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[42px] border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
              <div className="rounded-[32px] border border-white/10 bg-black/30 p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm tracking-[0.3em] text-purple-300">TONIGHT</p>
                    <h3 className="mt-2 text-2xl font-black">深夜營業中</h3>
                  </div>

                  <div className="rounded-full border border-green-300/20 bg-green-300/10 px-4 py-2 text-sm text-green-200">
                    ONLINE
                  </div>
                </div>

                <div className="space-y-4">
                  {[
                    ["聊天陪伴", "有人聽你說話", "bg-purple-300", "#price-chat"],
                    ["遊戲陪玩", "今晚一起開局", "bg-blue-300", "#price-game"],
                    ["VIP 尊享", "解鎖限定福利", "bg-pink-300", "#vip"],
                  ].map(([title, text, dot, href]) => (
                    <a key={title} href={href} className="glass-card block rounded-3xl border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center gap-4">
                        <span className={`h-3 w-3 rounded-full ${dot} shadow-[0_0_20px_rgba(216,180,254,0.8)]`} />
                        <div>
                          <h4 className="font-bold">{title}</h4>
                          <p className="text-sm text-zinc-400">{text}</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>

                <div className="mt-6 rounded-3xl border border-purple-300/20 bg-purple-300/10 p-5">
                  <p className="text-sm text-zinc-400">今晚推薦</p>
                  <p className="mt-2 text-xl font-black">找一盞燈，陪你把夜晚過完。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["多元服務", "聊天、陪玩、打賞、VIP"],
            ["深夜陪伴", "讓夜晚不只剩安靜"],
            ["活動福利", "抽獎券與會員獎勵"],
            ["客服協助", "訂單問題即時處理"],
          ].map(([title, text]) => (
            <div
              key={title}
              className="glass-card rounded-3xl border border-white/10 bg-white/5 p-6"
            >
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <SectionTitle
          tag="SERVICES"
          title="今晚，你想點亮哪一盞燈？"
          text="從陪伴聊天到遊戲同樂，從打賞心意到高階會員尊享，讓每一種需求都有適合的選擇。"
        />

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {serviceCards.map((card) => (
            <a
              key={card.title}
              href={card.href}
              className="glass-card relative block overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-7"
            >
              <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-br ${card.accent} blur-2xl`} />

              <div className="relative">
                <p className="mb-5 text-sm tracking-[0.3em] text-purple-300">
                  {card.tag}
                </p>

                <h3 className="mb-4 text-2xl font-black">
                  {card.title}
                </h3>

                <p className="leading-relaxed text-zinc-400">
                  {card.text}
                </p>

                <p className="mt-6 text-sm font-bold text-purple-200">
                  查看對應價目 →
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section id="companions" className="relative z-10 bg-white/[0.03] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            tag="COMPANIONS"
            title="深夜陪伴名片牆"
            text="先放官方推薦服務卡，之後可以替換成真實陪陪名片、照片、上線時間與擅長遊戲。"
          />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {companions.map((person) => (
              <a
                key={person.name}
                href={person.href}
                className="glass-card group block overflow-hidden rounded-[32px] border border-white/10 bg-black/40"
              >
                <div className={`relative h-48 bg-gradient-to-br ${person.gradient}`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.22),transparent_35%)]" />

                  <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/30 shadow-[0_0_45px_rgba(216,180,254,0.35)] backdrop-blur-xl">
                    <span className="text-4xl">✦</span>
                  </div>

                  <div className="absolute right-4 top-4 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-xs text-white backdrop-blur">
                    {person.status}
                  </div>
                </div>

                <div className="p-6">
                  <p className="mb-2 text-sm tracking-[0.25em] text-purple-300">
                    {person.role}
                  </p>

                  <h3 className="text-2xl font-black">
                    {person.name}
                  </h3>

                  <p className="mt-2 text-sm text-zinc-500">
                    {person.time}
                  </p>

                  <p className="mt-5 min-h-[72px] leading-relaxed text-zinc-400">
                    {person.desc}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {person.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1 text-xs text-purple-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-bold text-zinc-200">
                    查看對應價目
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-8 rounded-[32px] border border-purple-300/20 bg-purple-300/10 p-8 text-center">
            <h3 className="text-2xl font-black">
              想成為深夜不關燈的陪陪嗎？
            </h3>

            <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-zinc-300">
              我們歡迎聊天陪伴、遊戲陪玩、技術陪陪與活動協助人員加入。
              詳細招募條件、抽成與排班方式，請加入 Discord 洽詢。
            </p>

            <a
              href={discordLink}
              target="_blank"
              className="glow-button mt-6 inline-block rounded-full bg-gradient-to-r from-purple-200 to-pink-200 px-8 py-3 font-black text-black"
            >
              申請加入團隊
            </a>
          </div>
        </div>
      </section>

      <section id="price" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <SectionTitle
          tag="PRICE LIST"
          title="服務價目表"
          text="點擊上方推薦服務後，會自動跳到對應價目。實際價格、服務時間與陪陪狀態，請以 Discord 客服公告為準。"
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {priceSections.map((section, index) => (
            <PriceCard
              key={`${section.title}-${index}`}
              {...section}
            />
          ))}
        </div>

        <div className="mt-8 rounded-3xl border border-yellow-400/20 bg-yellow-500/10 p-6 text-zinc-300">
          如需 3x3 方案，請洽談客服。保底單以第一把開局時間做計算，若是時間到但對局未結束，當局仍計算保底內。
        </div>
      </section>

      <section id="vip" className="relative z-10 bg-white/[0.03] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            tag="VIP & VVIP"
            title="會員等級與尊享福利"
            text="前五段為 VIP 1 至 VIP 5，後五段為 VVIP 1 至 VVIP 5。"
          />

          <div className="grid gap-6 lg:grid-cols-5">
            {vipTiers.map((tier) => (
              <TierCard key={tier.level} {...tier} />
            ))}
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-5">
            {vvipTiers.map((tier) => (
              <TierCard key={tier.level} {...tier} vvip />
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-zinc-500">
            會員福利、折價券使用規則與實際發放內容，請以 Discord 官方公告與客服說明為準。
          </p>
        </div>
      </section>

      <section id="event" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <SectionTitle
          tag="OPENING EVENT"
          title="開幕大活動"
          text="活動期間消費滿額即可獲得抽獎券，每消費 1000 元獲得 1 張，抽獎券可以累加。"
        />

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          {[
            ["EVENT TIME", "6/01 - 8/31", "活動期間"],
            ["DRAW DATE", "9/10", "統一開獎"],
            ["TICKET", "1000 元 = 1 張", "可累加抽獎券"],
          ].map(([label, title, text]) => (
            <div
              key={label}
              className="glass-card rounded-3xl border border-white/10 bg-white/5 p-8 text-center"
            >
              <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
                {label}
              </p>

              <h3 className="mb-2 text-2xl font-black">
                {title}
              </h3>

              <p className="text-zinc-400">
                {text}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-6 rounded-3xl border border-pink-300/30 bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-8">
          <h3 className="mb-3 text-center text-2xl font-black md:text-3xl">
            總抽獎券數達標，即解鎖對應獎項
          </h3>

          <p className="text-center text-zinc-400">
            全服總抽獎券累積達指定數量後，將開放抽出對應獎品。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {prizes.map(([tickets, item, value], index) => (
            <div
              key={tickets}
              className={`glass-card rounded-3xl border p-7 ${
                index === 0
                  ? "border-yellow-300/30 bg-yellow-500/10"
                  : "border-white/10 bg-black/40"
              }`}
            >
              <p className={`mb-4 text-sm tracking-[0.3em] ${
                index === 0 ? "text-yellow-300" : "text-purple-300"
              }`}>
                PRIZE {String(index + 1).padStart(2, "0")}
              </p>

              <h3 className="mb-4 text-2xl font-black">
                總數滿 {tickets}
              </h3>

              <p className="text-lg font-bold text-white">
                {item}
              </p>

              <p className="mt-2 text-sm text-zinc-400">
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="relative z-10 bg-white/[0.03] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <SectionTitle tag="FAQ" title="常見問題" />

          <div className="space-y-5">
            {faqs.map(([question, answer]) => (
              <div
                key={question}
                className="glass-card rounded-3xl border border-white/10 bg-black/40 p-8"
              >
                <h3 className="mb-3 text-xl font-bold">
                  {question}
                </h3>

                <p className="leading-relaxed text-zinc-400">
                  {answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="relative z-10 px-6 py-28 text-center">
        <div className="mx-auto max-w-4xl rounded-[40px] border border-white/10 bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-10 md:p-16">
          <p className="mb-4 text-sm tracking-[0.35em] text-purple-200">
            JOIN US
          </p>

          <h2 className="text-4xl font-black md:text-6xl">
            今晚，讓燈為你亮著。
          </h2>

          <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-zinc-300">
            想點單、儲值、詢問服務，請透過 Discord 聯絡客服。
            我們會在深夜裡，替你留一盞燈。
          </p>

          <a
            href={discordLink}
            target="_blank"
            className="glow-button mt-10 inline-block rounded-full bg-gradient-to-r from-purple-200 to-pink-200 px-10 py-4 font-black text-black"
          >
            進入 Discord
          </a>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/10 px-6 py-8 text-center text-sm text-zinc-500">
        © 2026 深夜不關燈 We Are Still Here
      </footer>
    </main>
  );
}