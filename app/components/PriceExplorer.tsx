"use client";

import { useMemo, useState } from "react";

const priceData = [
  {
    id: "chat",
    title: "陪伴聊天",
    label: "CHAT",
    desc: "聊天、陪伴、出氣與情緒放鬆服務。",
    groups: [
      {
        id: "male-chat",
        title: "男生陪伴",
        desc: "適合想找男生聊天、陪伴、聽你說話的夜晚。",
        items: [
          ["半小時", "160 元"],
          ["一小時", "300 元"],
          ["90 分鐘", "450 元"],
          ["兩小時", "550 元"],
        ],
      },
      {
        id: "female-chat",
        title: "女生陪伴",
        desc: "適合想找女生聊天、陪伴、放鬆心情的夜晚。",
        items: [
          ["半小時", "210 元"],
          ["一小時", "350 元"],
          ["90 分鐘", "500 元"],
          ["兩小時", "650 元"],
        ],
      },
      {
        id: "vent",
        title: "出氣陪伴",
        desc: "情緒出口，盡情傾訴，我們會好好接住你。",
        items: [
          ["10 分鐘", "100 元"],
          ["30 分鐘", "250 元"],
          ["一小時", "450 元"],
          ["臨時頭像更換", "20 元"],
        ],
      },
    ],
  },
  {
    id: "game",
    title: "遊戲陪玩",
    label: "GAME",
    desc: "PUBG、特戰英豪、Steam、三角洲行動等遊戲服務。",
    groups: [
      {
        id: "pubg",
        title: "PUBG",
        desc: "娛樂性質，不保證勝率與 KD。遊戲開始即算一場。",
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
        id: "valorant",
        title: "特戰英豪",
        desc: "一般陪玩與技術陪陪，依段位與服務類型計價。",
        items: [
          ["一般場", "250 / hr"],
          ["黃金含以下", "250 / hr"],
          ["白金", "260 / hr"],
          ["鑽石", "270 / hr"],
          ["超凡", "310 / hr"],
          ["超凡以上", "請洽客服"],
          ["技術陪 黃金含以下及匹配", "260 / hr"],
          ["技術陪 白金", "180 / 局"],
          ["技術陪 鑽石", "210 / 局"],
          ["技術陪 超凡", "240 / 局"],
          ["技術陪 神話", "300 / 局"],
          ["技術陪 輻能", "洽詢客服"],
        ],
      },
      {
        id: "steam",
        title: "Steam 遊戲",
        desc: "依遊戲類型計價，詳細支援遊戲請以 Discord 公告為準。",
        items: [
          ["恐怖遊戲", "250 / hr"],
          ["肉鴿遊戲", "240 / hr"],
          ["派對遊戲", "230 / hr"],
          ["生存遊戲", "260 / hr"],
        ],
      },
      {
        id: "delta",
        title: "三角洲行動",
        desc: "護航、保底與一般陪玩服務，詳細規則請洽客服。",
        items: [
          ["機密雙護 基本無保", "600 元 / 小時"],
          ["機密雙護 有保底", "800 元 / 小時"],
          ["機密雙護 保底金額", "1000 萬"],
          ["猛攻護航 基本無保", "700 元 / 小時"],
          ["猛攻護航 有保底", "1100 元 / 小時"],
          ["猛攻護航 保底金額", "1800 萬"],
          ["一般陪玩", "280 元 / 小時"],
          ["3x3 方案", "請洽客服"],
        ],
      },
    ],
  },
  {
    id: "gift",
    title: "打賞禮物",
    label: "GIFT",
    desc: "特殊打賞、專屬禮物與客製服務。",
    groups: [
      {
        id: "special-gift",
        title: "特殊打賞",
        desc: "用一份心意，點亮對方的夜晚。",
        items: [
          ["明燈千里", "1999 元"],
          ["專寵獨賞", "16888 元"],
          ["明燈三千", "請洽客服"],
          ["其他客製禮物", "請洽客服"],
        ],
      },
    ],
  },
  {
    id: "vip",
    title: "VIP 會員",
    label: "VIP",
    desc: "VIP / VVIP 會員福利與升級條件。",
    groups: [
      {
        id: "vip-normal",
        title: "VIP",
        desc: "VIP 1 至 VIP 5，依累積消費或單次儲值升級。",
        items: [
          ["VIP 1", "累積 5,000 或單儲 3,000 ASD"],
          ["VIP 2", "累積 8,000 或單儲 7,000 ASD"],
          ["VIP 3", "累積 15,000 或單儲 13,500 ASD"],
          ["VIP 4", "累積 30,000 或單儲 27,500 ASD"],
          ["VIP 5", "累積 50,000 或單儲 45,000 ASD"],
        ],
      },
      {
        id: "vip-vvip",
        title: "VVIP",
        desc: "VVIP 1 至 VVIP 5，解鎖更高階尊享福利。",
        items: [
          ["VVIP 1", "累積 66,666 或單儲 60,000 ASD"],
          ["VVIP 2", "累積 88,888 或單儲 80,000 ASD"],
          ["VVIP 3", "累積 99,999 或單儲 90,000 ASD"],
          ["VVIP 4", "累積 131,420 或單儲 120,000 ASD"],
          ["VVIP 5", "累積 521,314 或單儲 450,000 ASD"],
        ],
      },
    ],
  },
];

