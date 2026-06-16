import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

type OrderAction = "accept" | "start" | "complete" | "cancel";

type ProfileRow = {
  id: string;
  role: string | null;
  display_name: string | null;
};

type AccessResult =
  | {
      ok: true;
      supabase: ReturnType<typeof getSupabaseAdmin>;
      userId: string;
      profile: ProfileRow | null;
      actorRole: "customer" | "player" | "staff" | "admin";
      order: Record<string, unknown>;
    }
  | {
      ok: false;
      response: NextResponse;
    };

const actionLabel: Record<OrderAction, string> = {
  accept: "已接單",
  start: "已開始服務",
  complete: "已完成訂單",
  cancel: "已取消訂單",
};

const actionNextStatus: Record<OrderAction, string> = {
  accept: "accepted",
  start: "in_progress",
  complete: "completed",
  cancel: "cancelled",
};

function getValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

function getOrderStatus(order: Record<string, unknown>) {
  return typeof order.status === "string" ? order.status : "";
}

function getPaymentStatus(order: Record<string, unknown>) {
  return typeof order.payment_status === "string" ? order.payment_status : "";
}

async function getCurrentUser(request: Request) {
  const supabase = getSupabaseAdmin();

  const authHeader = request.headers.get("authorization") || "";
  const accessToken = authHeader.replace("Bearer ", "").trim();

  if (!accessToken) {
    return {
      ok: false as const,
      supabase,
      response: NextResponse.json(
        { error: "請先登入後再操作訂單。" },
        { status: 401 }
      ),
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return {
      ok: false as const,
      supabase,
      response: NextResponse.json(
        { error: "登入狀態已過期，請重新登入。" },
        { status: 401 }
      ),
    };
  }

  return {
    ok: true as const,
    supabase,
    user,
  };
}

async function canAccessOrder(
  request: Request,
  orderId: string
): Promise<AccessResult> {
  const current = await getCurrentUser(request);

  if (!current.ok) {
    return current;
  }

  const { supabase, user } = current;

  const { data: profile, error: profileError } = await supabase
    .from("platform_profiles")
    .select("id, role, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "讀取使用者資料失敗：" + profileError.message },
        { status: 500 }
      ),
    };
  }

  const { data: order, error: orderError } = await supabase
    .from("platform_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "讀取訂單失敗：" + orderError.message },
        { status: 500 }
      ),
    };
  }

  if (!order) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "找不到這筆訂單。" },
        { status: 404 }
      ),
    };
  }

  const profileRow = profile as ProfileRow | null;
  const role = profileRow?.role || "";
  const orderRow = order as Record<string, unknown>;

  if (role === "admin") {
    return {
      ok: true,
      supabase,
      userId: user.id,
      profile: profileRow,
      actorRole: "admin",
      order: orderRow,
    };
  }

  if (role === "staff") {
    return {
      ok: true,
      supabase,
      userId: user.id,
      profile: profileRow,
      actorRole: "staff",
      order: orderRow,
    };
  }

  const customerUserId = getValue(orderRow, [
    "user_id",
    "customer_id",
    "buyer_id",
    "member_id",
    "client_id",
    "created_by",
  ]);

  if (customerUserId === user.id) {
    return {
      ok: true,
      supabase,
      userId: user.id,
      profile: profileRow,
      actorRole: "customer",
      order: orderRow,
    };
  }

  const directPlayerUserId = getValue(orderRow, [
    "player_user_id",
    "accepted_by",
    "assignee_id",
    "player_member_id",
  ]);

  if (directPlayerUserId === user.id) {
    return {
      ok: true,
      supabase,
      userId: user.id,
      profile: profileRow,
      actorRole: "player",
      order: orderRow,
    };
  }

  const playerId = getValue(orderRow, [
    "player_id",
    "platform_player_id",
    "assigned_player_id",
  ]);

  if (playerId) {
    const { data: player } = await supabase
      .from("platform_players")
      .select("id, user_id, owner_id, profile_id")
      .eq("id", playerId)
      .maybeSingle();

    const playerRow = (player || {}) as Record<string, unknown>;

    const playerUserId = getValue(playerRow, [
      "user_id",
      "owner_id",
      "profile_id",
    ]);

    if (playerUserId === user.id) {
      return {
        ok: true,
        supabase,
        userId: user.id,
        profile: profileRow,
        actorRole: "player",
        order: orderRow,
      };
    }
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: "你沒有權限操作這筆訂單。" },
      { status: 403 }
    ),
  };
}

