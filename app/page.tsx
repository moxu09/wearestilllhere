import PriceExplorer from "./components/PriceExplorer";
const discordLink = "https://discord.gg/tXNnXWMHbJ";

const services = [
  {
    title: "陪伴聊天",
    label: "CHAT",
    text: "不想一個人待著的時候，有人聽你說話，也有人陪你安靜。",
    href: "#price-chat",
  },
  {
    title: "遊戲陪玩",
    label: "GAME",
    text: "PUBG、Steam、特戰英豪、三角洲行動，今晚一起開局。",
    href: "#price-game",
  },
  {
    title: "VIP 尊享",
    label: "VIP",
    text: "累積消費與單次儲值皆可升級，解鎖專屬福利與高階尊享。",
    href: "#price-vip",
  },
];

const priceCards = [
  {
    id: "chat",
    label: "CHAT",
    title: "陪伴聊天",
    desc: "適合想找人聊天、陪伴、出氣、放鬆情緒的夜晚。",
    items: [
      ["男生陪伴", "160 元起"],
      ["女生陪伴", "210 元起"],
      ["出氣陪伴", "100 元起"],
      ["臨時頭像更換", "20 元"],
    ],
  },
  {
    id: "game",
    label: "GAME",
    title: "遊戲陪玩",
    desc: "提供 PUBG、Steam、特戰英豪、三角洲行動等陪玩服務。",
    items: [
      ["PUBG 娛樂單陪", "99 元起"],
      ["PUBG 娛樂雙陪", "180 元起"],
      ["Steam 遊戲陪玩", "230 元/hr 起"],
      ["三角洲行動", "280 元/hr 起"],
    ],
  },
  {
    id: "gift",
    label: "GIFT",
    title: "打賞禮物",
    desc: "用一份心意，點亮對方的夜晚。",
    items: [
      ["明燈千里", "1999 元"],
      ["專寵獨賞", "16888 元"],
      ["明燈三千", "請洽客服"],
      ["其他客製禮物", "請洽客服"],
    ],
  },
];

const vipCards = [
  {
    title: "VIP",
    desc: "VIP 1 至 VIP 5，依累積消費或單次儲值升級。",
    points: ["ASD 回饋", "折價券", "尊享頻道", "自定義 TAG"],
  },
  {
    title: "VVIP",
    desc: "VVIP 1 至 VVIP 5，解鎖更高階專屬福利。",
    points: ["專屬客服", "冠名福利", "限定禮包", "尊寵好禮"],
  },
];

const faqs = [
  ["如何下單？", "加入 Discord 後，依照點單系統選擇服務、時間與付款方式，客服會協助確認。"],
  ["可以指定陪陪嗎？", "可以，實際安排會依陪陪當下接單狀態與時間為主。"],
  ["遊戲陪玩保證勝率嗎？", "一般娛樂陪玩不保證勝率、KD、段位或掉落物。"],
  ["詳細價目在哪裡看？", "官網提供分類參考，完整價目與最新公告請以 Discord 為準。"],
];

