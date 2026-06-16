import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { queryPchomePayment } from "@/lib/pchomepay";

type PchomeNotifyMessage = {
  order_id: string;
  amount: string;
  pay_type: string;
  trade_amount: number;
  platform_amount: number;
  pp_fee: number;
  create_date: string | null;
  pay_date: string | null;
  actual_pay_date?: string | null;
  fail_date: string | null;
  status: "S" | "W" | "F";
  status_code: string | null;
  payment_info: Record<string, unknown> | null;
  available_date: string | null;
  items: {
    name: string;
    url: string;
  }[];
};

function textResponse(text: string, status = 200) {
  return new Response(text, {
    status,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

async function readNotifyBody(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  let notifyType = "";
  let notifyMessageRaw = "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    notifyType = String(formData.get("notify_type") || "");
    notifyMessageRaw = String(formData.get("notify_message") || "");
  } else {
    const body = (await request.json()) as {
      notify_type?: string;
      notify_message?: string | PchomeNotifyMessage;
    };

    notifyType = String(body.notify_type || "");

    notifyMessageRaw =
      typeof body.notify_message === "string"
        ? body.notify_message
        : JSON.stringify(body.notify_message || {});
  }

  return {
    notifyType,
    notifyMessageRaw,
  };
}

export async function POST(request: Request) {
  const supabase = getSupabaseAdmin();

  try {
    const { notifyType, notifyMessageRaw } = await readNotifyBody(request);

    if (!notifyType || !notifyMessageRaw) {
      console.warn("[pchomepay:notify] missing fields");
      return textResponse("success");
    }

    const notifyMessage = JSON.parse(
      notifyMessageRaw
    ) as PchomeNotifyMessage;

    const paymentNo = notifyMessage.order_id;

    if (!paymentNo) {
      console.warn("[pchomepay:notify] missing order_id");
      return textResponse("success");
    }

    const { data: payment, error: paymentError } = await supabase
      .from("platform_payments")
      .select("*")
      .eq("payment_no", paymentNo)
      .maybeSingle();

    if (paymentError) {
      console.error("[pchomepay:notify] read payment failed:", paymentError);
      return textResponse("retry", 500);
    }

    if (!payment) {
      console.warn("[pchomepay:notify] payment not found:", paymentNo);
      return textResponse("success");
    }

    if (payment.status === "paid") {
      return textResponse("success");
    }

    if (notifyType === "order_confirm" && notifyMessage.status === "S") {
      const checkedOrder = await queryPchomePayment(paymentNo);

      const checkedAmount = Number(checkedOrder.amount || 0);
      const expectedAmount = Number(payment.amount || 0);

      if (checkedOrder.status !== "S" || checkedAmount !== expectedAmount) {
        console.error("[pchomepay:notify] order verify failed:", {
          checkedStatus: checkedOrder.status,
          checkedAmount,
          expectedAmount,
        });

        return textResponse("retry", 500);
      }

      const { error: creditError } = await supabase.rpc(
        "platform_credit_wallet_for_payment",
        {
          p_payment_id: payment.id,
          p_checked_order: checkedOrder,
        }
      );

      if (creditError) {
        console.error("[pchomepay:notify] credit wallet failed:", creditError);
        return textResponse("retry", 500);
      }

      return textResponse("success");
    }

    const nextStatus =
      notifyType === "order_expired"
        ? "expired"
        : notifyType === "order_failed"
        ? "failed"
        : notifyMessage.status === "F"
        ? "failed"
        : "pending";

    const { error: statusUpdateError } = await supabase
      .from("platform_payments")
      .update({
        status: nextStatus,
        raw_notify: {
          notify_type: notifyType,
          notify_message: notifyMessage,
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (statusUpdateError) {
      console.error(
        "[pchomepay:notify] payment status update failed:",
        statusUpdateError
      );
      return textResponse("retry", 500);
    }

    return textResponse("success");
  } catch (error) {
    console.error("[pchomepay:notify] failed:", error);
    return textResponse("retry", 500);
  }
}