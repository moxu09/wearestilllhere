import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { isRetiredMainSiteOffering, type SiteContentItem } from "@/lib/siteContent";

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
      {
        items: ((data || []) as SiteContentItem[]).filter(
          (item) => !isRetiredMainSiteOffering(item),
        ),
      },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    console.error("Failed to load site content", error);
    return Response.json(
      { items: [] },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}