function validateAction(
  action: OrderAction,
  actorRole: string,
  order: Record<string, unknown>
) {
  const status = getOrderStatus(order);
  const paymentStatus = getPaymentStatus(order);

  const isStaffLike = actorRole === "admin" || actorRole === "staff";
  const isPlayerLike = actorRole === "player";

  if (action === "cancel") {
    if (!isStaffLike) {
      return "只有客服或管理員可以取消訂單。";
    }

    if (status === "completed") {
      return "已完成的訂單不能取消。";
    }

    return "";
  }

  if (!isStaffLike && !isPlayerLike) {
    return "只有客服、管理員或陪玩師可以操作接單流程。";
  }

  if (paymentStatus !== "paid") {
    return "訂單尚未付款，不能接單或開始服務。";
  }

  if (status === "completed") {
    return "訂單已完成，不能再操作。";
  }

  if (status === "cancelled" || status === "refunded") {
    return "訂單已取消或退款，不能再操作。";
  }

  if (action === "accept") {
    if (
      status !== "paid" &&
      status !== "waiting_player" &&
      status !== "pending_payment"
    ) {
      return "目前狀態不能接單。";
    }

    return "";
  }

  if (action === "start") {
    if (status !== "accepted") {
      return "請先接單後，再開始服務。";
    }

    return "";
  }

  if (action === "complete") {
    if (status !== "accepted" && status !== "in_progress") {
      return "訂單尚未開始，不能完成訂單。";
    }

    return "";
  }

  return "";
}

function getActorName(profile: ProfileRow | null, actorRole: string) {
  const name = profile?.display_name || "";

  if (name) return name;

  if (actorRole === "admin") return "管理員";
  if (actorRole === "staff") return "客服";
  if (actorRole === "player") return "陪玩師";
  return "會員";
}

export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  const access = await canAccessOrder(request, orderId);

  if (!access.ok) {
    return access.response;
  }

  try {
    const body = (await request.json()) as {
      action?: OrderAction;
    };

    const action = body.action;

    if (
      action !== "accept" &&
      action !== "start" &&
      action !== "complete" &&
      action !== "cancel"
    ) {
      return NextResponse.json(
        { error: "不支援的訂單操作。" },
        { status: 400 }
      );
    }

    const validateError = validateAction(
      action,
      access.actorRole,
      access.order
    );

    if (validateError) {
      return NextResponse.json({ error: validateError }, { status: 400 });
    }

    const nextStatus = actionNextStatus[action];

    const { data: updatedOrder, error: updateError } = await access.supabase
      .from("platform_orders")
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("id, order_no, title, status, payment_status, total_amount")
      .single();

    if (updateError || !updatedOrder) {
      return NextResponse.json(
        { error: "更新訂單狀態失敗：" + updateError?.message },
        { status: 500 }
      );
    }

    const actorName = getActorName(access.profile, access.actorRole);

    const systemMessage = `${actorName} ${actionLabel[action]}`;

    const { error: messageError } = await access.supabase
      .from("platform_order_messages")
      .insert({
        order_id: orderId,
        sender_id: access.userId,
        sender_role: access.actorRole,
        body: systemMessage,
        is_system: true,
      });

    if (messageError) {
      console.warn("[order action] insert system message failed:", messageError);
    }

    return NextResponse.json({
      ok: true,
      action,
      status: nextStatus,
      message: systemMessage,
      order: updatedOrder,
    });
  } catch (error) {
    console.error("[order action] failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "操作訂單失敗。",
      },
      { status: 500 }
    );
  }
}