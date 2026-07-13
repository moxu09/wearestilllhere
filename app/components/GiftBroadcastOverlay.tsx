"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Crown, Sparkles, X } from "lucide-react";

type GlobalBroadcast = {
  id: string;
  source_type?: string;
  source_id?: string | null;
  title: string;
  subtitle: string | null;
  body: string | null;
  icon: string | null;
  amount: number;
  sender_name: string | null;
  receiver_name: string | null;
  theme?: "lantern_luxury" | "gold_firework" | "violet_star";
  display_type: "fullscreen" | "banner";
  duration_seconds: number;
  is_active: boolean;
  created_at: string;
};

export default function GiftBroadcastOverlay() {
  const [current, setCurrent] = useState<GlobalBroadcast | null>(null);
  const [visible, setVisible] = useState(false);

  const shownIdsRef = useRef<Set<string>>(new Set());
  const closeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkLatestBroadcast();

    const channel = supabase
      .channel("platform-global-broadcasts-animation")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "platform_global_broadcasts",
        },
        (payload) => {
          showBroadcast(payload.new as GlobalBroadcast, true);
        }
      )
      .subscribe();

    pollTimerRef.current = setInterval(() => {
      checkLatestBroadcast();
    }, 2000);

    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      supabase.removeChannel(channel);
    };
    // The realtime subscription and polling loop intentionally share one lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function checkLatestBroadcast() {
    const tenMinutesAgo = new Date(Date.now() - 1000 * 60 * 10).toISOString();

    const { data, error } = await supabase
      .from("platform_global_broadcasts")
      .select(
        `
        id,
        source_type,
        source_id,
        title,
        subtitle,
        body,
        icon,
        amount,
        sender_name,
        receiver_name,
        theme,
        display_type,
        duration_seconds,
        is_active,
        created_at
      `
      )
      .eq("is_active", true)
      .gte("created_at", tenMinutesAgo)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn("[GlobalBroadcast] read failed:", error.message);
      return;
    }

    if (!data) return;

    showBroadcast(data as GlobalBroadcast);
  }

  function showBroadcast(broadcast: GlobalBroadcast, force = false) {
    if (!broadcast?.id) return;
    if (!broadcast.is_active) return;

    if (!force && shownIdsRef.current.has(broadcast.id)) return;

    shownIdsRef.current.add(broadcast.id);
    setCurrent(broadcast);

    window.setTimeout(() => {
      setVisible(true);
    }, 80);

    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);

    closeTimerRef.current = setTimeout(() => {
      closeBroadcast();
    }, Math.max(broadcast.duration_seconds || 12, 6) * 1000);
  }

  function closeBroadcast() {
    setVisible(false);

    window.setTimeout(() => {
      setCurrent(null);
    }, 700);
  }

  if (!current) return null;

  return (
    <div
      className={`fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden bg-[#03020a] px-4 transition-opacity duration-700 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.22),transparent_34%),radial-gradient(circle_at_18%_22%,rgba(217,70,239,0.26),transparent_34%),radial-gradient(circle_at_82%_28%,rgba(124,58,237,0.3),transparent_34%),radial-gradient(circle_at_50%_100%,rgba(251,191,36,0.16),transparent_42%)]" />

        <div className="absolute left-1/2 top-1/2 h-[980px] w-[980px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/10 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 animate-[luxuryPulseRing_2.2s_ease-in-out_infinite] rounded-full border border-amber-200/25" />
        <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 animate-[luxuryPulseRing_2.8s_ease-in-out_infinite] rounded-full border border-fuchsia-200/20" />
        <div className="absolute left-1/2 top-1/2 h-[860px] w-[860px] -translate-x-1/2 -translate-y-1/2 animate-[luxuryPulseRing_3.4s_ease-in-out_infinite] rounded-full border border-violet-200/15" />

        {Array.from({ length: 42 }).map((_, index) => (
          <span
            key={`lantern-${index}`}
            className="absolute animate-[luxuryLanternFloat_8s_linear_infinite] text-3xl opacity-80"
            style={{
              left: `${(index * 31) % 100}%`,
              bottom: `-${40 + ((index * 17) % 150)}px`,
              animationDelay: `${(index * 0.21) % 6}s`,
              animationDuration: `${7 + (index % 6)}s`,
            }}
          >
            🏮
          </span>
        ))}

        {Array.from({ length: 120 }).map((_, index) => (
          <span
            key={`gold-rain-${index}`}
            className="absolute h-1.5 w-1.5 animate-[luxuryGoldRain_4.8s_linear_infinite] rounded-full bg-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.95)]"
            style={{
              left: `${(index * 13) % 100}%`,
              top: `-${(index * 7) % 140}px`,
              animationDelay: `${(index * 0.06) % 4}s`,
              animationDuration: `${3.2 + (index % 5)}s`,
            }}
          />
        ))}

        {Array.from({ length: 28 }).map((_, index) => (
          <span
            key={`firework-${index}`}
            className="absolute h-2 w-2 animate-[luxuryFireworkPop_2.9s_ease-out_infinite] rounded-full bg-fuchsia-300 shadow-[0_0_28px_rgba(244,114,182,0.95)]"
            style={{
              left: `${7 + ((index * 37) % 86)}%`,
              top: `${7 + ((index * 29) % 78)}%`,
              animationDelay: `${(index * 0.17) % 2.8}s`,
            }}
          />
        ))}

        {Array.from({ length: 14 }).map((_, index) => (
          <span
            key={`beam-${index}`}
            className="absolute left-1/2 top-1/2 h-[140vh] w-1 origin-top animate-[luxurySpinBeam_10s_linear_infinite] bg-gradient-to-b from-amber-200/0 via-amber-200/35 to-transparent blur-sm"
            style={{
              transform: `rotate(${index * 25.7}deg)`,
              animationDelay: `${index * 0.11}s`,
            }}
          />
        ))}

        {Array.from({ length: 18 }).map((_, index) => (
          <span
            key={`star-${index}`}
            className="absolute animate-[luxuryStarBurst_3.2s_ease-in-out_infinite] text-2xl text-amber-100"
            style={{
              left: `${5 + ((index * 41) % 90)}%`,
              top: `${8 + ((index * 23) % 82)}%`,
              animationDelay: `${(index * 0.19) % 3}s`,
            }}
          >
            ✦
          </span>
        ))}
      </div>

      <button
        onClick={closeBroadcast}
        className="absolute right-5 top-5 z-20 rounded-full border border-white/10 bg-white/10 p-3 text-white/70 backdrop-blur transition hover:bg-white/20 hover:text-white"
      >
        <X className="h-5 w-5" />
      </button>

      <section
        className={`relative z-10 mx-auto max-w-5xl text-center transition-all duration-700 ${
          visible
            ? "scale-100 translate-y-0 opacity-100"
            : "scale-90 translate-y-10 opacity-0"
        }`}
      >
        <div className="mx-auto mb-7 inline-flex animate-[luxuryTitleDrop_1s_ease-out_both] items-center gap-3 rounded-full border border-amber-200/40 bg-white/10 px-6 py-3 text-sm font-black tracking-[0.25em] text-amber-100 shadow-[0_0_45px_rgba(251,191,36,0.25)] backdrop-blur-xl">
          <Sparkles className="h-4 w-4" />
          全平台放送
          <Sparkles className="h-4 w-4" />
        </div>

        <div className="mx-auto mb-9 flex justify-center">
          <div className="relative h-60 w-60 md:h-80 md:w-80">
            <div className="absolute inset-[-42px] animate-[luxuryGlowSpin_4s_linear_infinite] rounded-full bg-gradient-to-r from-amber-300 via-fuchsia-300 to-violet-400 opacity-80 blur-2xl" />
            <div className="absolute inset-[-18px] animate-[luxuryCoreBreath_1.8s_ease-in-out_infinite] rounded-full border border-amber-200/40 bg-amber-200/5" />

            <div className="relative flex h-full w-full items-center justify-center rounded-[4rem] border border-amber-200/30 bg-white/10 shadow-[0_0_80px_rgba(251,191,36,0.6)] backdrop-blur-xl">
              <div className="absolute inset-8 animate-[luxuryCoreBreath_1.5s_ease-in-out_infinite] rounded-full bg-gradient-to-br from-amber-300/40 via-fuchsia-300/20 to-violet-400/30 blur-xl" />

              <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-amber-100/70 bg-gradient-to-br from-amber-300 via-yellow-100 to-fuchsia-200 text-8xl shadow-[0_0_80px_rgba(251,191,36,0.95)] md:h-52 md:w-52 md:text-9xl">
                {current.icon || "🏮"}
              </div>

              <div className="absolute -bottom-5 rounded-full border border-amber-200/40 bg-black/35 px-6 py-2 text-xs font-black tracking-[0.35em] text-amber-100 backdrop-blur">
                LUXURY GIFT
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mb-5 inline-flex animate-[luxuryAmountPop_0.9s_ease-out_both] items-center gap-2 rounded-full bg-amber-300 px-5 py-2 text-sm font-black text-slate-950 shadow-[0_0_35px_rgba(251,191,36,0.8)]">
          <Crown className="h-4 w-4" />
          {current.amount.toLocaleString()} ASD
        </div>

        <h1 className="animate-[luxuryNameShine_1.1s_ease-out_both] bg-gradient-to-r from-amber-100 via-white to-fuchsia-100 bg-clip-text text-5xl font-black leading-tight text-transparent drop-shadow-[0_0_32px_rgba(251,191,36,0.4)] md:text-8xl">
          {current.title}
        </h1>

        <p className="mx-auto mt-6 max-w-4xl animate-[luxuryFadeUp_1s_ease-out_0.2s_both] text-xl font-black leading-10 text-white md:text-3xl">
          <span className="text-amber-200">
            {current.sender_name || "神秘會員"}
          </span>
          <span className="mx-3 text-white/70">送給</span>
          <span className="text-fuchsia-200">
            {current.receiver_name || "陪玩師"}
          </span>
        </p>

        <div className="mx-auto mt-7 max-w-3xl animate-[luxuryFadeUp_1s_ease-out_0.35s_both] rounded-[2rem] border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl">
          <p className="text-sm leading-8 text-white/75 md:text-base">
            {current.body || "明燈三千，滿天星火只為你點亮。"}
          </p>
        </div>
      </section>

      <style jsx global>{`
        @keyframes luxuryLanternFloat {
          0% {
            transform: translateY(0) scale(0.68) rotate(-8deg);
            opacity: 0;
          }
          12% {
            opacity: 0.9;
          }
          55% {
            transform: translateY(-62vh) scale(1) rotate(8deg);
          }
          100% {
            transform: translateY(-125vh) scale(1.2) rotate(-5deg);
            opacity: 0;
          }
        }

        @keyframes luxuryGoldRain {
          0% {
            transform: translateY(-20vh) rotate(0deg);
            opacity: 0;
          }
          12% {
            opacity: 0.95;
          }
          100% {
            transform: translateY(125vh) rotate(260deg);
            opacity: 0;
          }
        }

        @keyframes luxuryFireworkPop {
          0% {
            transform: scale(0);
            opacity: 0;
            box-shadow: 0 0 0 rgba(244, 114, 182, 0);
          }
          35% {
            transform: scale(1);
            opacity: 1;
            box-shadow:
              0 0 18px rgba(251, 191, 36, 0.9),
              20px 0 22px rgba(244, 114, 182, 0.85),
              -20px 0 22px rgba(196, 181, 253, 0.85),
              0 20px 22px rgba(253, 224, 71, 0.85),
              0 -20px 22px rgba(216, 180, 254, 0.85);
          }
          100% {
            transform: scale(3.6);
            opacity: 0;
            box-shadow:
              0 0 30px rgba(251, 191, 36, 0),
              80px 0 44px rgba(244, 114, 182, 0),
              -80px 0 44px rgba(196, 181, 253, 0),
              0 80px 44px rgba(253, 224, 71, 0),
              0 -80px 44px rgba(216, 180, 254, 0);
          }
        }

        @keyframes luxuryPulseRing {
          0%,
          100% {
            transform: translate(-50%, -50%) scale(0.9);
            opacity: 0.25;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.85;
          }
        }

        @keyframes luxurySpinBeam {
          0% {
            transform: rotate(0deg);
            opacity: 0.22;
          }
          50% {
            opacity: 0.58;
          }
          100% {
            transform: rotate(360deg);
            opacity: 0.22;
          }
        }

        @keyframes luxuryGlowSpin {
          0% {
            transform: rotate(0deg) scale(0.95);
          }
          50% {
            transform: rotate(180deg) scale(1.08);
          }
          100% {
            transform: rotate(360deg) scale(0.95);
          }
        }

        @keyframes luxuryCoreBreath {
          0%,
          100% {
            transform: scale(0.92);
            opacity: 0.55;
          }
          50% {
            transform: scale(1.12);
            opacity: 1;
          }
        }

        @keyframes luxuryStarBurst {
          0%,
          100% {
            transform: scale(0.5) rotate(0deg);
            opacity: 0.25;
          }
          50% {
            transform: scale(1.7) rotate(180deg);
            opacity: 1;
          }
        }

        @keyframes luxuryTitleDrop {
          0% {
            transform: translateY(-24px) scale(0.94);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        @keyframes luxuryAmountPop {
          0% {
            transform: scale(0.7);
            opacity: 0;
          }
          70% {
            transform: scale(1.08);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes luxuryNameShine {
          0% {
            transform: translateY(20px) scale(0.96);
            opacity: 0;
            filter: blur(8px);
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
            filter: blur(0);
          }
        }

        @keyframes luxuryFadeUp {
          0% {
            transform: translateY(18px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
