import type { User } from "@supabase/supabase-js";
import { apiError, requireUser } from "@/lib/serverAuth";

async function requirePlatformAdmin(request: Request) {
  const context = await requireUser(request);
  const { data: profile, error } = await context.admin
    .from("platform_profiles")
    .select("id, role, display_name")
    .eq("id", context.user.id)
    .maybeSingle();
  if (error) throw error;
  if (profile?.role !== "admin") throw new Error("FORBIDDEN");
  return { ...context, profile };
}

async function listAuthUsers(admin: Awaited<ReturnType<typeof requirePlatformAdmin>>["admin"]) {
  const users: User[] = [];
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
  }
  return users;
}

export async function GET(request: Request) {
  try {
    const { admin, user } = await requirePlatformAdmin(request);
    const [{ data: profiles, error }, authUsers] = await Promise.all([
      admin
        .from("platform_profiles")
        .select("id, display_name, role, updated_at")
        .eq("role", "admin")
        .order("updated_at", { ascending: true }),
      listAuthUsers(admin),
    ]);
    if (error) throw error;

    const authById = new Map(authUsers.map((authUser) => [authUser.id, authUser]));
    return Response.json({
      currentUserId: user.id,
      admins: (profiles || []).map((profile) => ({
        ...profile,
        email: authById.get(profile.id)?.email || null,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { admin } = await requirePlatformAdmin(request);
    const body = (await request.json()) as { email?: unknown };
    const email = String(body.email || "").trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("請輸入正確的 Email");

    const authUsers = await listAuthUsers(admin);
    const targetUser = authUsers.find(
      (authUser) => authUser.email?.trim().toLowerCase() === email,
    );
    if (!targetUser) {
      throw new Error("找不到此帳號，請先請對方用這個 Email 註冊或登入官網一次");
    }

    const { data: existing, error: profileError } = await admin
      .from("platform_profiles")
      .select("id, display_name")
      .eq("id", targetUser.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const displayName =
      existing?.display_name ||
      String(targetUser.user_metadata?.full_name || targetUser.user_metadata?.name || email);
    const { error } = await admin.from("platform_profiles").upsert({
      id: targetUser.id,
      display_name: displayName,
      role: "admin",
      status: "active",
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { admin, user } = await requirePlatformAdmin(request);
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) throw new Error("缺少管理員編號");
    if (id === user.id) throw new Error("不能移除自己的管理員權限");

    const { count, error: countError } = await admin
      .from("platform_profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if (countError) throw countError;
    if ((count || 0) <= 1) throw new Error("至少要保留一位管理員");

    const { data, error } = await admin
      .from("platform_profiles")
      .update({ role: "customer", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("role", "admin")
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("找不到這位管理員");

    return Response.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}

