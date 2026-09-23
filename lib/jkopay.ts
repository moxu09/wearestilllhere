import { randomBytes, timingSafeEqual } from "node:crypto";
import {
  calculateShippingFee,
  getMerchandiseSlugFromTitle,
  merchandiseCatalog,
  type MerchandiseSlug,
} from "@/lib/merchandiseCatalog";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const defaultCallbackIps = [
  "125.227.158.50",
  "220.133.77.56",
  "59.124.107.103",
  "35.194.172.6",
  "35.244.159.28",
  "175.99.130.66",
  "125.227.158.49",
  "175.99.130.82",
  "35.187.144.191",
];

type CheckoutItem = {
  slug: MerchandiseSlug;
  quantity: number;
};

export type MerchandiseCheckoutRequest = {
  customerName: string;
  phone: string;
  shippingProvider: "7-ELEVEN" | "全家";
  storeName: string;
  items: CheckoutItem[];
};

export function getJkopayConfig() {
  const gatewayUrl = (process.env.JKOPAY_GATEWAY_URL?.trim() || "").replace(/\/$/, "");
  const gatewaySecret = process.env.JKOPAY_GATEWAY_SECRET?.trim() || "";
  const storeId = process.env.JKOPAY_STORE_ID?.trim() || "";
  return {
    available: process.env.JKOPAY_ACCEPT_PAYMENTS === "true" && Boolean(gatewayUrl && gatewaySecret && storeId),
    storeId,
    gatewayUrl,
    gatewaySecret,
    publicBaseUrl: (process.env.JKOPAY_PUBLIC_BASE_URL?.trim() || "https://www.wearestilllhere.com").replace(/\/$/, ""),
    callbackIps: new Set(
      (process.env.JKOPAY_CALLBACK_IPS || defaultCallbackIps.join(","))
        .split(",")
        .map(normalizeIp)
        .filter(Boolean),
    ),
  };
}

function normalizeIp(value: string) {
  const normalized = value.trim();
  return normalized.startsWith("::ffff:") ? normalized.slice(7) : normalized;
}

export function getRequestIp(request: Request) {
  return normalizeIp(request.headers.get("x-real-ip") || "");
}

export function isAllowedCallbackIp(ip: string, allowedIps: Set<string>) {
  return allowedIps.has(normalizeIp(ip));
}

function secureEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

