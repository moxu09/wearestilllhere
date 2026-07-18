export const siteContentTypes = [
  "activity",
  "prize",
  "merchandise",
  "contact",
] as const;

export type SiteContentType = (typeof siteContentTypes)[number];

export type SiteContentItem = {
  id: string;
  content_type: SiteContentType;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  price: number | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export const defaultSiteContent: SiteContentItem[] = [
  {
    id: "default-activity",
    content_type: "activity",
    title: "把今晚的幸運，也一起帶走。",
    subtitle: "Opening lottery",
    description:
      "活動期間每消費滿 1,000 元獲得 1 張抽獎券；前 50 筆滿額訂單抽獎券翻倍，限量 100 張。",
    image_url: null,
    link_url: null,
    price: null,
    sort_order: 0,
    is_active: true,
  },
  {
    id: "default-prize-1",
    content_type: "prize",
    title: "iPhone 17 Pro Max 512G",
    subtitle: null,
    description: null,
    image_url: "/home/prizes/iphone-17-pro-max.png",
    link_url: null,
    price: null,
    sort_order: 10,
    is_active: true,
  },
  {
    id: "default-prize-2",
    content_type: "prize",
    title: "MacBook Air 512G",
    subtitle: null,
    description: null,
    image_url: "/home/prizes/macbook-air.png",
    link_url: null,
    price: null,
    sort_order: 20,
    is_active: true,
  },
  {
    id: "default-prize-3",
    content_type: "prize",
    title: "iPad Air 11 512G",
    subtitle: null,
    description: null,
    image_url: "/home/prizes/ipad-air.png",
    link_url: null,
    price: null,
    sort_order: 30,
    is_active: true,
  },
  {
    id: "default-prize-4",
    content_type: "prize",
    title: "AirPods Max / Pro / Nitro",
    subtitle: null,
    description: null,
    image_url: "/home/prizes/airpods.png",
    link_url: null,
    price: null,
    sort_order: 40,
    is_active: true,
  },
  {
    id: "default-contact-discord",
    content_type: "contact",
    title: "前往 Discord",
    subtitle: "一般客服與服務安排",
    description: null,
    image_url: null,
    link_url: "https://discord.gg/tXNnXWMHbJ",
    price: null,
    sort_order: 10,
    is_active: true,
  },
  {
    id: "default-contact-instagram",
    content_type: "contact",
    title: "Instagram",
    subtitle: "最新消息與活動",
    description: null,
    image_url: null,
    link_url: "https://www.instagram.com/w.a.s.h.co",
    price: null,
    sort_order: 20,
    is_active: true,
  },
  {
    id: "default-contact-threads",
    content_type: "contact",
    title: "Threads",
    subtitle: "追蹤我們的日常",
    description: null,
    image_url: null,
    link_url: "https://www.threads.net/@w.a.s.h.co",
    price: null,
    sort_order: 30,
    is_active: true,
  },
  {
    id: "default-contact-payment-email",
    content_type: "contact",
    title: "金流問題客服信箱",
    subtitle: "as.co.service@wearestilllhere.com",
    description: "儲值、付款、退款或其他金流相關問題，請來信由公司協助處理。",
    image_url: null,
    link_url: "mailto:as.co.service@wearestilllhere.com",
    price: null,
    sort_order: 40,
    is_active: true,
  },
];

export function isSiteContentType(value: unknown): value is SiteContentType {
  return siteContentTypes.includes(value as SiteContentType);
}

