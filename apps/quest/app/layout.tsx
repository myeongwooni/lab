import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // 공유 이미지 주소를 절대 경로로 만들 때 씁니다.
  metadataBase: new URL("https://quest-guild.vercel.app"),
  title: "오늘의 퀘스트",
  description: "길드의 오늘의 퀘스트를 수행할 단 한 명의 용사를 소환합니다.",
  openGraph: {
    title: "오늘의 퀘스트",
    description: "이름과 임무를 적으면, 오늘의 용사 한 명이 소환됩니다.",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "오늘의 퀘스트",
    description: "이름과 임무를 적으면, 오늘의 용사 한 명이 소환됩니다.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d2117",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Press+Start+2P&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
