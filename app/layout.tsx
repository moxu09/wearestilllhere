import type { Metadata, Viewport } from "next";
import SiteLoader from "./components/SiteLoader";
import MerchandiseCartProvider from "./components/MerchandiseCartProvider";
import MotionEffects from "./components/MotionEffects";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.wearestilllhere.com"),
  title: {
    default: "深夜不關燈｜We Are Still Here",
    template: "%s｜深夜不關燈",
  },
  applicationName: "深夜不關燈",
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
  authors: [{ name: "深夜不關燈", url: "https://www.wearestilllhere.com" }],
  creator: "深夜不關燈",
  publisher: "深夜不關燈",
  category: "陪伴服務與娛樂",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
    languages: {
      "zh-Hant-TW": "/",
    },
  },
  manifest: "/manifest.webmanifest",
  verification: {
    google: "Ffo_OiPVxlTWWz7YOG-QVUXp4rO3992421osmFC7sPU",
  },
  icons: {
    icon: [
      {
        url: "/favicon-brand-16.png",
        type: "image/png",
        sizes: "16x16",
      },
      {
        url: "/favicon-brand-32.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/favicon-brand-48.png",
        type: "image/png",
        sizes: "48x48",
      },
      {
        url: "/favicon-brand-96.png",
        type: "image/png",
        sizes: "96x96",
      },
    ],
    shortcut: [
      {
        url: "/favicon-brand-32.png",
        type: "image/png",
        sizes: "32x32",
      },
    ],
    apple: [
      {
        url: "/apple-touch-icon-brand.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    title: "深夜不關燈｜We Are Still Here",
    description:
      "一個在深夜也有人陪你的地方，讓每一段夜晚都不孤單。",
    url: "/",
    siteName: "深夜不關燈",
    type: "website",
    locale: "zh_TW",
    images: [
      {
        url: "/og-image-gold-v2.png",
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
    creator: "@wearestilllhere",
    images: ["/og-image-gold-v2.png"],
  },
  appleWebApp: {
    capable: true,
    title: "深夜不關燈",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  colorScheme: "dark",
  themeColor: "#0d0e10",
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
        <MotionEffects />
        <MerchandiseCartProvider>{children}</MerchandiseCartProvider>
      </body>
    </html>
  );
}
