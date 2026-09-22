import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "이어달리기 원고지",
  description:
    "한 사람이 하루에 한 글자씩, 모두가 이어 쓰는 원고지. 다음 글자가 무엇이 될지는 누구도 정할 수 없습니다.",
  openGraph: {
    title: "이어달리기 원고지",
    description: "한 사람이 하루에 한 글자. 당신의 차례는 오늘 한 번뿐입니다.",
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
          href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@400;700&family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
