export const merchandiseSlugs = ["canvas-bag", "keychain"] as const;

export type MerchandiseSlug = (typeof merchandiseSlugs)[number];

export type MerchandiseProduct = {
  slug: MerchandiseSlug;
  name: string;
  shortName: string;
  fallbackPrice: number;
  specifications: Array<{
    label: string;
    value: string;
  }>;
};

export const merchandiseCatalog: Record<
  MerchandiseSlug,
  MerchandiseProduct
> = {
  "canvas-bag": {
    slug: "canvas-bag",
    name: "深夜不關燈帆布袋",
    shortName: "帆布袋",
    fallbackPrice: 100,
    specifications: [
      { label: "材質", value: "帆布、棉麻" },
      { label: "尺寸", value: "25 × 20 cm" },
      { label: "製圖", value: "熱轉印工藝" },
    ],
  },
  keychain: {
    slug: "keychain",
    name: "深夜不關燈鑰匙圈",
    shortName: "鑰匙圈",
    fallbackPrice: 50,
    specifications: [
      { label: "主要材質", value: "壓克力" },
      { label: "鑰匙環材質", value: "鐵、不鏽鋼" },
      { label: "尺寸", value: "6 × 2 cm" },
    ],
  },
};

export function getMerchandiseProduct(value: string) {
  if (merchandiseSlugs.includes(value as MerchandiseSlug)) {
    return merchandiseCatalog[value as MerchandiseSlug];
  }

  return null;
}

export function getMerchandiseSlugFromTitle(title: string) {
  const normalizedTitle = title.replace(/\s+/g, "");

  if (normalizedTitle.includes("鑰匙圈")) return "keychain";
  if (
    normalizedTitle.includes("帆布袋") ||
    normalizedTitle.includes("麻布袋") ||
    normalizedTitle.includes("棉麻袋")
  ) {
    return "canvas-bag";
  }

  return null;
}

export function isWebsiteDesignTitle(title: string) {
  const normalizedTitle = title.replace(/\s+/g, "").toLowerCase();
  return (
    normalizedTitle.includes("網站設計") ||
    normalizedTitle.includes("webdesign") ||
    normalizedTitle.includes("website委託")
  );
}
