// src/components/WordCloud.tsx
"use client";

import React, { useEffect, useState } from 'react';

interface WordProps {
  words: { word: string; count: number }[];
}

const WordCloud = ({ words }: WordProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !words || words.length === 0) return null;

  // 상위 20~30개만 사용
  const displayWords = words.slice(0, 30);
  const maxCount = Math.max(...displayWords.map(w => w.count));

  // 색상 팔레트
  const colors = ['text-blue-500', 'text-purple-500', 'text-emerald-500', 'text-amber-500', 'text-rose-500', 'text-indigo-500'];

  return (
    <div className="w-full min-h-[300px] flex flex-wrap justify-center items-center gap-x-6 gap-y-4 p-8 bg-white rounded-2xl border border-gray-100 shadow-inner overflow-hidden">
      {displayWords.map((item, index) => {
        // 빈도수에 따른 폰트 크기 계산 (최소 1rem ~ 최대 3.5rem)
        const fontSize = 1 + (item.count / maxCount) * 2.5;
        const colorClass = colors[index % colors.length];

        return (
          <span
            key={index}
            style={{ 
              fontSize: `${fontSize}rem`,
              lineHeight: '1.2'
            }}
            className={`font-black transition-all hover:scale-110 cursor-default select-none ${colorClass}`}
            title={`${item.count}회 등장`}
          >
            {item.word}
          </span>
        );
      })}
    </div>
  );
};

export default WordCloud;