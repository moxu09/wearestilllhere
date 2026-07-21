"use client";

import Image from "next/image";
import { LoaderCircle, Users } from "lucide-react";
import { useEffect, useState } from "react";

type ThanksMember = {
  id: string;
  name: string;
  avatarUrl: string;
};

export default function ThanksWall() {
  const [members, setMembers] = useState<ThanksMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/thanks", { signal: controller.signal })
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "名單載入失敗");
        setMembers(payload.members || []);
      })
      .catch((fetchError) => {
        if (fetchError.name !== "AbortError") setError(fetchError.message);
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  return (
    <section className="site-section border-t border-white/10 bg-[#090a0c] px-5 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div data-reveal className="grid gap-8 border-b border-white/10 pb-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase text-[#e7ba67]">
              Hall of gratitude · 1505307437597724762
            </p>
            <h2 className="home-title-font mt-4 text-3xl text-white sm:text-5xl">
              謝謝你，讓這盞燈一直亮著。
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-white/55 lg:justify-self-end lg:text-base">
            每一個名字，都是深夜不關燈走到這裡的一部分。感謝願意支持、陪伴，並和我們一起把這個地方變得更好的人。
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-44 items-center justify-center gap-3 text-sm text-white/50">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            正在點亮感謝名單
          </div>
        ) : error ? (
          <div className="flex min-h-44 items-center justify-center gap-3 text-sm text-white/50">
            <Users className="h-5 w-5 text-[#e7ba67]" />
            {error}
          </div>
        ) : members.length === 0 ? (
          <div className="flex min-h-44 items-center justify-center gap-3 text-sm text-white/50">
            <Users className="h-5 w-5 text-[#e7ba67]" />
            感謝名單正在整理中
          </div>
        ) : (
          <div className="grid grid-cols-2 border-l border-t border-white/10 sm:grid-cols-3 lg:grid-cols-5">
            {members.map((member) => (
              <div
                key={member.id}
                data-reveal
                className="interactive-card group flex min-w-0 items-center gap-3 border-b border-r border-white/10 p-4 hover:bg-white/[0.04] sm:p-5"
              >
                <Image
                  src={member.avatarUrl}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                  className="h-10 w-10 shrink-0 rounded-full border border-[#e7ba67]/40 object-cover grayscale transition group-hover:grayscale-0 sm:h-12 sm:w-12"
                />
                <p className="min-w-0 truncate text-sm font-bold text-white/75 group-hover:text-white">
                  {member.name}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
