export default function Home() {
  return (
    <main className="min-h-screen bg-[#08080c] text-white">
      {/* 導覽列 */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <a href="#home" className="text-lg font-bold">
            深夜不關燈
          </a>

          <nav className="hidden gap-6 text-sm text-zinc-300 md:flex">
            <a href="#services" className="hover:text-white">
              服務
            </a>

            <a href="#price" className="hover:text-white">
              價目表
            </a>

            <a href="#vip" className="hover:text-white">
              VIP
            </a>

            <a href="#event" className="hover:text-white">
              活動
            </a>

            <a href="#faq" className="hover:text-white">
              FAQ
            </a>

            <a href="#contact" className="hover:text-white">
              聯絡
            </a>
          </nav>

          <a
            href="https://discord.gg/tXNnXWMHbJ"
            target="_blank"
            className="rounded-full bg-purple-400 px-5 py-2 text-sm font-bold text-black transition hover:bg-purple-300"
          >
            加入 Discord
          </a>
        </div>
      </header>

      {/* 首頁 Banner */}
      <section
        id="home"
        className="flex min-h-screen flex-col items-center justify-center px-6 pt-24 text-center"
      >
        <p className="mb-4 text-sm tracking-[0.3em] text-purple-300">
          WE ARE STILL HERE
        </p>

        <h1 className="mb-6 text-5xl font-bold md:text-7xl">
          深夜不關燈
        </h1>

        <p className="max-w-2xl text-lg leading-relaxed text-zinc-300 md:text-xl">
          一個在深夜也有人陪你的地方。
          <br />
          陪玩、聊天、打賞、儲值、VIP 服務，讓每一段夜晚都不孤單。
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <a
            href="#price"
            className="rounded-full bg-white px-8 py-3 font-semibold text-black transition hover:bg-purple-200"
          >
            查看價目表
          </a>

          <a
            href="#contact"
            className="rounded-full border border-white/30 px-8 py-3 font-semibold transition hover:bg-white/10"
          >
            聯絡客服
          </a>
        </div>
      </section>
        <div className="mt-8 grid grid-cols-2 gap-3 text-sm md:hidden">
          <a
            href="#services"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-zinc-300"
          >
            服務項目
          </a>

          <a
            href="#price"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-zinc-300"
          >
            價目表
          </a>

          <a
            href="#vip"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-zinc-300"
          >
            VIP 福利
          </a>

          <a
            href="#event"
            className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-zinc-300"
          >
            開幕活動
          </a>
        </div>
      {/* 服務項目 */}
      <section id="services" className="mx-auto max-w-6xl px-6 py-24">
        <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl">
          服務項目
        </h2>

        <p className="mb-12 text-center text-zinc-400">
          選一盞適合你的燈，讓今晚有人陪你。
        </p>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h3 className="mb-3 text-2xl font-bold">
              聊天陪伴
            </h3>

            <p className="leading-relaxed text-zinc-400">
              不想一個人待著的時候，可以找人聊天、聽你說話、陪你度過深夜。
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h3 className="mb-3 text-2xl font-bold">
              遊戲陪玩
            </h3>

            <p className="leading-relaxed text-zinc-400">
              提供娛樂陪玩、Steam 遊戲、PUBG、特戰英豪與三角洲行動服務。
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <h3 className="mb-3 text-2xl font-bold">
              打賞禮物
            </h3>

            <p className="leading-relaxed text-zinc-400">
              用一份心意點亮對方的夜晚，支援特殊打賞與專屬禮物。
            </p>
          </div>
        </div>
      </section>

      {/* 價目表 */}
      <section id="price" className="bg-white/[0.03] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-center text-sm tracking-[0.3em] text-purple-300">
            PRICE LIST
          </p>

          <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl">
            服務價目表
          </h2>

          <p className="mb-12 text-center text-zinc-400">
            深夜不關燈提供聊天陪伴、遊戲陪玩、技術陪陪與護航服務。
          </p>

          <div className="grid gap-6 md:grid-cols-2">
            {/* 聊天陪伴 */}
            <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
              <h3 className="mb-2 text-2xl font-bold">
                聊天陪伴
              </h3>

              <p className="mb-6 text-sm text-zinc-500">
                你說話，我聽著；你沉默，我陪著。
              </p>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="mb-4 text-lg font-bold text-purple-200">
                    男生價目表
                  </h4>

                  <ul className="space-y-4 text-zinc-300">
                    <li className="flex justify-between">
                      <span>半小時</span>
                      <span>160 元</span>
                    </li>

                    <li className="flex justify-between">
                      <span>一小時</span>
                      <span>300 元</span>
                    </li>

                    <li className="flex justify-between">
                      <span>90 分鐘</span>
                      <span>450 元</span>
                    </li>

                    <li className="flex justify-between">
                      <span>兩小時</span>
                      <span>550 元</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="mb-4 text-lg font-bold text-pink-200">
                    女生價目表
                  </h4>

                  <ul className="space-y-4 text-zinc-300">
                    <li className="flex justify-between">
                      <span>半小時</span>
                      <span>210 元</span>
                    </li>

                    <li className="flex justify-between">
                      <span>一小時</span>
                      <span>350 元</span>
                    </li>

                    <li className="flex justify-between">
                      <span>90 分鐘</span>
                      <span>500 元</span>
                    </li>

                    <li className="flex justify-between">
                      <span>兩小時</span>
                      <span>650 元</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 出氣陪伴 */}
            <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
              <h3 className="mb-2 text-2xl font-bold">
                出氣陪伴
              </h3>

              <p className="mb-6 text-sm text-zinc-500">
                情緒出口，盡情傾訴，我會好好接住你。
              </p>

              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h4 className="mb-4 text-lg font-bold text-purple-200">
                    男生出氣
                  </h4>

                  <ul className="space-y-4 text-zinc-300">
                    <li className="flex justify-between">
                      <span>10 分鐘</span>
                      <span>100 元</span>
                    </li>

                    <li className="flex justify-between">
                      <span>30 分鐘</span>
                      <span>250 元</span>
                    </li>

                    <li className="flex justify-between">
                      <span>一小時</span>
                      <span>450 元</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="mb-4 text-lg font-bold text-pink-200">
                    女生出氣
                  </h4>

                  <ul className="space-y-4 text-zinc-300">
                    <li className="flex justify-between">
                      <span>10 分鐘</span>
                      <span>100 元</span>
                    </li>

                    <li className="flex justify-between">
                      <span>30 分鐘</span>
                      <span>250 元</span>
                    </li>

                    <li className="flex justify-between">
                      <span>一小時</span>
                      <span>450 元</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-zinc-400">
                可額外加購臨時頭像更換：20 元
              </div>
            </div>
          </div>

          {/* PUBG */}
          <div className="mt-6 rounded-3xl border border-blue-400/20 bg-black/40 p-8">
            <h3 className="mb-2 text-2xl font-bold">
              PUBG 娛樂陪玩
            </h3>

            <p className="mb-6 text-sm text-zinc-500">
              娛樂性質，不保證勝率與 KD。遊戲開始即算一場，落地成盒也算完成。
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-blue-400/20 bg-blue-500/10 p-6">
                <h4 className="mb-4 text-xl font-bold text-blue-200">
                  娛樂單陪
                </h4>

                <ul className="space-y-4 text-zinc-300">
                  <li className="flex justify-between">
                    <span>1 場</span>
                    <span>99 元</span>
                  </li>

                  <li className="flex justify-between">
                    <span>3 場</span>
                    <span>289 元</span>
                  </li>

                  <li className="flex justify-between">
                    <span>5 場</span>
                    <span>459 元</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-purple-400/20 bg-purple-500/10 p-6">
                <h4 className="mb-4 text-xl font-bold text-purple-200">
                  娛樂雙陪
                </h4>

                <ul className="space-y-4 text-zinc-300">
                  <li className="flex justify-between">
                    <span>1 場</span>
                    <span>180 元</span>
                  </li>

                  <li className="flex justify-between">
                    <span>3 場</span>
                    <span>499 元</span>
                  </li>

                  <li className="flex justify-between">
                    <span>5 場</span>
                    <span>888 元</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
              <h4 className="mb-3 font-bold">
                深夜加成
              </h4>

              <ul className="space-y-3 text-zinc-300">
                <li className="flex justify-between">
                  <span>300 元以下訂單金額</span>
                  <span>10%</span>
                </li>

                <li className="flex justify-between">
                  <span>300 元以上訂單金額</span>
                  <span>5%</span>
                </li>
              </ul>

              <p className="mt-4 text-sm text-zinc-500">
                00:00 後開始計算。
              </p>
            </div>
          </div>

          {/* 特戰英豪 */}
          <div className="mt-6 rounded-3xl border border-red-400/20 bg-black/40 p-8">
            <h3 className="mb-2 text-2xl font-bold">
              特戰英豪陪玩
            </h3>

            <p className="mb-6 text-sm text-zinc-500">
              依段位與服務類型計價，超凡以上可洽詢技術陪陪。
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h4 className="mb-4 text-xl font-bold">
                  一般陪玩
                </h4>

                <ul className="space-y-4 text-zinc-300">
                  <li className="flex justify-between">
                    <span>一般場</span>
                    <span>250 / hr</span>
                  </li>

                  <li className="flex justify-between">
                    <span>黃金含以下</span>
                    <span>250 / hr</span>
                  </li>

                  <li className="flex justify-between">
                    <span>白金</span>
                    <span>260 / hr</span>
                  </li>

                  <li className="flex justify-between">
                    <span>鑽石</span>
                    <span>270 / hr</span>
                  </li>

                  <li className="flex justify-between">
                    <span>超凡</span>
                    <span>310 / hr</span>
                  </li>

                  <li className="flex justify-between">
                    <span>超凡以上</span>
                    <span>請洽客服</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6">
                <h4 className="mb-4 text-xl font-bold text-red-200">
                  技術陪陪
                </h4>

                <ul className="space-y-4 text-zinc-300">
                  <li className="flex justify-between">
                    <span>黃金含以下及匹配</span>
                    <span>260 / hr</span>
                  </li>

                  <li className="flex justify-between">
                    <span>白金</span>
                    <span>180 / 局</span>
                  </li>

                  <li className="flex justify-between">
                    <span>鑽石</span>
                    <span>210 / 局</span>
                  </li>

                  <li className="flex justify-between">
                    <span>超凡</span>
                    <span>240 / 局</span>
                  </li>

                  <li className="flex justify-between">
                    <span>神話</span>
                    <span>300 / 局</span>
                  </li>

                  <li className="flex justify-between">
                    <span>輻能</span>
                    <span>洽詢客服</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Steam 遊戲 */}
          <div className="mt-6 rounded-3xl border border-sky-400/20 bg-black/40 p-8">
            <h3 className="mb-2 text-2xl font-bold">
              Steam 遊戲陪玩
            </h3>

            <p className="mb-6 text-sm text-zinc-500">
              深夜不關燈擁有最終解釋權，任何問題請洽客服。
            </p>

            <div className="space-y-4">
              <div className="rounded-2xl border border-sky-400/20 bg-sky-500/10 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-sky-200">
                      恐怖遊戲
                    </h4>

                    <p className="mt-2 text-zinc-400">
                      精神病院 / Devour / DBD / Lunch Lady / Content Warning / Escape the Backrooms / Lethal Company / REPO / Emissary Zero
                    </p>
                  </div>

                  <span className="text-2xl font-bold">
                    250 / hr
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-green-400/20 bg-green-500/10 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-green-200">
                      肉鴿遊戲
                    </h4>

                    <p className="mt-2 text-zinc-400">
                      傳送地下城 / World War 2 / Dying Light / Bloons TD 6
                    </p>
                  </div>

                  <span className="text-2xl font-bold">
                    240 / hr
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-yellow-200">
                      派對遊戲
                    </h4>

                    <p className="mt-2 text-zinc-400">
                      PICO PARK 2 / For The King / Liar&apos;s Bar / Ember Knights / Witch It
                    </p>
                  </div>

                  <span className="text-2xl font-bold">
                    230 / hr
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="text-xl font-bold text-emerald-200">
                      生存遊戲
                    </h4>

                    <p className="mt-2 text-zinc-400">
                      Grounded / Palia / Craftopia / Once Human / Core Keeper
                    </p>
                  </div>

                  <span className="text-2xl font-bold">
                    260 / hr
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 三角洲行動 */}
          <div className="mt-6 rounded-3xl border border-emerald-400/20 bg-black/40 p-8">
            <h3 className="mb-2 text-2xl font-bold">
              三角洲行動護航服務
            </h3>

            <p className="mb-6 text-sm text-zinc-500">
              專業護航、純綠安全、效率穩定、客戶至上。
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6">
                <h4 className="mb-2 text-xl font-bold text-emerald-200">
                  機密雙護
                </h4>

                <p className="mb-5 text-sm text-zinc-500">
                  機密行動雙人護航，穩定帶出高價值物資。
                </p>

                <ul className="space-y-4 text-zinc-300">
                  <li className="flex justify-between">
                    <span>基本無保</span>
                    <span>600 元 / 小時</span>
                  </li>

                  <li className="flex justify-between">
                    <span>有保底</span>
                    <span>800 元 / 小時</span>
                  </li>

                  <li className="flex justify-between">
                    <span>保底金額</span>
                    <span>1000 萬</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 p-6">
                <h4 className="mb-2 text-xl font-bold text-red-200">
                  猛攻護航
                </h4>

                <p className="mb-5 text-sm text-zinc-500">
                  猛攻模式護航，穩定推進完成高強度任務。
                </p>

                <ul className="space-y-4 text-zinc-300">
                  <li className="flex justify-between">
                    <span>基本無保</span>
                    <span>700 元 / 小時</span>
                  </li>

                  <li className="flex justify-between">
                    <span>有保底</span>
                    <span>1100 元 / 小時</span>
                  </li>

                  <li className="flex justify-between">
                    <span>保底金額</span>
                    <span>1800 萬</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-blue-400/20 bg-blue-500/10 p-6">
              <h4 className="mb-4 text-xl font-bold text-blue-200">
                一般陪玩類型
              </h4>

              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <p className="text-zinc-400">
                  輕鬆遊玩、聊天互動、放鬆減壓，適合想找人一起玩的玩家。
                </p>

                <span className="text-3xl font-bold">
                  280 元 / 小時
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-5 text-zinc-300">
              如需 3x3 方案，請洽談客服。保底單以第一把開局時間做計算，若是時間到但對局未結束，當局仍計算保底內。
            </div>
          </div>

          {/* 注意事項 */}
          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-8">
            <h3 className="mb-6 text-2xl font-bold">
              注意事項
            </h3>

            <div className="grid gap-6 text-sm leading-relaxed text-zinc-400 md:grid-cols-3">
              <div>
                <h4 className="mb-2 font-bold text-white">
                  服務性質
                </h4>

                <p>
                  本團服務以娛樂陪伴為主，不保證勝率、KD、掉落物或任務結果。
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-bold text-white">
                  遊戲規範
                </h4>

                <p>
                  請互相尊重並維持良好遊戲氛圍，任何違規行為可能列入黑名單。
                </p>
              </div>

              <div>
                <h4 className="mb-2 font-bold text-white">
                  客服協助
                </h4>

                <p>
                  中途離隊、訂單問題、服務異常或特殊需求，請立即洽詢客服人員。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* VIP 與 VVIP */}
      <section id="vip" className="mx-auto max-w-6xl px-6 py-24">
        <p className="mb-4 text-center text-sm tracking-[0.3em] text-purple-300">
          VIP & VVIP
        </p>

        <h2 className="mb-4 text-center text-3xl font-bold md:text-4xl">
          會員等級與尊享福利
        </h2>

        <p className="mb-12 text-center text-zinc-400">
          前五段為 VIP 1 至 VIP 5，後五段為 VVIP 1 至 VVIP 5。
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
              VIP 01
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              VIP 1
            </h3>

            <p className="mb-5 text-zinc-300">
              累積消費 5,000 或單次儲值 3,000 ASD
            </p>

            <ul className="space-y-3 text-zinc-400">
              <li>獲得 150 ASD</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
              VIP 02
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              VIP 2
            </h3>

            <p className="mb-5 text-zinc-300">
              累積消費 8,000 或單次儲值 7,000 ASD
            </p>

            <ul className="space-y-3 text-zinc-400">
              <li>獲得 300 ASD</li>
              <li>解鎖尊享頻道</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
              VIP 03
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              VIP 3
            </h3>

            <p className="mb-5 text-zinc-300">
              累積消費 15,000 或單次儲值 13,500 ASD
            </p>

            <ul className="space-y-3 text-zinc-400">
              <li>獲得 1,000 ASD</li>
              <li>獲得 1 個月自定義 TAG + 身分組圖標</li>
              <li>獲得 95 折券 × 1</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
              VIP 04
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              VIP 4
            </h3>

            <p className="mb-5 text-zinc-300">
              累積消費 30,000 或單次儲值 27,500 ASD
            </p>

            <ul className="space-y-3 text-zinc-400">
              <li>獲得 1,314 ASD</li>
              <li>自定義指定陪玩冠名 3 日</li>
              <li>獲得個人語音頻道</li>
              <li>獲得 9 折券 × 1</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
              VIP 05
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              VIP 5
            </h3>

            <p className="mb-5 text-zinc-300">
              累積消費 50,000 或單次儲值 45,000 ASD
            </p>

            <ul className="space-y-3 text-zinc-400">
              <li>獲得 5,200 ASD</li>
              <li>獲得 8 折折價券 × 1，升級一個月內使用完畢</li>
              <li>獲得永久自定義 TAG + 身分組圖標</li>
              <li>解鎖每季定期周邊好禮 × 1</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-purple-400/20 bg-purple-500/10 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-pink-300">
              VVIP 01
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              VVIP 1
            </h3>

            <p className="mb-5 text-zinc-300">
              累積消費 66,666 或單次儲值 60,000 ASD
            </p>

            <ul className="space-y-3 text-zinc-400">
              <li>獲得 6,666 ASD</li>
              <li>獲得闆闆個人聊天區</li>
              <li>個人頻道分組置產至尊享專區</li>
              <li>獲得 8 折折價券 × 1</li>
              <li>任選面額 500 元禮品卡</li>
              <li>解鎖每月定期周邊好禮 × 1</li>
              <li>自定義指定陪玩冠名</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-purple-400/20 bg-purple-500/10 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-pink-300">
              VVIP 02
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              VVIP 2
            </h3>

            <p className="mb-5 text-zinc-300">
              累積消費 88,888 或單次儲值 80,000 ASD
            </p>

            <ul className="space-y-3 text-zinc-400">
              <li>獲得 8,888 ASD</li>
              <li>獲得 7 折折價券 × 1</li>
              <li>獲得闆闆專屬禮物區</li>
              <li>訂製專屬冠名圖</li>
              <li>個人頻道分組置產至至尊專區</li>
              <li>專屬客服冠名 1 個月</li>
              <li>解鎖專屬客服一位</li>
              <li>解鎖每月限定大禮包 × 1</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-purple-400/20 bg-purple-500/10 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-pink-300">
              VVIP 03
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              VVIP 3
            </h3>

            <p className="mb-5 text-zinc-300">
              累積消費 99,999 或單次儲值 90,000 ASD
            </p>

            <ul className="space-y-3 text-zinc-400">
              <li>獲得 9,999 ASD</li>
              <li>獲得 7 折折價券 × 1</li>
              <li>獲得闆闆專屬派單房</li>
              <li>自定義陪玩冠名 3 日券 × 2，需經過陪陪本人同意</li>
              <li>解鎖每月限定大禮包 × 1</li>
              <li>獲得自定義 TAG + 身分組圖標半年</li>
              <li>解鎖限定節假日好禮 × 1</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-purple-400/20 bg-purple-500/10 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-pink-300">
              VVIP 04
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              VVIP 4
            </h3>

            <p className="mb-5 text-zinc-300">
              累積消費 131,420 或單次儲值 120,000 ASD
            </p>

            <ul className="space-y-3 text-zinc-400">
              <li>獲得 11,111 ASD</li>
              <li>自定義陪玩前綴一週券 × 2</li>
              <li>獲得 7 折折價券 × 2</li>
              <li>獲得陪玩冠名 7 日券 × 2</li>
              <li>一年雙人獨顯 TAG + 身分組圖標</li>
              <li>解鎖國定假日好禮 × 1</li>
              <li>專屬客服自訂冠名一年</li>
            </ul>
          </div>

          <div className="rounded-3xl border border-pink-300/30 bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-8 lg:col-span-2">
            <p className="mb-3 text-sm tracking-[0.3em] text-pink-300">
              VVIP 05
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              VVIP 5
            </h3>

            <p className="mb-5 text-zinc-300">
              累積消費 521,314 或單次儲值 450,000 ASD
            </p>

            <ul className="grid gap-3 text-zinc-400 md:grid-cols-2">
              <li>獲得 66,666 ASD</li>
              <li>闆闆全體專屬特別播報</li>
              <li>獲得 6 折折價券</li>
              <li>獲得永久自定義 TAG + 身分組圖標</li>
              <li>訂製專屬禮物圖</li>
              <li>每月修改指定三位陪陪冠名一個月，需經過陪陪本人同意</li>
              <li>單次點三個陪陪及以上可獲得該次消費 10% 返點回饋</li>
              <li>解鎖生日深夜現實好禮及小卡 × 1</li>
              <li>獲得每月現實尊寵大禮包</li>
            </ul>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-zinc-500">
          會員福利、折價券使用規則與實際發放內容，請以 Discord 官方公告與客服說明為準。
        </p>
      </section>

      {/* 開幕活動 */}
      <section id="event" className="mx-auto max-w-6xl px-6 py-24">
        <p className="mb-4 text-center text-sm tracking-[0.3em] text-purple-300">
          OPENING EVENT
        </p>

        <h2 className="mb-4 text-center text-3xl font-bold md:text-5xl">
          開幕大活動
        </h2>

        <p className="mb-12 text-center text-zinc-400">
          活動期間消費滿額即可獲得抽獎券，每消費 1000 元獲得 1 張，抽獎券可以累加。
        </p>

        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
              EVENT TIME
            </p>

            <h3 className="mb-2 text-2xl font-bold">
              6/01 - 8/31
            </h3>

            <p className="text-zinc-400">
              活動期間
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
              DRAW DATE
            </p>

            <h3 className="mb-2 text-2xl font-bold">
              9/10
            </h3>

            <p className="text-zinc-400">
              統一開獎
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center">
            <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
              TICKET
            </p>

            <h3 className="mb-2 text-2xl font-bold">
              1000 元 = 1 張
            </h3>

            <p className="text-zinc-400">
              可累加抽獎券
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-3xl border border-pink-300/30 bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-8">
          <h3 className="mb-3 text-center text-2xl font-bold md:text-3xl">
            總抽獎券數達標，即解鎖對應獎項
          </h3>

          <p className="text-center text-zinc-400">
            全服總抽獎券累積達指定數量後，將開放抽出對應獎品。
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-yellow-300/20 bg-black/40 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-yellow-300">
              GRAND PRIZE
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              總數滿 3000 張
            </h3>

            <div className="rounded-2xl border border-yellow-300/20 bg-yellow-500/10 p-5">
              <p className="text-xl font-bold">
                iPhone 17 Pro Max 512G
              </p>

              <p className="mt-2 text-zinc-400">
                價值約 52,900 元
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
              PRIZE 02
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              總數滿 2000 張
            </h3>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xl font-bold">
                MacBook Air 512G
              </p>

              <p className="mt-2 text-zinc-400">
                價值約 35,900 元
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
              PRIZE 03
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              總數滿 1000 張
            </h3>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xl font-bold">
                iPad Air 11 吋 512G
              </p>

              <p className="mt-2 text-zinc-400">
                價值約 30,400 元
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
              PRIZE 04
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              總數滿 700 張
            </h3>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xl font-bold">
                AirPods Max 1 副
              </p>

              <p className="mt-2 text-zinc-400">
                價值約 17,990 元
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
              PRIZE 05
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              總數滿 500 張
            </h3>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xl font-bold">
                AirPods Pro 1 副
              </p>

              <p className="mt-2 text-zinc-400">
                價值約 7,490 元
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
              PRIZE 06
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              總數滿 200 張
            </h3>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xl font-bold">
                AirPods 1 副
              </p>

              <p className="mt-2 text-zinc-400">
                價值約 4,990 元
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
              PRIZE 07
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              總數滿 100 張
            </h3>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xl font-bold">
                Discord Nitro 一年
              </p>

              <p className="mt-2 text-zinc-400">
                價值約 3,200 元
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
            <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
              PRIZE 08
            </p>

            <h3 className="mb-4 text-2xl font-bold">
              總數滿 50 張
            </h3>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <p className="text-xl font-bold">
                Discord Nitro 一個月
              </p>

              <p className="mt-2 text-zinc-400">
                開幕限定小確幸
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
          <h3 className="mb-4 text-2xl font-bold">
            活動說明
          </h3>

          <div className="grid gap-6 text-sm leading-relaxed text-zinc-400 md:grid-cols-3">
            <div>
              <h4 className="mb-2 font-bold text-white">
                抽獎券取得
              </h4>

              <p>
                活動期間每消費 1000 元即可獲得 1 張抽獎券，抽獎券可累加。
              </p>
            </div>

            <div>
              <h4 className="mb-2 font-bold text-white">
                獎項解鎖
              </h4>

              <p>
                依全服總抽獎券數量解鎖對應獎項，達標後才會抽出該獎項。
              </p>
            </div>

            <div>
              <h4 className="mb-2 font-bold text-white">
                最終公告
              </h4>

              <p>
                活動規則、獎項細節與開獎結果，請以 Discord 官方公告為準。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 常見問題 */}
      <section id="faq" className="bg-white/[0.03] px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-center text-sm tracking-[0.3em] text-purple-300">
            FAQ
          </p>

          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
            常見問題
          </h2>

          <div className="space-y-5">
            <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
              <h3 className="mb-3 text-xl font-bold">
                如何下單？
              </h3>

              <p className="leading-relaxed text-zinc-400">
                請加入 Discord 伺服器，依照點單系統選擇服務項目、陪陪、時段與付款方式，客服會協助確認訂單。
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
              <h3 className="mb-3 text-xl font-bold">
                可以指定陪陪嗎？
              </h3>

              <p className="leading-relaxed text-zinc-400">
                可以，指定陪陪需依照陪陪當下接單狀態與時間安排為主。若指定人員無法接單，客服會協助媒合其他合適人選。
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
              <h3 className="mb-3 text-xl font-bold">
                付款方式有哪些？
              </h3>

              <p className="leading-relaxed text-zinc-400">
                目前付款方式請以 Discord 內公告為準。若已儲值 ASD，也可以使用儲值卡餘額付款。
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
              <h3 className="mb-3 text-xl font-bold">
                遊戲陪玩會保證勝率嗎？
              </h3>

              <p className="leading-relaxed text-zinc-400">
                一般娛樂陪玩不保證勝率、KD、段位、掉落物或任務結果。若為保底或特殊服務，請依照該服務規則與客服說明為準。
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
              <h3 className="mb-3 text-xl font-bold">
                如果訂單中途有問題怎麼辦？
              </h3>

              <p className="leading-relaxed text-zinc-400">
                若遇到陪陪離線、時間爭議、付款問題或其他異常，請立即聯絡客服，不要私下爭執，客服會協助處理。
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/40 p-8">
              <h3 className="mb-3 text-xl font-bold">
                深夜不關燈是合法的嗎？
              </h3>

              <p className="leading-relaxed text-zinc-400">
                絕對是！深夜不關燈是依據中華民國法規設立登記的工作室。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 聯絡 */}
      <section id="contact" className="bg-white/[0.03] px-6 py-24 text-center">
        <h2 className="mb-6 text-3xl font-bold md:text-4xl">
          加入我們的 Discord
        </h2>

        <p className="mb-10 text-zinc-400">
          想點單、儲值、詢問服務，請透過 Discord 聯絡客服。
        </p>

        <a
          href="https://discord.gg/tXNnXWMHbJ"
          target="_blank"
          className="inline-block rounded-full bg-purple-400 px-10 py-4 font-bold text-black transition hover:bg-purple-300"
        >
          進入 Discord
        </a>
      </section>

      <footer className="py-8 text-center text-sm text-zinc-500">
        © 2026 深夜不關燈 We Are Still Here
      </footer>
    </main>
  );
}