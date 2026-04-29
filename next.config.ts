import type { NextConfig } from "next";

/**
 * Next.js 설정
 * - reactStrictMode: false
 *   Endic 등 브라우저 확장 프로그램이 DOM을 수정할 때 발생하는
 *   개발 환경 Hydration 에러 노이즈를 줄이기 위해 비활성화.
 *   (프로덕션 동작에는 영향 없음)
 */
const nextConfig: NextConfig = {
  reactStrictMode: false,
};

export default nextConfig;
