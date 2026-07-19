import type { User } from "@supabase/supabase-js";
import {
  apiError,
  getConfiguredAdminEmails,
  requireSiteAdmin,
} from "@/lib/serverAuth";

async function listAuthUsers(admin: Awaited<ReturnType<typeof requireSiteAdmin>>["admin"]) {
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
    const { admin, user } = await requireSiteAdmin(request);
    const [{ data: profiles, error }, authUsers] = await Promise.all([
      admin
        .from("platform_profiles")
        .select("id, display_name, role, updated_at")
        .eq("role", "admin")
        .order("updated_at", { ascending: true }),
      listAuthUsers(admin),
    ]);
    if (error) throw error;

    const configuredAdminEmails = getConfiguredAdminEmails();
    const authById = new Map(authUsers.map((authUser) => [authUser.id, authUser]));
    const adminById = new Map(
      (profiles || []).map((profile) => [
        profile.id,
        {
          ...profile,
          email: authById.get(profile.id)?.email || null,
          is_configured: false,
        },
      ]),
    );

    for (const authUser of authUsers) {
      if (
        authUser.email &&
        configuredAdminEmails.includes(authUser.email.trim().toLowerCase())
      ) {
        adminById.set(authUser.id, {
          id: authUser.id,
          display_name: String(
            authUser.user_metadata?.full_name ||
              authUser.user_metadata?.name ||
              authUser.email,
          ),
          role: "admin",
          updated_at: authUser.updated_at || null,
          email: authUser.email,
          is_configured: true,
        });
      }
    }

    return Response.json({
      currentUserId: user.id,
      admins: Array.from(adminById.values()),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { admin } = await requireSiteAdmin(request);
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
    const { admin, user } = await requireSiteAdmin(request);
    const id = new URL(request.url).searchParams.get("id")?.trim();
    if (!id) throw new Error("缺少管理員編號");
    if (id === user.id) throw new Error("不能移除自己的管理員權限");

    const authUsers = await listAuthUsers(admin);
    const targetUser = authUsers.find((authUser) => authUser.id === id);
    const configuredAdminEmails = getConfiguredAdminEmails();
    if (
      targetUser?.email &&
      configuredAdminEmails.includes(targetUser.email.trim().toLowerCase())
    ) {
      throw new Error("環境設定的主要管理員不能在這裡移除");
    }

    const { data: profileAdmins, error: countError } = await admin
      .from("platform_profiles")
      .select("id")
      .eq("role", "admin");
    if (countError) throw countError;
    const configuredAdminIds = authUsers
      .filter(
        (authUser) =>
          authUser.email &&
          configuredAdminEmails.includes(authUser.email.trim().toLowerCase()),
      )
      .map((authUser) => authUser.id);
    const totalAdminCount = new Set([
      ...(profileAdmins || []).map((profile) => profile.id),
      ...configuredAdminIds,
    ]).size;
    if (totalAdminCount <= 1) throw new Error("至少要保留一位管理員");

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
