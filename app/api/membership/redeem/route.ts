import { apiError, getDiscordId, requireUser } from "@/lib/serverAuth";

export async function POST(request: Request) {
  try {
    const { admin, user } = await requireUser(request);
    const discordId = getDiscordId(user);
    if (!discordId) throw new Error("請使用 Discord 登入");
    const body = await request.json();
    const { data, error } = await admin.rpc("alliance_request_redemption", {
      p_discord_user_id: discordId,
      p_reward_id: body.rewardId || null,
      p_discount_points: body.discountPoints
        ? Number(body.discountPoints)
        : null,
      p_request_note: body.note || null,
    });
    if (error) throw error;
    return Response.json({ request: data });
  } catch (error) {
    return apiError(error);
  }
}
