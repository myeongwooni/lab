import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const TITLE = "이름을 잃은 별에게 — 판타지 로맨스 비주얼 노벨";
const DESC = "백 일 뒤 지워야 할 남자의 일생을 받아 적던 필경사는, 그 책의 마지막 장에 자기 이름이 적혀 있다는 걸 알게 된다.";

export const metadata: Metadata = {
  // 공유 이미지 주소를 절대 경로로 만들 때 씁니다.
  metadataBase: new URL("https://starscribe.vercel.app"),
  title: TITLE,
  description: DESC,
  openGraph: { title: TITLE, description: DESC, type: "website", locale: "ko_KR" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export const viewport: Viewport = {
  themeColor: "#070a1c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&family=Noto+Serif+KR:wght@300;400;600&family=Nanum+Pen+Script&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
