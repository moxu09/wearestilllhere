"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Gamepad2,
  Headphones,
  Loader2,
  Lock,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  UserRound,
} from "lucide-react";

type Player = {
  id: string;
  user_id: string;
  nickname: string;
  status: string;
  is_accepting_orders: boolean;
};

type ServiceCategory = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number | null;
  is_active: boolean | null;
};

type Service = {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  base_price: number | null;
  unit: string | null;
  is_active: boolean | null;
  sort_order: number | null;
};

type PlayerService = {
  id: string;
  player_id: string;
  service_id: string;
  custom_price: number | null;
  price_note: string | null;
  is_enabled: boolean;
};

type ServiceForm = {
  existed: boolean;
  is_enabled: boolean;
  custom_price: string;
  price_note: string;
};

export default function PlayerServicesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [settings, setSettings] = useState<Record<string, ServiceForm>>({});

  const [searchText, setSearchText] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const enabledCount = useMemo(() => {
    return Object.values(settings).filter((item) => item.is_enabled).length;
  }, [settings]);

  const visibleGroups = useMemo(() => {
    const keyword = searchText.trim().toLowerCase();

    const activeCategories = categories
      .filter((category) => category.is_active !== false)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const activeServices = services
      .filter((service) => service.is_active !== false)
      .filter((service) => {
        if (!keyword) return true;

        const text = [
          service.name,
          service.description,
          service.base_price?.toString(),
          service.unit,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return text.includes(keyword);
      })
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    const groups = activeCategories.map((category) => ({
      category,
      services: activeServices.filter(
        (service) => service.category_id === category.id
      ),
    }));

    const uncategorized = activeServices.filter(
      (service) =>
        !service.category_id ||
        !activeCategories.some((category) => category.id === service.category_id)
    );

    if (uncategorized.length > 0) {
      groups.push({
        category: {
          id: "uncategorized",
          name: "其他服務",
          description: "尚未分類的服務項目",
          sort_order: 9999,
          is_active: true,
        },
        services: uncategorized,
      });
    }

    return groups.filter((group) => group.services.length > 0);
  }, [categories, services, searchText]);

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
      setUserId(null);
      setLoading(false);
      return;
    }

    setUserId(user.id);

    const { data: playerData, error: playerError } = await supabase
      .from("platform_players")
      .select("id, user_id, nickname, status, is_accepting_orders")
      .eq("user_id", user.id)
      .maybeSingle();

    if (playerError) {
      setError("讀取陪玩師資料失敗：" + playerError.message);
      setLoading(false);
      return;
    }

    if (!playerData) {
      setPlayer(null);
      setLoading(false);
      return;
    }

    const currentPlayer = playerData as Player;
    setPlayer(currentPlayer);

    const [categoriesResult, servicesResult, playerServicesResult] =
      await Promise.all([
        supabase
          .from("platform_service_categories")
          .select("id, name, description, sort_order, is_active")
          .order("sort_order", { ascending: true }),

        supabase
          .from("platform_services")
          .select(
            "id, category_id, name, description, base_price, unit, is_active, sort_order"
          )
          .order("sort_order", { ascending: true }),

        supabase
          .from("platform_player_services")
          .select("id, player_id, service_id, custom_price, price_note, is_enabled")
          .eq("player_id", currentPlayer.id),
      ]);

    if (categoriesResult.error) {
      setError("讀取服務分類失敗：" + categoriesResult.error.message);
      setLoading(false);
      return;
    }

    if (servicesResult.error) {
      setError("讀取服務項目失敗：" + servicesResult.error.message);
      setLoading(false);
      return;
    }

    if (playerServicesResult.error) {
      setError("讀取你的可接服務失敗：" + playerServicesResult.error.message);
      setLoading(false);
      return;
    }

    const categoryRows = (categoriesResult.data || []) as ServiceCategory[];
    const serviceRows = (servicesResult.data || []) as Service[];
    const playerServiceRows = (playerServicesResult.data ||
      []) as PlayerService[];

    const existingMap = new Map<string, PlayerService>();

    playerServiceRows.forEach((row) => {
      existingMap.set(row.service_id, row);
    });

    const nextSettings: Record<string, ServiceForm> = {};

    serviceRows.forEach((service) => {
      const existing = existingMap.get(service.id);

      nextSettings[service.id] = {
        existed: !!existing,
        is_enabled: existing?.is_enabled || false,
        custom_price:
          existing?.custom_price === null || existing?.custom_price === undefined
            ? ""
            : String(existing.custom_price),
        price_note: existing?.price_note || "",
      };
    });

    setCategories(categoryRows);
    setServices(serviceRows);
    setSettings(nextSettings);
    setLoading(false);
  }

  function updateServiceSetting(
    serviceId: string,
    patch: Partial<ServiceForm>
  ) {
    setSettings((current) => ({
      ...current,
      [serviceId]: {
        existed: current[serviceId]?.existed || false,
        is_enabled: current[serviceId]?.is_enabled || false,
        custom_price: current[serviceId]?.custom_price || "",
        price_note: current[serviceId]?.price_note || "",
        ...patch,
      },
    }));
  }

  function toggleService(serviceId: string) {
    const current = settings[serviceId];

    updateServiceSetting(serviceId, {
      is_enabled: !current?.is_enabled,
    });
  }

  function setCategoryEnabled(categoryId: string, enabled: boolean) {
    const serviceIds = services
      .filter((service) => {
        if (categoryId === "uncategorized") {
          return !service.category_id;
        }

        return service.category_id === categoryId;
      })
      .map((service) => service.id);

    setSettings((current) => {
      const next = { ...current };

      serviceIds.forEach((serviceId) => {
        next[serviceId] = {
          existed: next[serviceId]?.existed || false,
          is_enabled: enabled,
          custom_price: next[serviceId]?.custom_price || "",
          price_note: next[serviceId]?.price_note || "",
        };
      });

      return next;
    });
  }

  async function saveServices() {
    if (!player) {
      setError("找不到陪玩師資料。");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    type PlayerServiceUpsertRow = {
      player_id: string;
      service_id: string;
      custom_price: number | null;
      price_note: string | null;
      is_enabled: boolean;
      updated_at: string;
    };

    const rows: PlayerServiceUpsertRow[] = [];

    try {
      for (const service of services) {
        const setting = settings[service.id];

        if (!setting) continue;

        const customPriceText = setting.custom_price.trim();
        const customPrice =
          customPriceText.length > 0 ? Number(customPriceText) : null;

        if (
          customPrice !== null &&
          (!Number.isFinite(customPrice) || customPrice < 0)
        ) {
         throw new Error(`「${service.name}」的自訂價格格式錯誤。`);
        }

        const priceNote = setting.price_note.trim();

        const shouldPersist =
          setting.existed ||
          setting.is_enabled ||
          customPrice !== null ||
          priceNote.length > 0;

        if (!shouldPersist) continue;

        rows.push({
          player_id: player.id,
          service_id: service.id,
          custom_price: customPrice,
          price_note: priceNote || null,
          is_enabled: setting.is_enabled,
          updated_at: new Date().toISOString(),
        });
      }

      if (rows.length > 0) {
        const { error } = await supabase
          .from("platform_player_services")
          .upsert(rows, {
            onConflict: "player_id,service_id",
          });

        if (error) {
          setError("儲存可接服務失敗：" + error.message);
          setSaving(false);
          return;
        }
      }
  
      const { error: playerError } = await supabase
        .from("platform_players")
        .update({
          is_accepting_orders: enabledCount > 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", player.id)
        .eq("user_id", player.user_id);

      if (playerError) {
        setError("更新接單狀態失敗：" + playerError.message);
        setSaving(false);
        return;
      }

      setMessage("可接服務已更新。");
      await loadPage();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "儲存失敗。");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f7f3ec] px-4 py-10 text-slate-950">
        <div className="mx-auto flex max-w-7xl items-center justify-center py-32">
          <Loader2 className="mr-3 h-5 w-5 animate-spin text-violet-600" />
          <span className="text-sm text-slate-500">讀取可接服務中...</span>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <AccessCard
        icon={<Lock className="h-8 w-8" />}
        title="請先登入"
        desc="登入陪玩師帳號後才能設定可接服務。"
        buttonText="前往登入"
        buttonHref="/login?next=/player-center/services"
      />
    );
  }

  if (!player) {
    return (
      <AccessCard
        icon={<ShieldCheck className="h-8 w-8" />}
        title="你還不是陪玩師"
        desc="審核通過後，才可以設定自己的可接服務。"
        buttonText="申請成為陪玩師"
        buttonHref="/apply-player"
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
          <a
            href="/player-center"
            className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 px-4 py-2.5 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-white hover:text-violet-700"
          >
            <ArrowLeft className="h-4 w-4" />
            回陪玩師中心
          </a>

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

          <div className="mb-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-4 py-2 text-sm font-bold text-violet-700 shadow-sm">
                <SlidersHorizontal className="h-4 w-4" />
                PLAYER SERVICES
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-950 md:text-6xl">
                可接服務設定
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-8 text-slate-600 md:text-base">
                {player.nickname} 可以在這裡勾選自己能接的遊戲與服務，也可以填寫自訂價格或備註，方便客人下單前確認。
              </p>
            </div>

            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <BadgeCheck className="h-7 w-7" />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-500">目前開放服務</p>
                  <p className="mt-1 text-3xl font-black text-slate-950">
                    {enabledCount}
                  </p>
                </div>
              </div>

              <button
                onClick={saveServices}
                disabled={saving}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-violet-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-violet-200 transition hover:bg-violet-500 disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    儲存中...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    儲存設定
                  </>
                )}
              </button>
            </section>
          </div>

          <div className="mb-6 rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-xl backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <Search className="h-5 w-5" />
                </div>

                <div>
                  <p className="font-black text-slate-950">搜尋服務</p>
                  <p className="text-xs font-semibold text-slate-500">
                    可以搜尋遊戲名稱、服務名稱或價格。
                  </p>
                </div>
              </div>

              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜尋：特戰、娛樂、技術、Steam..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-300 md:max-w-sm"
              />
            </div>
          </div>

          {visibleGroups.length === 0 ? (
            <section className="rounded-[2rem] border border-white/70 bg-white/80 p-10 text-center shadow-xl backdrop-blur-xl">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-violet-50 text-violet-700">
                <Gamepad2 className="h-8 w-8" />
              </div>

              <h2 className="text-2xl font-black text-slate-950">
                目前沒有服務項目
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-500">
                請先到資料庫或管理後台建立 platform_services 服務項目。
              </p>
            </section>
          ) : (
            <div className="grid gap-6">
              {visibleGroups.map((group) => (
                <section
                  key={group.category.id}
                  className="rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur-xl"
                >
                  <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                        <Gamepad2 className="h-6 w-6" />
                      </div>

                      <div>
                        <h2 className="text-2xl font-black text-slate-950">
                          {group.category.name}
                        </h2>
                        {group.category.description && (
                          <p className="mt-1 text-sm leading-6 text-slate-500">
                            {group.category.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCategoryEnabled(group.category.id, true)
                        }
                        className="rounded-2xl bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100"
                      >
                        全部開啟
                      </button>
                      <button
                        onClick={() =>
                          setCategoryEnabled(group.category.id, false)
                        }
                        className="rounded-2xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200"
                      >
                        全部關閉
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    {group.services.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        setting={settings[service.id]}
                        onToggle={() => toggleService(service.id)}
                        onPriceChange={(value) =>
                          updateServiceSetting(service.id, {
                            custom_price: value,
                          })
                        }
                        onNoteChange={(value) =>
                          updateServiceSetting(service.id, {
                            price_note: value,
                          })
                        }
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ServiceCard({
  service,
  setting,
  onToggle,
  onPriceChange,
  onNoteChange,
}: {
  service: Service;
  setting?: ServiceForm;
  onToggle: () => void;
  onPriceChange: (value: string) => void;
  onNoteChange: (value: string) => void;
}) {
  const enabled = !!setting?.is_enabled;

  return (
    <section
      className={`rounded-3xl border p-5 transition ${
        enabled
          ? "border-violet-200 bg-violet-50/80"
          : "border-slate-100 bg-slate-50/80"
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
              enabled
                ? "bg-white text-violet-700 shadow-sm"
                : "bg-white text-slate-400 shadow-sm"
            }`}
          >
            <Headphones className="h-5 w-5" />
          </div>

          <div>
            <p className="text-lg font-black text-slate-950">{service.name}</p>

            {service.description && (
              <p className="mt-1 text-xs leading-6 text-slate-500">
                {service.description}
              </p>
            )}

            <p className="mt-2 text-xs font-black text-amber-600">
              平台參考價：{formatPrice(service.base_price, service.unit)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggle}
          className={`shrink-0 rounded-2xl px-3 py-2 text-xs font-black transition ${
            enabled
              ? "bg-emerald-100 text-emerald-700"
              : "bg-slate-200 text-slate-500"
          }`}
        >
          <span className="inline-flex items-center gap-1">
            {enabled ? (
              <ToggleRight className="h-4 w-4" />
            ) : (
              <ToggleLeft className="h-4 w-4" />
            )}
            {enabled ? "已開啟" : "未開啟"}
          </span>
        </button>
      </div>

      <div className="grid gap-3">
        <label>
          <span className="text-xs font-black text-slate-600">
            自訂價格 ASD
          </span>
          <input
            value={setting?.custom_price || ""}
            onChange={(e) => onPriceChange(e.target.value)}
            inputMode="numeric"
            placeholder="不填則使用平台參考價"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-violet-300"
          />
        </label>

        <label>
          <span className="text-xs font-black text-slate-600">價格備註</span>
          <textarea
            value={setting?.price_note || ""}
            onChange={(e) => onNoteChange(e.target.value)}
            rows={3}
            placeholder="例如：高端局另議、可提前預約、只接娛樂單..."
            className="mt-2 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-violet-300"
          />
        </label>
      </div>
    </section>
  );
}

function formatPrice(price: number | null, unit: string | null) {
  if (price === null || price === undefined) return "未設定";

  return `${price.toLocaleString()} ASD${unit ? ` / ${unit}` : ""}`;
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

        <p className="text-sm font-bold text-violet-600">PLAYER SERVICES</p>
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