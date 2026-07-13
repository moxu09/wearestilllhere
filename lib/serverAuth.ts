import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export function getDiscordId(user: User) {
  const identity = user.identities?.find((item) => item.provider === "discord");
  const identityData = (identity?.identity_data || {}) as Record<
    string,
    unknown
  >;
  const metadata = (user.user_metadata || {}) as Record<string, unknown>;
  return String(
    identityData.provider_id ||
      identityData.sub ||
      metadata.provider_id ||
      metadata.sub ||
      "",
  );
}

export function getDiscordProfile(user: User) {
  const metadata = (user.user_metadata || {}) as Record<string, unknown>;
  return {
    discordId: getDiscordId(user),
    displayName: String(
      metadata.full_name || metadata.name || metadata.user_name || "星夜會員",
    ),
    avatarUrl: metadata.avatar_url ? String(metadata.avatar_url) : null,
  };
}

export async function requireUser(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (!token) throw new Error("UNAUTHORIZED");
  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new Error("UNAUTHORIZED");
  return { admin, user: data.user };
}

export async function requireStaff(request: Request) {
  const context = await requireUser(request);
  const { data: profile } = await context.admin
    .from("platform_profiles")
    .select("id, role, display_name")
    .eq("id", context.user.id)
    .maybeSingle();
  if (!profile || !["staff", "admin"].includes(profile.role)) {
    throw new Error("FORBIDDEN");
  }
  return { ...context, profile };
}

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  const status =
    message === "UNAUTHORIZED" ? 401 : message === "FORBIDDEN" ? 403 : 400;
  return Response.json(
    {
      error:
        status === 401 ? "請先登入" : status === 403 ? "沒有客服權限" : message,
    },
    { status },
  );
}
