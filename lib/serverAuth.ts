import type { User } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export type StaffBrand = "deepnight" | "qiunai";

const STAFF_GUILDS = {
  deepnight: {
    guildId: "1501098191813214312",
    roleId: "1501271090918326362",
    tokenEnv: "DISCORD_DEEPNIGHT_BOT_TOKEN",
  },
  qiunai: {
    guildId: "1206138511535898654",
    roleId: "1210642900355125288",
    tokenEnv: "DISCORD_QIUNAI_BOT_TOKEN",
  },
} as const;

const staffBrandCache = new Map<
  string,
  { brands: StaffBrand[]; expiresAt: number }
>();

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

export function getConfiguredAdminEmails() {
  return String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireSiteAdmin(request: Request) {
  const context = await requireUser(request);
  const { data: profile, error } = await context.admin
    .from("platform_profiles")
    .select("id, role, display_name")
    .eq("id", context.user.id)
    .maybeSingle();
  if (error) throw error;

  const configuredAdminEmails = getConfiguredAdminEmails();
  const userEmail = context.user.email?.trim().toLowerCase() || "";
  const isConfiguredAdmin =
    Boolean(userEmail) && configuredAdminEmails.includes(userEmail);

  if (profile?.role !== "admin" && !isConfiguredAdmin) {
    throw new Error("FORBIDDEN");
  }

  return {
    ...context,
    profile,
    isConfiguredAdmin,
  };
}

async function hasDiscordRole(
  userId: string,
  config: (typeof STAFF_GUILDS)[StaffBrand],
) {
  const botToken = process.env[config.tokenEnv];
  if (!botToken) throw new Error("客服權限驗證尚未設定完成");

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${config.guildId}/members/${userId}`,
    {
      headers: { authorization: `Bot ${botToken}` },
      cache: "no-store",
    },
  );
  if (response.status === 404) return false;
  if (!response.ok) throw new Error("暫時無法向 Discord 驗證客服身分組");

  const member = (await response.json()) as { roles?: string[] };
  return member.roles?.includes(config.roleId) || false;
}

async function getStaffBrands(discordUserId: string) {
  const cached = staffBrandCache.get(discordUserId);
  if (cached && cached.expiresAt > Date.now()) return cached.brands;

  const checks = await Promise.all(
    (Object.entries(STAFF_GUILDS) as [StaffBrand, (typeof STAFF_GUILDS)[StaffBrand]][])
      .map(async ([brand, config]) => ({
        brand,
        allowed: await hasDiscordRole(discordUserId, config),
      })),
  );
  const brands = checks.filter((item) => item.allowed).map((item) => item.brand);
  staffBrandCache.set(discordUserId, {
    brands,
    expiresAt: Date.now() + 60_000,
  });
  return brands;
}

export async function requireStaff(request: Request) {
  const context = await requireUser(request);
  const { data: profile } = await context.admin
    .from("platform_profiles")
    .select("id, role, display_name")
    .eq("id", context.user.id)
    .maybeSingle();
  if (profile?.role === "admin") {
    return {
      ...context,
      profile,
      allowedBrands: ["deepnight", "qiunai"] as StaffBrand[],
    };
  }

  const discordUserId = getDiscordId(context.user);
  if (!discordUserId) throw new Error("FORBIDDEN");
  const allowedBrands = await getStaffBrands(discordUserId);
  if (!allowedBrands.length) throw new Error("FORBIDDEN");

  return {
    ...context,
    profile: profile || {
      id: context.user.id,
      role: "staff",
      display_name: getDiscordProfile(context.user).displayName,
    },
    allowedBrands,
  };
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
