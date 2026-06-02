const services = [
  {
    title: "男生陪伴",
    desc: "適合想找男生聊天、陪伴、聽你說話的夜晚。",
    detailTitle: "男生陪伴",
    detailDesc:
      "男生陪伴偏向穩定、放鬆、陪你聊天或聽你說話。適合想要有人回應、陪你度過一段時間，但不想太有壓力的客人。",
    tags: ["想找人聊天", "想有人陪著", "想放鬆心情", "想要比較穩定的陪伴感"],
    rules: [
      "服務內容以聊天陪伴為主。",
      "實際接單時間依陪陪當日狀態為準。",
      "若有特殊需求，請先告知客服確認。"
    ],
    prices: [
      ["半小時", "160 元"],
      ["一小時", "300 元"],
      ["90 分鐘", "450 元"],
      ["兩小時", "550 元"]
    ]
  },
  {
    title: "女生陪伴",
    desc: "適合想找女生聊天、陪伴、放鬆心情的夜晚。",
    detailTitle: "女生陪伴",
    detailDesc:
      "女生陪伴適合想找人聊天、撒嬌、放鬆、分享生活的人。用輕鬆自然的方式，陪你度過不想一個人的時間。",
    tags: ["想被溫柔陪伴", "想聊天", "想放鬆", "想找人分享心情"],
    rules: [
      "服務內容以聊天陪伴為主。",
      "可依需求選擇陪伴風格。",
      "若需指定陪陪，請先確認陪陪是否有空。"
    ],
    prices: [
      ["半小時", "210 元"],
      ["一小時", "350 元"],
      ["90 分鐘", "500 元"],
      ["兩小時", "650 元"]
    ]
  },
  {
    title: "出氣陪伴",
    desc: "情緒出口，盡情傾訴，我們會好好接住你。",
    detailTitle: "出氣陪伴",
    detailDesc:
      "出氣陪伴適合心情不好、壓力大、想要有人聽你說的人。你可以放心傾訴，我們會用合適的方式陪你消化情緒。",
    tags: ["想抒發情緒", "想有人聽", "壓力很大", "想被接住"],
    rules: [
      "服務以情緒陪伴與傾聽為主。",
      "請保持基本尊重與安全界線。",
      "若內容涉及嚴重危機，建議尋求專業協助。"
    ],
    prices: [
      ["10 分鐘", "100 元"],
      ["30 分鐘", "250 元"],
      ["一小時", "450 元"]
    ]
  }
];

export default function ServicePage() {
  const active = services[0];

  return (
    <main className="min-h-screen bg-[#FFF7FF] px-6 py-10 text-[#111827]">
      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[360px_1fr]">
        {/* 左側服務列表 */}
        <div className="space-y-5">
          {services.map((service, index) => (
            <div
              key={service.title}
              className={[
                "rounded-[28px] border-2 bg-white p-7 shadow-[0_10px_30px_rgba(109,40,217,0.12)]",
                index === 0
                  ? "border-[#A855F7]"
                  : "border-[#E9D5FF]"
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-3xl font-black text-[#111827]">
                    {service.title}
                  </h3>
                  <p className="mt-5 text-xl font-bold leading-relaxed text-[#374151]">
                    {service.desc}
                  </p>
                </div>

                <span className="text-3xl font-black text-[#6D28D9]">
                  →
                </span>
              </div>

              <button
                className={[
                  "mt-8 rounded-full px-8 py-4 text-lg font-black transition",
                  index === 0
                    ? "bg-[#EC4899] text-white shadow-[0_8px_20px_rgba(236,72,153,0.35)]"
                    : "border-2 border-[#A855F7] bg-white text-[#7C3AED]"
                ].join(" ")}
              >
                立即預約
              </button>
            </div>
          ))}
        </div>

        {/* 右側詳細內容 */}
        <div className="overflow-hidden rounded-[36px] border-2 border-[#C084FC] bg-white shadow-[0_20px_60px_rgba(109,40,217,0.16)]">
          {/* 頂部介紹區 */}
          <div className="bg-[#E9D5FF] px-12 py-12">
            <h1 className="text-5xl font-black tracking-tight text-[#111827]">
              {active.detailTitle}
            </h1>
            <p className="mt-6 max-w-5xl text-2xl font-extrabold leading-relaxed text-[#1F2937]">
              {active.detailDesc}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 bg-[#FDF4FF] p-12 lg:grid-cols-2">
            {/* 適合誰 */}
            <section className="rounded-[28px] border-2 border-[#C084FC] bg-white p-8">
              <h2 className="text-3xl font-black text-[#111827]">
                適合誰？
              </h2>

              <div className="mt-8 flex flex-wrap gap-4">
                {active.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-[#6D28D9] px-6 py-3 text-lg font-black text-white shadow-[0_6px_16px_rgba(109,40,217,0.3)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>

            {/* 價目細項 */}
            <section className="rounded-[28px] border-2 border-[#C084FC] bg-white p-8">
              <h2 className="text-3xl font-black text-[#111827]">
                價目細項
              </h2>

              <div className="mt-8 space-y-5">
                {active.prices.map(([time, price]) => (
                  <div
                    key={time}
                    className="flex items-center justify-between rounded-3xl bg-[#111827] px-7 py-5 text-white shadow-[0_8px_22px_rgba(17,24,39,0.28)]"
                  >
                    <span className="text-xl font-black">
                      {time}
                    </span>
                    <span className="text-2xl font-black">
                      {price}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* 服務規則 */}
            <section className="rounded-[28px] border-2 border-[#C084FC] bg-white p-8 lg:col-span-2">
              <h2 className="text-3xl font-black text-[#111827]">
                服務規則
              </h2>

              <ul className="mt-8 space-y-5">
                {active.rules.map((rule) => (
                  <li
                    key={rule}
                    className="flex gap-4 text-xl font-extrabold leading-relaxed text-[#1F2937]"
                  >
                    <span className="mt-1 text-3xl font-black text-[#7C3AED]">
                      •
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}