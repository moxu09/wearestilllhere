"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Edit3,
  Loader2,
  Mail,
  Package,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Trophy,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  siteContentTypes,
  type SiteContentItem,
  type SiteContentType,
} from "@/lib/siteContent";
import AdminManager from "./AdminManager";

const typeDetails: Record<
  SiteContentType,
  { label: string; description: string; icon: typeof Sparkles }
> = {
  activity: { label: "活動內容", description: "首頁活動、抽獎辦法與權責說明", icon: Sparkles },
  prize: { label: "獎品內容", description: "活動獎品名稱與圖片", icon: Trophy },
  merchandise: { label: "周邊商品", description: "販售商品、價格與購買連結", icon: Package },
  contact: { label: "聯絡方式", description: "社群、客服信箱與其他聯絡管道", icon: Mail },
};

type FormState = {
  id: string | null;
  content_type: SiteContentType;
  title: string;
  subtitle: string;
  description: string;
  responsibility_note: string;
  image_url: string;
  link_url: string;
  price: string;
  sort_order: string;
  is_active: boolean;
};

function emptyForm(type: SiteContentType): FormState {
  return {
    id: null,
    content_type: type,
    title: "",
    subtitle: "",
    description: "",
    responsibility_note: "",
    image_url: "",
    link_url: "",
    price: "",
    sort_order: "0",
    is_active: true,
  };
}

