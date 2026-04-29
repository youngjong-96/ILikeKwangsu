/** 분석 결과 단어 타입 */
export interface WordResult {
  word: string;
  count: number;
}

/** ResultBadges props 타입 정의 */
interface ResultBadgesProps {
  /** 전체 분석 결과 배열 */
  result: WordResult[];
}

/**
 * ResultBadges 컴포넌트
 * - 분석 요약 배지: 총 키워드 수(Total Keywords), 최다 사용 단어(Most Used) 표시
 */
export default function ResultBadges({ result }: ResultBadgesProps) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {/* 총 키워드 수 배지 */}
      <div
        className="px-5 py-3 rounded-2xl border flex-shrink-0"
        style={{ background: "#FFF2C6", borderColor: "var(--color-accent-light)" }}
      >
        <p
          className="text-[10px] font-black uppercase tracking-widest mb-1"
          style={{ color: "var(--color-accent)" }}
        >
          Total Keywords
        </p>
        <p className="text-2xl font-black" style={{ color: "var(--color-text-primary)" }}>
          {result.length}
        </p>
      </div>

      {/* 최다 사용 단어 배지 */}
      <div
        className="px-5 py-3 rounded-2xl border flex-shrink-0"
        style={{ background: "#F0F5FF", borderColor: "var(--color-accent-light)" }}
      >
        <p
          className="text-[10px] font-black uppercase tracking-widest mb-1"
          style={{ color: "var(--color-accent)" }}
        >
          Most Used
        </p>
        <p className="text-2xl font-black" style={{ color: "var(--color-text-primary)" }}>
          &ldquo;{result[0]?.word}&rdquo;
        </p>
      </div>
    </div>
  );
}
