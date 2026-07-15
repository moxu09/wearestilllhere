import { apiError, getDiscordProfile, requireUser } from "@/lib/serverAuth";

const EXCLUSIVE_CARD_URLS = {
  white: "https://www.wearestilllhere.com/membership-cards/exclusive.png",
  black: "https://www.wearestilllhere.com/membership-cards/exclusive-black.png",
} as const;

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
      invitationResult,
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
      admin
        .from("alliance_exclusive_invitations")
        .select("*")
        .eq("discord_user_id", discord.discordId)
        .eq("status", "pending")
        .order("invited_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    if (memberResult.error) throw memberResult.error;
    if (invitationResult.error) throw invitationResult.error;
    const tiers = tiersResult.data || [];
    const currentTierRecord =
      tiers.find((tier) => tier.tier_key === memberResult.data.tier_key) ||
      tiers[0];
    const exclusiveCardVariant = memberResult.data.exclusive_card_variant as
      | keyof typeof EXCLUSIVE_CARD_URLS
      | null;
    const currentTier = currentTierRecord
      ? {
          ...currentTierRecord,
          card_image_url:
            currentTierRecord.tier_key === "exclusive" && exclusiveCardVariant
              ? EXCLUSIVE_CARD_URLS[exclusiveCardVariant]
              : currentTierRecord.card_image_url,
        }
      : null;
    const nextTier = currentTier?.is_invitation_only
      ? null
      : tiers.find(
          (tier) =>
            !tier.is_invitation_only &&
            Number(tier.threshold_points) >
              Number(memberResult.data.lifetime_points),
        );
    const eligibleRewards = (rewardsResult.data || []).filter((reward) => {
      const eligibleTierKeys = Array.isArray(reward.eligible_tier_keys)
        ? reward.eligible_tier_keys
        : [];
      return (
        eligibleTierKeys.length === 0 ||
        eligibleTierKeys.includes(memberResult.data.tier_key)
      );
    });
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
      rewards: eligibleRewards,
      exclusiveInvitation: invitationResult.data || null,
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
    if (body.action === "select_exclusive_card") {
      const variant = String(body.variant || "");
      if (variant !== "white" && variant !== "black") {
        throw new Error("請選擇有效的尊享會員卡面");
      }
      const { data, error } = await admin
        .from("alliance_members")
        .update({
          exclusive_card_variant: variant,
          updated_at: new Date().toISOString(),
        })
        .eq("discord_user_id", discord.discordId)
        .eq("auth_user_id", user.id)
        .eq("tier_key", "exclusive")
        .is("exclusive_card_variant", null)
        .select("exclusive_card_variant")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        throw new Error("尊享會員卡面只能選擇一次，確認後無法更改");
      }
      return Response.json(data);
    }
    if (body.action === "respond_exclusive_invitation") {
      const { data, error } = await admin.rpc(
        "alliance_respond_exclusive_invitation",
        {
          p_discord_user_id: discord.discordId,
          p_auth_user_id: user.id,
          p_accepted: Boolean(body.accepted),
        },
      );
      if (error) throw error;
      return Response.json(data);
    }
    if (body.action === "update_profile_details") {
      const gender = String(body.gender || "undisclosed");
      const allowedGenders = new Set([
        "undisclosed",
        "female",
        "male",
        "other",
      ]);
      if (!allowedGenders.has(gender)) throw new Error("請選擇有效的性別");

      const rawBirthMonth =
        body.birthMonth == null ? "" : String(body.birthMonth);
      const rawBirthDay = body.birthDay == null ? "" : String(body.birthDay);
      const hasBirthday = rawBirthMonth !== "" && rawBirthDay !== "";
      const birthMonth = hasBirthday ? Number(rawBirthMonth) : null;
      const birthDay = hasBirthday ? Number(rawBirthDay) : null;
      if (hasBirthday) {
        const date = new Date(2000, birthMonth! - 1, birthDay!);
        const isValid =
          Number.isInteger(birthMonth) &&
          Number.isInteger(birthDay) &&
          date.getMonth() === birthMonth! - 1 &&
          date.getDate() === birthDay;
        if (!isValid) throw new Error("請選擇有效的生日月日");
      }
      if ((rawBirthMonth === "") !== (rawBirthDay === "")) {
        throw new Error("生日月份與日期需一起填寫");
      }

      const { data, error } = await admin
        .from("alliance_members")
        .update({
          gender,
          birth_month: birthMonth,
          birth_day: birthDay,
          updated_at: new Date().toISOString(),
        })
        .eq("discord_user_id", discord.discordId)
        .eq("auth_user_id", user.id)
        .select("gender, birth_month, birth_day")
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("找不到會員資料，請重新整理後再試");
      return Response.json(data);
    }

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
