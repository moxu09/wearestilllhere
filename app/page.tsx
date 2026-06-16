import {
  ArrowRight,
  BadgeCheck,
  Bell,
  ChevronRight,
  Coins,
  Crown,
  Flame,
  Gamepad2,
  Headphones,
  Heart,
  Mic2,
  Moon,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wallet,
  Zap,
} from "lucide-react";

const featuredPlayers = [
  {
    name: "小夜",
    tag: "特戰英豪｜娛樂陪玩",
    price: "280 ASD / 小時",
    rating: "4.9",
    orders: "328",
    status: "在線中",
    intro: "溫柔陪玩、氣氛型、可聊天可認真打。",
  },
  {
    name: "眠眠",
    tag: "聊天陪伴｜掛睡",
    price: "300 ASD / 小時",
    rating: "5.0",
    orders: "211",
    status: "可預約",
    intro: "深夜陪聊、掛睡、安靜陪伴型。",
  },
  {
    name: "澈",
    tag: "Apex｜技術陪玩",
    price: "350 ASD / 小時",
    rating: "4.8",
    orders: "186",
    status: "接單中",
    intro: "穩定帶場、節奏清楚、適合想上分的玩家。",
  },
];

const voiceRooms = [
  {
    title: "深夜陪聊小房間",
    host: "小夜",
    online: 18,
    type: "公開語音廳",
  },
  {
    title: "一起打瓦休閒廳",
    host: "澈",
    online: 9,
    type: "遊戲語音廳",
  },
  {
    title: "睡前聊天電台",
    host: "眠眠",
    online: 24,
    type: "陪伴語音廳",
  },
];

const serviceCategories = [
  {
    title: "遊戲陪玩",
    desc: "特戰英豪、Apex、英雄聯盟、Steam 等遊戲陪玩。",
    icon: Gamepad2,
    href: "/players?category=game",
  },
  {
    title: "聊天陪伴",
    desc: "聊天、唱歌、掛睡、出氣包，深夜也有人陪你。",
    icon: Headphones,
    href: "/players?category=chat",
  },
  {
    title: "自由語音廳",
    desc: "陪玩師可自由開廳，會員可進房互動與送禮。",
    icon: Mic2,
    href: "/voice-rooms",
  },
  {
    title: "ASD 錢包",
    desc: "儲值 ASD 後可下單、送禮、進付費語音廳。",
    icon: Wallet,
    href: "/wallet/topup",
  },
];

