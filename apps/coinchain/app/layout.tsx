import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "동전 체인",
  description:
    "모두가 이어 온 연속 기록. 200번에 한 번 뒷면이 나오고, 체인을 끊은 사람의 이름은 영원히 남습니다.",
  openGraph: {
    title: "동전 체인",
    description: "끊는 순간 당신의 이름이 남습니다.",
    type: "website",
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