export default function SiteContentAdminPage() {
  const [activeType, setActiveType] = useState<SiteContentType>("activity");
  const [items, setItems] = useState<SiteContentItem[]>([]);
  const [form, setForm] = useState<FormState>(() => emptyForm("activity"));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [authState, setAuthState] = useState<"checking" | "ready" | "signed-out">("checking");

  const callApi = useCallback(async (path: string, init?: RequestInit) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setAuthState("signed-out");
      throw new Error("請先登入管理後台");
    }
    setAuthState("ready");
    const response = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });
    const payload = (await response.json()) as { error?: string; items?: SiteContentItem[]; item?: SiteContentItem };
    if (!response.ok) throw new Error(payload.error || "操作失敗");
    return payload;
  }, []);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await callApi("/api/admin/site-content");
      let loadedItems = payload.items || [];

      if (loadedItems.length === 0) {
        const publicResponse = await fetch("/api/site-content?refresh=1", {
          cache: "no-store",
        });
        const publicPayload = (await publicResponse.json()) as {
          items?: SiteContentItem[];
        };

        if (publicResponse.ok && publicPayload.items?.length) {
          loadedItems = publicPayload.items;
        }
      }

      setItems(loadedItems);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "讀取內容失敗");
    } finally {
      setLoading(false);
    }
  }, [callApi]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadItems(), 0);
    return () => window.clearTimeout(timer);
  }, [loadItems]);

  const visibleItems = useMemo(
    () => items.filter((item) => item.content_type === activeType),
    [activeType, items],
  );

  function selectType(type: SiteContentType) {
    setActiveType(type);
    setForm(emptyForm(type));
    setError("");
    setMessage("");
  }

  function editItem(item: SiteContentItem) {
    setActiveType(item.content_type);
    setForm({
      id: item.id,
      content_type: item.content_type,
      title: item.title,
      subtitle: item.subtitle || "",
      description: item.description || "",
      responsibility_note: item.responsibility_note || "",
      image_url: item.image_url || "",
      link_url: item.link_url || "",
      price: item.price === null ? "" : String(item.price),
      sort_order: String(item.sort_order),
      is_active: item.is_active,
    });
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("請輸入標題或名稱");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await callApi("/api/admin/site-content", {
        method: form.id ? "PATCH" : "POST",
        body: JSON.stringify(form),
      });
      setMessage(form.id ? "內容已更新" : "內容已新增");
      setForm(emptyForm(activeType));
      await loadItems();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(item: SiteContentItem) {
    if (!window.confirm(`確定要刪除「${item.title}」嗎？刪除後無法復原。`)) return;
    setDeletingId(item.id);
    setError("");
    setMessage("");
    try {
      await callApi(`/api/admin/site-content?id=${encodeURIComponent(item.id)}`, { method: "DELETE" });
      if (form.id === item.id) setForm(emptyForm(activeType));
      setMessage("內容已刪除");
      await loadItems();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "刪除失敗");
    } finally {
      setDeletingId(null);
    }
  }

  if (authState === "signed-out" && !loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0d0e10] px-5 text-white">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
          <h1 className="text-2xl font-bold">請先登入內容管理後台</h1>
          <p className="mt-3 text-sm leading-6 text-white/55">登入既有管理員或客服帳號後，就能新增、修改與刪除官網內容。</p>
          <Link href="/login?next=/admin/content" className="mt-6 inline-flex rounded-lg bg-[#e7ba67] px-5 py-3 text-sm font-bold text-[#111214]">前往登入</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0d0e10] px-5 py-8 text-white sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 border-b border-white/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-bold text-white/45 hover:text-white"><ArrowLeft className="h-4 w-4" /> 返回管理首頁</Link>
            <p className="mt-8 text-xs font-bold uppercase text-[#5bd6d0]">Website content</p>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">官網內容管理</h1>
            <p className="mt-3 text-sm text-white/50">更新後會直接套用到公開官網，不需要修改程式。</p>
          </div>
          <a href="/" target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-lg border border-white/15 px-5 text-sm font-bold hover:border-white/40">預覽官網</a>
        </header>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {siteContentTypes.map((type) => {
            const details = typeDetails[type];
            const Icon = details.icon;
            const count = items.filter((item) => item.content_type === type).length;
            return (
              <button key={type} type="button" onClick={() => selectType(type)} className={`rounded-xl border p-5 text-left transition ${activeType === type ? "border-[#e7ba67] bg-[#e7ba67]/10" : "border-white/10 bg-white/[0.03] hover:border-white/25"}`}>
                <div className="flex items-center justify-between"><Icon className="h-5 w-5 text-[#e7ba67]" /><span className="text-xs text-white/35">{count} 筆</span></div>
                <p className="mt-5 font-bold">{details.label}</p>
                <p className="mt-2 text-xs leading-5 text-white/40">{details.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <form onSubmit={saveItem} className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 lg:sticky lg:top-8">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-xs font-bold text-[#5bd6d0]">{typeDetails[activeType].label}</p><h2 className="mt-2 text-xl font-bold">{form.id ? "編輯內容" : "新增內容"}</h2></div>
              {form.id ? <button type="button" onClick={() => setForm(emptyForm(activeType))} className="text-xs font-bold text-white/45 hover:text-white">取消編輯</button> : <Plus className="h-5 w-5 text-white/30" />}
            </div>

            <div className="mt-6 grid gap-4">
              <Field label={activeType === "merchandise" ? "商品名稱 *" : "標題／名稱 *"} value={form.title} onChange={(value) => setForm((current) => ({ ...current, title: value }))} />
              <Field label="副標題" value={form.subtitle} onChange={(value) => setForm((current) => ({ ...current, subtitle: value }))} placeholder={activeType === "contact" ? "例如：金流問題專用" : undefined} />
              <label className="grid gap-2 text-sm font-semibold text-white/70">內容說明<textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={4} className="rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-white outline-none focus:border-[#e7ba67]" /></label>
              {activeType === "activity" && (
                <label className="grid gap-2 text-sm font-semibold text-white/70">
                  權責說明
                  <textarea
                    value={form.responsibility_note}
                    onChange={(event) => setForm((current) => ({ ...current, responsibility_note: event.target.value }))}
                    rows={4}
                    placeholder="例如：主辦單位保留活動內容調整、變更及最終解釋之權利。"
                    className="rounded-lg border border-white/10 bg-black/25 px-4 py-3 text-white outline-none placeholder:text-white/20 focus:border-[#e7ba67]"
                  />
                </label>
              )}
              {(activeType === "prize" || activeType === "merchandise" || activeType === "activity") && <Field label="圖片網址" value={form.image_url} onChange={(value) => setForm((current) => ({ ...current, image_url: value }))} placeholder="https://... 或 /images/..." />}
              {(activeType === "merchandise" || activeType === "contact" || activeType === "activity") && <Field label={activeType === "contact" ? "聯絡連結／mailto 信箱" : "連結網址"} value={form.link_url} onChange={(value) => setForm((current) => ({ ...current, link_url: value }))} placeholder={activeType === "contact" ? "mailto:name@example.com 或 https://..." : "https://..."} />}
              <div className="grid gap-4 sm:grid-cols-2">
                {activeType === "merchandise" && <Field label="售價（元）" type="number" value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} />}
                <Field label="排序（小的在前）" type="number" value={form.sort_order} onChange={(value) => setForm((current) => ({ ...current, sort_order: value }))} />
              </div>
              <label className="flex items-center gap-3 rounded-lg border border-white/10 px-4 py-3 text-sm font-semibold text-white/70"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} className="h-4 w-4 accent-[#e7ba67]" /> 顯示在公開官網</label>
            </div>

            {error && <p className="mt-5 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
            {message && <p className="mt-5 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p>}
            <button type="submit" disabled={saving} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#e7ba67] text-sm font-bold text-[#111214] disabled:cursor-not-allowed disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{form.id ? "儲存修改" : "新增內容"}</button>
          </form>

          <section>
            <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold text-[#e7ba67]">目前內容</p><h2 className="mt-2 text-2xl font-bold">{typeDetails[activeType].label}</h2></div><span className="text-xs text-white/35">共 {visibleItems.length} 筆</span></div>
            {loading ? <div className="mt-6 grid min-h-48 place-items-center rounded-2xl border border-white/10"><Loader2 className="h-6 w-6 animate-spin text-[#e7ba67]" /></div> : visibleItems.length === 0 ? <div className="mt-6 rounded-2xl border border-dashed border-white/15 p-10 text-center text-sm text-white/40">目前沒有內容，請從左側新增第一筆。</div> : <div className="mt-6 grid gap-4">{visibleItems.map((item) => <article key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] p-5"><div className="flex gap-4">{item.image_url && <div className="h-20 w-24 shrink-0 rounded-lg bg-cover bg-center bg-white/10" style={{ backgroundImage: `url(${JSON.stringify(item.image_url).slice(1, -1)})` }} />}<div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{item.title}</h3><span className={`rounded-full px-2 py-1 text-[10px] font-bold ${item.is_active ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/35"}`}>{item.is_active ? "顯示中" : "已隱藏"}</span></div>{item.subtitle && <p className="mt-2 text-xs text-[#5bd6d0]">{item.subtitle}</p>}{item.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/45">{item.description}</p>}{activeType === "activity" && item.responsibility_note && <p className="mt-3 line-clamp-3 border-l-2 border-[#e7ba67]/45 pl-3 text-xs leading-5 text-white/40"><span className="font-bold text-[#e7ba67]">權責說明：</span>{item.responsibility_note}</p>}{item.price !== null && <p className="mt-3 font-bold text-[#e7ba67]">NT$ {Number(item.price).toLocaleString("zh-TW")}</p>}<p className="mt-3 text-[11px] text-white/25">排序 {item.sort_order}</p></div></div><div className="mt-5 flex justify-end gap-2 border-t border-white/10 pt-4"><button type="button" onClick={() => editItem(item)} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-xs font-bold hover:border-white/40"><Edit3 className="h-3.5 w-3.5" /> 編輯</button><button type="button" onClick={() => void deleteItem(item)} disabled={deletingId === item.id} className="inline-flex items-center gap-2 rounded-lg border border-red-400/25 px-4 py-2 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50">{deletingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} 刪除</button></div></article>)}</div>}
          </section>
        </div>

        <AdminManager />
      </div>
    </main>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: "text" | "number" }) {
  return <label className="grid gap-2 text-sm font-semibold text-white/70">{label}<input type={type} min={type === "number" ? 0 : undefined} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-11 rounded-lg border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-white/20 focus:border-[#e7ba67]" /></label>;
}
