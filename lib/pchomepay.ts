type PchomePayTokenResponse = {
  token: string;
  expired_in: number;
  expired_timestamp: number;
};

type CreatePchomePaymentPayload = {
  order_id: string;
  pay_type: string[];
  amount: number;
  return_url: string;
  fail_return_url: string;
  notify_url: string;
  buyer_email?: string;
  items: {
    name: string;
    url: string;
  }[];
  return_timer?: "Y" | "N";
  member_key?: string;
};

type CreatePchomePaymentResponse = {
  order_id: string;
  payment_url: string;
};

type QueryPchomePaymentResponse = {
  order_id: string;
  amount: string;
  pay_type: string;
  trade_amount: number;
  platform_amount: number;
  pp_fee: number;
  create_date: string | null;
  pay_date: string | null;
  actual_pay_date: string | null;
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

function hasInvalidEnvValue(value: string | undefined) {
  if (!value) return true;

  return (
    value.includes("你的") ||
    value.includes("請填") ||
    value.includes("貼在這裡") ||
    value.includes("真正的")
  );
}

function getPchomeBaseUrl() {
  const baseUrl =
    process.env.PCHOMEPAY_API_URL || "https://sandbox-api.pchomepay.com.tw";

  if (hasInvalidEnvValue(baseUrl)) {
    throw new Error("PCHOMEPAY_API_URL 尚未設定");
  }

  return baseUrl.replace(/\/$/, "");
}

function getPchomeAuthHeader() {
  const appId = process.env.PCHOMEPAY_APP_ID;
  const secret = process.env.PCHOMEPAY_SECRET;

  if (hasInvalidEnvValue(appId)) {
    throw new Error("PCHOMEPAY_APP_ID 尚未設定成真正的 APP ID");
  }

  if (hasInvalidEnvValue(secret)) {
    throw new Error("PCHOMEPAY_SECRET 尚未設定成真正的 SECRET");
  }

  return `Basic ${Buffer.from(`${appId}:${secret}`).toString("base64")}`;
}

async function readJsonOrThrow<T>(response: Response) {
  const text = await response.text();

  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`PChomePay 回應不是 JSON：${text}`);
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as { message?: string }).message)
        : typeof data === "object" && data && "error_type" in data
        ? JSON.stringify(data)
        : text;

    throw new Error(`PChomePay API 失敗：${message}`);
  }

  return data as T;
}

export async function getPchomePayToken() {
  const response = await fetch(`${getPchomeBaseUrl()}/v1/token`, {
    method: "POST",
    headers: {
      Authorization: getPchomeAuthHeader(),
    },
    cache: "no-store",
  });

  const result = await readJsonOrThrow<PchomePayTokenResponse>(response);

  if (!result.token) {
    throw new Error("PChomePay 沒有回傳 token");
  }

  return result;
}

export async function createPchomePayment(
  payload: CreatePchomePaymentPayload
) {
  const token = await getPchomePayToken();

  const response = await fetch(`${getPchomeBaseUrl()}/v1/payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "pcpay-token": token.token,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const result = await readJsonOrThrow<CreatePchomePaymentResponse>(response);

  if (!result.payment_url) {
    throw new Error("PChomePay 沒有回傳 payment_url");
  }

  return result;
}

export async function queryPchomePayment(orderId: string) {
  const token = await getPchomePayToken();

  const response = await fetch(
    `${getPchomeBaseUrl()}/v1/payment/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      headers: {
        "pcpay-token": token.token,
      },
      cache: "no-store",
    }
  );

  return readJsonOrThrow<QueryPchomePaymentResponse>(response);
}