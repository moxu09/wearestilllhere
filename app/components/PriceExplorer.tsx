"use client";

import { useState } from "react";

type PriceItem = {
  name: string;
  price: string;
  note?: string;
};

type PriceCategory = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  description: string;
  suitable: string[];
  prices: PriceItem[];
  tags?: string[];
};

const categories: PriceCategory[] = [
  {
    id: "chat-girl",
    emoji: "🌙",
    title: "女生聊天陪伴",
    subtitle: "溫柔陪聊、深夜陪伴",
    description:
      "適合想找人聊天、放鬆、撒嬌、分享日常，或是不想一個人待著的闆闆。",
    suitable: ["想有人陪你聊天", "想放鬆心情", "喜歡溫柔陪伴", "深夜不想一個人"],
    tags: ["深夜陪伴", "溫柔聊天"],
    prices: [
      { name: "30 分鐘", price: "210 元" },
      { name: "1 小時", price: "350 元" },
      { name: "90 分鐘", price: "500 元" },
      { name: "2 小時", price: "650 元" },
    ],
  },
  {
    id: "vent-girl",
    emoji: "🫧",
    title: "女生出氣陪伴",
    subtitle: "聽你說、陪你消化情緒",
    description:
      "適合心情不好、想抱怨、想被理解，或只是需要一個人安靜聽你說話的時候。",
    suitable: ["想抱怨一下", "需要情緒出口", "想被安慰", "想有人聽你說"],
    tags: ["情緒出口", "安靜陪伴"],
    prices: [
      { name: "10 分鐘", price: "100 元" },
      { name: "30 分鐘", price: "250 元" },
      { name: "1 小時", price: "450 元" },
    ],
  },
  {
    id: "chat-boy",
    emoji: "☕",
    title: "男生聊天陪伴",
    subtitle: "自然聊天、輕鬆陪伴",
    description:
      "適合想要輕鬆聊天、打發時間、找人陪著，或喜歡比較自然互動的闆闆。",
    suitable: ["想輕鬆聊天", "想找人陪著", "喜歡自然互動", "想聽男聲陪伴"],
    tags: ["自然互動", "輕鬆陪伴"],
    prices: [
      { name: "10 分鐘", price: "80 元" },
      { name: "30 分鐘", price: "150 元" },
      { name: "1 小時", price: "280 元" },
    ],
  },
  {
    id: "valorant-normal",
    emoji: "🔫",
    title: "特戰英豪娛樂陪玩",
    subtitle: "娛樂陪玩、一起排隊",
    description:
      "適合想找人一起打特戰英豪、輕鬆排隊、語音互動，或深夜不想一個人排的闆闆。",
    suitable: ["想找人一起打瓦", "想輕鬆雙排", "想要語音互動", "不想一個人排"],
    tags: ["熱門遊戲", "娛樂陪玩"],
    prices: [
      {
        name: "娛樂陪玩",
        price: "280 元 / 小時",
      },
      {
        name: "計時方式",
        price: "以第一把開局時間做計算",
        note: "若時間到但對局未結束，當局仍計算保底內。",
      },
      {
        name: "指定陪陪",
        price: "依人員公告或客服確認",
      },
    ],
  },
  {
    id: "pubg",
    emoji: "🏹",
    title: "PUBG",
    subtitle: "娛樂單陪、娛樂雙陪",
    description:
      "適合想找人一起吃雞、娛樂陪玩、語音互動，或深夜想找人一起組隊的闆闆。",
    suitable: ["想找人一起玩 PUBG", "想語音互動", "想單陪或雙陪", "想要深夜陪伴"],
    tags: ["組隊陪玩", "場次制"],
    prices: [
      { name: "娛樂單陪｜1 場", price: "99 元 / 場" },
      { name: "娛樂單陪｜3 場", price: "289 元 / 3 場" },
      { name: "娛樂單陪｜5 場", price: "459 元 / 5 場" },
      { name: "娛樂雙陪｜1 場", price: "180 元 / 場" },
      { name: "娛樂雙陪｜3 場", price: "499 元 / 3 場" },
      { name: "娛樂雙陪｜5 場", price: "888 元 / 5 場" },
      {
        name: "深夜加成",
        price: "00:00 後開始計算",
        note: "300 元以下訂單金額加收 10%；300 元以上訂單金額加收 5%。",
      },
    ],
  },
  {
    id: "delta",
    emoji: "🛡️",
    title: "三角洲行動",
    subtitle: "護航服務、一般陪玩",
    description:
      "適合需要護航、陪打、保底規劃，或想要穩定完成任務與高價值物資帶出的闆闆。",
    suitable: ["想要護航", "想打保底", "想完成高強度任務", "想找專業團隊陪玩"],
    tags: ["護航服務", "保底方案"],
    prices: [
      { name: "機密雙護｜基本無保", price: "600 元 / 小時" },
      { name: "機密雙護｜有保底", price: "800 元 / 小時", note: "保底金額：1000 萬。" },
      { name: "猛攻護航｜基本無保", price: "700 元 / 小時" },
      { name: "猛攻護航｜有保底", price: "1100 元 / 小時", note: "保底金額：1800 萬。" },
      { name: "一般陪玩", price: "280 元 / 小時" },
      { name: "3x3 方案", price: "請洽談客服", note: "依需求客製隊伍與戰術配置，價格另行評估。" },
      { name: "補充說明", price: "以第一把開局時間做計算", note: "若是時間到但對局未結束，當局仍計算保底內。" },
    ],
  },
  {
    id: "steam-horror",
    emoji: "👻",
    title: "Steam 恐怖遊戲",
    subtitle: "恐怖遊戲陪玩",
    description:
      "適合想找人一起玩恐怖遊戲、壯膽、語音互動，或想一起被嚇的闆闆。",
    suitable: ["想玩恐怖遊戲", "需要人陪壯膽", "想語音互動", "想一起被嚇"],
    tags: ["Steam", "壯膽陪玩"],
    prices: [
      {
        name: "恐怖遊戲",
        price: "250 元 / 小時",
        note: "精神病院 / Devour / DBD / Lunch Lady / Content Warning / Escape the Backrooms / Lethal Company / REPO / Emissary Zero。",
      },
    ],
  },
  {
    id: "steam-roguelike",
    emoji: "🕊️",
    title: "Steam 肉鴿遊戲",
    subtitle: "肉鴿類遊戲陪玩",
    description:
      "適合想找人一起刷關卡、打配合、慢慢農進度，或想要有人一起探索的闆闆。",
    suitable: ["想一起刷關卡", "想找人配合", "想慢慢農進度", "想一起探索"],
    tags: ["Steam", "合作刷關"],
    prices: [
      {
        name: "肉鴿遊戲",
        price: "240 元 / 小時",
        note: "傳送地下城 / World War 2 / Dying Light / Bloons TD 6。",
      },
    ],
  },
  {
    id: "steam-party",
    emoji: "🎲",
    title: "Steam 派對遊戲",
    subtitle: "派對類遊戲陪玩",
    description:
      "適合想找人一起玩派對遊戲、搞笑互動、多人娛樂，或想讓氣氛更熱鬧的闆闆。",
    suitable: ["想玩派對遊戲", "想多人娛樂", "想搞笑互動", "想讓氣氛更熱鬧"],
    tags: ["Steam", "派對娛樂"],
    prices: [
      {
        name: "派對遊戲",
        price: "230 元 / 小時",
        note: "PICO PARK 2 / For The King / Liar’s Bar / Ember Knights / Witch It。",
      },
    ],
  },
  {
    id: "steam-survival",
    emoji: "🌿",
    title: "Steam 生存遊戲",
    subtitle: "生存類遊戲陪玩",
    description:
      "適合想找人一起蓋家、探索、打怪、生存合作，或想慢慢養成進度的闆闆。",
    suitable: ["想一起生存合作", "想蓋家探索", "想慢慢養成", "想找人一起冒險"],
    tags: ["Steam", "生存合作"],
    prices: [
      {
        name: "生存遊戲",
        price: "260 元 / 小時",
        note: "Grounded / Palia / Craftopia / Once Human / Core Keeper。",
      },
    ],
  },
  {
    id: "gift",
    emoji: "🎁",
    title: "打賞禮物",
    subtitle: "把喜歡變成儀式感",
    description:
      "適合想支持陪陪、送出心意、製造驚喜，或想用特殊禮物留下紀念的闆闆。",
    suitable: ["想支持喜歡的陪陪", "想送禮物", "想製造驚喜", "喜歡儀式感"],
    tags: ["儀式感", "特殊打賞"],
    prices: [
      { name: "小禮物", price: "30 / 45 / 50 元" },
      { name: "一般打賞", price: "100 / 250 / 380 元" },
      { name: "浪漫打賞", price: "520 / 666 / 888 元" },
      { name: "全體廣播", price: "1688 元" },
      { name: "明燈千里", price: "1999 元" },
      { name: "專寵獨賞", price: "16888 元" },
    ],
  },
  {
    id: "vip",
    emoji: "💎",
    title: "VIP 會員",
    subtitle: "專屬權益、優先服務",
    description:
      "適合常常下單、想要優惠、想優先預約，或想要更多專屬感的闆闆。",
    suitable: ["常常下單", "想要折扣", "想優先排單", "喜歡專屬感"],
    tags: ["會員權益", "優先服務"],
    prices: [
      { name: "小夜燈", price: "149 元 / 月" },
      { name: "星光燈", price: "399 元 / 月" },
      { name: "永夜燈", price: "999 元 / 月" },
    ],
  },
];

