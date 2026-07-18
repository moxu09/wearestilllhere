import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { defaultSiteContent, type SiteContentItem } from "@/lib/siteContent";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { data, error } = await getSupabaseAdmin()
      .from("site_content_items")
      .select("*")
      .eq("is_active", true)
      .order("content_type")
      .order("sort_order")
      .order("created_at");

    if (error) throw error;

    return Response.json(
      { items: (data || []) as SiteContentItem[] },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("Failed to load site content; using defaults", error);
    return Response.json(
      { items: defaultSiteContent, fallback: true },
      { headers: { "Cache-Control": "public, max-age=30" } },
    );
  }
}

