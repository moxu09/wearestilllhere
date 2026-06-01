const services = [
  {
    title: "聊天陪伴",
    text: "不想一個人待著的時候，可以找人聊天、聽你說話、陪你度過深夜。",
  },
  {
    title: "遊戲陪玩",
    text: "提供娛樂陪玩、Steam 遊戲、PUBG、特戰英豪與三角洲行動服務。",
  },
  {
    title: "打賞禮物",
    text: "用一份心意點亮對方的夜晚，支援特殊打賞與專屬禮物。",
  },
];

const chatPrices = [
  {
    title: "男生價目表",
    color: "text-purple-200",
    items: [
      ["半小時", "160 元"],
      ["一小時", "300 元"],
      ["90 分鐘", "450 元"],
      ["兩小時", "550 元"],
    ],
  },
  {
    title: "女生價目表",
    color: "text-pink-200",
    items: [
      ["半小時", "210 元"],
      ["一小時", "350 元"],
      ["90 分鐘", "500 元"],
      ["兩小時", "650 元"],
    ],
  },
];

const ventPrices = [
  {
    title: "男生出氣",
    color: "text-purple-200",
    items: [
      ["10 分鐘", "100 元"],
      ["30 分鐘", "250 元"],
      ["一小時", "450 元"],
    ],
  },
  {
    title: "女生出氣",
    color: "text-pink-200",
    items: [
      ["10 分鐘", "100 元"],
      ["30 分鐘", "250 元"],
      ["一小時", "450 元"],
    ],
  },
];

const pubgPrices = [
  {
    title: "娛樂單陪",
    color: "text-blue-200",
    box: "border-blue-400/20 bg-blue-500/10",
    items: [
      ["1 場", "99 元"],
      ["3 場", "289 元"],
      ["5 場", "459 元"],
    ],
  },
  {
    title: "娛樂雙陪",
    color: "text-purple-200",
    box: "border-purple-400/20 bg-purple-500/10",
    items: [
      ["1 場", "180 元"],
      ["3 場", "499 元"],
      ["5 場", "888 元"],
    ],
  },
];

const valorantPrices = [
  {
    title: "一般陪玩",
    box: "border-white/10 bg-white/5",
    color: "text-white",
    items: [
      ["一般場", "250 / hr"],
      ["黃金含以下", "250 / hr"],
      ["白金", "260 / hr"],
      ["鑽石", "270 / hr"],
      ["超凡", "310 / hr"],
      ["超凡以上", "請洽客服"],
    ],
  },
  {
    title: "技術陪陪",
    box: "border-red-400/20 bg-red-500/10",
    color: "text-red-200",
    items: [
      ["黃金含以下及匹配", "260 / hr"],
      ["白金", "180 / 局"],
      ["鑽石", "210 / 局"],
      ["超凡", "240 / 局"],
      ["神話", "300 / 局"],
      ["輻能", "洽詢客服"],
    ],
  },
];

const steamGames = [
  {
    title: "恐怖遊戲",
    color: "text-sky-200",
    box: "border-sky-400/20 bg-sky-500/10",
    games:
      "精神病院 / Devour / DBD / Lunch Lady / Content Warning / Escape the Backrooms / Lethal Company / REPO / Emissary Zero",
    price: "250 / hr",
  },
  {
    title: "肉鴿遊戲",
    color: "text-green-200",
    box: "border-green-400/20 bg-green-500/10",
    games: "傳送地下城 / World War 2 / Dying Light / Bloons TD 6",
    price: "240 / hr",
  },
  {
    title: "派對遊戲",
    color: "text-yellow-200",
    box: "border-yellow-400/20 bg-yellow-500/10",
    games: "PICO PARK 2 / For The King / Liar's Bar / Ember Knights / Witch It",
    price: "230 / hr",
  },
  {
    title: "生存遊戲",
    color: "text-emerald-200",
    box: "border-emerald-400/20 bg-emerald-500/10",
    games: "Grounded / Palia / Craftopia / Once Human / Core Keeper",
    price: "260 / hr",
  },
];

