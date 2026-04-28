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

  const displayWords = words.slice(0, 30);
  const maxCount = Math.max(...displayWords.map(w => w.count));
  const colors = ['text-blue-500', 'text-purple-500', 'text-emerald-500', 'text-amber-500', 'text-rose-500'];

  return (
    <div className="w-full min-h-[400px] flex flex-wrap justify-center items-center gap-x-8 gap-y-6 p-10 bg-white rounded-3xl border border-gray-100 shadow-inner">
      {displayWords.map((item, index) => {
        const fontSize = 1.2 + (item.count / maxCount) * 3; // 크기 범위를 조금 더 키움
        const colorClass = colors[index % colors.length];

        return (
          <div key={index} className="relative group">
            <span
              style={{ fontSize: `${fontSize}rem` }}
              className={`font-black transition-all duration-300 hover:scale-125 cursor-default select-none ${colorClass} hover:drop-shadow-md`}
            >
              {item.word}
            </span>
            {/* 1. 툴팁 추가: 마우스 오버 시 나타남 */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {item.count}회 언급됨
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-gray-800"></div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default WordCloud;