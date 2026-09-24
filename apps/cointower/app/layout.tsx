import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // 공유 이미지 주소를 절대 경로로 만들 때 씁니다.
  metadataBase: new URL("https://cointower-luck.vercel.app"),
  title: "동전탑",
  description:
    "앞면이 나오는 동안 동전이 저절로 계속 던져집니다. 뒷면이 나오면 탑이 무너지고 그때까지의 층수가 기록에 남습니다.",
  openGraph: {
    title: "동전탑",
    description: "앞면만으로 몇 층까지 쌓을 수 있나요?",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "동전탑",
    description: "앞면만으로 몇 층까지 쌓을 수 있나요?",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Gothic+A1:wght@400;700&family=JetBrains+Mono:wght@400;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
