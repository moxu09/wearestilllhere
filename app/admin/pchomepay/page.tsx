import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CreditCard,
  ListChecks,
  Server,
  ShieldCheck,
  Wallet,
} from "lucide-react";

export default function AdminPchomePayPage() {
  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
      <section className="mx-auto max-w-6xl">
        <a
          href="/admin"
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-white hover:text-violet-700"
        >
          <ArrowLeft className="h-4 w-4" />
          回後台
        </a>

        <section className="relative overflow-hidden rounded-[2.8rem] border border-white/70 bg-white/80 p-7 shadow-xl shadow-violet-100/70 backdrop-blur-xl md:p-10">
          <div className="absolute right-[-140px] top-[-140px] h-96 w-96 rounded-full bg-violet-200/70 blur-3xl" />
          <div className="absolute bottom-[-160px] left-[-120px] h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-black text-violet-700 shadow-sm">
              <CreditCard className="h-4 w-4" />
              PCHOMEPAY ADMIN
            </div>

            <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              PChomePay 金流管理
            </h1>

            <p className="mt-5 max-w-3xl text-sm leading-8 text-slate-600 md:text-base">
              這裡是 PChomePay 串接總控台，可以檢查 API 串接狀態、查看付款紀錄、
              手動同步付款狀態，並確認會員儲值是否正確入帳。
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <MiniStatus
                icon={<ShieldCheck />}
                title="串接檢查"
                desc="檢查 APP ID、SECRET、API URL、Supabase 表與 token。"
              />
              <MiniStatus
                icon={<Wallet />}
                title="自動入帳"
                desc="付款成功後，系統會將 ASD 加到會員錢包。"
              />
              <MiniStatus
                icon={<CheckCircle2 />}
                title="防重複入帳"
                desc="同一筆付款就算重複通知，也只會入帳一次。"
              />
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 md:grid-cols-2">
          <AdminCard
            href="/admin/pchomepay-health"
            icon={<Server />}
            title="串接健康檢查"
            desc="檢查環境變數、Supabase 資料表、Service Role，以及 PChomePay Token 是否能正常取得。"
            buttonText="前往檢查"
          />

          <AdminCard
            href="/admin/pchomepay-payments"
            icon={<ListChecks />}
            title="付款紀錄管理"
            desc="查看所有 PChomePay 線上儲值紀錄，包含等待付款、已付款、失敗與手動同步功能。"
            buttonText="查看付款紀錄"
          />
        </section>

        <section className="mt-6 rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
          <p className="font-black text-amber-800">上線前確認</p>

          <div className="mt-4 grid gap-3 text-sm font-semibold leading-7 text-amber-800/85">
            <CheckLine text="PCHOMEPAY_APP_ID 已換成正式或測試 APP ID。" />
            <CheckLine text="PCHOMEPAY_SECRET 已換成正式或測試 SECRET。" />
            <CheckLine text="正式站 NEXT_PUBLIC_SITE_URL 要改成 https://wearestillhere.com。" />
            <CheckLine text="PChomePay 後台 Notify URL 要設定成 /api/payments/pchomepay/notify。" />
            <CheckLine text="正式環境 API URL 要改成 https://api.pchomepay.com.tw。" />
          </div>
        </section>
      </section>
    </main>
  );
}

function AdminCard({
  href,
  icon,
  title,
  desc,
  buttonText,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  buttonText: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-[2.2rem] border border-white/70 bg-white/85 p-6 shadow-xl shadow-violet-100/60 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 transition group-hover:bg-violet-600 group-hover:text-white [&_svg]:h-7 [&_svg]:w-7">
        {icon}
      </div>

      <h2 className="text-2xl font-black text-slate-950">{title}</h2>

      <p className="mt-3 min-h-[84px] text-sm font-semibold leading-7 text-slate-500">
        {desc}
      </p>

      <div className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-100 transition group-hover:bg-violet-500">
        {buttonText}
        <ArrowRight className="h-4 w-4" />
      </div>
    </a>
  );
}

function MiniStatus({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/70 bg-white/70 p-5 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>

      <p className="font-black text-slate-950">{title}</p>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        {desc}
      </p>
    </div>
  );
}

function CheckLine({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-amber-700" />
      <span>{text}</span>
    </div>
  );
}