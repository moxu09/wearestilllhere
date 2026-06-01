export default function Home() {
  return (
    <main className="min-h-screen bg-[#08080c] text-white">
      {/* 首頁 Banner */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 text-sm tracking-[0.3em] text-purple-300">
          WE ARE STILL HERE
        </p>

        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          深夜不關燈
        </h1>

        <p className="max-w-2xl text-lg md:text-xl text-zinc-300 leading-relaxed">
          一個在深夜也有人陪你的地方。
          <br />
          陪玩、聊天、打賞、儲值、VIP 服務，讓每一段夜晚都不孤單。
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-4">
          <a
            href="#services"
            className="rounded-full bg-white px-8 py-3 text-black font-semibold hover:bg-purple-200 transition"
          >
            查看服務
          </a>

          <a
            href="#contact"
            className="rounded-full border border-white/30 px-8 py-3 font-semibold hover:bg-white/10 transition"
          >
            聯絡客服
          </a>
        </div>
      </section>

      {/* 服務項目 */}
      <section id="services" className="px-6 py-24 max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
          服務項目
        </h2>
        <p className="text-center text-zinc-400 mb-12">
          選一盞適合你的燈，讓今晚有人陪你。
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-3xl bg-white/5 border border-white/10 p-8">
            <h3 className="text-2xl font-bold mb-3">聊天陪伴</h3>
            <p className="text-zinc-400 leading-relaxed">
              不想一個人待著的時候，可以找人聊天、聽你說話、陪你度過深夜。
            </p>
          </div>

          <div className="rounded-3xl bg-white/5 border border-white/10 p-8">
            <h3 className="text-2xl font-bold mb-3">遊戲陪玩</h3>
            <p className="text-zinc-400 leading-relaxed">
              提供娛樂陪玩與遊戲陪伴服務，讓每一場遊戲都更有溫度。
            </p>
          </div>

          <div className="rounded-3xl bg-white/5 border border-white/10 p-8">
            <h3 className="text-2xl font-bold mb-3">打賞禮物</h3>
            <p className="text-zinc-400 leading-relaxed">
              用一份心意點亮對方的夜晚，支援特殊打賞與專屬禮物。
            </p>
          </div>
        </div>
      </section>

      {/* 價目表 */}
      <section className="px-6 py-24 bg-white/[0.03]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            價目參考
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-3xl bg-black/40 border border-white/10 p-8">
              <h3 className="text-2xl font-bold mb-6">聊天陪伴</h3>
              <ul className="space-y-4 text-zinc-300">
                <li className="flex justify-between">
                  <span>女生 30 分鐘</span>
                  <span>210 元</span>
                </li>
                <li className="flex justify-between">
                  <span>女生 1 小時</span>
                  <span>350 元</span>
                </li>
                <li className="flex justify-between">
                  <span>女生 90 分鐘</span>
                  <span>500 元</span>
                </li>
                <li className="flex justify-between">
                  <span>女生 2 小時</span>
                  <span>650 元</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl bg-black/40 border border-white/10 p-8">
              <h3 className="text-2xl font-bold mb-6">出氣陪伴</h3>
              <ul className="space-y-4 text-zinc-300">
                <li className="flex justify-between">
                  <span>女生 10 分鐘</span>
                  <span>100 元</span>
                </li>
                <li className="flex justify-between">
                  <span>女生 30 分鐘</span>
                  <span>250 元</span>
                </li>
                <li className="flex justify-between">
                  <span>女生 1 小時</span>
                  <span>450 元</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 開幕活動 */}
      <section className="px-6 py-24 max-w-5xl mx-auto text-center">
        <p className="mb-4 text-sm tracking-[0.3em] text-purple-300">
          OPENING EVENT
        </p>

        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          開幕大活動
        </h2>

        <p className="text-zinc-300 text-lg leading-relaxed">
          活動期間消費滿額即可獲得抽獎券。
          <br />
          每消費 1000 元獲得 1 張，抽獎券可以累加。
        </p>

        <div className="mt-10 rounded-3xl bg-white/5 border border-white/10 p-8">
          <p className="text-2xl font-bold mb-2">6/18 - 8/31</p>
          <p className="text-zinc-400">開獎日期：9/10</p>
        </div>
      </section>

      {/* 聯絡 */}
      <section id="contact" className="px-6 py-24 bg-white/[0.03] text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          加入我們的 Discord
        </h2>

        <p className="text-zinc-400 mb-10">
          想點單、儲值、詢問服務，請透過 Discord 聯絡客服。
        </p>

        <a
          href="https://discord.gg/tXNnXWMHbJ
"
          target="_blank"
          className="inline-block rounded-full bg-purple-400 px-10 py-4 text-black font-bold hover:bg-purple-300 transition"
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