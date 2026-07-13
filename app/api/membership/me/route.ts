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
        display_name: discord.displayName,
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
      profile: { ...discord, role: existingProfile?.role || "customer" },
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
