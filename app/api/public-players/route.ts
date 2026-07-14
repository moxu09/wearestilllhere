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

    const players = (data || [])
      .map((player) => ({
        ...player,
        is_featured:
          Boolean(player.is_featured) &&
          String(player.featured_month || "").startsWith(currentMonth),
      }))
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
