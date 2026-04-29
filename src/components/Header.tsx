/** Header props 타입 정의 */
interface HeaderProps {
  /** true이면 결과 화면용 compact 크기로 렌더링 */
  compact?: boolean;
}

/**
 * Header 컴포넌트
 * - compact=false(기본): 초기 화면 — 큰 타이틀 + 넉넉한 하단 마진
 * - compact=true: 결과 화면 — 작은 타이틀 + 최소 마진으로 공간 절약
 */
export default function Header({ compact = false }: HeaderProps) {
  return (
    <header
      className={`text-center animate-fade-slide-up shrink-0 ${
        compact ? "mb-3" : "mb-10"
      }`}
    >
      {/* 서비스명: 결과 모드에서 크기 축소 */}
      <h1
        className={`font-black tracking-tight mb-1 transition-all duration-500 ${
          compact ? "text-2xl md:text-3xl" : "text-4xl md:text-5xl"
        }`}
        style={{ color: "var(--color-text-primary)" }}
      >
        I like Kwangsu
      </h1>

      {/* 서브타이틀: 결과 모드에서 숨김 처리 */}
      {!compact && (
        <p
          className="text-base font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          광수는 어떤 단어를 가장 많이 쓸까?
        </p>
      )}
    </header>
  );
}
