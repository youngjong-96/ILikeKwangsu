"use client";

import { BarChart3, Trash2 } from "lucide-react";
import WordCloud from "./WordCloud";
import ResultBadges, { type WordResult } from "./ResultBadges";
import TranscribedText from "./TranscribedText";
import TopRanking from "./TopRanking";

/** AnalysisReport props 타입 정의 */
interface AnalysisReportProps {
  /** 분석 결과 배열 */
  result: WordResult[] | null;
  /** 전사된 전체 텍스트 */
  transcribedText: string;
  /** 분석 진행 여부 */
  isAnalyzing: boolean;
  /** 현재 분석 엔진 또는 결과 출처 라벨 */
  analysisLabel?: string;
  /** 분석 중 사용자에게 보여줄 상태 메시지 */
  loadingStatusText?: string;
  /** 결과 초기화 핸들러 */
  onReset: () => void;
  /** 부모 레이아웃에서 주입하는 추가 클래스 */
  className?: string;
}

/**
 * 분석 결과 카드 컴포넌트
 * - 결과가 있으면 워드클라우드, 랭킹, 전사문을 2열 레이아웃으로 보여준다.
 * - 결과가 없으면 현재 분석 상태 메시지를 중심 로딩 화면으로 보여준다.
 */
export default function AnalysisReport({
  result,
  transcribedText,
  isAnalyzing,
  analysisLabel = "",
  loadingStatusText = "",
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
      <div
        className="flex items-center justify-between gap-3 mb-4 pb-4 shrink-0"
        style={{ borderBottom: "1.5px solid var(--color-border)" }}
      >
        <h2
          className="text-lg font-black flex items-center gap-2 tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          <BarChart3 className="w-5 h-5" style={{ color: "var(--color-accent)" }} />
          ANALYSIS REPORT
        </h2>

        <div className="flex items-center gap-2">
          {analysisLabel && (
            <span
              className="px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide"
              style={{
                background: "#F0F5FF",
                color: "var(--color-accent)",
                border: "1px solid var(--color-accent-light)",
              }}
            >
              {analysisLabel}
            </span>
          )}

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
      </div>

      {result ? (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-5 animate-fade-slide-up">
          <div className="flex flex-col min-h-0">
            <p
              className="text-[10px] font-black uppercase tracking-widest mb-2 text-center shrink-0"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Visual Keyword Cloud
            </p>
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

          <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
            <ResultBadges result={result} />
            <TopRanking result={result} />
            <TranscribedText text={transcribedText} />
          </div>
        </div>
      ) : (
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
              {isAnalyzing ? "ANALYZING..." : "READY"}
            </p>
            <p className="text-sm mt-2">
              {loadingStatusText || "브라우저 안에서 음성을 정리하고 자주 나온 단어를 계산하고 있어요."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
