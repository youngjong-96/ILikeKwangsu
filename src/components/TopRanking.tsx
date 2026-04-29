import { WordResult } from "./ResultBadges";

/** TopRanking props 타입 정의 */
interface TopRankingProps {
  /** 전체 분석 결과 배열 (상위 5개만 사용) */
  result: WordResult[];
}

/**
 * TopRanking 컴포넌트
 * - 빈도수 상위 5개 키워드를 순위별로 나열
 * - 호버 시 오른쪽으로 살짝 이동하는 마이크로 애니메이션 적용
 */
export default function TopRanking({ result }: TopRankingProps) {
  /** 상위 5개 단어만 추출 */
  const top5 = result.slice(0, 5);

  return (
    <div className="space-y-2">
      {/* 섹션 라벨 */}
      <p
        className="text-[10px] font-black uppercase tracking-widest mb-3"
        style={{ color: "var(--color-accent)" }}
      >
        Top 5 Ranking
      </p>

      {/* 랭킹 아이템 목록 */}
      {top5.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 hover:translate-x-1"
          style={{
            background: "var(--color-bg-card)",
            borderColor: "var(--color-border)",
          }}
        >
          {/* 순위 번호 + 단어 */}
          <span
            className="font-bold flex items-center gap-2"
            style={{ color: "var(--color-text-primary)" }}
          >
            <span
              className="font-black text-sm opacity-50"
              style={{ color: "var(--color-accent)" }}
            >
              {/* 1~9위는 앞에 0 패딩 */}
              0{index + 1}
            </span>
            {item.word}
          </span>

          {/* 언급 횟수 배지 */}
          <span
            className="font-black text-sm px-3 py-1 rounded-lg"
            style={{ background: "#FFF2C6", color: "var(--color-accent)" }}
          >
            {item.count}회
          </span>
        </div>
      ))}
    </div>
  );
}
