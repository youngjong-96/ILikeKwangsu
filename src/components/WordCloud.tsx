"use client";

interface WordProps {
  /** 단어와 빈도수 배열 */
  words: { word: string; count: number }[];
}

/**
 * 워드클라우드 컴포넌트
 * - 전달받은 단어 빈도 배열을 크기와 색상 차이로 시각화한다.
 * - 부모 컨테이너의 남은 높이를 그대로 채우도록 구성한다.
 */
export default function WordCloud({ words }: WordProps) {
  if (!words || words.length === 0) {
    return null;
  }

  const displayWords = words.slice(0, 30);
  const maxCount = Math.max(...displayWords.map((item) => item.count));
  const colorPool = [
    "#8CA9FF",
    "#AAC4F5",
    "#6B93F5",
    "#C4A020",
    "#E8B84B",
    "#7CB8F5",
    "#A0B8F0",
    "#D4A820",
  ];

  return (
    <div
      className="w-full h-full flex flex-wrap justify-center items-center gap-x-5 gap-y-4 p-5 overflow-hidden"
      style={{ background: "var(--color-bg-card)" }}
    >
      {displayWords.map((item, index) => {
        const fontSize = 1 + (item.count / maxCount) * 2.5;
        const color = colorPool[index % colorPool.length];

        return (
          <div key={`${item.word}-${index}`} className="relative group">
            <span
              style={{ fontSize: `${fontSize}rem`, color }}
              className="font-black transition-all duration-300 hover:scale-125 cursor-default select-none hover:drop-shadow-md inline-block"
            >
              {item.word}
            </span>

            <div
              className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10"
              style={{ background: "var(--color-accent)", color: "#fff" }}
            >
              {item.count}회 등장
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
}
