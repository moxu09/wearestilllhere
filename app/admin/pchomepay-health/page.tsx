"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Server,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from "lucide-react";

type CheckResult = {
  name: string;
  ok: boolean;
  message: string;
};

type HealthResult = {
  ok: boolean;
  environment: string;
  site_url: string | null;
  checks: CheckResult[];
};

export default function PchomePayHealthPage() {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<HealthResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadHealth();
  }, []);

  async function loadHealth() {
    setChecking(true);
    setError("");

    try {
      const response = await fetch("/api/payments/pchomepay/health", {
        method: "GET",
        cache: "no-store",
      });

      const data = (await response.json()) as HealthResult | { error?: string };

      if ("checks" in data) {
        setResult(data);
      } else {
        setError(data.error || "讀取 PChomePay 健康檢查失敗。");
      }
    } catch (err) {
      console.error("[pchomepay health page] failed:", err);
      setError("讀取 PChomePay 健康檢查失敗。");
    } finally {
      setLoading(false);
      setChecking(false);
    }
  }

  const totalChecks = result?.checks.length || 0;
  const passedChecks = result?.checks.filter((check) => check.ok).length || 0;
  const failedChecks = totalChecks - passedChecks;

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <a
          href="/admin"
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-white hover:text-violet-700"
        >
          <ArrowLeft className="h-4 w-4" />
          回後台
        </a>

        <section className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-violet-100/70 backdrop-blur-xl md:p-8">
          <div className="absolute right-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-200/70 blur-3xl" />
          <div className="absolute bottom-[-140px] left-[-120px] h-80 w-80 rounded-full bg-fuchsia-200/60 blur-3xl" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-black text-violet-700 shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              PCHOMEPAY HEALTH CHECK
            </div>

            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-5xl">
                  PChomePay 串接檢查
                </h1>

                <p className="mt-4 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                  這裡會檢查 Supabase 表、Service Role、PChomePay APP ID /
                  SECRET、API URL，以及是否能成功取得 PChomePay Token。
                </p>
              </div>

              <button
                type="button"
                onClick={loadHealth}
                disabled={checking}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checking ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
                {checking ? "檢查中..." : "重新檢查"}
              </button>
            </div>
          </div>
        </section>

        {loading ? (
          <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-600" />
            <p className="mt-4 text-sm font-bold text-slate-500">
              正在檢查 PChomePay 串接狀態...
            </p>
          </section>
        ) : (
          <>
            {error && (
              <section className="mt-6 rounded-[2rem] border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-600">
                {error}
              </section>
            )}

            {result && (
              <>
                <section className="mt-6 grid gap-4 md:grid-cols-3">
                  <SummaryCard
                    icon={<Server />}
                    title="環境"
                    value={
                      result.environment === "sandbox" ? "測試環境" : "正式環境"
                    }
                    desc={result.site_url || "尚未設定 NEXT_PUBLIC_SITE_URL"}
                    tone="violet"
                  />

                  <SummaryCard
                    icon={result.ok ? <CheckCircle2 /> : <TriangleAlert />}
                    title="整體狀態"
                    value={result.ok ? "正常" : "需要修正"}
                    desc={
                      result.ok
                        ? "所有檢查都通過"
                        : `有 ${failedChecks} 項需要處理`
                    }
                    tone={result.ok ? "emerald" : "amber"}
                  />

                  <SummaryCard
                    icon={<ShieldCheck />}
                    title="通過項目"
                    value={`${passedChecks} / ${totalChecks}`}
                    desc="Supabase、資料表、PChomePay Token"
                    tone="violet"
                  />
                </section>

                <section className="mt-6 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-violet-600">
                        CHECK LIST
                      </p>
                      <h2 className="text-2xl font-black text-slate-950">
                        檢查結果
                      </h2>
                    </div>

                    <div
                      className={`rounded-full px-4 py-2 text-xs font-black ${
                        result.ok
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {result.ok ? "全部通過" : "尚未完成"}
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {result.checks.map((check) => (
                      <CheckItem key={check.name} check={check} />
                    ))}
                  </div>
                </section>

                {!result.ok && (
                  <section className="mt-6 rounded-[2rem] border border-amber-200 bg-amber-50 p-6">
                    <div className="flex items-start gap-3">
                      <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                      <div>
                        <p className="font-black text-amber-800">下一步</p>
                        <p className="mt-2 text-sm leading-7 text-amber-800/80">
                          如果錯誤是 APP ID / SECRET，請到 `.env.local`
                          換成 PChomePay 給你的測試或正式帳密。如果錯誤是資料表不存在，就回 Supabase
                          SQL Editor 補建對應資料表。
                        </p>
                      </div>
                    </div>
                  </section>
                )}
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  desc,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  desc: string;
  tone: "violet" | "emerald" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "amber"
      ? "bg-amber-50 text-amber-700"
      : "bg-violet-50 text-violet-700";

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl shadow-violet-100/60 backdrop-blur-xl">
      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${toneClass} [&_svg]:h-6 [&_svg]:w-6`}
      >
        {icon}
      </div>

      <p className="text-sm font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-2 break-all text-xs leading-5 text-slate-500">{desc}</p>
    </section>
  );
}

function CheckItem({ check }: { check: CheckResult }) {
  return (
    <section
      className={`rounded-3xl border p-5 ${
        check.ok
          ? "border-emerald-100 bg-emerald-50/70"
          : "border-red-100 bg-red-50/70"
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            check.ok
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {check.ok ? (
            <CheckCircle2 className="h-6 w-6" />
          ) : (
            <XCircle className="h-6 w-6" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="break-all text-sm font-black text-slate-950">
            {check.name}
          </p>
          <p
            className={`mt-1 break-all text-sm leading-7 ${
              check.ok ? "text-emerald-700" : "text-red-600"
            }`}
          >
            {check.message}
          </p>
        </div>
      </div>
    </section>
  );
}