async function callJkopay({
  payload,
  gatewayPath,
}: {
  payload: string;
  gatewayPath: "entry" | "inquiry";
}) {
  const config = getJkopayConfig();
  if (!config.gatewayUrl || !config.gatewaySecret) throw new Error("街口付款通道尚未設定");
  const response = await fetch(`${config.gatewayUrl}/${gatewayPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      Authorization: `Bearer ${config.gatewaySecret}`,
    },
    body: gatewayPath === "entry"
      ? payload
      : JSON.stringify({ platform_order_id: new URLSearchParams(payload).get("platform_order_ids") }),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await response.json()) as {
    result?: string;
    message?: string | null;
    result_object?: Record<string, unknown> | null;
  };
  if (!response.ok) throw new Error(`街口連線失敗（HTTP ${response.status}）`);
  return data;
}

function validateCheckout(input: MerchandiseCheckoutRequest) {
  const customerName = String(input.customerName || "").trim();
  const phone = String(input.phone || "").replace(/[\s-]/g, "");
  const storeName = String(input.storeName || "").trim();
  if (customerName.length < 2 || customerName.length > 50) throw new Error("請填寫正確的取件人姓名");
  if (!/^09\d{8}$/.test(phone)) throw new Error("請填寫正確的台灣手機號碼");
  if (!(["7-ELEVEN", "全家"] as const).includes(input.shippingProvider)) throw new Error("取件超商錯誤");
  if (storeName.length < 2 || storeName.length > 80) throw new Error("請填寫正確的取件門市名稱");

  const quantities = new Map<MerchandiseSlug, number>();
  for (const item of input.items || []) {
    if (!(item.slug in merchandiseCatalog)) throw new Error("購物車包含無效商品");
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("商品數量錯誤");
    quantities.set(item.slug, (quantities.get(item.slug) || 0) + quantity);
  }
  if (!quantities.size) throw new Error("購物車是空的");
  if ([...quantities.values()].reduce((sum, quantity) => sum + quantity, 0) > 99) throw new Error("單筆訂單最多 99 件商品");
  return { customerName, phone, storeName, shippingProvider: input.shippingProvider, quantities };
}

export async function createMerchandisePayment(input: MerchandiseCheckoutRequest) {
  const config = getJkopayConfig();
  if (!config.available) throw new Error("街口付款目前未開放");
  const validated = validateCheckout(input);
  const supabase = getSupabaseAdmin();
  const { data: currentProducts, error: priceError } = await supabase
    .from("site_content_items")
    .select("title,price")
    .eq("content_type", "merchandise")
    .eq("is_active", true);
  if (priceError) throw new Error("暫時無法取得商品價格");
  const livePrices = new Map<MerchandiseSlug, number>();
  for (const item of currentProducts || []) {
    const slug = getMerchandiseSlugFromTitle(item.title);
    const price = Number(item.price);
    if (slug && Number.isFinite(price) && price > 0) livePrices.set(slug, Math.round(price));
  }
  if ([...validated.quantities.keys()].some((slug) => !livePrices.has(slug)))
    throw new Error("購物車包含目前未開放的商品");

  const items = [...validated.quantities].map(([slug, quantity]) => {
    const product = merchandiseCatalog[slug];
    const unitPrice = livePrices.get(slug)!;
    return { slug, name: product.name, unit_price: unitPrice, quantity, subtotal: unitPrice * quantity };
  });
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const shippingFee = calculateShippingFee(subtotal);
  const totalAmount = subtotal + shippingFee;
  const suffix = randomBytes(5).toString("hex").toUpperCase();
  const orderNo = `WEB-${Date.now()}-${suffix}`;
  const platformOrderId = `WASH-${Date.now()}-${suffix}`;

  const { error: insertError } = await supabase.from("merchandise_orders").insert({
    order_no: orderNo,
    platform_order_id: platformOrderId,
    customer_name: validated.customerName,
    phone: validated.phone,
    shipping_provider: validated.shippingProvider,
    store_name: validated.storeName,
    items,
    subtotal,
    shipping_fee: shippingFee,
    total_amount: totalAmount,
    status: "pending",
    payment_method: "街口支付",
  });
  if (insertError) throw new Error(insertError.message || "無法建立商品訂單");

  const payload = JSON.stringify({
    platform_order_id: platformOrderId,
    store_id: config.storeId,
    currency: "TWD",
    total_price: totalAmount,
    final_price: totalAmount,
    unredeem: 0,
    result_url: `${config.publicBaseUrl}/api/payments/jkopay/merchandise/result`,
    result_display_url: `${config.publicBaseUrl}/merchandise/payment-result?order=${encodeURIComponent(platformOrderId)}`,
    payment_type: "onetime",
    escrow: false,
    products: [
      ...items.map((item) => ({
        name: item.name,
        unit_count: item.quantity,
        unit_price: item.unit_price,
        unit_final_price: item.unit_price,
      })),
      ...(shippingFee
        ? [{ name: "超商取貨運費", unit_count: 1, unit_price: shippingFee, unit_final_price: shippingFee }]
        : []),
    ],
  });

  try {
    const result = await callJkopay({
      payload,
      gatewayPath: "entry",
    });
    const resultObject = result.result_object as
      | { payment_url?: string; qr_img?: string; qr_timeout?: number }
      | undefined;
    if (result.result !== "000" || !resultObject?.payment_url) {
      throw new Error(result.message || `街口建立付款失敗（${result.result || "unknown"}）`);
    }
    await supabase
      .from("merchandise_orders")
      .update({
        payment_url: resultObject.payment_url,
        qr_img: resultObject.qr_img || null,
        qr_timeout: resultObject.qr_timeout || null,
        updated_at: new Date().toISOString(),
      })
      .eq("platform_order_id", platformOrderId);
    return { orderNo, platformOrderId, paymentUrl: resultObject.payment_url };
  } catch (error) {
    await supabase
      .from("merchandise_orders")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("platform_order_id", platformOrderId);
    throw error;
  }
}

export async function inquireJkopay(platformOrderId: string) {
  const query = `platform_order_ids=${encodeURIComponent(platformOrderId)}`;
  const result = await callJkopay({
    payload: query,
    gatewayPath: "inquiry",
  });
  if (result.result !== "000") throw new Error(result.message || "街口查單失敗");
  const resultObject = result.result_object as
    | { transactions?: Array<Record<string, unknown>> }
    | undefined;
  const transactions = resultObject?.transactions || [];
  return transactions.find((transaction) => transaction.platform_order_id === platformOrderId);
}

export async function completeMerchandisePayment(callback: Record<string, unknown>) {
  const callbackTransaction = callback.transaction as Record<string, unknown> | undefined;
  const platformOrderId = String(callbackTransaction?.platform_order_id || "");
  if (!platformOrderId) throw new Error("缺少街口訂單編號");
  const supabase = getSupabaseAdmin();
  const { data: order, error } = await supabase
    .from("merchandise_orders")
    .select("platform_order_id,total_amount")
    .eq("platform_order_id", platformOrderId)
    .maybeSingle();
  if (error || !order) throw new Error("找不到商品訂單");

  const transaction = await inquireJkopay(platformOrderId);
  if (!transaction || Number(transaction.status) !== 0) throw new Error("街口查單尚未付款成功");
  if (Number(transaction.final_price) !== Number(order.total_amount)) throw new Error("街口付款金額不符");
  if (
    callbackTransaction?.tradeNo &&
    !secureEqual(String(callbackTransaction.tradeNo), String(transaction.tradeNo || ""))
  ) {
    throw new Error("街口交易序號不符");
  }

  const { error: completeError } = await supabase.rpc("complete_jkopay_merchandise_order", {
    p_platform_order_id: platformOrderId,
    p_trade_no: String(transaction.tradeNo || ""),
    p_amount: Number(transaction.final_price),
    p_trans_time: String(transaction.trans_time || ""),
    p_raw_result: transaction,
  });
  if (completeError) throw new Error(completeError.message || "商品付款入帳失敗");
}
