"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function SiteLoader() {
  const pathname = usePathname();
  const firstLoadRef = useRef(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);

    const delay = firstLoadRef.current ? 1100 : 450;
    firstLoadRef.current = false;

    const timer = window.setTimeout(() => {
      setVisible(false);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [pathname]);

  return (
    <div
      className={`pointer-events-none fixed inset-0 z-[999999] flex items-center justify-center overflow-hidden bg-[#05050f] transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,204,0,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(0,186,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(126,34,206,0.35),transparent_35%)]" />

      <div className="absolute left-[16%] top-[24%] text-4xl text-yellow-300 drop-shadow-[0_0_18px_rgba(250,204,21,0.9)]">
        ✦
      </div>

      <div className="absolute right-[14%] top-[25%] text-2xl text-yellow-300/70">
        ✧
      </div>

      <div className="absolute bottom-[16%] left-[22%] text-3xl text-yellow-300/80">
        ✦
      </div>

      <div className="absolute bottom-[13%] right-[24%] text-4xl text-yellow-300/80">
        ✧
      </div>

      <section className="relative z-10 flex flex-col items-center">
        <div className="rounded-full border border-yellow-400/70 px-9 py-3 text-sm font-black tracking-[0.35em] text-yellow-300 shadow-[0_0_32px_rgba(250,204,21,0.25)]">
          深夜不關燈
        </div>

        <div className="relative mt-8">
          <div className="absolute inset-0 rounded-[2rem] bg-yellow-300/25 blur-2xl" />

          <div className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-[2rem] border border-yellow-400/80 bg-black/30 p-3 shadow-[0_0_42px_rgba(250,204,21,0.38)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icon.jpeg"
              alt="深夜不關燈"
              className="h-full w-full rounded-[1.5rem] object-cover"
            />
          </div>

          <div className="absolute -right-4 top-0 text-4xl text-yellow-300 drop-shadow-[0_0_15px_rgba(250,204,21,0.9)]">
            ✦
          </div>

          <div className="absolute -bottom-4 -right-3 text-4xl text-yellow-300 drop-shadow-[0_0_15px_rgba(250,204,21,0.9)]">
            ✦
          </div>
        </div>

        <p className="mt-10 text-lg font-black tracking-[0.2em] text-white/75">
          正在為你點亮深夜燈光...
        </p>

        <div className="mt-5 flex items-center gap-3">
          <span className="h-4 w-4 animate-bounce rounded-full bg-yellow-300 shadow-[0_0_18px_rgba(250,204,21,0.9)]" />
          <span className="h-4 w-4 animate-bounce rounded-full bg-yellow-400/70 shadow-[0_0_18px_rgba(250,204,21,0.6)] [animation-delay:140ms]" />
          <span className="h-4 w-4 animate-bounce rounded-full bg-yellow-500/50 shadow-[0_0_18px_rgba(250,204,21,0.4)] [animation-delay:280ms]" />
        </div>
      </section>
    </div>
  );
}