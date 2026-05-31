import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PWARegister } from "@/components/pwa";

export const metadata: Metadata = {
  title: "CoWriter — 쓰는 일이 외롭지 않도록",
  description: "AI-powered creative writing companion",
  applicationName: "CoWriter",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "CoWriter" },
};

// Mobile-web essentials: render at device width (not desktop-zoomed-out), and
// use viewportFit 'cover' so the bottom tab bar's env(safe-area-inset-bottom)
// works on notched phones. Pinch-zoom left enabled for accessibility.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#8B6FB8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" data-palette="twilight" data-typeset="manuscript" data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Noto+Serif+KR:wght@400;500;600&display=swap"
        />
      </head>
      <body style={{ height: '100%' }}>
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
