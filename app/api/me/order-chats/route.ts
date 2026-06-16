import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

type ProfileRow = {
  id: string;
  role: string | null;
  display_name: string | null;
};

type OrderRow = {
  id: string;
  order_no: string | null;
  title: string | null;
  total_amount: number | null;
  payment_status: string | null;
  status: string | null;
  created_at: string;
  platform_players?: {
    nickname: string | null;
    avatar_url: string | null;
  } | null;
};

type MessageRow = {
  id: string;
  order_id: string;
  body: string;
  sender_role: string;
  created_at: string;
};

const orderSelect = `
  id,
  order_no,
  title,
  total_amount,
  payment_status,
  status,
  created_at,
  platform_players (
    nickname,
    avatar_url
  )
`;

const fallbackOrderSelect = `
  id,
  order_no,
  title,
  total_amount,
  payment_status,
  status,
  created_at
`;

function normalizeOrder(row: Record<string, unknown>): OrderRow {
  const rawPlayer = row.platform_players;

  let player: OrderRow["platform_players"] = null;

  if (Array.isArray(rawPlayer)) {
    const first = rawPlayer[0] as Record<string, unknown> | undefined;

    if (first) {
      player = {
        nickname: typeof first.nickname === "string" ? first.nickname : null,
        avatar_url:
          typeof first.avatar_url === "string" ? first.avatar_url : null,
      };
    }
  } else if (rawPlayer && typeof rawPlayer === "object") {
    const playerRow = rawPlayer as Record<string, unknown>;

    player = {
      nickname:
        typeof playerRow.nickname === "string" ? playerRow.nickname : null,
      avatar_url:
        typeof playerRow.avatar_url === "string"
          ? playerRow.avatar_url
          : null,
    };
  }

  return {
    id: String(row.id || ""),
    order_no: typeof row.order_no === "string" ? row.order_no : null,
    title: typeof row.title === "string" ? row.title : null,
    total_amount:
      typeof row.total_amount === "number" ? row.total_amount : Number(row.total_amount || 0),
    payment_status:
      typeof row.payment_status === "string" ? row.payment_status : null,
    status: typeof row.status === "string" ? row.status : null,
    created_at:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date().toISOString(),
    platform_players: player,
  };
}

