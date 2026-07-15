import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "immm Detail Studio - 1인 가방 브랜드를 위한 멀티 채널 상세페이지 빌더",
  description: "가방 사진과 브랜드 자산만 입력하면 스마트스토어, 쿠팡, 무신사, 29CM, W컨셉 등 6대 채널 규격에 맞춘 썸네일과 상세페이지를 1초 만에 자동 생성하고 다운로드하세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${outfit.variable}`}>
      <body>{children}</body>
    </html>
  );
}
