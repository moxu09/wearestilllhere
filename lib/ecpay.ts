import { randomBytes } from "node:crypto";
import {
  calculateShippingFee,
  getMerchandiseSlugFromTitle,
  merchandiseCatalog,
  type MerchandiseSlug,
} from "@/lib/merchandiseCatalog";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import type { MerchandiseCheckoutRequest } from "@/lib/jkopay";
import { checkMacValue, verifyEcpayMac } from "@/lib/ecpayMac";

const stageUrl = "https://payment-stage.ecpay.com.tw/Cashier/AioCheckOut/V5";
const productionUrl = "https://payment.ecpay.com.tw/Cashier/AioCheckOut/V5";

export function getEcpayConfig() {
  const merchantId = process.env.ECPAY_MERCHANT_ID?.trim() || "";
  const hashKey = process.env.ECPAY_HASH_KEY?.trim() || "";
  const hashIv = process.env.ECPAY_HASH_IV?.trim() || "";
  const baseUrl = (process.env.ECPAY_PUBLIC_BASE_URL?.trim() || "https://www.wearestilllhere.com").replace(/\/$/, "");
  const stage = process.env.ECPAY_ENV === "stage";
  const available = Boolean(merchantId && hashKey && hashIv && process.env.ECPAY_ACCEPT_PAYMENTS === "true");
  return { merchantId, hashKey, hashIv, baseUrl, stage, available, checkoutUrl: stage ? stageUrl : productionUrl };
}

export function verifyEcpayCallback(fields: Record<string, string>, config = getEcpayConfig()) {
  if (!config.merchantId || !config.hashKey || !config.hashIv || fields.MerchantID !== config.merchantId) return false;
  return verifyEcpayMac(fields, config.hashKey, config.hashIv);
}

function merchantTradeDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}/${values.month}/${values.day} ${values.hour}:${values.minute}:${values.second}`;
}

function cleanTradeText(value: string, maxLength: number) {
  return value.replace(/[&<>#]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function createEcpayMerchandisePayment(input: MerchandiseCheckoutRequest) {
  const config = getEcpayConfig();
  if (!config.available) throw new Error("綠界支付尚未開放");
  const customerName = String(input.customerName || "").trim();
  const phone = String(input.phone || "").replace(/[\s-]/g, "");
  const storeName = String(input.storeName || "").trim();
  if (customerName.length < 2 || customerName.length > 50) throw new Error("請填寫正確的取件人姓名");
  if (!/^09\d{8}$/.test(phone)) throw new Error("請填寫正確的台灣手機號碼");
  if (!["7-ELEVEN", "全家"].includes(input.shippingProvider)) throw new Error("取件超商錯誤");
  if (storeName.length < 2 || storeName.length > 80) throw new Error("請填寫正確的取件門市名稱");

  const quantities = new Map<MerchandiseSlug, number>();
  for (const item of input.items || []) {
    if (!(item.slug in merchandiseCatalog)) throw new Error("購物車包含無效商品");
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("商品數量錯誤");
    quantities.set(item.slug, (quantities.get(item.slug) || 0) + quantity);
  }
  if (!quantities.size || [...quantities.values()].reduce((sum, quantity) => sum + quantity, 0) > 99)
    throw new Error("商品數量錯誤");

  const supabase = getSupabaseAdmin();
  const { data: currentProducts, error: priceError } = await supabase
    .from("site_content_items").select("title,price").eq("content_type", "merchandise").eq("is_active", true);
  if (priceError) throw new Error("暫時無法取得商品價格");
  const livePrices = new Map<MerchandiseSlug, number>();
  for (const item of currentProducts || []) {
    const slug = getMerchandiseSlugFromTitle(item.title);
    const price = Number(item.price);
    if (slug && Number.isFinite(price) && price > 0) livePrices.set(slug, Math.round(price));
  }
  if ([...quantities.keys()].some((slug) => !livePrices.has(slug)))
    throw new Error("購物車包含目前未開放的商品");
  const items = [...quantities].map(([slug, quantity]) => {
    const product = merchandiseCatalog[slug];
    const unitPrice = livePrices.get(slug)!;
    return { slug, name: product.name, unit_price: unitPrice, quantity, subtotal: unitPrice * quantity };
  });
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const shippingFee = calculateShippingFee(subtotal);
  const totalAmount = subtotal + shippingFee;
  if (!Number.isInteger(totalAmount) || totalAmount < 6 || totalAmount > 199_999)
    throw new Error("綠界信用卡單筆金額須介於 NT$6 至 NT$199,999");

  const suffix = randomBytes(5).toString("hex").toUpperCase();
  const orderNo = `WEB-${Date.now()}-${suffix}`;
  const merchantTradeNo = `DNW${Date.now().toString(36).toUpperCase()}${suffix.slice(0, 8)}`;
  if (merchantTradeNo.length > 20) throw new Error("綠界交易編號過長");
  const { error: insertError } = await supabase.from("merchandise_orders").insert({
    order_no: orderNo,
    platform_order_id: merchantTradeNo,
    customer_name: customerName,
    phone,
    shipping_provider: input.shippingProvider,
    store_name: storeName,
    items,
    subtotal,
    shipping_fee: shippingFee,
    total_amount: totalAmount,
    status: "pending",
    payment_method: "綠界支付",
  });
  if (insertError) throw new Error(insertError.message || "無法建立商品訂單");

  const fields: Record<string, string> = {
    MerchantID: config.merchantId,
    MerchantTradeNo: merchantTradeNo,
    MerchantTradeDate: merchantTradeDate(),
    PaymentType: "aio",
    TotalAmount: String(totalAmount),
    TradeDesc: "深夜不關燈周邊商品",
    ItemName: items.map((item) => cleanTradeText(`${item.name} x${item.quantity}`, 70)).join("#").slice(0, 400),
    ReturnURL: `${config.baseUrl}/api/payments/ecpay/merchandise/result`,
    OrderResultURL: `${config.baseUrl}/api/payments/ecpay/merchandise/display`,
    ChoosePayment: "Credit",
    EncryptType: "1",
  };
  fields.CheckMacValue = checkMacValue(fields, config.hashKey, config.hashIv);
  return { orderNo, merchantTradeNo, action: config.checkoutUrl, fields };
}

export async function completeEcpayMerchandisePayment(fields: Record<string, string>) {
  const config = getEcpayConfig();
  if (!verifyEcpayCallback(fields, config)) throw new Error("綠界通知驗證失敗");
  if (fields.RtnCode !== "1" || fields.SimulatePaid === "1") return false;
  const merchantTradeNo = fields.MerchantTradeNo || "";
  const amount = Number(fields.TradeAmt);
  if (!/^[A-Za-z0-9]{1,20}$/.test(merchantTradeNo) || !Number.isInteger(amount) || amount <= 0 || !fields.TradeNo)
    throw new Error("綠界付款通知資料不完整");
  const { error } = await getSupabaseAdmin().rpc("complete_ecpay_merchandise_order", {
    p_merchant_trade_no: merchantTradeNo,
    p_trade_no: fields.TradeNo,
    p_amount: amount,
    p_payment_date: fields.PaymentDate || null,
    p_raw_result: fields,
  });
  if (error) throw new Error(error.message || "商品付款入帳失敗");
  return true;
}

export async function createEcpayServiceCheckout(merchantTradeNo: string) {
  const config = getEcpayConfig();
  if (!config.available) throw new Error("綠界支付尚未開放");
  if (!/^[A-Za-z0-9]{1,20}$/.test(merchantTradeNo)) throw new Error("綠界交易編號格式錯誤");
  const { data: payment, error } = await getSupabaseAdmin()
    .from("ecpay_service_payments")
    .select("merchant_trade_no,organization_code,amount,description,status,created_at")
    .eq("merchant_trade_no", merchantTradeNo)
    .maybeSingle();
  if (error || !payment) throw new Error("找不到綠界付款單");
  if (payment.status !== "pending") throw new Error("這筆付款已完成或不可付款");
  if (Date.now() - Date.parse(payment.created_at) > 24 * 60 * 60 * 1000)
    throw new Error("付款連結已過期，請回到 Discord 重新建立訂單");
  const amount = Number(payment.amount);
  if (!Number.isInteger(amount) || amount < 6 || amount > 199_999) throw new Error("綠界信用卡付款金額錯誤");
  const description = cleanTradeText(String(payment.description || "服務付款"), 100);
  const fields: Record<string, string> = {
    MerchantID: config.merchantId,
    MerchantTradeNo: merchantTradeNo,
    MerchantTradeDate: merchantTradeDate(),
    PaymentType: "aio",
    TotalAmount: String(amount),
    TradeDesc: payment.organization_code === "qiunai" ? "秋奈電競服務付款" : "深夜不關燈服務付款",
    ItemName: description || "服務付款",
    ReturnURL: `${config.baseUrl}/api/payments/ecpay/service/result`,
    OrderResultURL: `${config.baseUrl}/api/payments/ecpay/service/display`,
    ChoosePayment: "Credit",
    EncryptType: "1",
  };
  fields.CheckMacValue = checkMacValue(fields, config.hashKey, config.hashIv);
  return { action: config.checkoutUrl, fields };
}

export async function completeEcpayServicePayment(fields: Record<string, string>) {
  const config = getEcpayConfig();
  if (!verifyEcpayCallback(fields, config)) throw new Error("綠界通知驗證失敗");
  if (fields.RtnCode !== "1" || fields.SimulatePaid === "1") return false;
  const merchantTradeNo = fields.MerchantTradeNo || "";
  const amount = Number(fields.TradeAmt);
  if (!/^[A-Za-z0-9]{1,20}$/.test(merchantTradeNo) || !Number.isInteger(amount) || amount <= 0 || !fields.TradeNo)
    throw new Error("綠界付款通知資料不完整");
  const { error } = await getSupabaseAdmin().rpc("ecpay_mark_service_paid", {
    p_merchant_trade_no: merchantTradeNo,
    p_trade_no: fields.TradeNo,
    p_amount: amount,
    p_payment_date: fields.PaymentDate || null,
    p_raw_result: fields,
  });
  if (error) throw new Error(error.message || "服務付款狀態保存失敗");
  return true;
}
