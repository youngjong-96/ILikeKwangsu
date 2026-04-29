import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "I like Kwangsu | 음성 키워드 분석기",
  description: "광수는 어떤 단어를 말하는 중간에 가장 많이 사용할까",
};

/**
 * 루트 레이아웃
 * - 폰트는 globals.css의 @font-face(온글잎 박다현체)로 직접 로드하므로
 *   next/font는 사용하지 않음
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning: 브라우저 확장 프로그램(Endic 등)으로 인한 Hydration 불일치 방지
    <html lang="ko" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
