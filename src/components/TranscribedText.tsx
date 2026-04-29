/** TranscribedText props 타입 정의 */
interface TranscribedTextProps {
  /** STT로 변환된 전체 텍스트 */
  text: string;
}

/**
 * TranscribedText 컴포넌트
 * - STT(Speech-to-Text) 변환 결과 원문 텍스트를 표시
 * - 최대 높이(max-h-40) 초과 시 스크롤 가능
 */
export default function TranscribedText({ text }: TranscribedTextProps) {
  return (
    <div
      className="p-5 rounded-2xl border flex flex-col"
      style={{ background: "#FFF8DE", borderColor: "var(--color-accent-light)" }}
    >
      {/* 섹션 라벨 */}
      <p
        className="text-[10px] font-black uppercase tracking-widest mb-3"
        style={{ color: "var(--color-accent)" }}
      >
        Transcribed Text
      </p>

      {/* 변환 텍스트 본문 - 이탤릭체, 스크롤 가능 */}
      <div
        className="text-sm leading-relaxed italic overflow-y-auto max-h-40 pr-1"
        style={{ color: "var(--color-text-secondary)" }}
      >
        &ldquo;{text}&rdquo;
      </div>
    </div>
  );
}
