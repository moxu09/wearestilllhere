import { apiError, getDiscordProfile, requireUser } from "@/lib/serverAuth";

export async function GET(request: Request) {
  try {
    const { admin, user } = await requireUser(request);
    const discord = getDiscordProfile(user);
    if (!discord.discordId)
      throw new Error("請使用 Discord 登入以連結會員資料");

    const { data: existingProfile } = await admin
      .from("platform_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const { data: existingMember } = await admin
      .from("alliance_members")
      .select("custom_display_name")
      .eq("discord_user_id", discord.discordId)
      .maybeSingle();
    const effectiveDisplayName =
      existingMember?.custom_display_name || discord.displayName;
    await admin.from("platform_profiles").upsert({
      id: user.id,
      discord_user_id: discord.discordId,
      display_name: discord.displayName,
      avatar_url: discord.avatarUrl,
      role: existingProfile?.role || "customer",
      status: "active",
      updated_at: new Date().toISOString(),
    });
    await admin.from("alliance_members").upsert(
      {
        discord_user_id: discord.discordId,
        auth_user_id: user.id,
        display_name: effectiveDisplayName,
        avatar_url: discord.avatarUrl,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "discord_user_id" },
    );
    await admin
      .from("users")
      .upsert({ user_id: discord.discordId }, { onConflict: "user_id" });

    const [
      memberResult,
      tiersResult,
      walletResult,
      ledgerResult,
      redemptionResult,
      rewardsResult,
    ] = await Promise.all([
      admin
        .from("alliance_members")
        .select("*")
        .eq("discord_user_id", discord.discordId)
        .single(),
      admin
        .from("alliance_membership_tiers")
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),
      admin
        .from("users")
        .select("coins")
        .eq("user_id", discord.discordId)
        .maybeSingle(),
      admin
        .from("alliance_point_ledger")
        .select("*")
        .eq("discord_user_id", discord.discordId)
        .order("created_at", { ascending: false })
        .limit(30),
      admin
        .from("alliance_redemption_requests")
        .select("*")
        .eq("discord_user_id", discord.discordId)
        .order("created_at", { ascending: false })
        .limit(30),
      admin
        .from("alliance_rewards")
        .select("*")
        .eq("status", "active")
        .order("sort_order")
        .order("created_at", { ascending: false }),
    ]);
    if (memberResult.error) throw memberResult.error;
    const tiers = tiersResult.data || [];
    const currentTier =
      tiers.find((tier) => tier.tier_key === memberResult.data.tier_key) ||
      tiers[0];
    const nextTier = tiers.find(
      (tier) =>
        !tier.is_invitation_only &&
        Number(tier.threshold_points) >
          Number(memberResult.data.lifetime_points),
    );
    return Response.json({
      profile: {
        ...discord,
        displayName:
          memberResult.data.custom_display_name || discord.displayName,
        isCustomName: Boolean(memberResult.data.custom_display_name),
        role: existingProfile?.role || "customer",
      },
      member: memberResult.data,
      currentTier,
      nextTier: nextTier || null,
      tiers,
      walletBalance: Number(walletResult.data?.coins || 0),
      ledger: ledgerResult.data || [],
      redemptions: redemptionResult.data || [],
      rewards: rewardsResult.data || [],
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { admin, user } = await requireUser(request);
    const discord = getDiscordProfile(user);
    if (!discord.discordId)
      throw new Error("請使用 Discord 登入以連結會員資料");

    const body = await request.json();
    const reset = Boolean(body.reset);
    const displayName = String(body.displayName || "")
      .replace(/\s+/g, " ")
      .trim();
    if (!reset && (displayName.length < 1 || displayName.length > 30)) {
      throw new Error("會員名稱需為 1 到 30 個字");
    }
    if (!reset && /[\u0000-\u001f\u007f]/.test(displayName)) {
      throw new Error("會員名稱包含不支援的字元");
    }

    const customDisplayName = reset ? null : displayName;
    const { data, error } = await admin
      .from("alliance_members")
      .update({
        custom_display_name: customDisplayName,
        display_name: customDisplayName || discord.displayName,
        updated_at: new Date().toISOString(),
      })
      .eq("discord_user_id", discord.discordId)
      .eq("auth_user_id", user.id)
      .select("display_name, custom_display_name")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("找不到會員資料，請重新整理後再試");

    return Response.json({
      displayName: data.custom_display_name || discord.displayName,
      isCustomName: Boolean(data.custom_display_name),
    });
  } catch (error) {
    return apiError(error);
  }
}
