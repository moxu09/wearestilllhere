import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import OrderChatFloatingWidget from "@/components/OrderChatFloatingWidget";
import SiteLoader from "./components/SiteLoader";
import PlatformTopNav from "./components/PlatformTopNav";

// 先不要開全平台禮物播報，避免換頁卡住 / Failed to fetch
// import GiftBroadcastOverlay from "./components/GiftBroadcastOverlay";

export const metadata: Metadata = {
  title: "深夜不關燈｜We Are Still Here",
  description: "深夜不關燈陪玩平台，找陪玩、下單、送禮、儲值與會員中心。",
  icons: {
    icon: "/icon.jpeg",
    apple: "/icon.jpeg",
  },
  openGraph: {
    title: "深夜不關燈｜We Are Still Here",
    description: "陪你遊戲，快樂翻倍。",
    siteName: "深夜不關燈",
    images: [
      {
        url: "/icon.jpeg",
        width: 512,
        height: 512,
        alt: "深夜不關燈",
      },
    ],
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f3ec",
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#f7f3ec] text-slate-950 antialiased"
      >
        <SiteLoader />

        {/* 先關掉，最後再修全平台禮物播報 */}
        {/* <GiftBroadcastOverlay /> */}

        <PlatformTopNav />

        <div className="pt-20">
          {children}
          <OrderChatFloatingWidget />
        </div>
      </body>
    </html>
  );
}