const vipTiers = [
  {
    label: "VIP 01",
    title: "VIP 1",
    requirement: "累積消費 5,000 或單次儲值 3,000 ASD",
    rewards: ["獲得 150 ASD"],
    special: false,
  },
  {
    label: "VIP 02",
    title: "VIP 2",
    requirement: "累積消費 8,000 或單次儲值 7,000 ASD",
    rewards: ["獲得 300 ASD", "解鎖尊享頻道"],
    special: false,
  },
  {
    label: "VIP 03",
    title: "VIP 3",
    requirement: "累積消費 15,000 或單次儲值 13,500 ASD",
    rewards: ["獲得 1,000 ASD", "獲得 1 個月自定義 TAG + 身分組圖標", "獲得 95 折券 × 1"],
    special: false,
  },
  {
    label: "VIP 04",
    title: "VIP 4",
    requirement: "累積消費 30,000 或單次儲值 27,500 ASD",
    rewards: ["獲得 1,314 ASD", "自定義指定陪玩冠名 3 日", "獲得個人語音頻道", "獲得 9 折券 × 1"],
    special: false,
  },
  {
    label: "VIP 05",
    title: "VIP 5",
    requirement: "累積消費 50,000 或單次儲值 45,000 ASD",
    rewards: [
      "獲得 5,200 ASD",
      "獲得 8 折折價券 × 1，升級一個月內使用完畢",
      "獲得永久自定義 TAG + 身分組圖標",
      "解鎖每季定期周邊好禮 × 1",
    ],
    special: false,
  },
  {
    label: "VVIP 01",
    title: "VVIP 1",
    requirement: "累積消費 66,666 或單次儲值 60,000 ASD",
    rewards: [
      "獲得 6,666 ASD",
      "獲得闆闆個人聊天區",
      "個人頻道分組置產至尊享專區",
      "獲得 8 折折價券 × 1",
      "任選面額 500 元禮品卡",
      "解鎖每月定期周邊好禮 × 1",
      "自定義指定陪玩冠名",
    ],
    special: true,
  },
  {
    label: "VVIP 02",
    title: "VVIP 2",
    requirement: "累積消費 88,888 或單次儲值 80,000 ASD",
    rewards: [
      "獲得 8,888 ASD",
      "獲得 7 折折價券 × 1",
      "獲得闆闆專屬禮物區",
      "訂製專屬冠名圖",
      "個人頻道分組置產至至尊專區",
      "專屬客服冠名 1 個月",
      "解鎖專屬客服一位",
      "解鎖每月限定大禮包 × 1",
    ],
    special: true,
  },
  {
    label: "VVIP 03",
    title: "VVIP 3",
    requirement: "累積消費 99,999 或單次儲值 90,000 ASD",
    rewards: [
      "獲得 9,999 ASD",
      "獲得 7 折折價券 × 1",
      "獲得闆闆專屬派單房",
      "自定義陪玩冠名 3 日券 × 2，需經過陪陪本人同意",
      "解鎖每月限定大禮包 × 1",
      "獲得自定義 TAG + 身分組圖標半年",
      "解鎖限定節假日好禮 × 1",
    ],
    special: true,
  },
  {
    label: "VVIP 04",
    title: "VVIP 4",
    requirement: "累積消費 131,420 或單次儲值 120,000 ASD",
    rewards: [
      "獲得 11,111 ASD",
      "自定義陪玩前綴一週券 × 2",
      "獲得 7 折折價券 × 2",
      "獲得陪玩冠名 7 日券 × 2",
      "一年雙人獨顯 TAG + 身分組圖標",
      "解鎖國定假日好禮 × 1",
      "專屬客服自訂冠名一年",
    ],
    special: true,
  },
];

