// src/components/WordCloud.tsx
"use client";

import React, { useEffect, useState } from 'react';

interface WordProps {
  /** 단어와 빈도수 배열 */
  words: { word: string; count: number }[];
}

/**
 * 워드 클라우드 컴포넌트
 * - 부모(AnalysisReport 좌측 컬럼)의 flex-1 min-h-0 영역을 h-full로 꽉 채움
 * - min-h 고정값 제거 → 뷰포트에 맞게 유동적으로 크기 결정
 * - 빈도수에 따라 1.0rem ~ 3.5rem 폰트 크기 비례 적용
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
   * design.md 팔레트 기반 색상 풀
   * - 파스텔 파란 계열 + 황금/노란 계열 혼합
   */
  const colorPool = [
    '#8CA9FF', // 진한 파스텔 파란 (accent)
    '#AAC4F5', // 밝은 파스텔 파란 (accent-light)
    '#6B93F5', // 좀 더 진한 파란
    '#C4A020', // 황금빛
    '#E8B84B', // 따뜻한 노란
    '#7CB8F5', // 하늘빛 파란
    '#A0B8F0', // 연한 파란
    '#D4A820', // 진한 황금
  ];

  return (
    // h-full: 부모 flex-1 컨테이너 높이를 그대로 채움
    <div
      className="w-full h-full flex flex-wrap justify-center items-center gap-x-5 gap-y-4 p-5 overflow-hidden"
      style={{ background: "var(--color-bg-card)" }}
    >
      {displayWords.map((item, index) => {
        // 빈도수 비례 폰트 크기 (1.0rem ~ 3.5rem으로 상한 조정)
        const fontSize = 1.0 + (item.count / maxCount) * 2.5;
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
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              {item.count}회 언급됨
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