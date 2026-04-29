"use client";

import { BarChart3, MessageSquare, Trash2 } from "lucide-react";
import WordCloud from "./WordCloud";
import ResultBadges, { WordResult } from "./ResultBadges";
import TranscribedText from "./TranscribedText";
import TopRanking from "./TopRanking";

/** AnalysisReport props 타입 정의 */
interface AnalysisReportProps {
  /** 분석 결과 배열 (null이면 미분석 상태) */
  result: WordResult[] | null;
  /** STT 변환 텍스트 */
  transcribedText: string;
  /** 분석 진행 중 여부 */
  isAnalyzing: boolean;
  /** 새로 분석하기 버튼 클릭 핸들러 */
  onReset: () => void;
  /**
   * 외부에서 주입하는 추가 클래스
   * - 결과 모드: "flex-1 min-h-0" → 부모 flex 컨테이너의 남은 높이를 전부 차지
   */
  className?: string;
}

/**
 * AnalysisReport 컴포넌트
 * - 결과 화면: 좌(워드클라우드) + 우(배지·랭킹·텍스트) 2컬럼 레이아웃
 *   → flex 체인으로 컨테이너 높이에 맞게 늘어남 (스크롤 없음)
 * - 분석 중: 로딩 스피너
 */
export default function AnalysisReport({
  result,
  transcribedText,
  isAnalyzing,
  onReset,
  className = "",
}: AnalysisReportProps) {
  return (
    <div
      className={`rounded-3xl border flex flex-col transition-all duration-700 p-5 md:p-6 ${className}`}
      style={{
        background: result ? "#FFFDF5" : "var(--color-bg-card)",
        borderColor: result ? "var(--color-accent-light)" : "var(--color-border)",
        boxShadow: result ? "var(--shadow-accent)" : "var(--shadow-card)",
      }}
    >
      {/* ── 패널 헤더 (고정 높이) ── */}
      <div
        className="flex items-center justify-between mb-4 pb-4 shrink-0"
        style={{ borderBottom: "1.5px solid var(--color-border)" }}
      >
        <h2
          className="text-lg font-black flex items-center gap-2 tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          <BarChart3 className="w-5 h-5" style={{ color: "var(--color-accent)" }} />
          ANALYSIS REPORT
        </h2>

        {/* 결과가 있을 때만 초기화 버튼 표시 */}
        {result && (
          <button
            onClick={onReset}
            className="px-3 py-1.5 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-all duration-200 active:scale-95"
            style={{
              background: "#FFF2C6",
              color: "#E25353",
              border: "1px solid #F9A8A8",
            }}
          >
            <Trash2 className="w-3.5 h-3.5" /> 새로 분석하기
          </button>
        )}
      </div>

      {/* ── 결과 있음: 2컬럼 레이아웃 (스크롤 없이 남은 높이에 꽉 맞게) ── */}
      {result ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-5 animate-fade-slide-up">

          {/* 왼쪽: 워드 클라우드 (남은 높이를 전부 채움) */}
          <div className="flex flex-col min-h-0">
            <p
              className="text-[10px] font-black uppercase tracking-widest mb-2 text-center shrink-0"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Visual Keyword Cloud
            </p>
            {/* flex-1 + min-h-0 → 부모 높이 계산에 참여하여 WordCloud를 올바르게 늘림 */}
            <div
              className="flex-1 min-h-0 rounded-2xl border overflow-hidden"
              style={{
                background: "var(--color-bg-card)",
                borderColor: "var(--color-border)",
              }}
            >
              <WordCloud words={result} />
            </div>
          </div>

          {/* 오른쪽: 배지 + 랭킹 + 원문 텍스트 (세로 스택, 내용이 넘치면 자체 스크롤) */}
          <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
            {/* 1) 요약 배지 */}
            <ResultBadges result={result} />
            {/* 2) Top 5 랭킹 */}
            <TopRanking result={result} />
            {/* 3) STT 원문 텍스트 */}
            <TranscribedText text={transcribedText} />
          </div>
        </div>
      ) : (
        /* ── 결과 없음: 로딩 스피너 (분석 중 상태에서만 렌더링됨) ── */
        <div
          className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <div className="flex flex-col items-center">
            <div
              className="w-16 h-16 rounded-full border-4 animate-spin mb-6"
              style={{
                borderColor: "var(--color-accent-light)",
                borderTopColor: "transparent",
              }}
            />
            <p
              className="font-black text-xl animate-scale-pulse"
              style={{ color: "var(--color-accent)" }}
            >
              ANALYZING...
            </p>
            <p className="text-sm mt-2">음성을 텍스트로 변환하고 단어를 세는 중입니다.</p>
          </div>
        </div>
      )}
    </div>
  );
}
