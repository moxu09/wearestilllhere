"use client";

import { useEffect, useMemo, useState } from "react";
const discordLink = "https://discord.gg/tXNnXWMHbJ";
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
        intro:
          "男生陪伴偏向穩定、放鬆、陪你聊天或聽你說話。適合想要有人回應、陪你度過一段時間，但不想太有壓力的客人。",
        suitable: ["想找人聊天", "想有人陪著", "想放鬆心情", "想要比較穩定的陪伴感"],
        rules: [
          "服務內容以聊天陪伴為主。",
          "實際接單時間依陪陪當日狀態為準。",
          "若有特殊需求，請先告知客服確認。",
        ],
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
        intro:
          "女生陪伴適合想要輕鬆聊天、撒嬌互動、分享日常或單純有人陪著的客人。可以依照陪陪風格選擇比較活潑或比較溫柔的類型。",
        suitable: ["想聊天放鬆", "想聽溫柔聲音", "想分享日常", "想要輕鬆陪伴"],
        rules: [
          "服務以陪伴聊天為主，不包含不合理或違規要求。",
          "可指定陪陪，但需依陪陪時間與接單狀態安排。",
          "若中途有問題，請直接聯絡客服協助。",
        ],
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
        intro:
          "出氣陪伴適合情緒比較滿、想抱怨、想哭、想吐苦水，或只是需要一個人先聽你說完的時候。我們會盡量提供情緒承接與陪伴。",
        suitable: ["心情不好", "想抱怨事情", "想找人聽你說", "需要短時間情緒出口"],
        rules: [
          "出氣陪伴不是心理治療或醫療諮詢。",
          "請避免人身攻擊、威脅、騷擾或違法內容。",
          "若涉及危急狀況，建議立即尋求身邊可信任的人或專業協助。",
        ],
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
        intro:
          "PUBG 娛樂陪玩主打輕鬆開局、有人互動、一起跑圖與聊天。適合想找人一起玩，不想單排太無聊的玩家。",
        suitable: ["想找人一起玩 PUBG", "不想單排", "想輕鬆聊天開局", "想要單陪或雙陪"],
        rules: [
          "娛樂陪玩不保證勝率、吃雞、KD 或排名。",
          "遊戲開始即算一場，落地成盒也算完成。",
          "深夜加成依訂單金額與開始時間計算。",
        ],
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
        intro:
          "特戰英豪陪玩分為一般陪玩與技術陪陪。一般陪玩適合想輕鬆打、有人配合；技術陪陪則適合想要更穩定的遊戲體驗。",
        suitable: ["想雙排或多人排", "想找人配合溝通", "想要比較穩的隊友", "想依段位安排陪玩"],
        rules: [
          "一般陪玩不保證勝率與升段。",
          "技術陪陪依段位與局數計價。",
          "超凡以上或特殊需求請洽客服確認。",
          "本團不提供代打服務。",
        ],
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
        intro:
          "Steam 遊戲陪玩適合多人派對、恐怖遊戲、生存遊戲、合作闖關。可以依照想玩的氣氛選擇遊戲類型。",
        suitable: ["想玩恐怖遊戲", "想找人合作破關", "想多人派對同樂", "想開新遊戲但不想一個人"],
        rules: [
          "實際支援遊戲請以 Discord 公告為準。",
          "部分遊戲需客人自備遊戲本體。",
          "若遊戲需要多人數，請先洽客服安排。",
        ],
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
        intro:
          "三角洲行動提供一般陪玩、機密雙護與猛攻護航。適合想穩定跑圖、提高帶出效率、或想找人一起配合的玩家。",
        suitable: ["想找人一起跑圖", "想穩定護航", "想做保底服務", "想要三角洲陪玩"],
        rules: [
          "保底單以第一把開局時間做計算。",
          "若時間到但對局未結束，當局仍計算保底內。",
          "如需 3x3 方案，請洽談客服。",
          "護航服務不包含任何違規外掛或破壞遊戲公平性的行為。",
        ],
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
        intro:
          "打賞禮物適合想表達心意、支持陪陪、製造驚喜或留下專屬紀念。特殊品項可依官方公告或客服說明安排。",
        suitable: ["想支持陪陪", "想送特殊禮物", "想製造驚喜", "想要專屬紀念感"],
        rules: [
          "特殊打賞與客製禮物請先洽客服確認。",
          "部分禮物可能需要製圖或排程時間。",
          "實際品項與發放方式以 Discord 官方公告為準。",
        ],
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
        intro:
          "VIP 適合常態消費、想要折價券、ASD 回饋、尊享頻道與個人化福利的客人。等級越高，可解鎖越多專屬內容。",
        suitable: ["常態點單", "想要折價券", "想累積福利", "想解鎖專屬身分"],
        rules: [
          "VIP 可透過累積消費或單次儲值達成。",
          "福利發放與使用期限以 Discord 官方公告為準。",
          "部分自定義內容需符合伺服器規範。",
        ],
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
        intro:
          "VVIP 是高階尊享會員，適合想要專屬客服、冠名福利、禮品卡、限定禮包、節日好禮與更多客製化服務的客人。",
        suitable: ["高頻消費", "想要專屬客服", "想要冠名福利", "想解鎖高階尊寵禮"],
        rules: [
          "VVIP 福利內容較多，實際使用方式以客服說明為準。",
          "冠名、前綴、專屬服務等可能需經陪陪本人同意。",
          "禮包、周邊、現實好禮發放方式以官方公告為準。",
        ],
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
  useEffect(() => {
    function syncFromHash() {
      const hash = window.location.hash.replace("#", "");

      const hashMap: Record<string, string> = {
        "price-chat": "chat",
        "price-game": "game",
        "price-gift": "gift",
        "price-vip": "vip",
      };

      const nextCategoryId = hashMap[hash];

      if (!nextCategoryId) return;

      const nextCategory = priceData.find(
        (category) => category.id === nextCategoryId
      );

      if (!nextCategory) return;

      setCategoryId(nextCategory.id);
      setGroupId(nextCategory.groups[0].id);
    }

    syncFromHash();

    window.addEventListener("hashchange", syncFromHash);

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
    };
  }, []);
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
            id={`price-${category.id}`}
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
              <div
                key={group.id}
                className={`rounded-2xl border p-5 transition ${
                  activeGroup.id === group.id
                    ? "border-purple-300/40 bg-purple-300/10"
                    : "border-white/10 bg-white/[0.04] hover:bg-white/[0.07]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setGroupId(group.id)}
                  className="block w-full text-left"
                >
                  <h4 className="font-black text-white">
                    {group.title}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-500">
                    {group.desc}
                  </p>
                </button>
                <a
                  href={discordLink}
                  target="_blank"
                  className="mt-5 block rounded-full bg-gradient-to-r from-purple-200 to-pink-200 px-5 py-3 text-center text-sm font-black text-black transition hover:opacity-90"
                >
                  立即預約
                </a>
              </div>
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
              {activeGroup.intro}
            </p>
          </div>

          <div className="grid gap-6 p-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h4 className="mb-4 text-xl font-black">
                  適合誰？
                </h4>

                <div className="flex flex-wrap gap-2">
                  {activeGroup.suitable.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1 text-sm text-purple-100"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
                <h4 className="mb-4 text-xl font-black">
                  服務規則
                </h4>

                <ul className="space-y-3 text-sm leading-relaxed text-zinc-400">
                  {activeGroup.rules.map((rule) => (
                    <li key={rule} className="flex gap-3">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-300" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h4 className="mb-4 text-xl font-black">
                價目細項
              </h4>

              <div className="grid gap-4">
                {activeGroup.items.map(([name, price]) => (
                  <div
                    key={`${activeGroup.id}-${name}`}
                    className="rounded-2xl border border-white/10 bg-black/25 p-4"
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

          <div className="border-t border-white/10 p-6 text-sm leading-relaxed text-zinc-500">
            ※ 官網為分類參考，完整價目、陪陪狀態、活動規則與最新公告，請以 Discord 官方公告與客服說明為準。
          </div>
        </div>
      </div>
    </div>
  );
}