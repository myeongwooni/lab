import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // 공유 이미지 주소를 절대 경로로 만들 때 씁니다.
  metadataBase: new URL("https://lab-omikuji.vercel.app"),
  title: "오늘의 냥쿠지",
  description: "도트 고양이가 흔들어 주는 하루 한 번의 운세 뽑기.",
  openGraph: {
    title: "오늘의 냥쿠지",
    description: "통을 흔들면, 오늘의 고양이와 운세 쪽지가 나온다냥.",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "오늘의 냥쿠지",
    description: "통을 흔들면, 오늘의 고양이와 운세 쪽지가 나온다냥.",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffd9c7",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/galmuri@latest/dist/galmuri.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
