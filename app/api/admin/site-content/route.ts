import { apiError, requireStaff } from "@/lib/serverAuth";
import {
  isSiteContentType,
  type SiteContentItem,
} from "@/lib/siteContent";

export const dynamic = "force-dynamic";

const editableFields = [
  "content_type",
  "title",
  "subtitle",
  "description",
  "image_url",
  "link_url",
  "price",
  "sort_order",
  "is_active",
] as const;

function cleanPayload(input: unknown, partial = false) {
  if (!input || typeof input !== "object") throw new Error("內容格式不正確");
  const body = input as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const field of editableFields) {
    if (field in body) output[field] = body[field];
  }

  if (!partial || "content_type" in output) {
    if (!isSiteContentType(output.content_type)) throw new Error("內容類型不正確");
  }
  if (!partial || "title" in output) {
    const title = String(output.title || "").trim();
    if (!title) throw new Error("請輸入標題");
    output.title = title;
  }

  for (const field of ["subtitle", "description", "image_url", "link_url"] as const) {
    if (field in output) output[field] = String(output[field] || "").trim() || null;
  }
  if ("price" in output) {
    const value = output.price === null || output.price === "" ? null : Number(output.price);
    if (value !== null && (!Number.isFinite(value) || value < 0)) throw new Error("價格格式不正確");
    output.price = value;
  }
  if ("sort_order" in output) {
    const value = Number(output.sort_order);
    output.sort_order = Number.isFinite(value) ? Math.trunc(value) : 0;
  }
  if ("is_active" in output) output.is_active = Boolean(output.is_active);

  return output;
}

export async function GET(request: Request) {
  try {
    const { admin } = await requireStaff(request);
    const { data, error } = await admin
      .from("site_content_items")
      .select("*")
      .order("content_type")
      .order("sort_order")
      .order("created_at");
    if (error) throw error;
    return Response.json(
      { items: (data || []) as SiteContentItem[] },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { admin } = await requireStaff(request);
    const payload = cleanPayload(await request.json());
    const { data, error } = await admin
      .from("site_content_items")
      .insert(payload)
      .select("*")
      .single();
    if (error) throw error;
    return Response.json({ item: data as SiteContentItem }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { admin } = await requireStaff(request);
    const body = (await request.json()) as Record<string, unknown>;
    const id = String(body.id || "").trim();
    if (!id) throw new Error("缺少內容編號");
    const payload = cleanPayload(body, true);
    const { data, error } = await admin
      .from("site_content_items")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw error;
    return Response.json({ item: data as SiteContentItem });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { admin } = await requireStaff(request);
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) throw new Error("缺少內容編號");
    const { error } = await admin.from("site_content_items").delete().eq("id", id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