function SectionTitle({
  label,
  title,
  text,
  center = false,
}: {
  label: string;
  title: string;
  text?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mb-14 text-center" : "mb-14"}>
      <p className="mb-4 text-sm tracking-[0.35em] text-purple-300">
        {label}
      </p>

      <h2 className="text-4xl font-black tracking-tight md:text-6xl">
        {title}
      </h2>

      {text && (
        <p
          className={`mt-5 max-w-2xl leading-relaxed text-zinc-400 ${
            center ? "mx-auto" : ""
          }`}
        >
          {text}
        </p>
      )}
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

      <section
        id="home"
        className="relative z-10 mx-auto flex min-h-screen max-w-7xl items-center px-6 pt-28"
      >
        <div className="w-full text-center">
          <p className="soft-glow mb-8 inline-flex rounded-full border border-purple-300/20 bg-purple-300/10 px-5 py-2 text-sm tracking-[0.35em] text-purple-200">
            WE ARE STILL HERE
          </p>

          <h1 className="text-glow mx-auto max-w-5xl bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-6xl font-black leading-tight tracking-tight text-transparent md:text-8xl">
            深夜不關燈
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-xl leading-relaxed text-zinc-300 md:text-2xl">
            不是每個夜晚都需要很熱鬧，
            <br />
            但至少可以有人在。
          </p>

          <p className="mx-auto mt-6 max-w-2xl leading-relaxed text-zinc-400">
            聊天陪伴、遊戲陪玩、打賞禮物與 VIP 尊享，
            為每一個不想獨自度過的深夜，留一盞微光。
          </p>

          <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href={discordLink}
              target="_blank"
              className="glow-button rounded-full bg-gradient-to-r from-purple-200 to-pink-200 px-9 py-4 font-black text-black"
            >
              立即加入 Discord
            </a>

            <a
              href="#services"
              className="rounded-full border border-white/20 bg-white/5 px-9 py-4 font-bold backdrop-blur transition hover:bg-white/10"
            >
              查看服務
            </a>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            ["聊天陪伴", "有人聽你說話"],
            ["遊戲陪玩", "今晚一起開局"],
            ["打賞禮物", "讓心意被看見"],
            ["VIP 尊享", "解鎖限定福利"],
          ].map(([title, text]) => (
            <div
              key={title}
              className="glass-card rounded-[30px] border border-white/10 bg-white/5 p-6 text-center"
            >
              <h3 className="text-xl font-black">{title}</h3>
              <p className="mt-2 text-sm text-zinc-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="services" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <SectionTitle
          label="SERVICES"
          title="今晚，你想點亮哪一盞燈？"
          text="我們把服務分成三個主要入口，讓你更快找到需要的陪伴。"
          center
        />

        <div className="grid gap-6 lg:grid-cols-3">
          {services.map((service) => (
            <a
              key={service.title}
              href={service.href}
              className="glass-card group relative min-h-[320px] overflow-hidden rounded-[40px] border border-white/10 bg-black/40 p-8"
            >
              <div className="absolute right-[-90px] top-[-90px] h-64 w-64 rounded-full bg-purple-400/15 blur-3xl transition group-hover:scale-125" />

              <div className="relative flex h-full flex-col justify-between">
                <div>
                  <p className="mb-5 text-sm tracking-[0.35em] text-purple-300">
                    {service.label}
                  </p>

                  <h3 className="text-3xl font-black">
                    {service.title}
                  </h3>

                  <p className="mt-5 leading-relaxed text-zinc-400">
                    {service.text}
                  </p>
                </div>

                <p className="mt-8 font-bold text-purple-200">
                  查看對應內容 →
                </p>
              </div>
            </a>
          ))}
        </div>
      </section>
      <section id="price" className="relative z-10 bg-white/[0.03] px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <SectionTitle
            label="PRICE"
            title="價目參考"
            text="點選分類後，可以繼續查看細項。完整價目與最新公告請以 Discord 為準。"
          />

          <PriceExplorer />
        </div>
      </section>
      <section id="vip" className="relative z-10 mx-auto max-w-7xl px-6 py-24">
        <SectionTitle
          label="VIP"
          title="會員尊享"
          text="不需要一口氣看完所有等級，先理解：消費越高，燈越亮，福利越專屬。"
          center
        />

        <div className="grid gap-6 lg:grid-cols-2">
          {vipCards.map((card) => (
            <div
              key={card.title}
              className="vip-card rounded-[40px] border border-white/10 bg-white/5 p-9"
            >
              <p className="mb-5 text-sm tracking-[0.35em] text-purple-300">
                {card.title}
              </p>

              <h3 className="text-4xl font-black">
                {card.title === "VIP" ? "基礎會員福利" : "高階尊享福利"}
              </h3>

              <p className="mt-5 leading-relaxed text-zinc-400">
                {card.desc}
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {card.points.map((point) => (
                  <div
                    key={point}
                    className="rounded-2xl border border-white/10 bg-black/25 p-4 text-sm font-bold text-zinc-200"
                  >
                    {point}
                  </div>
                ))}
              </div>

              <a
                href={discordLink}
                target="_blank"
                className="mt-8 inline-block rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-zinc-200 transition hover:bg-white/10"
              >
                查看完整會員制度
              </a>
            </div>
          ))}
        </div>
      </section>

      <section id="event" className="relative z-10 bg-white/[0.03] px-6 py-24">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="mb-5 text-sm tracking-[0.35em] text-purple-300">
              OPENING EVENT
            </p>

            <h2 className="text-4xl font-black md:text-6xl">
              開幕大活動
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-300">
              活動期間每消費 1000 元獲得 1 張抽獎券，抽獎券可累加。
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["活動期間", "6/01 - 8/31"],
                ["開獎日期", "9/10"],
                ["抽獎券", "1000 元 = 1 張"],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-3xl border border-white/10 bg-white/5 p-5"
                >
                  <p className="text-sm text-zinc-400">{label}</p>
                  <p className="mt-2 font-black">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-[44px] border border-yellow-300/30 bg-gradient-to-br from-yellow-500/15 to-purple-500/10 p-10">
            <p className="mb-4 text-sm tracking-[0.35em] text-yellow-300">
              GRAND PRIZE
            </p>

            <h3 className="text-4xl font-black">
              總數滿 3000 張
            </h3>

            <p className="mt-6 text-2xl font-black">
              iPhone 17 Pro Max 512G
            </p>

            <p className="mt-2 text-zinc-400">
              價值約 52,900 元
            </p>

            <p className="mt-8 text-sm leading-relaxed text-zinc-500">
              其他獎項包含 MacBook Air、iPad Air、AirPods Max、AirPods Pro、Nitro 等，詳細依 Discord 官方公告為準。
            </p>
          </div>
        </div>
      </section>

      <section id="faq" className="relative z-10 mx-auto max-w-5xl px-6 py-24">
        <SectionTitle label="FAQ" title="常見問題" center />

        <div className="space-y-5">
          {faqs.map(([question, answer]) => (
            <div
              key={question}
              className="glass-card rounded-[30px] border border-white/10 bg-black/40 p-8"
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
      </section>

      <section id="contact" className="relative z-10 px-6 py-28 text-center">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[44px] border border-white/10 bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-10 md:p-16">
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