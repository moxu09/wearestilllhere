"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getAuthCallbackUrl } from "@/lib/authRedirect";
import {
  ArrowRight,
  Boxes,
  ClipboardCheck,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from "lucide-react";

// Service responses combine rows from several operational tables.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

async function authFetch(init?: RequestInit) {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("請先登入");
  const response = await fetch("/api/service", {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error || "操作失敗");
  return body;
}

export default function ServicePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Row | null>(null);
  const [tab, setTab] = useState("reports");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [search, setSearch] = useState("");
  const [adjust, setAdjust] = useState({
    discordUserId: "",
    pointKind: "membership",
    delta: "",
    note: "",
  });
  const [reward, setReward] = useState({
    id: "",
    name: "",
    description: "",
    rewardType: "prize",
    pointsCost: "",
    stock: "",
    status: "active",
    couponName: "",
  });
  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      setHasSession(Boolean(sessionData.session));
      if (!sessionData.session) throw new Error("請先登入");
      setData(await authFetch());
    } catch (e) {
      setError(e instanceof Error ? e.message : "讀取失敗");
    } finally {
      setLoading(false);
    }
  }
  async function loginWithDiscord() {
    setBusy(true);
    setError("");
    const { error: loginError } = await supabase.auth.signInWithOAuth({
      provider: "discord",
      options: { redirectTo: getAuthCallbackUrl("/service") },
    });
    if (loginError) {
      setBusy(false);
      setError(`Discord 登入失敗：${loginError.message}`);
    }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);
  async function action(payload: Row) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await authFetch({ method: "POST", body: JSON.stringify(payload) });
      setMessage("操作已完成");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失敗");
    } finally {
      setBusy(false);
    }
  }
  const members = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.members || [])
      .filter(
        (m: Row) =>
          !q ||
          String(m.display_name || "")
            .toLowerCase()
            .includes(q) ||
          String(m.discord_user_id).includes(q),
      )
      .sort(
        (a: Row, b: Row) =>
          Number(b.lifetime_points || 0) - Number(a.lifetime_points || 0),
      );
  }, [data, search]);
  const profileByDiscord = useMemo(
    () =>
      new Map(
        (data?.profiles || []).map((profile: Row) => [
          String(profile.discord_user_id),
          profile,
        ]),
      ),
    [data],
  );
  if (loading)
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#eef3f0] text-[#31463f]">
        <Loader2 className="mr-3 animate-spin text-emerald-700" />
        載入客服中心
      </main>
    );
  if (!data)
    return (
      <main className="flex min-h-screen items-center bg-[#eef3f0] px-4 py-10">
        <div className="mx-auto w-full max-w-lg rounded-lg border border-[#d8e3dd] bg-white p-7 text-center shadow-[0_22px_60px_rgba(30,58,48,0.12)] sm:p-10">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e5f1eb] text-emerald-800">
            <ShieldCheck size={28} />
          </span>
          <p className="mt-5 text-xs font-bold text-amber-700">STAR NIGHT OPERATIONS</p>
          <h1 className="mt-2 text-2xl font-black text-[#172b25]">
            {hasSession ? "沒有客服權限" : "星夜聯盟客服登入"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-red-600">{error}</p>
          {hasSession ? (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                location.reload();
              }}
              className="mt-6 rounded-md bg-[#183d32] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#102f27]"
            >
              登出並更換 Discord 帳號
            </button>
          ) : (
            <button
              disabled={busy}
              onClick={loginWithDiscord}
              className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#183d32] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#102f27] disabled:opacity-60"
            >
              {busy ? "前往 Discord 中" : "使用 Discord 登入"}
              <ArrowRight size={17} />
            </button>
          )}
        </div>
      </main>
    );
  return (
    <main className="min-h-screen bg-[#eef3f0] text-[#1f312b]">
      <header className="border-b border-white/10 bg-[#152923] text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6">
          <div>
            <p className="text-xs font-bold text-amber-300">
              STAR NIGHT OPERATIONS
            </p>
            <h1 className="mt-1 text-xl font-black sm:text-2xl">星夜聯盟客服中心</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={load}
              title="重新整理"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                location.href = "/";
              }}
              title="登出"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/15 text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {message && (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}
        <nav className="flex gap-1 overflow-x-auto rounded-lg border border-[#d8e3dd] bg-white p-1.5 shadow-sm">
          {[
            [
              "reports",
              "員工審核",
              ClipboardCheck,
              (data.reports || []).length,
            ],
            ["members", "會員審核", Users, (data.redemptions || []).length],
            ["rewards", "兌換商品", Boxes, (data.rewards || []).length],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ].map(([key, label, Icon, count]: any) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex shrink-0 items-center gap-2 rounded-md px-4 py-3 text-sm font-bold transition sm:px-5 ${tab === key ? "bg-[#e3efe9] text-emerald-900" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
            >
              <Icon size={17} />
              {label}
              <span className={`rounded-full px-2 py-0.5 text-xs ${tab === key ? "bg-white text-emerald-800" : "bg-slate-100"}`}>{count}</span>
            </button>
          ))}
        </nav>

        {tab === "reports" && (
          <section className="mt-5">
            <SectionTitle
              title="待審工時報單"
              text="深夜與秋奈機器人送出的工時申報會集中顯示於此。"
            />
            {(data.reports || []).length ? (
              <div className="overflow-x-auto rounded-lg border border-[#d8e3dd] bg-white shadow-sm">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="bg-[#f6f9f7] text-xs font-bold text-slate-500">
                    <tr>
                      {[
                        "品牌",
                        "陪陪",
                        "老闆",
                        "類型／項目",
                        "金額",
                        "時長",
                        "操作",
                      ].map((x) => (
                        <th key={x} className="px-4 py-3">
                          {x}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.reports.map((r: Row) => (
                      <tr key={r.id} className="transition hover:bg-[#f8faf9]">
                        <td className="px-4 py-4 font-bold">
                          {r.brand === "deepnight" ? "深夜" : "秋奈"}
                        </td>
                        <td className="px-4 py-4">
                          {r.staff_name || r.discord_id}
                        </td>
                        <td className="px-4 py-4">
                          {r.customer_name ||
                            r.meta?.customerName ||
                            r.meta?.customerId ||
                            "-"}
                        </td>
                        <td className="px-4 py-4">
                          {r.meta?.orderType || r.order_type || "訂單"}
                          <br />
                          <span className="text-xs text-slate-400">
                            {r.service_name || r.service || r.meta?.serviceName}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-semibold">
                          {Number(
                            r.order_amount || r.price || 0,
                          ).toLocaleString()}{" "}
                          ASD
                        </td>
                        <td className="px-4 py-4">
                          {Number(
                            r.duration_minutes || r.meta?.durationMinutes || 0,
                          )}{" "}
                          分
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            <button
                              disabled={busy}
                              onClick={() =>
                                action({
                                  action: "review_report",
                                  brand: r.brand,
                                  reportId: r.id,
                                  approved: true,
                                })
                              }
                            className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                            >
                              通過
                            </button>
                            <button
                              disabled={busy}
                              onClick={() => {
                                const note = prompt("請輸入駁回原因");
                                if (note)
                                  action({
                                    action: "review_report",
                                    brand: r.brand,
                                    reportId: r.id,
                                    approved: false,
                                    note,
                                  });
                              }}
                            className="rounded-md border border-red-200 bg-white px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                              駁回
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty text="目前沒有待審工時報單" />
            )}
          </section>
        )}

        {tab === "members" && (
          <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_1.4fr]">
            <div>
              <SectionTitle
                title="兌換申請"
                text="審核商品、優惠券與自訂折價券。"
              />
              {(data.redemptions || []).length ? (
                <div className="space-y-3">
                  {data.redemptions.map((r: Row) => (
                    <article
                      key={r.id}
                      className="rounded-lg border border-[#d8e3dd] bg-white p-4 shadow-sm"
                    >
                      <div className="flex justify-between gap-3">
                        <div>
                          <p className="font-bold">{r.reward_name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {r.discord_user_id} ·{" "}
                            {Number(r.points_spent).toLocaleString()} 點
                          </p>
                        </div>
                        {r.discount_amount && (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-bold text-amber-800">
                            折 {r.discount_amount} ASD
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          disabled={busy}
                          onClick={() =>
                            action({
                              action: "review_redemption",
                              requestId: r.id,
                              approved: true,
                            })
                          }
                          className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-50"
                        >
                          同意
                        </button>
                        <button
                          disabled={busy}
                          onClick={() => {
                            const note = prompt("請輸入駁回原因");
                            if (note)
                              action({
                                action: "review_redemption",
                                requestId: r.id,
                                approved: false,
                                note,
                              });
                          }}
                          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold transition hover:bg-slate-50 disabled:opacity-50"
                        >
                          駁回
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty text="目前沒有待審兌換" />
              )}
            </div>
            <div>
              <SectionTitle
                title="會員與積分調整"
                text="客服可依 Discord ID 增減會籍或獎勵積分，所有異動都會留下紀錄。"
              />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  action({
                    action: "adjust_points",
                    ...adjust,
                    delta: Number(adjust.delta),
                  });
                }}
                className="grid gap-3 rounded-lg border border-[#d8e3dd] bg-white p-4 shadow-sm md:grid-cols-[1fr_150px_130px_1fr_auto]"
              >
                <input
                  required
                  value={adjust.discordUserId}
                  onChange={(e) =>
                    setAdjust({ ...adjust, discordUserId: e.target.value })
                  }
                  placeholder="Discord ID"
                  className="rounded-md border border-slate-200 bg-[#fbfcfb] px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                <select
                  value={adjust.pointKind}
                  onChange={(e) =>
                    setAdjust({ ...adjust, pointKind: e.target.value })
                  }
                  className="rounded-md border border-slate-200 bg-[#fbfcfb] px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="membership">會籍積分</option>
                  <option value="reward">獎勵積分</option>
                </select>
                <input
                  required
                  type="number"
                  step="0.01"
                  value={adjust.delta}
                  onChange={(e) =>
                    setAdjust({ ...adjust, delta: e.target.value })
                  }
                  placeholder="增減數值"
                  className="rounded-md border border-slate-200 bg-[#fbfcfb] px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                <input
                  required
                  value={adjust.note}
                  onChange={(e) =>
                    setAdjust({ ...adjust, note: e.target.value })
                  }
                  placeholder="調整原因"
                  className="rounded-md border border-slate-200 bg-[#fbfcfb] px-3 py-2 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                />
                <button
                  disabled={busy}
                  className="rounded-md bg-[#183d32] px-4 py-2 font-bold text-white transition hover:bg-[#102f27] disabled:opacity-50"
                >
                  確定
                </button>
              </form>
              <div className="mt-4 flex items-center rounded-lg border border-[#d8e3dd] bg-white px-3 shadow-sm focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
                <Search size={17} className="text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜尋名稱或 Discord ID"
                  className="w-full px-3 py-3 outline-none"
                />
              </div>
              <div className="mt-3 max-h-[560px] overflow-auto rounded-lg border border-[#d8e3dd] bg-white shadow-sm">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="sticky top-0 bg-[#f3f7f5] text-xs font-bold text-slate-500 shadow-[0_1px_0_#d8e3dd]">
                    <tr>
                      {[
                        "會員",
                        "會籍",
                        "會籍積分",
                        "獎勵積分",
                        "錢包連結",
                        "客服權限",
                      ].map((x) => (
                          <th key={x} className="px-4 py-3">
                            {x}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {members.map((m: Row) => {
                      const tier = data.tiers.find(
                        (t: Row) => t.tier_key === m.tier_key,
                      );
                      const linkedProfile = profileByDiscord.get(
                        String(m.discord_user_id),
                      ) as Row | undefined;
                      return (
                        <tr key={m.discord_user_id} className="transition hover:bg-[#f8faf9]">
                          <td className="px-4 py-3">
                            <p className="font-bold">
                              {m.display_name || "未設定名稱"}
                            </p>
                            <button
                              onClick={() =>
                                setAdjust({
                                  ...adjust,
                                  discordUserId: m.discord_user_id,
                                })
                              }
                              className="text-xs text-emerald-700 hover:underline"
                            >
                              {m.discord_user_id}
                            </button>
                          </td>
                          <td className="px-4 py-3">{tier?.tier_name}</td>
                          <td className="px-4 py-3">
                            {Number(m.lifetime_points).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            {Number(m.reward_points).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">
                            {m.auth_user_id ? "已連結" : "首次登入時連結"}
                          </td>
                          <td className="px-4 py-3">
                            {linkedProfile?.role === "admin" ? (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                                管理員
                              </span>
                            ) : data.actorRole === "admin" ? (
                              <button
                                disabled={!linkedProfile || busy}
                                onClick={() =>
                                  action({
                                    action: "set_staff_role",
                                    discordUserId: m.discord_user_id,
                                    enabled: linkedProfile?.role !== "staff",
                                  })
                                }
                                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-bold transition hover:bg-slate-50 disabled:opacity-40"
                              >
                                {!linkedProfile
                                  ? "尚未登入"
                                  : linkedProfile.role === "staff"
                                    ? "移除客服"
                                    : "設為客服"}
                              </button>
                            ) : (
                              <span>
                                {linkedProfile?.role === "staff"
                                  ? "客服"
                                  : "一般會員"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {tab === "rewards" && (
          <section className="mt-5 grid gap-5 lg:grid-cols-[380px_1fr]">
            <div>
              <SectionTitle
                title={reward.id ? "編輯兌換商品" : "新增兌換商品"}
                text="儲存後會員端會立即顯示。"
              />
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  action({
                    action: "save_reward",
                    ...reward,
                    pointsCost: Number(reward.pointsCost),
                  });
                  setReward({
                    id: "",
                    name: "",
                    description: "",
                    rewardType: "prize",
                    pointsCost: "",
                    stock: "",
                    status: "active",
                    couponName: "",
                  });
                }}
                className="space-y-3 rounded-lg border border-[#d8e3dd] bg-white p-4 shadow-sm"
              >
                <Field label="商品名稱">
                  <input
                    required
                    value={reward.name}
                    onChange={(e) =>
                      setReward({ ...reward, name: e.target.value })
                    }
                  />
                </Field>
                <Field label="說明">
                  <textarea
                    value={reward.description}
                    onChange={(e) =>
                      setReward({ ...reward, description: e.target.value })
                    }
                  />
                </Field>
                <Field label="類型">
                  <select
                    value={reward.rewardType}
                    onChange={(e) =>
                      setReward({ ...reward, rewardType: e.target.value })
                    }
                  >
                    <option value="prize">實體／一般獎品</option>
                    <option value="coupon">優惠券</option>
                    <option value="discount_coupon">折價券</option>
                  </select>
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="所需積分">
                    <input
                      required
                      type="number"
                      min="1"
                      value={reward.pointsCost}
                      onChange={(e) =>
                        setReward({ ...reward, pointsCost: e.target.value })
                      }
                    />
                  </Field>
                  <Field label="庫存（空白不限）">
                    <input
                      type="number"
                      min="0"
                      value={reward.stock}
                      onChange={(e) =>
                        setReward({ ...reward, stock: e.target.value })
                      }
                    />
                  </Field>
                </div>
                <Field label="狀態">
                  <select
                    value={reward.status}
                    onChange={(e) =>
                      setReward({ ...reward, status: e.target.value })
                    }
                  >
                    <option value="active">可兌換</option>
                    <option value="paused">停換</option>
                  </select>
                </Field>
                <button
                  disabled={busy}
                  className="w-full rounded-md bg-[#183d32] px-4 py-3 font-bold text-white transition hover:bg-[#102f27] disabled:opacity-50"
                >
                  {reward.id ? "儲存修改" : "新增商品"}
                </button>
              </form>
            </div>
            <div>
              <SectionTitle
                title="會員兌換商品列表"
                text="可修改、停換或刪除商品。"
              />
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {data.rewards.map((r: Row) => (
                  <article
                    key={r.id}
                    className="rounded-lg border border-[#d8e3dd] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e5f1eb] text-emerald-800"><Boxes size={19} /></span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${r.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
                      >
                        {r.status === "active" ? "可兌換" : "已停換"}
                      </span>
                    </div>
                    <h3 className="mt-4 font-black">{r.name}</h3>
                    <p className="mt-2 min-h-10 text-sm text-slate-500">
                      {r.description || "無說明"}
                    </p>
                    <p className="mt-4 font-bold text-emerald-800">
                      {Number(r.points_cost).toLocaleString()} 點
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      庫存：{r.stock == null ? "不限" : r.stock}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() =>
                          setReward({
                            id: r.id,
                            name: r.name,
                            description: r.description || "",
                            rewardType: r.reward_type,
                            pointsCost: String(r.points_cost),
                            stock: r.stock == null ? "" : String(r.stock),
                            status: r.status,
                            couponName: r.coupon_name || "",
                          })
                        }
                        className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-bold transition hover:bg-slate-50"
                      >
                        編輯
                      </button>
                      <button
                        title="刪除"
                        onClick={() =>
                          confirm("確定刪除？") &&
                          action({ action: "delete_reward", id: r.id })
                        }
                        className="grid h-9 w-9 place-items-center rounded-md border border-red-200 text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function SectionTitle({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-xl font-black text-[#183d32]">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[#cbd9d2] bg-white/70 p-10 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-bold text-slate-700">
      {label}
      <div className="mt-1 [&_input]:w-full [&_input]:rounded-md [&_input]:border [&_input]:border-slate-200 [&_input]:bg-[#fbfcfb] [&_input]:px-3 [&_input]:py-2 [&_input]:outline-none [&_input]:focus:border-emerald-500 [&_select]:w-full [&_select]:rounded-md [&_select]:border [&_select]:border-slate-200 [&_select]:bg-[#fbfcfb] [&_select]:px-3 [&_select]:py-2 [&_select]:outline-none [&_select]:focus:border-emerald-500 [&_textarea]:min-h-20 [&_textarea]:w-full [&_textarea]:rounded-md [&_textarea]:border [&_textarea]:border-slate-200 [&_textarea]:bg-[#fbfcfb] [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:outline-none [&_textarea]:focus:border-emerald-500">
        {children}
      </div>
    </label>
  );
}
