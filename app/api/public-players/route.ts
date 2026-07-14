import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = getSupabaseAdmin();
    const currentMonth = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Taipei",
      year: "numeric",
      month: "2-digit",
    }).format(new Date());

    const { data, error } = await admin
      .from("salary_public_profiles")
      .select(
        "app_key,discord_id,display_name,avatar_url,intro,invite_url,games,is_online,can_take_order,is_featured,featured_month,updated_at",
      )
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("is_online", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) throw error;

    const normalized = (data || []).map((player) => ({
        ...player,
        is_featured:
          Boolean(player.is_featured) &&
          String(player.featured_month || "").startsWith(currentMonth),
      }));

    const mergedByDiscord = new Map<string, (typeof normalized)[number]>();
    for (const player of normalized) {
      const current = mergedByDiscord.get(player.discord_id);
      if (!current) {
        mergedByDiscord.set(player.discord_id, player);
        continue;
      }

      const score = (item: typeof player) =>
        Number(Boolean(item.intro)) * 8 +
        Number(Boolean(item.invite_url)) * 8 +
        Number(Boolean(item.is_featured)) * 4 +
        Number(Boolean(item.is_online)) * 2 +
        Number(item.app_key === "deepnight");
      const preferred = score(player) > score(current) ? player : current;
      const secondary = preferred === player ? current : player;

      mergedByDiscord.set(player.discord_id, {
        ...preferred,
        avatar_url: preferred.avatar_url || secondary.avatar_url,
        intro: preferred.intro || secondary.intro,
        invite_url: preferred.invite_url || secondary.invite_url,
        games: Array.from(
          new Set([...(preferred.games || []), ...(secondary.games || [])]),
        ),
        is_online: preferred.is_online || secondary.is_online,
        can_take_order:
          preferred.can_take_order || secondary.can_take_order,
        is_featured: preferred.is_featured || secondary.is_featured,
      });
    }

    const players = Array.from(mergedByDiscord.values())
      .sort((a, b) => Number(b.is_featured) - Number(a.is_featured));

    return Response.json(
      { players },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    console.error("[public players] load failed", error);
    return Response.json(
      { players: [], error: "陪陪資料暫時無法載入" },
      { status: 500 },
    );
  }
}
