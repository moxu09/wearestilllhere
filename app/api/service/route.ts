import { apiError, requireStaff } from "@/lib/serverAuth";

function reportMeta(row: Record<string, unknown>) {
  try {
    return JSON.parse(String(row.note || row.admin_note || "{}"));
  } catch {
    return {};
  }
}

function commissionRate(
  staff: Record<string, unknown> | null,
  endedAt: string,
  isTip: boolean,
) {
  const tier = String(staff?.commission_tier || "");
  const manual = tier.match(/(75|80|85|90|95)/)?.[1];
  let rate = manual
    ? Number(manual)
    : new Date(endedAt) < new Date("2026-09-01T00:00:00+08:00")
      ? 90
      : 80;
  if (isTip && rate !== 95) rate = 90;
  return rate;
}

export async function GET(request: Request) {
  try {
    const { admin, profile, allowedBrands } = await requireStaff(request);
    const [deep, qiunai, redemptions, rewards, members, tiers, profiles] =
      await Promise.all([
        admin
          .from("play_orders")
          .select("*")
          .eq("status", "work_pending")
          .order("created_at"),
        admin
          .from("qiunai_salary_orders")
          .select("*")
          .eq("status", "工時待審核")
          .order("created_at"),
        admin
          .from("alliance_redemption_requests")
          .select("*")
          .eq("status", "pending")
          .order("created_at"),
        admin
          .from("alliance_rewards")
          .select("*")
          .neq("status", "deleted")
          .order("sort_order")
          .order("created_at", { ascending: false }),
        admin
          .from("alliance_members")
          .select("*")
          .order("updated_at", { ascending: false }),
        admin.from("alliance_membership_tiers").select("*").order("sort_order"),
        admin
          .from("platform_profiles")
          .select("id, discord_user_id, display_name, role, status"),
      ]);
    for (const result of [
      deep,
      qiunai,
      redemptions,
      rewards,
      members,
      tiers,
      profiles,
    ]) {
      if (result.error) throw result.error;
    }
    return Response.json({
      reports: [
        ...(allowedBrands.includes("deepnight")
          ? (deep.data || []).map((row) => ({
              ...row,
              brand: "deepnight",
              meta: reportMeta(row),
            }))
          : []),
        ...(allowedBrands.includes("qiunai")
          ? (qiunai.data || []).map((row) => ({
              ...row,
              brand: "qiunai",
              meta: reportMeta(row),
            }))
          : []),
      ],
      redemptions: redemptions.data || [],
      rewards: rewards.data || [],
      members: members.data || [],
      tiers: tiers.data || [],
      profiles: profiles.data || [],
      actorRole: profile.role,
      allowedBrands,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { admin, user, profile, allowedBrands } = await requireStaff(request);
    const body = await request.json();
    if (body.action === "set_staff_role") {
      if (profile.role !== "admin")
        throw new Error("只有管理員可以調整客服權限");
      const { data, error } = await admin
        .from("platform_profiles")
        .update({
          role: body.enabled ? "staff" : "customer",
          updated_at: new Date().toISOString(),
        })
        .eq("discord_user_id", String(body.discordUserId))
        .neq("role", "admin")
        .select("id, discord_user_id, display_name, role")
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        throw new Error(
          "找不到此登入帳號，請先請對方使用 Discord 登入會員中心一次",
        );
      }
      return Response.json({ profile: data });
    }
    if (body.action === "adjust_points") {
      const { data, error } = await admin.rpc("alliance_adjust_points", {
        p_discord_user_id: String(body.discordUserId),
        p_point_kind: body.pointKind || "membership",
        p_delta: Number(body.delta),
        p_note: String(body.note || ""),
        p_created_by: user.id,
      });
      if (error) throw error;
      return Response.json({ member: data });
    }
    if (body.action === "review_redemption") {
      const { data, error } = await admin.rpc("alliance_review_redemption", {
        p_request_id: body.requestId,
        p_approved: Boolean(body.approved),
        p_reviewed_by: user.id,
        p_review_note: body.note || null,
      });
      if (error) throw error;
      return Response.json({ request: data });
    }
    if (body.action === "save_reward") {
      const payload = {
        name: String(body.name),
        description: body.description || null,
        reward_type: body.rewardType,
        points_cost: Number(body.pointsCost),
        stock:
          body.stock === "" || body.stock == null ? null : Number(body.stock),
        coupon_name: body.couponName || null,
        image_url: body.imageUrl || null,
        status: body.status || "active",
        updated_at: new Date().toISOString(),
      };
      const result = body.id
        ? await admin
            .from("alliance_rewards")
            .update(payload)
            .eq("id", body.id)
            .select()
            .single()
        : await admin
            .from("alliance_rewards")
            .insert({ ...payload, created_by: user.id })
            .select()
            .single();
      if (result.error) throw result.error;
      return Response.json({ reward: result.data });
    }
    if (body.action === "delete_reward") {
      const { error } = await admin
        .from("alliance_rewards")
        .update({ status: "deleted", updated_at: new Date().toISOString() })
        .eq("id", body.id);
      if (error) throw error;
      return Response.json({ ok: true });
    }
    if (body.action === "review_report") {
      if (!allowedBrands.includes(body.brand)) {
        throw new Error("沒有此品牌的訂單審核權限");
      }
      const table =
        body.brand === "deepnight" ? "play_orders" : "qiunai_salary_orders";
      const { data: report, error: reportError } = await admin
        .from(table)
        .select("*")
        .eq("id", body.reportId)
        .single();
      if (reportError) throw reportError;
      const meta = reportMeta(report);
      if (!body.approved) {
        const payload =
          body.brand === "deepnight"
            ? {
                status: "work_rejected",
                note: JSON.stringify({
                  ...meta,
                  rejectionReason: body.note || "客服駁回",
                }),
              }
            : {
                status: "工時已駁回",
                admin_note: JSON.stringify({
                  ...meta,
                  rejectionReason: body.note || "客服駁回",
                }),
              };
        const { error } = await admin
          .from(table)
          .update(payload)
          .eq("id", body.reportId);
        if (error) throw error;
        return Response.json({ ok: true });
      }
      const staffId = String(report.discord_id);
      const endedAt = String(
        meta.endedAt || report.order_finished_at || new Date().toISOString(),
      );
      const isTip = String(
        meta.orderType || report.order_type || report.service_name || "",
      ).includes("打賞");
      const staffTable =
        body.brand === "deepnight" ? "players" : "qiunai_staff";
      let staffQuery = admin
        .from(staffTable)
        .select("*")
        .eq("discord_id", staffId);
      if (body.brand === "deepnight")
        staffQuery = staffQuery.eq("guild_id", "1501098191813214312");
      const { data: staff } = await staffQuery.limit(1).maybeSingle();
      const rate = commissionRate(staff, endedAt, isTip);
      const amount = Number(report.order_amount || report.price || 0);
      const salary = Math.round((amount * rate) / 100);
      const payload =
        body.brand === "deepnight"
          ? {
              customer_name:
                report.customer_name ||
                meta.customerName ||
                meta.customerId ||
                "手動報單",
              service: report.service_name || meta.serviceName,
              service_name: report.service_name || meta.serviceName,
              order_type: isTip ? "打賞" : "訂單",
              staff_salary: salary,
              salary_rate: rate,
              salary_level: isTip
                ? rate === 95
                  ? "打賞特別設定 95%"
                  : "打賞固定 90%"
                : `工時申報 ${rate}%`,
              platform_expense: salary,
              status: "completed",
              quote_status: "completed",
              order_finished_at: endedAt,
              completed_at: endedAt,
              duration_minutes: Number(
                meta.durationMinutes || report.duration_minutes || 0,
              ),
              is_deleted: false,
            }
          : {
              customer_name:
                report.customer_name ||
                meta.customerName ||
                meta.customerId ||
                "手動報單",
              service_name: report.service_name || meta.serviceName,
              staff_salary: salary,
              salary_rate: rate,
              salary_level: isTip
                ? rate === 95
                  ? "打賞特別設定 95%"
                  : "打賞固定 90%"
                : `工時申報 ${rate}%`,
              platform_expense: salary,
              status: "未發薪",
              order_finished_at: endedAt,
              admin_note: `申報時長 ${Number(meta.durationMinutes || 0)} 分鐘`,
              is_deleted: false,
            };
      const { error } = await admin
        .from(table)
        .update(payload)
        .eq("id", body.reportId);
      if (error) throw error;
      return Response.json({ ok: true });
    }
    throw new Error("不支援的操作");
  } catch (error) {
    return apiError(error);
  }
}
