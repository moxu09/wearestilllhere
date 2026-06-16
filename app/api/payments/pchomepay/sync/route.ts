import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { queryPchomePayment } from "@/lib/pchomepay";

type CreditResult = {
  ok?: boolean;
  status?: string;
  message?: string;
  balance_after?: number;
};

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();

    const authHeader = request.headers.get("authorization") || "";
    const accessToken = authHeader.replace("Bearer ", "").trim();

    if (!accessToken) {
      return NextResponse.json(
        { error: "請先登入後再查詢付款狀態。" },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        { error: "登入狀態已過期，請重新登入。" },
        { status: 401 }
      );
    }

    const body = (await request.json()) as {
      payment_no?: string;
    };

    const paymentNo = String(body.payment_no || "").trim();

    if (!paymentNo) {
      return NextResponse.json(
        { error: "缺少付款編號。" },
        { status: 400 }
      );
    }

    const { data: payment, error: paymentError } = await supabase
      .from("platform_payments")
      .select("*")
      .eq("payment_no", paymentNo)
      .eq("user_id", user.id)
      .maybeSingle();

    if (paymentError) {
      return NextResponse.json(
        { error: "讀取付款紀錄失敗：" + paymentError.message },
        { status: 500 }
      );
    }

    if (!payment) {
      return NextResponse.json(
        { error: "找不到這筆付款紀錄。" },
        { status: 404 }
      );
    }

    if (payment.status === "paid") {
      return NextResponse.json({
        ok: true,
        status: "paid",
        message: "這筆付款已入帳。",
      });
    }

    const checkedOrder = await queryPchomePayment(paymentNo);

    const checkedAmount = Number(checkedOrder.amount || 0);
    const expectedAmount = Number(payment.amount || 0);

    if (checkedAmount !== expectedAmount) {
      return NextResponse.json(
        { error: "PChomePay 回傳金額與系統紀錄不一致。" },
        { status: 400 }
      );
    }

    if (checkedOrder.status === "S") {
      const { data: creditResult, error: creditError } = await supabase.rpc(
        "platform_credit_wallet_for_payment",
        {
          p_payment_id: payment.id,
          p_checked_order: checkedOrder,
        }
      );

      if (creditError) {
        return NextResponse.json(
          { error: "入帳失敗：" + creditError.message },
          { status: 500 }
        );
      }

      const result = creditResult as CreditResult | null;

      return NextResponse.json({
        ok: true,
        status: "paid",
        message: result?.message || "付款成功，ASD 已入帳。",
        balance_after: result?.balance_after,
      });
    }

    const nextStatus =
      checkedOrder.status === "F"
        ? "failed"
        : checkedOrder.status === "W"
        ? "pending"
        : "pending";

    const { error: updateError } = await supabase
      .from("platform_payments")
      .update({
        status: nextStatus,
        raw_notify: {
          source: "manual_sync",
          checked_order: checkedOrder,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updateError) {
      return NextResponse.json(
        { error: "更新付款狀態失敗：" + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      status: nextStatus,
      message:
        checkedOrder.status === "W"
          ? "付款仍在等待中。"
          : "付款尚未完成。",
    });
  } catch (error) {
    console.error("[pchomepay:sync] failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "同步 PChomePay 付款狀態失敗。",
      },
      { status: 500 }
    );
  }
}