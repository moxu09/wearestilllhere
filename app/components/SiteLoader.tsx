"use client";

import { useEffect, useState } from "react";

export default function SiteLoader() {
  const [loading, setLoading] = useState(true);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setHide(true);

      setTimeout(() => {
        setLoading(false);
      }, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex min-h-screen items-center justify-center overflow-hidden bg-[#08080c] text-white transition-opacity duration-500 ${
        hide ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute left-1/3 top-1/3 h-56 w-56 rounded-full bg-pink-500/10 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative flex flex-col items-center text-center">
        <div className="relative mb-8 flex h-28 w-28 items-center justify-center">
          <div className="absolute h-28 w-28 rounded-full border border-purple-300/20" />
          <div className="absolute h-28 w-28 animate-spin rounded-full border-2 border-transparent border-r-pink-300 border-t-purple-300" />
          <div className="absolute h-20 w-20 rounded-full bg-purple-300/20 blur-xl" />

          <img
            src="/loader-icon.png"
            alt="深夜不關燈"
            className="relative h-16 w-16 animate-pulse rounded-2xl object-cover shadow-[0_0_35px_rgba(216,180,254,0.75)]"
          />
        </div>

        <p className="mb-3 text-sm tracking-[0.35em] text-purple-200">
          WE ARE STILL HERE
        </p>

        <h1 className="text-3xl font-black tracking-tight md:text-5xl">
          深夜不關燈
        </h1>

        <p className="mt-4 text-sm text-zinc-400">
          正在為你點亮今晚的微光...
        </p>

        <div className="mt-8 flex gap-2">
          <span className="h-2 w-2 animate-bounce rounded-full bg-purple-300 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-pink-300 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-blue-300" />
        </div>
      </div>
    </div>
  );
}