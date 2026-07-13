"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("登入處理中...");

  useEffect(() => {
    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const requestedNext = params.get("next") || "/";
      const next =
        requestedNext.startsWith("/") && !requestedNext.startsWith("//")
          ? requestedNext
          : "/";
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setMessage("登入失敗：" + error.message);
          return;
        }
      } else {
        const { error } = await supabase.auth.getSession();

        if (error) {
          setMessage("登入失敗：" + error.message);
          return;
        }
      }

      window.location.href = next;
    }

    handleCallback();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1020] px-4 text-white">
      <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-8 text-center">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-violet-300" />
        <p className="text-sm text-slate-300">{message}</p>
      </div>
    </main>
  );
}
