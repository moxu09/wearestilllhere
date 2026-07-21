import type { Metadata } from "next";
import SiteLoader from "./components/SiteLoader";
import "./globals.css";

export const metadata: Metadata = {
  title: "深夜不關燈｜We Are Still Here",
  description:
    "深夜不關燈官方網站，在這裡，有一盞燈，永遠為你亮著。",
  keywords: [
    "深夜",
    "深夜不關燈",
    "We Are Still Here",
    "陪玩",
    "陪聊",
    "聊天陪伴",
    "遊戲陪玩",
    "Discord 陪玩",
    "VIP",
  ],
  verification: {
    google: "Ffo_OiPVxlTWWz7YOG-QVUXp4rO3992421osmFC7sPU",
  },
  icons: {
    icon: [
      { url: "/favicon-gold-transparent.ico" },
      {
        url: "/icon-gold-transparent.png",
        type: "image/png",
        sizes: "512x512",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon-gold-transparent.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
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
    <html lang="zh-Hant" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var theme=localStorage.getItem("service-color-theme");document.documentElement.dataset.serviceTheme=theme==="dark"?"dark":"light";}catch(_){document.documentElement.dataset.serviceTheme="light";}})();`,
          }}
        />
      </head>
      <body>
        <SiteLoader />
        {children}
      </body>
    </html>
  );
}