const prizes = [
  ["GRAND PRIZE", "總數滿 3000 張", "iPhone 17 Pro Max 512G", "價值約 52,900 元", "border-yellow-300/20 bg-yellow-500/10 text-yellow-300"],
  ["PRIZE 02", "總數滿 2000 張", "MacBook Air 512G", "價值約 35,900 元", "border-white/10 bg-white/5 text-purple-300"],
  ["PRIZE 03", "總數滿 1000 張", "iPad Air 11 吋 512G", "價值約 30,400 元", "border-white/10 bg-white/5 text-purple-300"],
  ["PRIZE 04", "總數滿 700 張", "AirPods Max 1 副", "價值約 17,990 元", "border-white/10 bg-white/5 text-purple-300"],
  ["PRIZE 05", "總數滿 500 張", "AirPods Pro 1 副", "價值約 7,490 元", "border-white/10 bg-white/5 text-purple-300"],
  ["PRIZE 06", "總數滿 200 張", "AirPods 1 副", "價值約 4,990 元", "border-white/10 bg-white/5 text-purple-300"],
  ["PRIZE 07", "總數滿 100 張", "Discord Nitro 一年", "價值約 3,200 元", "border-white/10 bg-white/5 text-purple-300"],
  ["PRIZE 08", "總數滿 50 張", "Discord Nitro 一個月", "開幕限定小確幸", "border-white/10 bg-white/5 text-purple-300"],
];

const faqs = [
  ["如何下單？", "請加入 Discord 伺服器，依照點單系統選擇服務項目、陪陪、時段與付款方式，客服會協助確認訂單。"],
  ["可以指定陪陪嗎？", "可以，指定陪陪需依照陪陪當下接單狀態與時間安排為主。若指定人員無法接單，客服會協助媒合其他合適人選。"],
  ["付款方式有哪些？", "目前付款方式請以 Discord 內公告為準。若已儲值 ASD，也可以使用儲值卡餘額付款。"],
  ["遊戲陪玩會保證勝率嗎？", "一般娛樂陪玩不保證勝率、KD、段位、掉落物或任務結果。若為保底或特殊服務，請依照該服務規則與客服說明為準。"],
  ["如果訂單中途有問題怎麼辦？", "若遇到陪陪離線、時間爭議、付款問題或其他異常，請立即聯絡客服，不要私下爭執，客服會協助處理。"],
  ["深夜不關燈有合法嗎？", "有。所有活動、價目、福利、抽獎與服務規則，皆依中華民國民法設立登記。"],
];

