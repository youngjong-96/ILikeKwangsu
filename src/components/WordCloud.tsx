// src/components/WordCloud.tsx
"use client";

import React, { useEffect, useState } from 'react';

interface WordProps {
  /** 단어와 빈도수 배열 */
  words: { word: string; count: number }[];
}

/**
 * 워드 클라우드 컴포넌트
 * - design.md 팔레트 기반 색상 사용 (파스텔 파란, 노란 계열 혼합)
 * - 빈도수에 따라 폰트 크기를 비례 조절
 * - 마우스 오버 시 툴팁으로 횟수 표시
 */
const WordCloud = ({ words }: WordProps) => {
  const [mounted, setMounted] = useState(false);

  // 클라이언트 마운트 후에만 렌더링 (SSR 불일치 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !words || words.length === 0) return null;

  // 최대 30개 단어만 표시
  const displayWords = words.slice(0, 30);
  const maxCount = Math.max(...displayWords.map(w => w.count));

  /**
   * design.md 팔레트에서 추출한 워드 클라우드 색상 풀
   * 파스텔 파란 계열 + 크림/황금 계열 + 보조 색상
   */
  const colorPool = [
    '#8CA9FF', // 진한 파스텔 파란 (accent)
    '#AAC4F5', // 밝은 파스텔 파란 (accent-light)
    '#6B93F5', // 좀 더 진한 파란
    '#C4A020', // 황금빛 (배경 대비용)
    '#E8B84B', // 따뜻한 노란
    '#7CB8F5', // 하늘빛 파란
    '#A0B8F0', // 연한 파란
    '#D4A820', // 진한 황금
  ];

  return (
    <div
      className="w-full min-h-[360px] flex flex-wrap justify-center items-center gap-x-6 gap-y-5 p-8 rounded-3xl"
      style={{ background: "var(--color-bg-card)" }}
    >
      {displayWords.map((item, index) => {
        // 빈도수에 비례한 폰트 크기 계산 (1.0rem ~ 4.0rem)
        const fontSize = 1.0 + (item.count / maxCount) * 3.0;
        // 색상 풀에서 순환 선택
        const color = colorPool[index % colorPool.length];

        return (
          <div key={index} className="relative group">
            <span
              style={{ fontSize: `${fontSize}rem`, color }}
              className="font-black transition-all duration-300 hover:scale-125 cursor-default select-none hover:drop-shadow-md inline-block"
            >
              {item.word}
            </span>

            {/* 툴팁: 마우스 오버 시 빈도수 표시 */}
            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
              style={{
                background: "var(--color-accent)",
                color: "#fff",
              }}
            >
              {item.count}회 언급됨
              {/* 툴팁 화살표 */}
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent"
                style={{ borderTopColor: "var(--color-accent)" }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WordCloud;