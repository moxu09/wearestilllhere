"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, ShieldCheck, Trash2, UserPlus, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

type SiteAdmin = {
  id: string;
  display_name: string | null;
  email: string | null;
  updated_at: string | null;
};

type AdminPayload = {
  error?: string;
  admins?: SiteAdmin[];
  currentUserId?: string;
};

export default function AdminManager() {
  const [admins, setAdmins] = useState<SiteAdmin[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [forbidden, setForbidden] = useState(false);

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("請先登入管理後台");
    const response = await fetch(path, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...init?.headers,
      },
    });
    const payload = (await response.json()) as AdminPayload;
    if (response.status === 403) setForbidden(true);
    if (!response.ok) throw new Error(payload.error || "操作失敗");
    return payload;
  }, []);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await request("/api/admin/site-admins");
      setAdmins(payload.admins || []);
      setCurrentUserId(payload.currentUserId || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "讀取管理員失敗");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadAdmins(), 0);
    return () => window.clearTimeout(timer);
  }, [loadAdmins]);

  async function addAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      await request("/api/admin/site-admins", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setEmail("");
      setMessage("管理員已新增");
      await loadAdmins();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : "新增管理員失敗");
    } finally {
      setSaving(false);
    }
  }

  async function removeAdmin(admin: SiteAdmin) {
    if (!window.confirm(`確定要移除「${admin.display_name || admin.email || "此帳號"}」的管理員權限嗎？`)) return;
    setRemovingId(admin.id);
    setError("");
    setMessage("");
    try {
      await request(`/api/admin/site-admins?id=${encodeURIComponent(admin.id)}`, { method: "DELETE" });
      setMessage("管理員權限已移除，會員帳號仍會保留");
      await loadAdmins();
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : "移除管理員失敗");
    } finally {
      setRemovingId(null);
    }
  }

  if (forbidden) return null;

  return (
    <section className="mt-10 border-t border-white/10 pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase text-[#5bd6d0]"><ShieldCheck className="h-4 w-4" /> Admin access</p>
          <h2 className="mt-3 text-2xl font-bold">管理員管理</h2>
          <p className="mt-3 text-sm leading-6 text-white/45">只有現有管理員能新增或移除管理權限；移除權限不會刪除會員帳號。</p>
        </div>
        <span className="inline-flex items-center gap-2 text-xs text-white/35"><Users className="h-4 w-4" /> 共 {admins.length} 位</span>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <form onSubmit={addAdmin} className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
          <h3 className="font-bold">新增管理員</h3>
          <p className="mt-2 text-xs leading-5 text-white/40">對方必須先用同一個 Email 註冊或登入官網一次。</p>
          <label className="mt-5 grid gap-2 text-sm font-semibold text-white/70">帳號 Email<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="h-11 rounded-lg border border-white/10 bg-black/25 px-4 text-white outline-none placeholder:text-white/20 focus:border-[#e7ba67]" /></label>
          <button type="submit" disabled={saving || !email.trim()} className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#e7ba67] text-sm font-bold text-[#111214] disabled:cursor-not-allowed disabled:opacity-50">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} 新增管理員</button>
          {error && <p className="mt-4 rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
          {message && <p className="mt-4 rounded-lg border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-200">{message}</p>}
        </form>

        <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">
          <h3 className="font-bold">目前管理員</h3>
          {loading ? <div className="grid min-h-32 place-items-center"><Loader2 className="h-5 w-5 animate-spin text-[#e7ba67]" /></div> : <div className="mt-4 grid gap-3">{admins.map((admin) => {
            const isCurrent = admin.id === currentUserId;
            return <div key={admin.id} className="flex flex-col gap-4 rounded-xl border border-white/10 bg-black/15 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-bold">{admin.display_name || "未設定名稱"}</p>{isCurrent && <span className="rounded-full bg-[#5bd6d0]/15 px-2 py-1 text-[10px] font-bold text-[#5bd6d0]">目前帳號</span>}</div><p className="mt-1 truncate text-xs text-white/40">{admin.email || "尚未取得 Email"}</p></div><button type="button" disabled={isCurrent || removingId === admin.id || admins.length <= 1} onClick={() => void removeAdmin(admin)} title={isCurrent ? "不能移除自己的權限" : admins.length <= 1 ? "至少要保留一位管理員" : "移除管理員權限"} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-400/25 px-3 text-xs font-bold text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30">{removingId === admin.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />} 移除權限</button></div>;
          })}</div>}
        </div>
      </div>
    </section>
  );
}