function PriceList({ items }: { items: string[][] }) {
  return (
    <ul className="space-y-4 text-zinc-300">
      {items.map(([name, price]) => (
        <li key={name} className="flex justify-between gap-4">
          <span>{name}</span>
          <span className="font-semibold text-white">{price}</span>
        </li>
      ))}
    </ul>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#08080c] text-white">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="float-light absolute left-[-120px] top-20 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="float-light absolute right-[-100px] top-80 h-80 w-80 rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <header className="fixed left-0 right-0 top-0 z-50 border-b border-white/10 bg-black/35 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#home" className="flex items-center gap-2 text-lg font-bold">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-300 shadow-[0_0_18px_rgba(216,180,254,0.9)]" />
            深夜不關燈
          </a>

          <nav className="hidden gap-6 text-sm text-zinc-300 md:flex">
            <a href="#services" className="hover:text-white">服務</a>
            <a href="#price" className="hover:text-white">價目表</a>
            <a href="#vip" className="hover:text-white">VIP</a>
            <a href="#event" className="hover:text-white">活動</a>
            <a href="#faq" className="hover:text-white">FAQ</a>
            <a href="#contact" className="hover:text-white">聯絡</a>
          </nav>

          <a
            href="https://discord.gg/tXNnXWMHbJ"
            target="_blank"
            className="glow-button rounded-full bg-gradient-to-r from-purple-300 to-pink-300 px-5 py-2 text-sm font-bold text-black"
          >
            加入 Discord
          </a>
        </div>
      </header>

      <section id="home" className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center">
        <p className="soft-glow mb-5 rounded-full border border-purple-300/20 bg-purple-300/10 px-5 py-2 text-sm tracking-[0.3em] text-purple-200">
          WE ARE STILL HERE
        </p>

        <h1 className="text-glow mb-6 bg-gradient-to-r from-white via-purple-100 to-pink-200 bg-clip-text text-6xl font-black tracking-tight text-transparent md:text-8xl">
          深夜不關燈
        </h1>

        <p className="max-w-2xl text-lg leading-relaxed text-zinc-300 md:text-xl">
          一個在深夜也有人陪你的地方。
          <br />
          陪玩、聊天、打賞、儲值、VIP 服務，讓每一段夜晚都不孤單。
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a href="#price" className="glow-button rounded-full bg-gradient-to-r from-purple-200 to-pink-200 px-8 py-3 font-bold text-black">
            查看價目表
          </a>

          <a href="#contact" className="rounded-full border border-white/20 bg-white/5 px-8 py-3 font-semibold backdrop-blur transition hover:scale-105 hover:bg-white/10">
            聯絡客服
          </a>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 text-sm md:hidden">
          {[
            ["服務項目", "#services"],
            ["價目表", "#price"],
            ["VIP 福利", "#vip"],
            ["開幕活動", "#event"],
          ].map(([name, link]) => (
            <a key={name} href={link} className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-zinc-300">
              {name}
            </a>
          ))}
        </div>
      </section>

      <section id="services" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl">服務項目</h2>
        <p className="mb-12 text-center text-zinc-400">選一盞適合你的燈，讓今晚有人陪你。</p>

        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <div key={service.title} className="glass-card rounded-3xl border border-white/10 bg-white/5 p-8">
              <h3 className="mb-3 text-2xl font-bold">{service.title}</h3>
              <p className="leading-relaxed text-zinc-400">{service.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="price" className="relative z-10 bg-white/[0.03] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-center text-sm tracking-[0.3em] text-purple-300">PRICE LIST</p>
          <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl">服務價目表</h2>
          <p className="mb-12 text-center text-zinc-400">深夜不關燈提供聊天陪伴、遊戲陪玩、技術陪陪與護航服務。</p>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="glass-card rounded-3xl border border-white/10 bg-black/40 p-8">
              <h3 className="mb-2 text-2xl font-bold">聊天陪伴</h3>
              <p className="mb-6 text-sm text-zinc-500">你說話，我聽著；你沉默，我陪著。</p>

              <div className="grid gap-6 sm:grid-cols-2">
                {chatPrices.map((group) => (
                  <div key={group.title}>
                    <h4 className={`mb-4 text-lg font-bold ${group.color}`}>{group.title}</h4>
                    <PriceList items={group.items} />
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-3xl border border-white/10 bg-black/40 p-8">
              <h3 className="mb-2 text-2xl font-bold">出氣陪伴</h3>
              <p className="mb-6 text-sm text-zinc-500">情緒出口，盡情傾訴，我會好好接住你。</p>

              <div className="grid gap-6 sm:grid-cols-2">
                {ventPrices.map((group) => (
                  <div key={group.title}>
                    <h4 className={`mb-4 text-lg font-bold ${group.color}`}>{group.title}</h4>
                    <PriceList items={group.items} />
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-400">
                可額外加購臨時頭像更換：20 元
              </div>
            </div>
          </div>

          <div className="glass-card mt-6 rounded-3xl border border-blue-400/20 bg-black/40 p-8">
            <h3 className="mb-2 text-2xl font-bold">PUBG 娛樂陪玩</h3>
            <p className="mb-6 text-sm text-zinc-500">娛樂性質，不保證勝率與 KD。遊戲開始即算一場，落地成盒也算完成。</p>

            <div className="grid gap-6 md:grid-cols-2">
              {pubgPrices.map((group) => (
                <div key={group.title} className={`rounded-2xl border p-6 ${group.box}`}>
                  <h4 className={`mb-4 text-xl font-bold ${group.color}`}>{group.title}</h4>
                  <PriceList items={group.items} />
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h4 className="mb-3 font-bold">深夜加成</h4>
              <PriceList items={[["300 元以下訂單金額", "10%"], ["300 元以上訂單金額", "5%"]]} />
              <p className="mt-4 text-sm text-zinc-500">00:00 後開始計算。</p>
            </div>
          </div>

          <div className="glass-card mt-6 rounded-3xl border border-red-400/20 bg-black/40 p-8">
            <h3 className="mb-2 text-2xl font-bold">特戰英豪陪玩</h3>
            <p className="mb-6 text-sm text-zinc-500">依段位與服務類型計價，超凡以上可洽詢技術陪陪。</p>

            <div className="grid gap-6 md:grid-cols-2">
              {valorantPrices.map((group) => (
                <div key={group.title} className={`rounded-2xl border p-6 ${group.box}`}>
                  <h4 className={`mb-4 text-xl font-bold ${group.color}`}>{group.title}</h4>
                  <PriceList items={group.items} />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card mt-6 rounded-3xl border border-sky-400/20 bg-black/40 p-8">
            <h3 className="mb-2 text-2xl font-bold">Steam 遊戲陪玩</h3>
            <p className="mb-6 text-sm text-zinc-500">深夜不關燈擁有最終解釋權，任何問題請洽客服。</p>

            <div className="space-y-4">
              {steamGames.map((game) => (
                <div key={game.title} className={`rounded-2xl border p-5 ${game.box}`}>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h4 className={`text-xl font-bold ${game.color}`}>{game.title}</h4>
                      <p className="mt-2 text-zinc-400">{game.games}</p>
                    </div>
                    <span className="text-2xl font-bold">{game.price}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card mt-6 rounded-3xl border border-emerald-400/20 bg-black/40 p-8">
            <h3 className="mb-2 text-2xl font-bold">三角洲行動護航服務</h3>
            <p className="mb-6 text-sm text-zinc-500">專業護航、純綠安全、效率穩定、客戶至上。</p>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6">
                <h4 className="mb-2 text-xl font-bold text-emerald-200">機密雙護</h4>
                <p className="mb-5 text-sm text-zinc-500">機密行動雙人護航，穩定帶出高價值物資。</p>
                <PriceList items={[["基本無保", "600 元 / 小時"], ["有保底", "800 元 / 小時"], ["保底金額", "1000 萬"]]} />
              </div>

              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6">
                <h4 className="mb-2 text-xl font-bold text-red-200">猛攻護航</h4>
                <p className="mb-5 text-sm text-zinc-500">猛攻模式護航，穩定推進完成高強度任務。</p>
                <PriceList items={[["基本無保", "700 元 / 小時"], ["有保底", "1100 元 / 小時"], ["保底金額", "1800 萬"]]} />
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-6">
              <h4 className="mb-4 text-xl font-bold text-blue-200">一般陪玩類型</h4>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-zinc-400">輕鬆遊玩、聊天互動、放鬆減壓，適合想找人一起玩的玩家。</p>
                <span className="text-3xl font-bold">280 元 / 小時</span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-5 text-zinc-300">
              如需 3x3 方案，請洽談客服。保底單以第一把開局時間做計算，若是時間到但對局未結束，當局仍計算保底內。
            </div>
          </div>
        </div>
      </section>

      <section id="vip" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <p className="mb-4 text-center text-sm tracking-[0.3em] text-purple-300">VIP & VVIP</p>
        <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl">會員等級與尊享福利</h2>
        <p className="mb-12 text-center text-zinc-400">前五段為 VIP 1 至 VIP 5，後五段為 VVIP 1 至 VVIP 5。</p>

        <div className="grid gap-6 lg:grid-cols-2">
          {vipTiers.map((tier) => (
            <div
              key={tier.label}
              className={`vip-card rounded-3xl border p-8 ${
                tier.special
                  ? "border-purple-400/20 bg-purple-500/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <p className={`mb-3 text-sm tracking-[0.3em] ${tier.special ? "text-pink-300" : "text-purple-300"}`}>
                {tier.label}
              </p>

              <h3 className="mb-4 text-2xl font-bold">{tier.title}</h3>
              <p className="mb-5 text-zinc-300">{tier.requirement}</p>

              <ul className="space-y-3 text-zinc-400">
                {tier.rewards.map((reward) => (
                  <li key={reward}>{reward}</li>
                ))}
              </ul>
            </div>
          ))}

          <div className="vip-card rounded-3xl border border-pink-300/30 bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-8 lg:col-span-2">
            <p className="mb-3 text-sm tracking-[0.3em] text-pink-300">VVIP 05</p>
            <h3 className="mb-4 text-2xl font-bold">VVIP 5</h3>
            <p className="mb-5 text-zinc-300">累積消費 521,314 或單次儲值 450,000 ASD</p>

            <ul className="grid gap-3 text-zinc-400 md:grid-cols-2">
              {[
                "獲得 66,666 ASD",
                "闆闆全體專屬特別播報",
                "獲得 6 折折價券",
                "獲得永久自定義 TAG + 身分組圖標",
                "訂製專屬禮物圖",
                "每月修改指定三位陪陪冠名一個月，需經過陪陪本人同意",
                "單次點三個陪陪及以上可獲得該次消費 10% 返點回饋",
                "解鎖生日深夜現實好禮及小卡 × 1",
                "獲得每月現實尊寵大禮包",
              ].map((reward) => (
                <li key={reward}>{reward}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-500">
          會員福利、折價券使用規則與實際發放內容，請以 Discord 官方公告與客服說明為準。
        </p>
      </section>

      <section id="event" className="relative z-10 mx-auto max-w-6xl px-6 py-24">
        <p className="mb-4 text-center text-sm tracking-[0.3em] text-purple-300">OPENING EVENT</p>
        <h2 className="mb-4 text-center text-3xl font-bold md:text-5xl">開幕大活動</h2>
        <p className="mb-12 text-center text-zinc-400">
          活動期間消費滿額即可獲得抽獎券，每消費 1000 元獲得 1 張，抽獎券可以累加。
        </p>

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          {[
            ["EVENT TIME", "6/01 - 8/31", "活動期間"],
            ["DRAW DATE", "9/10", "統一開獎"],
            ["TICKET", "1000 元 = 1 張", "可累加抽獎券"],
          ].map(([label, title, text]) => (
            <div key={label} className="glass-card rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
              <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">{label}</p>
              <h3 className="mb-2 text-2xl font-bold">{title}</h3>
              <p className="text-zinc-400">{text}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 rounded-3xl border border-pink-300/30 bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-8">
          <h3 className="mb-3 text-center text-2xl font-bold md:text-3xl">
            總抽獎券數達標，即解鎖對應獎項
          </h3>
          <p className="text-center text-zinc-400">全服總抽獎券累積達指定數量後，將開放抽出對應獎品。</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {prizes.map(([label, title, prize, value, style]) => (
            <div key={label} className="glass-card rounded-3xl border border-white/10 bg-black/40 p-8">
              <p className={`mb-3 text-sm tracking-[0.3em] ${style.split(" ").at(-1)}`}>{label}</p>
              <h3 className="mb-4 text-2xl font-bold">{title}</h3>
              <div className={`rounded-2xl border p-5 ${style}`}>
                <p className="text-xl font-bold text-white">{prize}</p>
                <p className="mt-2 text-zinc-400">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="relative z-10 bg-white/[0.03] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-center text-sm tracking-[0.3em] text-purple-300">FAQ</p>
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">常見問題</h2>

          <div className="space-y-5">
            {faqs.map(([question, answer]) => (
              <div key={question} className="glass-card rounded-3xl border border-white/10 bg-black/40 p-8">
                <h3 className="mb-3 text-xl font-bold">{question}</h3>
                <p className="leading-relaxed text-zinc-400">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="relative z-10 bg-white/[0.03] px-6 py-24 text-center">
        <h2 className="mb-6 text-3xl font-bold md:text-4xl">加入我們的 Discord</h2>
        <p className="mb-10 text-zinc-400">想點單、儲值、詢問服務，請透過 Discord 聯絡客服。</p>

        <a
          href="https://discord.gg/tXNnXWMHbJ"
          target="_blank"
          className="glow-button inline-block rounded-full bg-gradient-to-r from-purple-300 to-pink-300 px-10 py-4 font-bold text-black transition hover:opacity-90"
        >
          進入 Discord
        </a>
      </section>

      <footer className="relative z-10 border-t border-white/10 py-8 text-center text-sm text-zinc-500">
        © 2026 深夜不關燈 We Are Still Here
      </footer>
    </main>
  );
}