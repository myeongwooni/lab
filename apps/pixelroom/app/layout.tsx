import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "픽셀룸 | 하루 한 방, 10분의 탈출",
  description: "작은 도트 방을 탐색하고 물건과 단서를 조합해 10분 안에 탈출하세요. 매일 자정 새로운 비밀이 열립니다.",
  openGraph: {
    title: "픽셀룸 · 오늘의 10분 방탈출",
    description: "방은 하루에 하나. 단서는 곳곳에. 열쇠는 당신 손에.",
    type: "website",
    locale: "ko_KR",
  },
  twitter: { card: "summary", title: "픽셀룸", description: "10분 안에 탈출할 수 있을까?" },
};

export const viewport: Viewport = { themeColor: "#131b25", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/galmuri@latest/dist/galmuri.css" />
      </head>
      <body>{children}<Analytics /></body>
    </html>
  );
}
