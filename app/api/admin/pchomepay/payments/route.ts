import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function requireAdmin(request: Request) {
  const supabase = getSupabaseAdmin();

  const authHeader = request.headers.get("authorization") || "";
  const accessToken = authHeader.replace("Bearer ", "").trim();

  if (!accessToken) {
    return {
      ok: false as const,
      supabase,
      response: NextResponse.json(
        { error: "請先登入管理員帳號。" },
        { status: 401 }
      ),
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user?.email) {
    return {
      ok: false as const,
      supabase,
      response: NextResponse.json(
        { error: "登入狀態已過期，請重新登入。" },
        { status: 401 }
      ),
    };
  }

  const adminEmails = getAdminEmails();

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return {
      ok: false as const,
      supabase,
      response: NextResponse.json(
        { error: "你沒有權限查看 PChomePay 付款紀錄。" },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true as const,
    supabase,
    user,
  };
}

export async function GET(request: Request) {
  const admin = await requireAdmin(request);

  if (!admin.ok) {
    return admin.response;
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") || "all";
    const keyword = url.searchParams.get("q") || "";
    const limit = Number(url.searchParams.get("limit") || 80);

    let query = admin.supabase
      .from("platform_payments")
      .select(
        `
        id,
        user_id,
        payment_no,
        provider,
        purpose,
        amount,
        currency,
        asd_amount,
        status,
        provider_trade_no,
        provider_payment_url,
        raw_response,
        raw_notify,
        paid_at,
        created_at,
        updated_at
      `
      )
      .eq("provider", "pchomepay")
      .eq("purpose", "wallet_topup")
      .order("created_at", { ascending: false })
      .limit(Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 80);

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (keyword.trim()) {
      query = query.ilike("payment_no", `%${keyword.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "讀取付款紀錄失敗：" + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      payments: data || [],
    });
  } catch (error) {
    console.error("[admin:pchomepay:payments] failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "讀取 PChomePay 付款紀錄失敗。",
      },
      { status: 500 }
    );
  }
}
