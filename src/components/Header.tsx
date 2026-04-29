/**
 * Header 컴포넌트
 * - 서비스 로고 아이콘, 서비스명(Ko-WordCounter), 서브타이틀을 표시
 * - design.md 컬러 팔레트 변수 사용
 */
export default function Header() {
  return (
    <header className="mb-10 text-center animate-fade-slide-up">

      {/* 서비스명 */}
      <h1
        className="text-4xl md:text-5xl font-black tracking-tight mb-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        I like Kwangsu
      </h1>

      {/* 서브타이틀 */}
      <p
        className="text-base font-medium"
        style={{ color: "var(--color-text-secondary)" }}
      >
        광수는 어떤 단어를 가장 많이 쓸까?
      </p>
    </header>
  );
}