export default function PriceExplorer() {
  const [categoryId, setCategoryId] = useState("chat");
  const [groupId, setGroupId] = useState("male-chat");

  const activeCategory = useMemo(() => {
    return priceData.find((category) => category.id === categoryId) ?? priceData[0];
  }, [categoryId]);

  const activeGroup = useMemo(() => {
    return (
      activeCategory.groups.find((group) => group.id === groupId) ??
      activeCategory.groups[0]
    );
  }, [activeCategory, groupId]);

  function selectCategory(id: string) {
    const nextCategory = priceData.find((category) => category.id === id);

    if (!nextCategory) return;

    setCategoryId(id);
    setGroupId(nextCategory.groups[0].id);
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        {priceData.map((category) => (
          <button
            key={category.id}
            type="button"
            onClick={() => selectCategory(category.id)}
            className={`glass-card rounded-[28px] border p-6 text-left transition ${
              categoryId === category.id
                ? "border-purple-300/40 bg-purple-300/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <p className="mb-3 text-sm tracking-[0.3em] text-purple-300">
              {category.label}
            </p>

            <h3 className="text-2xl font-black">
              {category.title}
            </h3>

            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              {category.desc}
            </p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.35fr_0.65fr]">
        <div className="rounded-[36px] border border-white/10 bg-black/40 p-5">
          <p className="mb-4 px-3 text-sm tracking-[0.3em] text-purple-300">
            DETAIL
          </p>

          <div className="space-y-3">
            {activeCategory.groups.map((group) => (
              <button
                key={group.id}
                type="button"
                onClick={() => setGroupId(group.id)}
                className={`w-full rounded-2xl border p-5 text-left transition ${
                  activeGroup.id === group.id
                    ? "border-purple-300/40 bg-purple-300/10"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                }`}
              >
                <h4 className="font-black text-white">
                  {group.title}
                </h4>

                <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                  {group.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card overflow-hidden rounded-[36px] border border-white/10 bg-black/40">
          <div className="border-b border-white/10 bg-gradient-to-br from-purple-500/20 to-pink-500/10 p-8">
            <p className="mb-4 text-sm tracking-[0.35em] text-purple-200">
              {activeCategory.label}
            </p>

            <h3 className="text-4xl font-black">
              {activeGroup.title}
            </h3>

            <p className="mt-4 leading-relaxed text-zinc-300">
              {activeGroup.desc}
            </p>
          </div>

          <div className="grid gap-4 p-8 md:grid-cols-2">
            {activeGroup.items.map(([name, price]) => (
              <div
                key={`${activeGroup.id}-${name}`}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex justify-between gap-4">
                  <span className="text-sm text-zinc-300">
                    {name}
                  </span>

                  <span className="shrink-0 text-sm font-bold text-white">
                    {price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-zinc-500">
        ※ 官網為分類參考，完整價目、陪陪狀態、活動規則與最新公告，請以 Discord 官方公告與客服說明為準。
      </p>
    </div>
  );
}