"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  Mail,
  Lock,
  LogIn,
  UserPlus,
  Gamepad2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

type Mode = "login" | "register";
type OAuthProvider = "google" | "discord" | "facebook";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return email.trim().length > 3 && password.length >= 6 && !loading;
  }, [email, password, loading]);

  function getNextPath() {
    if (typeof window === "undefined") return "/";
    const params = new URLSearchParams(window.location.search);
    return params.get("next") || "/";
  }

  async function loginWithOAuth(provider: OAuthProvider) {
    setError("");
    setMessage("");
    setOauthLoading(provider);

    const next = getNextPath();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      next
    )}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        scopes: provider === "facebook" ? "public_profile" : undefined,
      },
    });

    if (error) {
      setOauthLoading(null);
      setError("登入失敗：" + error.message);
    }
  }

  async function handleSubmit() {
    setError("");
    setMessage("");

    if (!canSubmit) {
      setError("請輸入 Email，密碼至少 6 碼。");
      return;
    }

    setLoading(true);

    if (mode === "register") {
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(
            getNextPath()
          )}`,
          data: {
            role: "customer",
          },
        },
      });

      setLoading(false);

      if (signUpError) {
        setError("註冊失敗：" + signUpError.message);
        return;
      }

      setMessage("註冊成功！如果有開信箱驗證，請先到信箱點驗證連結。");
      return;
    }

    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (loginError) {
      setError("登入失敗：" + loginError.message);
      return;
    }

    window.location.href = getNextPath();
  }

  return (
    <main className="min-h-screen bg-[#0b1020] px-4 py-10 text-white">
      <section className="mx-auto flex min-h-[80vh] max-w-md items-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/[0.06] p-7 shadow-2xl">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20 text-violet-200">
              <Gamepad2 className="h-7 w-7" />
            </div>

            <p className="text-sm text-violet-200">深夜不關燈陪玩平台</p>
            <h1 className="mt-2 text-3xl font-bold">
              {mode === "login" ? "會員登入" : "註冊普通會員"}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              一般會員可以儲值、下單、進語音廳；想成為陪玩師可以登入後申請。
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 rounded-2xl bg-black/25 p-1">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError("");
                setMessage("");
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                mode === "login"
                  ? "bg-violet-500 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              登入
            </button>

            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError("");
                setMessage("");
              }}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                mode === "register"
                  ? "bg-violet-500 text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              註冊
            </button>
          </div>

          {error && (
            <div className="mb-5 flex gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 p-4 text-sm text-red-100">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {message && (
            <div className="mb-5 flex gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{message}</p>
            </div>
          )}

          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => loginWithOAuth("google")}
              disabled={!!oauthLoading}
              className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 font-semibold text-white transition hover:border-violet-300/60 hover:bg-violet-500/10 disabled:opacity-60"
            >
              {oauthLoading === "google" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm font-bold text-slate-900">
                  G
                </span>
              )}
              使用 Gmail / Google 登入
            </button>

            <button
              type="button"
              onClick={() => loginWithOAuth("discord")}
              disabled={!!oauthLoading}
              className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 font-semibold text-white transition hover:border-violet-300/60 hover:bg-violet-500/10 disabled:opacity-60"
            >
              {oauthLoading === "discord" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-xs font-bold text-white">
                  D
                </span>
              )}
              使用 Discord 登入
            </button>

            <button
              type="button"
              onClick={() => loginWithOAuth("facebook")}
              disabled={!!oauthLoading}
              className="flex items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 font-semibold text-white transition hover:border-violet-300/60 hover:bg-violet-500/10 disabled:opacity-60"
            >
              {oauthLoading === "facebook" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  f
                </span>
              )}
              使用 Facebook 登入
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs text-slate-500">或使用 Email</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid gap-4">
            <label className="block">
              <span className="text-sm text-slate-300">Email</span>
              <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-black/25 px-4 focus-within:border-violet-300">
                <Mail className="h-5 w-5 text-slate-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="your@email.com"
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-500"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm text-slate-300">密碼</span>
              <div className="mt-2 flex items-center rounded-2xl border border-white/10 bg-black/25 px-4 focus-within:border-violet-300">
                <Lock className="h-5 w-5 text-slate-400" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="至少 6 碼"
                  className="w-full bg-transparent px-3 py-3 text-sm outline-none placeholder:text-slate-500"
                />
              </div>
            </label>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
              className="mt-2 flex items-center justify-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  處理中...
                </>
              ) : mode === "login" ? (
                <>
                  <LogIn className="h-5 w-5" />
                  登入
                </>
              ) : (
                <>
                  <UserPlus className="h-5 w-5" />
                  註冊普通會員
                </>
              )}
            </button>
          </div>

          <a
            href="/apply-player"
            className="mt-6 block text-center text-sm text-violet-200 underline-offset-4 hover:underline"
          >
            想成為陪玩師？登入後前往申請
          </a>
        </div>
      </section>
    </main>
  );
}