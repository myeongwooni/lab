import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "오늘의 퀘스트",
  description: "길드의 오늘의 퀘스트를 수행할 단 한 명의 용사를 소환합니다.",
  openGraph: {
    title: "오늘의 퀘스트",
    description: "이름과 임무를 적으면, 오늘의 용사 한 명이 소환됩니다.",
    type: "website",
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