function dedupeOrders(orders: OrderRow[]) {
  const map = new Map<string, OrderRow>();

  for (const order of orders) {
    if (order.id) {
      map.set(order.id, order);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
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
        { error: "請先登入後再查看聊天室。" },
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

async function readProfile(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string
) {
  const { data } = await supabase
    .from("platform_profiles")
    .select("id, role, display_name")
    .eq("id", userId)
    .maybeSingle();

  return (data || null) as ProfileRow | null;
}

async function queryOrdersByColumn(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  column: string,
  value: string
) {
  const first = await supabase
    .from("platform_orders")
    .select(orderSelect)
    .eq(column, value)
    .order("created_at", { ascending: false })
    .limit(60);

  if (!first.error && first.data) {
    return (first.data as unknown as Record<string, unknown>[]).map(
      normalizeOrder
    );
  }

  const second = await supabase
    .from("platform_orders")
    .select(fallbackOrderSelect)
    .eq(column, value)
    .order("created_at", { ascending: false })
    .limit(60);

  if (!second.error && second.data) {
    return (second.data as unknown as Record<string, unknown>[]).map(
      normalizeOrder
    );
  }

  return [];
}

async function queryOrdersByColumnIn(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  column: string,
  values: string[]
) {
  if (values.length === 0) return [];

  const first = await supabase
    .from("platform_orders")
    .select(orderSelect)
    .in(column, values)
    .order("created_at", { ascending: false })
    .limit(60);

  if (!first.error && first.data) {
    return (first.data as unknown as Record<string, unknown>[]).map(
      normalizeOrder
    );
  }

  const second = await supabase
    .from("platform_orders")
    .select(fallbackOrderSelect)
    .in(column, values)
    .order("created_at", { ascending: false })
    .limit(60);

  if (!second.error && second.data) {
    return (second.data as unknown as Record<string, unknown>[]).map(
      normalizeOrder
    );
  }

  return [];
}

async function queryAdminOrders(
  supabase: ReturnType<typeof getSupabaseAdmin>
) {
  const first = await supabase
    .from("platform_orders")
    .select(orderSelect)
    .order("created_at", { ascending: false })
    .limit(80);

  if (!first.error && first.data) {
    return (first.data as unknown as Record<string, unknown>[]).map(
      normalizeOrder
    );
  }

  const second = await supabase
    .from("platform_orders")
    .select(fallbackOrderSelect)
    .order("created_at", { ascending: false })
    .limit(80);

  if (!second.error && second.data) {
    return (second.data as unknown as Record<string, unknown>[]).map(
      normalizeOrder
    );
  }

  throw new Error(first.error?.message || second.error?.message || "讀取訂單失敗");
}

async function queryPlayerIds(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string
) {
  const columns = ["user_id", "owner_id", "profile_id"];
  const ids: string[] = [];

  for (const column of columns) {
    const { data } = await supabase
      .from("platform_players")
      .select("id")
      .eq(column, userId)
      .limit(30);

    for (const row of data || []) {
      if (row.id && !ids.includes(row.id)) {
        ids.push(row.id);
      }
    }
  }

  return ids;
}

async function readLatestMessages(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  orderIds: string[]
) {
  if (orderIds.length === 0) {
    return new Map<string, MessageRow>();
  }

  const { data, error } = await supabase
    .from("platform_order_messages")
    .select("id, order_id, body, sender_role, created_at")
    .in("order_id", orderIds)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data) {
    return new Map<string, MessageRow>();
  }

  const map = new Map<string, MessageRow>();

  for (const message of data as MessageRow[]) {
    if (!map.has(message.order_id)) {
      map.set(message.order_id, message);
    }
  }

  return map;
}

export async function GET(request: Request) {
  const current = await getCurrentUser(request);

  if (!current.ok) {
    return current.response;
  }

  try {
    const { supabase, user } = current;
    const profile = await readProfile(supabase, user.id);
    const role = profile?.role || "";

    let orders: OrderRow[] = [];

    if (role === "admin" || role === "staff") {
      orders = await queryAdminOrders(supabase);
    } else {
      const customerColumns = [
        "user_id",
        "customer_id",
        "buyer_id",
        "member_id",
        "client_id",
        "created_by",
      ];

      const playerUserColumns = [
        "player_user_id",
        "accepted_by",
        "assignee_id",
        "player_member_id",
      ];

      const playerIdColumns = [
        "player_id",
        "platform_player_id",
        "assigned_player_id",
      ];

      const chunks: OrderRow[][] = [];

      for (const column of customerColumns) {
        chunks.push(await queryOrdersByColumn(supabase, column, user.id));
      }

      for (const column of playerUserColumns) {
        chunks.push(await queryOrdersByColumn(supabase, column, user.id));
      }

      const playerIds = await queryPlayerIds(supabase, user.id);

      for (const column of playerIdColumns) {
        chunks.push(await queryOrdersByColumnIn(supabase, column, playerIds));
      }

      orders = dedupeOrders(chunks.flat());
    }

    orders = dedupeOrders(orders).slice(0, 80);

    const latestMessageMap = await readLatestMessages(
      supabase,
      orders.map((order) => order.id)
    );

    return NextResponse.json({
      profile: {
        id: user.id,
        role,
        display_name: profile?.display_name || null,
      },
      orders: orders.map((order) => {
        const latestMessage = latestMessageMap.get(order.id);

        return {
          ...order,
          latest_message: latestMessage
            ? {
                body: latestMessage.body,
                sender_role: latestMessage.sender_role,
                created_at: latestMessage.created_at,
              }
            : null,
        };
      }),
    });
  } catch (error) {
    console.error("[me order chats] failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "讀取聊天室清單失敗。",
      },
      { status: 500 }
    );
  }
}