export default function PriceExplorer() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [step, setStep] = useState<"category" | "info" | "price">("category");

  const selected = categories.find((item) => item.id === selectedId);

  function openInfo(id: string) {
    setSelectedId(id);
    setStep("info");
  }

  function goBack() {
    if (step === "price") {
      setStep("info");
      return;
    }

    setSelectedId(null);
    setStep("category");
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 -top-20 h-40 rounded-full bg-yellow-300/10 blur-3xl" />

      {step === "category" && (
        <div>
          <div className="mb-8 text-center">
            <p className="inline-flex rounded-full border border-yellow-300/30 bg-yellow-300/10 px-4 py-2 text-xs font-bold tracking-[0.35em] text-yellow-300">
              STEP 01 ✦ SERVICE
            </p>
            <h3 className="mt-4 text-3xl font-black text-white md:text-4xl">
              先選擇你想看的服務
            </h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
              點擊卡片後，會先看到服務說明，再進入價目表。每一盞燈，都對應一種陪伴方式。
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openInfo(item.id)}
                className="group relative min-h-[215px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 text-left shadow-[0_0_24px_rgba(250,204,21,0.06)] backdrop-blur-xl transition duration-300 hover:-translate-y-2 hover:border-yellow-300/70 hover:bg-yellow-300/[0.09] hover:shadow-[0_0_42px_rgba(250,204,21,0.16)]"
              >
                <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-yellow-300/10 blur-2xl transition group-hover:bg-yellow-300/25" />
                <div className="absolute -bottom-12 left-4 h-24 w-24 rounded-full bg-violet-400/0 blur-2xl transition group-hover:bg-violet-400/10" />
                <span className="absolute right-5 top-5 text-xl text-yellow-200/0 transition group-hover:text-yellow-200/70">
                  ✦
                </span>

                <div className="relative flex h-full flex-col justify-between">
                  <div>
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-300/40 bg-yellow-300/10 text-3xl shadow-[0_0_20px_rgba(250,204,21,0.08)] transition group-hover:scale-105 group-hover:shadow-[0_0_24px_rgba(250,204,21,0.22)]">
                      {item.emoji}
                    </div>

                    <h4 className="text-xl font-black text-white">
                      {item.title}
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {item.subtitle}
                    </p>

                    {item.tags?.length ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[11px] font-bold text-yellow-100/70"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <p className="mt-5 text-sm font-bold tracking-[0.2em] text-yellow-300 transition group-hover:translate-x-1">
                    點我查看 →
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "info" && selected && (
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={goBack}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-bold text-zinc-300 transition hover:border-yellow-300/50 hover:text-yellow-300"
            >
              ← 返回分類
            </button>

            <p className="text-sm font-bold tracking-[0.25em] text-yellow-300">
              STEP 02
            </p>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] border border-yellow-300/40 bg-white/[0.055] p-8 shadow-2xl shadow-yellow-300/10 backdrop-blur-xl">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-yellow-300/12 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-violet-500/12 blur-3xl" />
            <div className="absolute right-10 top-10 text-3xl text-yellow-200/30">✧</div>

            <div className="relative">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-yellow-300/50 bg-yellow-300/10 text-5xl shadow-[0_0_30px_rgba(250,204,21,0.12)]">
                {selected.emoji}
              </div>

              <p className="text-sm font-bold tracking-[0.3em] text-yellow-300">
                {selected.subtitle}
              </p>

              <h3 className="mt-3 text-4xl font-black text-white">
                {selected.title}
              </h3>

              <p className="mt-5 text-base leading-8 text-zinc-300">
                {selected.description}
              </p>

              <div className="mt-8 rounded-3xl border border-white/10 bg-black/20 p-6">
                <p className="mb-4 text-sm font-black text-yellow-300">
                  適合這樣的你
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {selected.suitable.map((text) => (
                    <div
                      key={text}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-300"
                    >
                      ✦ {text}
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep("price")}
                className="mt-8 w-full rounded-2xl bg-yellow-300 px-6 py-4 text-base font-black text-zinc-950 shadow-xl shadow-yellow-300/20 transition hover:scale-[1.02] hover:bg-yellow-200"
              >
                查看 {selected.title} 價目表
              </button>
            </div>
          </div>
        </div>
      )}

      {step === "price" && selected && (
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={goBack}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-bold text-zinc-300 transition hover:border-yellow-300/50 hover:text-yellow-300"
            >
              ← 返回介紹
            </button>

            <p className="text-sm font-bold tracking-[0.25em] text-yellow-300">
              STEP 03
            </p>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-yellow-300/40 bg-white/[0.055] shadow-2xl shadow-yellow-300/10 backdrop-blur-xl">
            <div className="border-b border-white/10 bg-yellow-300/10 p-8">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-300/50 bg-zinc-950 text-4xl">
                  {selected.emoji}
                </div>

                <div>
                  <p className="text-sm font-bold tracking-[0.25em] text-yellow-300">
                    PRICE LIST
                  </p>
                  <h3 className="mt-1 text-3xl font-black text-white">
                    {selected.title}
                  </h3>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-6">
              {selected.prices.map((item, index) => (
                <div
                  key={`${item.name}-${index}`}
                  className="group rounded-3xl border border-white/10 bg-black/20 p-5 transition hover:border-yellow-300/40 hover:bg-yellow-300/[0.06]"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-lg font-black text-white">
                      {item.name}
                    </p>

                    <p className="text-xl font-black text-yellow-300">
                      {item.price}
                    </p>
                  </div>

                  {item.note && (
                    <p className="mt-3 border-t border-white/10 pt-3 text-sm leading-6 text-zinc-400">
                      {item.note}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 bg-black/25 p-6 text-center text-sm leading-6 text-zinc-400">
              實際方案可能依活動、指定陪陪、服務內容調整，以下單時客服確認為準。
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSelectedId(null);
              setStep("category");
            }}
            className="mt-6 w-full rounded-2xl border border-yellow-300/50 bg-yellow-300/10 px-6 py-4 text-sm font-black text-yellow-300 transition hover:bg-yellow-300 hover:text-zinc-950"
          >
            重新選擇其他服務
          </button>
        </div>
      )}
    </div>
  );
}
