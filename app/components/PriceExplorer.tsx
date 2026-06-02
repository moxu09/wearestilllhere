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
    prices: [
      { name: "10 分鐘", price: "80 元" },
      { name: "30 分鐘", price: "150 元" },
      { name: "1 小時", price: "280 元" },
    ],
  },
  {
    id: "game",
    emoji: "🎮",
    title: "遊戲陪玩",
    subtitle: "娛樂陪玩、一起上線",
    description:
      "適合想找人一起玩遊戲、雙排、組隊、破冰，或是單純想讓遊戲過程更熱鬧的闆闆。",
    suitable: ["想找人一起玩", "想雙排或組隊", "不想一個人打遊戲", "想要歡樂氣氛"],
    prices: [
      { name: "單陪", price: "99 / 289 / 459 元" },
      { name: "雙陪", price: "180 / 499 元" },
      { name: "特殊方案", price: "888 元" },
    ],
  },
  {
    id: "delta",
    emoji: "🛡️",
    title: "三角洲行動",
    subtitle: "機密雙護、猛攻護航",
    description:
      "適合需要護航、陪打、保底規劃，或想要更穩定遊戲體驗的闆闆。",
    suitable: ["想要護航", "想打保底", "想穩定遊戲體驗", "想找熟悉玩法的人陪"],
    prices: [
      { name: "機密雙護｜無保", price: "600 元 / 小時" },
      { name: "機密雙護｜保底 1000 萬", price: "800 元 / 小時" },
      { name: "猛攻護航｜無保", price: "700 元 / 小時" },
      { name: "猛攻護航｜保底 1800 萬", price: "1100 元 / 小時" },
      {
        name: "保底補充",
        price: "時間內未達到保底，重新計算",
        note: "以第一把開局時間做計算；若時間到但對局未結束，當局仍計算保底內。",
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
    prices: [
      { name: "小夜燈", price: "149 元 / 月" },
      { name: "星光燈", price: "399 元 / 月" },
      { name: "永夜燈", price: "999 元 / 月" },
      { name: "終身 VIP", price: "單筆儲值 18000 元" },
      { name: "VIP+", price: "單筆儲值 50000 元" },
    ],
  },
  {
    id: "topup",
    emoji: "🪙",
    title: "ASD 儲值",
    subtitle: "一元台幣 = 一枚 ASD",
    description:
      "適合想先儲值、之後慢慢使用，或想拿儲值贈送回饋的闆闆。",
    suitable: ["想先儲值", "想拿贈送回饋", "常常消費", "想方便扣款"],
    prices: [
      { name: "儲值比例", price: "1 元台幣 = 1 枚 ASD" },
      { name: "滿 5000", price: "贈送 300 ASD" },
      { name: "滿 8000", price: "贈送 700 ASD" },
      { name: "滿 18000", price: "贈送 1800 ASD" },
      { name: "滿 30000", price: "贈送 3000 ASD" },
      { name: "滿 50000", price: "贈送 5000 ASD" },
      { name: "滿 75000", price: "贈送 8000 ASD" },
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
      {/* 第一層：分類卡片 */}
      {step === "category" && (
        <div>
          <div className="mb-8 text-center">
            <p className="text-sm font-bold tracking-[0.3em] text-yellow-300">
              STEP 01
            </p>
            <h3 className="mt-2 text-3xl font-black text-white">
              先選擇你想看的服務
            </h3>
            <p className="mt-3 text-sm text-zinc-400">
              點擊卡片後，會先看到服務說明，再進入價目表。
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {categories.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openInfo(item.id)}
                className="group relative min-h-[190px] overflow-hidden rounded-3xl border border-white/10 bg-zinc-950 p-6 text-left shadow-xl transition hover:-translate-y-2 hover:border-yellow-300/70 hover:bg-zinc-900"
              >
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-yellow-300/10 blur-2xl transition group-hover:bg-yellow-300/20" />

                <div className="relative">
                  <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-yellow-300/40 bg-yellow-300/10 text-3xl">
                    {item.emoji}
                  </div>

                  <h4 className="text-xl font-black text-white">
                    {item.title}
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    {item.subtitle}
                  </p>

                  <p className="mt-5 text-sm font-bold text-yellow-300">
                    點我查看 →
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 第二層：服務資訊 */}
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

          <div className="relative overflow-hidden rounded-[2rem] border border-yellow-300/40 bg-zinc-950 p-8 shadow-2xl shadow-yellow-300/10">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-yellow-300/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-yellow-300/50 bg-yellow-300/10 text-5xl">
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

              <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="mb-4 text-sm font-black text-yellow-300">
                  適合這樣的你
                </p>

                <div className="grid gap-3 sm:grid-cols-2">
                  {selected.suitable.map((text) => (
                    <div
                      key={text}
                      className="rounded-2xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-zinc-300"
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

      {/* 第三層：價目表 */}
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

          <div className="overflow-hidden rounded-[2rem] border border-yellow-300/40 bg-zinc-950 shadow-2xl shadow-yellow-300/10">
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
                  className="rounded-3xl border border-white/10 bg-zinc-900 p-5"
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

            <div className="border-t border-white/10 bg-zinc-900/70 p-6 text-center text-sm leading-6 text-zinc-400">
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