const platformStats = [
  { label: "平台陪玩師", value: "120+", icon: Users },
  { label: "累積訂單", value: "8,600+", icon: BadgeCheck },
  { label: "平均評價", value: "4.9", icon: Star },
  { label: "即時語音廳", value: "24H", icon: Mic2 },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f3ec] text-slate-950">
      <section className="relative">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-200/70 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/3 h-96 w-96 rounded-full bg-blue-100/70 blur-3xl" />

        <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-20 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-20">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              深夜不關燈陪玩平台正式啟動
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-tight tracking-tight text-slate-950 md:text-7xl">
              找陪玩、開語音廳、
              <span className="bg-gradient-to-r from-violet-600 via-fuchsia-500 to-indigo-500 bg-clip-text text-transparent">
                深夜也有人陪你
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 md:text-lg">
              深夜不關燈是一個結合遊戲陪玩、聊天陪伴、自由語音廳與 ASD
              錢包的陪玩平台。會員可以自由下單、儲值、送禮；陪玩師可以入駐、接單、開廳與管理收入。
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="/players"
                className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-6 py-4 font-bold text-white shadow-xl shadow-violet-200 transition hover:bg-violet-500"
              >
                立即找陪玩
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </a>

              <a
                href="/voice-rooms"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-6 py-4 font-bold text-slate-800 shadow-sm transition hover:bg-white"
              >
                <Mic2 className="h-5 w-5 text-violet-600" />
                進入語音廳
              </a>

              <a
                href="/apply-player"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-fuchsia-200 bg-fuchsia-50 px-6 py-4 font-bold text-fuchsia-700 transition hover:bg-fuchsia-100"
              >
                成為陪玩師
              </a>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {platformStats.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.label}
                    className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-xl backdrop-blur-xl"
                  >
                    <Icon className="mb-3 h-5 w-5 text-violet-600" />
                    <p className="text-2xl font-black text-slate-950">
                      {item.value}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {item.label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative z-10">
            <div className="rounded-[2rem] border border-white/70 bg-white/65 p-4 shadow-2xl backdrop-blur-2xl">
              <div className="rounded-[1.5rem] border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-violet-700">
                      即時平台狀態
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">
                      深夜大廳
                    </h2>
                  </div>

                  <div className="rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                    Live
                  </div>
                </div>

                <div className="grid gap-3">
                  <StatusCard
                    icon={<Flame className="h-5 w-5" />}
                    title="熱門陪玩師接單中"
                    desc="目前 36 位陪玩師在線，可立即下單。"
                  />
                  <StatusCard
                    icon={<Mic2 className="h-5 w-5" />}
                    title="語音廳開放中"
                    desc="聊天、遊戲、掛睡房間即時開放。"
                  />
                  <StatusCard
                    icon={<Coins className="h-5 w-5" />}
                    title="ASD 錢包可用"
                    desc="儲值後可下單、送禮、付費進房。"
                  />
                </div>

                <div className="mt-5 rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-yellow-500 shadow-sm">
                      <Crown className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-violet-700">
                        會員特權
                      </p>
                      <h3 className="text-xl font-black text-slate-950">
                        儲值 ASD 開始體驗
                      </h3>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-slate-600">
                    用 ASD 支付陪玩訂單、語音廳禮物與平台服務，後續可接 VIP
                    等級、優惠券與月結制度。
                  </p>

                  <a
                    href="/wallet/topup"
                    className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
                  >
                    前往儲值
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionShell
        eyebrow="FEATURED PLAYERS"
        title="熱門陪玩師"
        desc="展示高評價、在線中、可立即預約的陪玩師，客人可以依遊戲、價格、性別與評價篩選。"
        actionText="查看全部陪玩師"
        actionHref="/players"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {featuredPlayers.map((player, index) => (
            <PlayerCard key={player.name} player={player} index={index} />
          ))}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="VOICE ROOMS"
        title="正在開放的語音廳"
        desc="陪玩師可以自由開廳，會員可以進入聊天、打遊戲、聽歌、掛睡或送禮互動。"
        actionText="進入語音廳大廳"
        actionHref="/voice-rooms"
      >
        <div className="grid gap-5 lg:grid-cols-3">
          {voiceRooms.map((room) => (
            <VoiceRoomCard key={room.title} room={room} />
          ))}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="SERVICES"
        title="平台服務分類"
        desc="不是單純表單下單，而是完整的陪玩、陪聊、語音廳、錢包與會員系統。"
      >
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {serviceCategories.map((category) => {
            const Icon = category.icon;

            return (
              <a
                key={category.title}
                href={category.href}
                className="group rounded-[1.8rem] border border-white/70 bg-white/75 p-6 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-violet-200 hover:bg-white"
              >
                <div className="mb-5 flex h-13 w-13 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <Icon className="h-6 w-6" />
                </div>

                <h3 className="text-xl font-black text-slate-950">
                  {category.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-500">
                  {category.desc}
                </p>

                <div className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-violet-700">
                  前往查看
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </a>
            );
          })}
        </div>
      </SectionShell>

      <section className="mx-auto max-w-7xl px-4 py-20">
        <div className="grid overflow-hidden rounded-[2rem] border border-white/70 bg-white/80 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
          <div className="p-8 md:p-12">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-violet-50 px-4 py-2 text-sm font-bold text-violet-700">
              <ShieldCheck className="h-4 w-4" />
              陪玩師入駐
            </div>

            <h2 className="text-4xl font-black leading-tight text-slate-950 md:text-5xl">
              讓陪玩師自己申請、開廳、接單、看收入
            </h2>

            <p className="mt-5 text-sm leading-8 text-slate-600 md:text-base">
              陪玩師不是由你手動一個一個新增，而是可以註冊普通會員後申請入駐。
              管理員審核通過後，陪玩師可以進入自己的中心管理服務、價格、時間、語音廳與收入。
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <FeatureLine icon={<BadgeCheck />} text="入駐審核制度" />
              <FeatureLine icon={<Wallet />} text="收入與提領紀錄" />
              <FeatureLine icon={<Mic2 />} text="自由開語音廳" />
              <FeatureLine icon={<Bell />} text="即時訂單通知" />
            </div>

            <a
              href="/apply-player"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-4 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
            >
              申請成為陪玩師
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>

          <div className="relative min-h-[420px] border-t border-slate-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-8 lg:border-l lg:border-t-0">
            <div className="absolute right-[-80px] top-[-80px] h-72 w-72 rounded-full bg-fuchsia-200/70 blur-3xl" />
            <div className="absolute bottom-[-80px] left-[-80px] h-72 w-72 rounded-full bg-blue-100/80 blur-3xl" />

            <div className="relative grid gap-4">
              <DashboardPreview
                title="今日接單"
                value="12"
                desc="比昨日 +18%"
                icon={<Zap className="h-5 w-5" />}
              />
              <DashboardPreview
                title="今日收入"
                value="8,420 ASD"
                desc="待結算 1,260 ASD"
                icon={<Coins className="h-5 w-5" />}
              />
              <DashboardPreview
                title="我的語音廳"
                value="開放中"
                desc="目前 18 人在線"
                icon={<Headphones className="h-5 w-5" />}
              />
              <DashboardPreview
                title="會員評價"
                value="4.9 / 5.0"
                desc="最近 30 日 96 則評價"
                icon={<Star className="h-5 w-5" />}
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionShell({
  eyebrow,
  title,
  desc,
  actionText,
  actionHref,
  children,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  actionText?: string;
  actionHref?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black tracking-[0.3em] text-violet-600">
            {eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 md:text-5xl">
            {title}
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
            {desc}
          </p>
        </div>

        {actionText && actionHref && (
          <a
            href={actionHref}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-white"
          >
            {actionText}
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
      </div>

      {children}
    </section>
  );
}

function PlayerCard({
  player,
  index,
}: {
  player: {
    name: string;
    tag: string;
    price: string;
    rating: string;
    orders: string;
    status: string;
    intro: string;
  };
  index: number;
}) {
  return (
    <article className="group overflow-hidden rounded-[1.8rem] border border-white/70 bg-white/80 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-violet-200 hover:bg-white">
      <div className="relative h-40 bg-gradient-to-br from-violet-100 via-fuchsia-50 to-blue-100">
        <div className="absolute right-5 top-5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
          {player.status}
        </div>

        <div className="absolute bottom-[-32px] left-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-white bg-white text-2xl font-black text-violet-700 shadow-xl">
          {player.name.slice(0, 1)}
        </div>

        <div className="absolute left-6 top-5 flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-violet-700 shadow-sm">
          <Crown className="h-3.5 w-3.5 text-yellow-500" />
          TOP {index + 1}
        </div>
      </div>

      <div className="px-6 pb-6 pt-12">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-2xl font-black text-slate-950">{player.name}</h3>
            <p className="mt-1 text-sm font-semibold text-violet-700">
              {player.tag}
            </p>
          </div>

          <button className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-400 transition hover:text-pink-500">
            <Heart className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm leading-7 text-slate-500">{player.intro}</p>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <MiniMetric label="評價" value={player.rating} />
          <MiniMetric label="訂單" value={player.orders} />
          <MiniMetric label="價格" value="詳情" />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-sm font-black text-amber-600">{player.price}</p>
          <a
            href="/players"
            className="inline-flex items-center gap-1 rounded-2xl bg-violet-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-500"
          >
            查看
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </article>
  );
}

function VoiceRoomCard({
  room,
}: {
  room: {
    title: string;
    host: string;
    online: number;
    type: string;
  };
}) {
  return (
    <article className="rounded-[1.8rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl transition hover:-translate-y-1 hover:border-fuchsia-200 hover:bg-white">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-50 text-fuchsia-700">
          <Mic2 className="h-6 w-6" />
        </div>

        <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
          {room.online} 人在線
        </div>
      </div>

      <p className="text-sm font-bold text-fuchsia-700">{room.type}</p>
      <h3 className="mt-2 text-2xl font-black text-slate-950">{room.title}</h3>
      <p className="mt-3 text-sm font-semibold text-slate-500">
        房主：{room.host}
      </p>

      <a
        href="/voice-rooms"
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-fuchsia-50"
      >
        進入房間
        <ArrowRight className="h-4 w-4" />
      </a>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3 text-center">
      <p className="text-sm font-black text-slate-950">{value}</p>
      <p className="mt-1 text-[11px] font-semibold text-slate-400">{label}</p>
    </div>
  );
}

function StatusCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-slate-100 bg-slate-50/80 p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm">
        {icon}
      </div>
      <div>
        <p className="font-black text-slate-900">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{desc}</p>
      </div>
    </div>
  );
}

function FeatureLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4 text-sm font-bold text-slate-700">
      <span className="text-violet-700 [&_svg]:h-5 [&_svg]:w-5">{icon}</span>
      {text}
    </div>
  );
}

function DashboardPreview({
  title,
  value,
  desc,
  icon,
}: {
  title: string;
  value: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/80 bg-white/85 p-5 shadow-xl backdrop-blur-xl">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-bold text-slate-500">{title}</p>
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-xs font-semibold text-slate-400">{desc}</p>
    </div>
  );
}