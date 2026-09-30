import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const TITLE = "천 번째 새벽, 당신에게 — 사망 회귀 판타지 로맨스 비주얼 노벨";
const DESC = "죽을 때마다 되돌아가는 응급실 간호사는, 자기를 이 세계로 부른 사람이 천 번째 새벽을 기다리는 미래의 그라는 것을 알게 된다.";

export const metadata: Metadata = {
  // 공유 이미지 주소를 절대 경로로 만들 때 씁니다.
  metadataBase: new URL("https://sandglass.vercel.app"),
  title: TITLE,
  description: DESC,
  applicationName: "천 번째 새벽, 당신에게",
  openGraph: { title: TITLE, description: DESC, type: "website", locale: "ko_KR", siteName: "천 번째 새벽, 당신에게" },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

export const viewport: Viewport = {
  themeColor: "#1b1a22",
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
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=Noto+Serif+KR:wght@300;400;600;700&family=Nanum+Pen+Script&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap"
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
