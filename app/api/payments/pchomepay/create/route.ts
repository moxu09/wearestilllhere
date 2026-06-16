import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { createPchomePayment } from "@/lib/pchomepay";

const allowedPayTypes = ["CARD", "ATM", "PI"] as const;

type AllowedPayType = (typeof allowedPayTypes)[number];

type CreatePaymentBody = {
  amount?: number;
  payType?: string[];
};

function makePaymentNo() {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `WASH${Date.now()}${random}`;
}

function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
}

function hasInvalidEnvValue(value: string | undefined) {
  if (!value) return true;

  return (
    value.includes("你的") ||
    value.includes("請填") ||
    value.includes("貼在這裡") ||
    value.includes("真正的")
  );
}

function assertPchomeEnv() {
  if (hasInvalidEnvValue(process.env.PCHOMEPAY_APP_ID)) {
    throw new Error("PCHOMEPAY_APP_ID 尚未設定成真正的 APP ID");
  }

  if (hasInvalidEnvValue(process.env.PCHOMEPAY_SECRET)) {
    throw new Error("PCHOMEPAY_SECRET 尚未設定成真正的 SECRET");
  }

  if (hasInvalidEnvValue(process.env.PCHOMEPAY_API_URL)) {
    throw new Error("PCHOMEPAY_API_URL 尚未設定");
  }
}

function normalizePayTypes(rawPayTypes: string[] | undefined): AllowedPayType[] {
  if (!rawPayTypes || rawPayTypes.length === 0) {
    return ["CARD"];
  }

  const cleanPayTypes = rawPayTypes.filter((payType): payType is AllowedPayType =>
    allowedPayTypes.includes(payType as AllowedPayType)
  );

  return cleanPayTypes.length > 0 ? cleanPayTypes : ["CARD"];
}

function validateAmount(amount: number, payTypes: AllowedPayType[]) {
  if (!Number.isInteger(amount)) {
    return "儲值金額必須是整數。";
  }

  if (amount <= 0) {
    return "儲值金額必須大於 0。";
  }

  if (payTypes.includes("CARD") && amount < 30) {
    return "信用卡付款金額至少需要 30 元。";
  }

  if (payTypes.includes("ATM") && amount > 49999) {
    return "ATM 付款單筆上限為 49,999 元。";
  }

  if (amount > 199999) {
    return "單筆儲值金額過高，請降低金額。";
  }

  return "";
}

export async function POST(request: Request) {
  let paymentNo = "";

  try {
    assertPchomeEnv();

    const supabase = getSupabaseAdmin();

    const authHeader = request.headers.get("authorization") || "";
    const accessToken = authHeader.replace("Bearer ", "").trim();

    if (!accessToken) {
      return NextResponse.json(
        { error: "請先登入後再儲值。" },
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

    const body = (await request.json()) as CreatePaymentBody;

    const amount = Number(body.amount || 0);
    const payType = normalizePayTypes(body.payType);
    const amountError = validateAmount(amount, payType);

    if (amountError) {
      return NextResponse.json({ error: amountError }, { status: 400 });
    }

    const siteUrl = getSiteUrl();
    paymentNo = makePaymentNo();

    const requestPayload = {
      order_id: paymentNo,
      pay_type: payType,
      amount,
      return_url: `${siteUrl}/wallet/topup/result?payment_no=${paymentNo}`,
      fail_return_url: `${siteUrl}/wallet/topup/result?payment_no=${paymentNo}&failed=1`,
      notify_url: `${siteUrl}/api/payments/pchomepay/notify`,
      buyer_email: user.email || undefined,
      member_key: user.id.replaceAll("-", "").slice(0, 30),
      return_timer: "N" as const,
      items: [
        {
          name: `深夜不關燈 ASD 儲值 ${amount} 點`,
          url: `${siteUrl}/wallet/topup`,
        },
      ],
    };

    const { data: paymentRow, error: insertError } = await supabase
      .from("platform_payments")
      .insert({
        user_id: user.id,
        payment_no: paymentNo,
        provider: "pchomepay",
        purpose: "wallet_topup",
        amount,
        currency: "TWD",
        asd_amount: amount,
        status: "pending",
        raw_request: requestPayload,
      })
      .select("id")
      .single();

    if (insertError || !paymentRow) {
      return NextResponse.json(
        { error: "建立付款紀錄失敗：" + insertError?.message },
        { status: 500 }
      );
    }

    try {
      const pchomeResult = await createPchomePayment(requestPayload);

      const { error: updateError } = await supabase
        .from("platform_payments")
        .update({
          provider_payment_url: pchomeResult.payment_url,
          raw_response: pchomeResult,
          updated_at: new Date().toISOString(),
        })
        .eq("payment_no", paymentNo);

      if (updateError) {
        console.warn(
          "[pchomepay:create] update payment url failed:",
          updateError
        );
      }

      return NextResponse.json({
        payment_no: paymentNo,
        payment_url: pchomeResult.payment_url,
      });
    } catch (pchomeError) {
      const errorMessage =
        pchomeError instanceof Error
          ? pchomeError.message
          : "PChomePay 建立付款失敗";

      const { error: failedUpdateError } = await supabase
        .from("platform_payments")
        .update({
          status: "failed",
          raw_response: {
            error: errorMessage,
          },
          updated_at: new Date().toISOString(),
        })
        .eq("payment_no", paymentNo);

      if (failedUpdateError) {
        console.warn(
          "[pchomepay:create] update failed status failed:",
          failedUpdateError
        );
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("[pchomepay:create] failed:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "建立 PChomePay 付款失敗。",
      },
      { status: 500 }
    );
  }
}