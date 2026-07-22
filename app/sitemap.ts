import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.wearestilllhere.com";
  const pages = [
    { path: "", priority: 1 },
    { path: "/membership", priority: 0.9 },
    { path: "/players", priority: 0.8 },
    { path: "/service", priority: 0.8 },
    { path: "/apply-player", priority: 0.7 },
    { path: "/merchandise/canvas-bag/shipping", priority: 0.6 },
    { path: "/merchandise/keychain/shipping", priority: 0.6 },
    { path: "/policies/returns", priority: 0.5 },
    { path: "/policies/privacy", priority: 0.5 },
    { path: "/policies/payment", priority: 0.5 },
  ];

  return pages.map(({ path, priority }) =>
    ({
      url: `${baseUrl}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority,
    }) satisfies MetadataRoute.Sitemap[number],
  );
}
