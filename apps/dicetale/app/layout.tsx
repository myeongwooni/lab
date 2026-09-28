import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  // 공유 이미지 주소를 절대 경로로 만들 때 씁니다.
  metadataBase: new URL("https://dicetale.vercel.app"),
  title: "다이스테일 — 도트 TRPG",
  description: "주사위 한 번에 운명이 갈리는 도트 그래픽 TRPG. 새끼 용이 훔쳐 간 새벽 등불을 되찾아라.",
  openGraph: {
    title: "다이스테일 — 도트 TRPG",
    description: "d20을 굴려 새끼 용이 훔쳐 간 새벽 등불을 되찾아라.",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "다이스테일 — 도트 TRPG",
    description: "d20을 굴려 새끼 용이 훔쳐 간 새벽 등불을 되찾아라.",
  },
};

export const viewport: Viewport = {
  themeColor: "#140f1c",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/galmuri@latest/dist/galmuri.css" />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
