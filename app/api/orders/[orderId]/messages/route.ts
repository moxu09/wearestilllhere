import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type RouteContext = {
  params: Promise<{
    orderId: string;
  }>;
};

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

function getValue(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];

    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
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
        { error: "請先登入後再使用訂單聊天室。" },
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

  if (role === "admin") {
    return {
      ok: true,
      supabase,
      userId: user.id,
      profile: profileRow,
      actorRole: "admin",
      order,
    };
  }

  if (role === "staff") {
    return {
      ok: true,
      supabase,
      userId: user.id,
      profile: profileRow,
      actorRole: "staff",
      order,
    };
  }

  const orderRow = order as Record<string, unknown>;

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
      order,
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
      order,
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
        order,
      };
    }
  }

  return {
    ok: false,
    response: NextResponse.json(
      { error: "你沒有權限查看這筆訂單聊天室。" },
      { status: 403 }
    ),
  };
}

function getOrderTitle(order: Record<string, unknown>) {
  const title =
    typeof order.title === "string" && order.title.trim()
      ? order.title
      : "訂單聊天室";

  const orderNo =
    typeof order.order_no === "string" && order.order_no.trim()
      ? order.order_no
      : "";

  return {
    title,
    order_no: orderNo,
    status: typeof order.status === "string" ? order.status : "",
    payment_status:
      typeof order.payment_status === "string" ? order.payment_status : "",
    total_amount:
      typeof order.total_amount === "number" ? order.total_amount : 0,
  };
}

export async function GET(request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  const access = await canAccessOrder(request, orderId);

  if (!access.ok) {
    return access.response;
  }

  try {
    const { data: messages, error: messagesError } = await access.supabase
      .from("platform_order_messages")
      .select(
        `
        id,
        order_id,
        sender_id,
        sender_role,
        body,
        attachment_url,
        attachment_type,
        is_system,
        created_at,
        updated_at
      `
      )
      .eq("order_id", orderId)
      .order("created_at", { ascending: true })
      .limit(300);

    if (messagesError) {
      return NextResponse.json(
        { error: "讀取聊天室訊息失敗：" + messagesError.message },
        { status: 500 }
      );
    }

    const senderIds = Array.from(
      new Set((messages || []).map((message) => message.sender_id))
    );

    let profiles: ProfileRow[] = [];

    if (senderIds.length > 0) {
      const { data: profileRows } = await access.supabase
        .from("platform_profiles")
        .select("id, role, display_name")
        .in("id", senderIds);

      profiles = (profileRows || []) as ProfileRow[];
    }

    const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));

    const cleanMessages = (messages || []).map((message) => {
      const senderProfile = profileMap.get(message.sender_id);

      return {
        ...message,
        sender_name:
          senderProfile?.display_name ||
          (message.sender_id === access.userId ? "我" : "使用者"),
        sender_profile_role: senderProfile?.role || null,
        is_mine: message.sender_id === access.userId,
      };
    });

    return NextResponse.json({
      order: getOrderTitle(access.order),
      actor_role: access.actorRole,
      messages: cleanMessages,
    });
  } catch (error) {
    console.error("[order messages:get] failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "讀取訂單聊天室失敗。",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  const access = await canAccessOrder(request, orderId);

  if (!access.ok) {
    return access.response;
  }

  try {
    const body = (await request.json()) as {
      body?: string;
    };

    const messageBody = String(body.body || "").trim();

    if (!messageBody) {
      return NextResponse.json(
        { error: "訊息內容不能是空白。" },
        { status: 400 }
      );
    }

    if (messageBody.length > 2000) {
      return NextResponse.json(
        { error: "單則訊息最多 2000 字。" },
        { status: 400 }
      );
    }

    const { data: message, error: insertError } = await access.supabase
      .from("platform_order_messages")
      .insert({
        order_id: orderId,
        sender_id: access.userId,
        sender_role: access.actorRole,
        body: messageBody,
      })
      .select(
        `
        id,
        order_id,
        sender_id,
        sender_role,
        body,
        attachment_url,
        attachment_type,
        is_system,
        created_at,
        updated_at
      `
      )
      .single();

    if (insertError || !message) {
      return NextResponse.json(
        { error: "送出訊息失敗：" + insertError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: {
        ...message,
        sender_name: access.profile?.display_name || "我",
        sender_profile_role: access.profile?.role || null,
        is_mine: true,
      },
    });
  } catch (error) {
    console.error("[order messages:post] failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "送出聊天室訊息失敗。",
      },
      { status: 500 }
    );
  }
}