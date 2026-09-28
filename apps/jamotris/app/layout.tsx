import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  // 공유 이미지 주소를 절대 경로로 만들 때 씁니다.
  metadataBase: new URL("https://jamotris.vercel.app"),
  title: "자모트리스",
  description: "떨어지는 자모를 쌓아 글자를, 글자를 이어 단어를 만드는 한글 테트리스.",
  openGraph: {
    title: "자모트리스",
    description: "ㄱ 위에 ㅏ를 떨구면 가. 나 옆에 무를 놓으면 나무가 펑!",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "자모트리스",
    description: "ㄱ 위에 ㅏ를 떨구면 가. 나 옆에 무를 놓으면 나무가 펑!",
  },
};

export const viewport: Viewport = {
  themeColor: "#161a33",
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
