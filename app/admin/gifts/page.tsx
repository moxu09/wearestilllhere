"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowRight,
  BadgeCheck,
  Coins,
  Eye,
  Gift,
  ImageIcon,
  Loader2,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  X,
} from "lucide-react";

type BroadcastType = "none" | "banner" | "fullscreen";

type GiftItem = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  price: number;
  is_active: boolean;
  sort_order: number;
  broadcast_type: BroadcastType;
  broadcast_duration_seconds: number;
  broadcast_text: string | null;
  created_at: string;
  updated_at: string;
};

type FormState = {
  name: string;
  description: string;
  icon: string;
  image_url: string;
  price: string;
  sort_order: string;
  is_active: boolean;
  broadcast_type: BroadcastType;
  broadcast_duration_seconds: string;
  broadcast_text: string;
};

const emptyForm: FormState = {
  name: "",
  description: "",
  icon: "🎁",
  image_url: "",
  price: "",
  sort_order: "100",
  is_active: true,
  broadcast_type: "none",
  broadcast_duration_seconds: "6",
  broadcast_text: "",
};

const broadcastLabel: Record<BroadcastType, string> = {
  none: "不播報",
  banner: "小播報",
  fullscreen: "全屏播報",
};

export default function AdminGiftsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [gifts, setGifts] = useState<GiftItem[]>([]);

  const [keyword, setKeyword] = useState("");
  const [showInactive, setShowInactive] = useState(true);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const editingGift = useMemo(() => {
    return gifts.find((gift) => gift.id === editingId) || null;
  }, [gifts, editingId]);

  const filteredGifts = useMemo(() => {
    return gifts.filter((gift) => {
      const text = [
        gift.name,
        gift.description,
        gift.icon,
        gift.image_url,
        gift.price,
        broadcastLabel[gift.broadcast_type],
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchKeyword = keyword.trim()
        ? text.includes(keyword.trim().toLowerCase())
        : true;

      const matchActive = showInactive ? true : gift.is_active;

      return matchKeyword && matchActive;
    });
  }, [gifts, keyword, showInactive]);

  const activeCount = gifts.filter((gift) => gift.is_active).length;
  const fullscreenCount = gifts.filter(
    (gift) => gift.broadcast_type === "fullscreen"
  ).length;
  const bannerCount = gifts.filter((gift) => gift.broadcast_type === "banner").length;

  useEffect(() => {
    loadPage();
  }, []);

  async function loadPage() {
    setLoading(true);
    setError("");
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      setError("讀取登入狀態失敗：" + userError.message);
      setLoading(false);
      return;
    }

    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("platform_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      setError("讀取管理員權限失敗：" + profileError.message);
      setLoading(false);
      return;
    }

    const admin = profileData?.role === "admin" || profileData?.role === "staff";
    setIsAdmin(admin);

    if (!admin) {
      setLoading(false);
      return;
    }

    await loadGifts();
    setLoading(false);
  }

  async function loadGifts() {
    const { data, error } = await supabase
      .from("platform_gifts")
      .select(
        `
        id,
        name,
        description,
        icon,
        image_url,
        price,
        is_active,
        sort_order,
        broadcast_type,
        broadcast_duration_seconds,
        broadcast_text,
        created_at,
        updated_at
      `
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      setError("讀取禮物列表失敗：" + error.message);
      return;
    }

    setGifts((data || []) as GiftItem[]);
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setMessage("");
  }

  function startEdit(gift: GiftItem) {
    setEditingId(gift.id);
    setForm({
      name: gift.name,
      description: gift.description || "",
      icon: gift.icon || "🎁",
      image_url: gift.image_url || "",
      price: String(gift.price || ""),
      sort_order: String(gift.sort_order || 100),
      is_active: gift.is_active,
      broadcast_type: gift.broadcast_type || "none",
      broadcast_duration_seconds: String(gift.broadcast_duration_seconds || 6),
      broadcast_text: gift.broadcast_text || "",
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function submitGift() {
    setError("");
    setMessage("");

    const name = form.name.trim();
    const price = Number(form.price);
    const sortOrder = Number(form.sort_order || 100);
    const duration = Number(form.broadcast_duration_seconds || 6);

    if (!name) {
      setError("請輸入禮物名稱。");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError("請輸入正確的禮物價格。");
      return;
    }

    if (!Number.isFinite(sortOrder)) {
      setError("排序必須是數字。");
      return;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      setError("播報秒數必須大於 0。");
      return;
    }

    setSaving(true);

    const payload = {
      name,
      description: form.description.trim() || null,
      icon: form.icon.trim() || "🎁",
      image_url: form.image_url.trim() || null,
      price,
      is_active: form.is_active,
      sort_order: sortOrder,
      broadcast_type: form.broadcast_type,
      broadcast_duration_seconds: duration,
      broadcast_text: form.broadcast_text.trim() || null,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase
        .from("platform_gifts")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        setError("更新禮物失敗：" + error.message);
        setSaving(false);
        return;
      }

      setMessage("禮物已更新。");
    } else {
      const { error } = await supabase.from("platform_gifts").insert(payload);

      if (error) {
        setError("新增禮物失敗：" + error.message);
        setSaving(false);
        return;
      }

      setMessage("禮物已新增。");
    }

    await loadGifts();
    resetForm();
    setSaving(false);
  }

  async function toggleActive(gift: GiftItem) {
    setError("");
    setMessage("");

    const { error } = await supabase
      .from("platform_gifts")
      .update({
        is_active: !gift.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", gift.id);

    if (error) {
      setError("切換狀態失敗：" + error.message);
      return;
    }

    setMessage(gift.is_active ? "禮物已停用。" : "禮物已啟用。");
    await loadGifts();
  }

  async function quickSetFullscreen(gift: GiftItem) {
    setError("");
    setMessage("");

    const { error } = await supabase
      .from("platform_gifts")
      .update({
        broadcast_type: "fullscreen",
        broadcast_duration_seconds: 10,
        broadcast_text:
          gift.broadcast_text || `${gift.name}，滿天星火只為你點亮。`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", gift.id);

    if (error) {
      setError("設定全屏播報失敗：" + error.message);
      return;
    }

    setMessage(`「${gift.name}」已設定為全屏播報。`);
    await loadGifts();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取禮物管理中...</span>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <AccessCard
        icon={<Lock className="h-8 w-8" />}
        title="沒有管理權限"
        desc="只有管理員或客服人員可以管理禮物清單。"
        buttonText="回首頁"
        buttonHref="/"
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-slate-950">
      <section className="relative overflow-hidden">
        <div className="absolute left-[-120px] top-[-120px] h-80 w-80 rounded-full bg-violet-200/70 blur-3xl" />
        <div className="absolute right-[-120px] top-20 h-96 w-96 rounded-full bg-fuchsia-200/60 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-96 w-96 rounded-full bg-amber-100/70 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-10">
          {message && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}

          <div className="mb-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
                <ShieldCheck className="h-4 w-4" />
                ADMIN GIFTS
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                禮物管理
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                新增、修改、停用禮物，設定圖片路徑與高額禮物播報效果。
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <GiftStat label="啟用禮物" value={String(activeCount)} icon={<Gift />} />
              <GiftStat
                label="小播報"
                value={String(bannerCount)}
                icon={<Sparkles />}
              />
              <GiftStat
                label="全屏播報"
                value={String(fullscreenCount)}
                icon={<Eye />}
              />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                    {editingId ? (
                      <Pencil className="h-5 w-5" />
                    ) : (
                      <Plus className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-950">
                      {editingId ? "編輯禮物" : "新增禮物"}
                    </h2>
                    <p className="text-xs font-semibold text-slate-400">
                      {editingGift
                        ? `正在編輯：${editingGift.name}`
                        : "建立新的送禮項目"}
                    </p>
                  </div>
                </div>

                {editingId && (
                  <button
                    onClick={resetForm}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-50"
                  >
                    取消編輯
                  </button>
                )}
              </div>

              <div className="grid gap-4">
                <label>
                  <span className="text-sm font-bold text-slate-700">
                    禮物名稱
                  </span>
                  <input
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    placeholder="例如：明燈三千"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-300"
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label>
                    <span className="text-sm font-bold text-slate-700">
                      價格 ASD
                    </span>
                    <input
                      value={form.price}
                      type="number"
                      min={1}
                      onChange={(e) => updateForm("price", e.target.value)}
                      placeholder="16888"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-300"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-bold text-slate-700">
                      排序
                    </span>
                    <input
                      value={form.sort_order}
                      type="number"
                      onChange={(e) =>
                        updateForm("sort_order", e.target.value)
                      }
                      placeholder="100"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-300"
                    />
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                  <label>
                    <span className="text-sm font-bold text-slate-700">
                      Emoji
                    </span>
                    <input
                      value={form.icon}
                      onChange={(e) => updateForm("icon", e.target.value)}
                      placeholder="🎁"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-300"
                    />
                  </label>

                  <label>
                    <span className="text-sm font-bold text-slate-700">
                      圖片路徑
                    </span>
                    <input
                      value={form.image_url}
                      onChange={(e) => updateForm("image_url", e.target.value)}
                      placeholder="/gifts/firework.png"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-300"
                    />
                  </label>
                </div>

                <label>
                  <span className="text-sm font-bold text-slate-700">
                    禮物描述
                  </span>
                  <textarea
                    value={form.description}
                    onChange={(e) => updateForm("description", e.target.value)}
                    rows={4}
                    placeholder="這個禮物的介紹文字..."
                    className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-violet-300"
                  />
                </label>

                <section className="rounded-[1.7rem] border border-amber-100 bg-amber-50/70 p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <Sparkles className="h-5 w-5 text-amber-600" />
                    <h3 className="font-black text-slate-950">播報設定</h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label>
                      <span className="text-sm font-bold text-slate-700">
                        播報類型
                      </span>
                      <select
                        value={form.broadcast_type}
                        onChange={(e) =>
                          updateForm(
                            "broadcast_type",
                            e.target.value as BroadcastType
                          )
                        }
                        className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-amber-300"
                      >
                        <option value="none">不播報</option>
                        <option value="banner">小播報</option>
                        <option value="fullscreen">全屏播報</option>
                      </select>
                    </label>

                    <label>
                      <span className="text-sm font-bold text-slate-700">
                        秒數
                      </span>
                      <input
                        value={form.broadcast_duration_seconds}
                        type="number"
                        min={1}
                        onChange={(e) =>
                          updateForm(
                            "broadcast_duration_seconds",
                            e.target.value
                          )
                        }
                        className="mt-2 w-full rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-amber-300"
                      />
                    </label>
                  </div>

                  <label className="mt-4 block">
                    <span className="text-sm font-bold text-slate-700">
                      播報文字
                    </span>
                    <textarea
                      value={form.broadcast_text}
                      onChange={(e) =>
                        updateForm("broadcast_text", e.target.value)
                      }
                      rows={3}
                      placeholder="例如：明燈三千，滿天星火只為你點亮。"
                      className="mt-2 w-full resize-none rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm leading-7 outline-none transition focus:border-amber-300"
                    />
                  </label>
                </section>

                <button
                  type="button"
                  onClick={() => updateForm("is_active", !form.is_active)}
                  className={`flex items-center justify-between gap-4 rounded-3xl border p-4 text-left transition ${
                    form.is_active
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div>
                    <p className="font-black text-slate-900">啟用狀態</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      停用後，會員送禮頁不會顯示這個禮物。
                    </p>
                  </div>

                  <div
                    className={`flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-bold ${
                      form.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {form.is_active ? (
                      <ToggleRight className="h-5 w-5" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                    {form.is_active ? "啟用" : "停用"}
                  </div>
                </button>

                <PreviewCard form={form} />

                <button
                  onClick={submitGift}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      儲存中...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      {editingId ? "儲存修改" : "新增禮物"}
                    </>
                  )}
                </button>
              </div>
            </section>

            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950">
                    禮物清單
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    共 {filteredGifts.length} 個符合條件
                  </p>
                </div>

                <button
                  onClick={loadGifts}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  重新整理
                </button>
              </div>

              <div className="mb-5 grid gap-4 lg:grid-cols-[1fr_auto]">
                <div className="flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 focus-within:border-violet-300 focus-within:bg-white">
                  <Search className="h-5 w-5 text-slate-400" />
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    placeholder="搜尋禮物名稱、價格、圖片路徑..."
                    className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-400"
                  />
                </div>

                <button
                  onClick={() => setShowInactive((value) => !value)}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  {showInactive ? "隱藏停用" : "顯示停用"}
                </button>
              </div>

              {filteredGifts.length === 0 ? (
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-10 text-center">
                  <Gift className="mx-auto mb-4 h-10 w-10 text-slate-300" />
                  <p className="font-black text-slate-900">沒有禮物</p>
                  <p className="mt-2 text-sm text-slate-500">
                    請先新增一個禮物。
                  </p>
                </div>
              ) : (
                <div className="grid max-h-[980px] gap-4 overflow-y-auto pr-1">
                  {filteredGifts.map((gift) => (
                    <GiftListCard
                      key={gift.id}
                      gift={gift}
                      onEdit={() => startEdit(gift)}
                      onToggleActive={() => toggleActive(gift)}
                      onQuickFullscreen={() => quickSetFullscreen(gift)}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

function GiftListCard({
  gift,
  onEdit,
  onToggleActive,
  onQuickFullscreen,
}: {
  gift: GiftItem;
  onEdit: () => void;
  onToggleActive: () => void;
  onQuickFullscreen: () => void;
}) {
  return (
    <article
      className={`rounded-[1.7rem] border p-4 transition ${
        gift.is_active
          ? "border-slate-100 bg-slate-50/80"
          : "border-slate-200 bg-slate-100/80 opacity-70"
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex items-center gap-4 lg:flex-1">
          <GiftImage
            imageUrl={gift.image_url}
            icon={gift.icon}
            name={gift.name}
          />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="line-clamp-1 text-lg font-black text-slate-950">
                {gift.name}
              </h3>

              {gift.is_active ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-black text-emerald-700">
                  啟用
                </span>
              ) : (
                <span className="rounded-full bg-slate-200 px-3 py-1 text-[11px] font-black text-slate-500">
                  停用
                </span>
              )}

              <BroadcastPill type={gift.broadcast_type} />
            </div>

            <p className="mt-1 text-xl font-black text-violet-700">
              {gift.price.toLocaleString()} ASD
            </p>

            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
              {gift.description || "沒有描述"}
            </p>

            <p className="mt-2 text-[11px] font-semibold text-slate-400">
              圖片：{gift.image_url || "使用 Emoji"} ｜ 排序：{gift.sort_order}
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:w-[360px]">
          <button
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-500"
          >
            <Pencil className="h-4 w-4" />
            編輯
          </button>

          <button
            onClick={onToggleActive}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            {gift.is_active ? (
              <X className="h-4 w-4" />
            ) : (
              <BadgeCheck className="h-4 w-4" />
            )}
            {gift.is_active ? "停用" : "啟用"}
          </button>

          <button
            onClick={onQuickFullscreen}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 shadow-sm transition hover:bg-amber-100"
          >
            <Sparkles className="h-4 w-4" />
            全屏
          </button>
        </div>
      </div>
    </article>
  );
}

function PreviewCard({ form }: { form: FormState }) {
  return (
    <section className="rounded-[1.7rem] border border-slate-100 bg-slate-50 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-black text-slate-900">
        <ImageIcon className="h-4 w-4 text-violet-600" />
        預覽
      </div>

      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <GiftImage
            imageUrl={form.image_url.trim() || null}
            icon={form.icon || "🎁"}
            name={form.name || "禮物名稱"}
          />

          <div className="min-w-0 flex-1">
            <p className="line-clamp-1 font-black text-slate-950">
              {form.name || "禮物名稱"}
            </p>
            <p className="mt-1 text-lg font-black text-violet-700">
              {Number(form.price || 0).toLocaleString()} ASD
            </p>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
              {form.description || "禮物描述會顯示在這裡。"}
            </p>
            <div className="mt-3">
              <BroadcastPill type={form.broadcast_type} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GiftImage({
  imageUrl,
  icon,
  name,
}: {
  imageUrl: string | null;
  icon: string | null;
  name: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className="h-20 w-20 shrink-0 object-contain"
      />
    );
  }

  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white text-4xl shadow-sm">
      {icon || "🎁"}
    </div>
  );
}

function BroadcastPill({ type }: { type: BroadcastType }) {
  if (type === "fullscreen") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-black text-amber-700">
        <Sparkles className="h-3 w-3" />
        全屏播報
      </span>
    );
  }

  if (type === "banner") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-[11px] font-black text-violet-700">
        <Sparkles className="h-3 w-3" />
        小播報
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-[11px] font-black text-slate-500">
      不播報
    </span>
  );
}

function GiftStat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur-xl">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700 [&_svg]:h-5 [&_svg]:w-5">
        {icon}
      </div>
      <p className="text-2xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function AccessCard({
  icon,
  title,
  desc,
  buttonText,
  buttonHref,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  buttonText: string;
  buttonHref: string;
}) {
  return (
    <main className="min-h-screen bg-[#f7f3ec] px-4 py-16 text-slate-950">
      <section className="mx-auto max-w-xl rounded-[2rem] border border-white/70 bg-white/80 p-8 text-center shadow-xl backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
          {icon}
        </div>

        <p className="text-sm font-bold text-violet-600">ADMIN GIFTS</p>
        <h1 className="mt-2 text-3xl font-black">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-slate-500">{desc}</p>

        <a
          href={buttonHref}
          className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 font-bold text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500"
        >
          {buttonText}
          <ArrowRight className="h-5 w-5" />
        </a>
      </section>
    </main>
  );
}
