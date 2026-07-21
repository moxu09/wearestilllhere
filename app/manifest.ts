import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "深夜不關燈｜We Are Still Here",
    short_name: "深夜不關燈",
    description: "深夜不關燈官方網站，陪玩、陪聊、會員服務與官方周邊。",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0d0e10",
    theme_color: "#0d0e10",
    lang: "zh-Hant-TW",
    orientation: "portrait-primary",
    categories: ["entertainment", "lifestyle"],
    icons: [
      {
        src: "/icon-gold-v2.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-touch-icon-gold-v2.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
