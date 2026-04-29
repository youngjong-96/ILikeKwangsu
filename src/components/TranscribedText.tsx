/** TranscribedText props 타입 정의 */
interface TranscribedTextProps {
  /** STT로 변환된 전체 텍스트 */
  text: string;
}

/**
 * TranscribedText 컴포넌트
 * - STT 변환 원문을 표시
 * - 부모(AnalysisReport 우측 컬럼)가 overflow-y-auto를 담당하므로
 *   자체 max-h 제거 — 텍스트가 길어도 부모 스크롤로 처리
 */
export default function TranscribedText({ text }: TranscribedTextProps) {
  return (
    <div
      className="p-4 rounded-2xl border flex flex-col shrink-0"
      style={{ background: "#FFF8DE", borderColor: "var(--color-accent-light)" }}
    >
      {/* 섹션 라벨 */}
      <p
        className="text-[10px] font-black uppercase tracking-widest mb-2"
        style={{ color: "var(--color-accent)" }}
      >
        Transcribed Text
      </p>

      {/* 변환 텍스트 본문 — 부모 컨테이너가 스크롤 담당 */}
      <div
        className="text-xs leading-relaxed italic overflow-hidden line-clamp-4"
        style={{ color: "var(--color-text-secondary)" }}
      >
        &ldquo;{text}&rdquo;
      </div>
    </div>
  );
}
