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
 * - grid 2컬럼으로 배치하여 우측 패널 너비에 맞게 유동적으로 조절
 * - truncate로 긴 단어가 박스를 벗어나지 않도록 처리
 */
export default function ResultBadges({ result }: ResultBadgesProps) {
  return (
    /* overflow-x-auto 제거 → grid로 너비 균등 분할 */
    <div className="grid grid-cols-2 gap-3 shrink-0">
      {/* 총 키워드 수 배지 */}
      <div
        className="px-4 py-3 rounded-2xl border min-w-0"
        style={{ background: "#FFF2C6", borderColor: "var(--color-accent-light)" }}
      >
        <p
          className="text-[9px] font-black uppercase tracking-widest mb-1 truncate"
          style={{ color: "var(--color-accent)" }}
        >
          Total Keywords
        </p>
        {/* 숫자는 넘칠 일 없으므로 크기 유지 */}
        <p className="text-xl font-black" style={{ color: "var(--color-text-primary)" }}>
          {result.length}
        </p>
      </div>

      {/* 최다 사용 단어 배지 */}
      <div
        className="px-4 py-3 rounded-2xl border min-w-0"
        style={{ background: "#F0F5FF", borderColor: "var(--color-accent-light)" }}
      >
        <p
          className="text-[9px] font-black uppercase tracking-widest mb-1 truncate"
          style={{ color: "var(--color-accent)" }}
        >
          Most Used
        </p>
        {/* truncate: 단어가 길어도 박스 밖으로 나가지 않음 */}
        <p
          className="text-xl font-black truncate"
          style={{ color: "var(--color-text-primary)" }}
          title={result[0]?.word}
        >
          &ldquo;{result[0]?.word}&rdquo;
        </p>
      </div>
    </div>
  );
}
