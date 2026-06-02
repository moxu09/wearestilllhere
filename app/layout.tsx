import type { Metadata } from "next";
import SiteLoader from "./components/SiteLoader";
import "./globals.css";

export const metadata: Metadata = {
  title: "深夜不關燈｜We Are Still Here",
  description:
    "深夜不關燈官方網站，提供聊天陪伴、遊戲陪玩、打賞禮物、VIP 會員與開幕活動資訊。",
  keywords: [
    "深夜不關燈",
    "We Are Still Here",
    "陪玩",
    "聊天陪伴",
    "遊戲陪玩",
    "Discord 陪玩",
    "VIP",
  ],
  verification: {
    google: "Ffo_OiPVxlTWWz7YOG-QVUXp4rO3992421osmFC7sPU",
  },
  openGraph: {
    title: "深夜不關燈｜We Are Still Here",
    description:
      "一個在深夜也有人陪你的地方，讓每一段夜晚都不孤單。",
    url: "https://wearestilllhere.com",
    siteName: "深夜不關燈",
    type: "website",
    locale: "zh_TW",
    images: [
      {
        url: "https://wearestilllhere.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "深夜不關燈 We Are Still Here",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "深夜不關燈｜We Are Still Here",
    description:
      "一個在深夜也有人陪你的地方，讓每一段夜晚都不孤單。",
    images: ["https://wearestilllhere.com/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>
        <SiteLoader />
        {children}
      </body>
    </html>
  );
}