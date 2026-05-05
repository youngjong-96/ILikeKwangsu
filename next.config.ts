import type { NextConfig } from "next";

/**
 * Next.js 설정
 * - reactStrictMode: false
 *   개발 환경에서 확장 프로그램으로 인한 hydration 경고 노이즈를 줄인다.
 * - output: "export"
 *   서버 없는 정적 결과물을 만들 수 있게 해 Vercel 정적 배포와 잘 맞춘다.
 */
const nextConfig: NextConfig = {
  reactStrictMode: false,
  output: "export",
};

export default nextConfig;
