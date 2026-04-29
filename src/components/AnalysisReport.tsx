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
}

/**
 * AnalysisReport 컴포넌트
 * - 분석 결과 패널 전체를 담당
 * - 상태에 따라 세 가지 뷰를 렌더링:
 *   1) 결과 있음: 배지 + 워드클라우드 + 텍스트 + 랭킹
 *   2) 분석 중: 로딩 스피너
 *   3) 초기 상태: 안내 플레이스홀더
 */
export default function AnalysisReport({
  result,
  transcribedText,
  isAnalyzing,
  onReset,
}: AnalysisReportProps) {
  return (
    <div
      className={`rounded-3xl border min-h-[580px] flex flex-col transition-all duration-700 ${
        result ? "p-8" : "p-7"
      }`}
      style={{
        // 결과가 있으면 더 밝고 따뜻한 배경으로 강조
        background: result ? "#FFFDF5" : "var(--color-bg-card)",
        borderColor: result ? "var(--color-accent-light)" : "var(--color-border)",
        boxShadow: result ? "var(--shadow-accent)" : "var(--shadow-card)",
      }}
    >
      {/* ── 패널 헤더 ── */}
      <div
        className="flex items-center justify-between mb-7 pb-5"
        style={{ borderBottom: "1.5px solid var(--color-border)" }}
      >
        <h2
          className="text-xl font-black flex items-center gap-2 tracking-tight"
          style={{ color: "var(--color-text-primary)" }}
        >
          <BarChart3 className="w-6 h-6" style={{ color: "var(--color-accent)" }} />
          ANALYSIS REPORT
        </h2>

        {/* 결과가 있을 때만 초기화 버튼 표시 */}
        {result && (
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200 active:scale-95"
            style={{
              background: "#FFF2C6",
              color: "#E25353",
              border: "1px solid #F9A8A8",
            }}
          >
            <Trash2 className="w-4 h-4" /> 새로 분석하기
          </button>
        )}
      </div>

      {/* ── 결과 있음: 전체 리포트 렌더링 ── */}
      {result ? (
        <div className="animate-fade-slide-up space-y-8">
          {/* 1) 요약 배지 (총 키워드 수 / 최다 사용 단어) */}
          <ResultBadges result={result} />

          {/* 2) 워드 클라우드 */}
          <div>
            <p
              className="text-[10px] font-black uppercase tracking-widest mb-3 text-center"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Visual Keyword Cloud
            </p>
            <div
              className="rounded-3xl p-4 border"
              style={{
                background: "var(--color-bg-card)",
                borderColor: "var(--color-border)",
              }}
            >
              <WordCloud words={result} />
            </div>
          </div>

          {/* 3) 변환 텍스트 & Top 5 랭킹 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TranscribedText text={transcribedText} />
            <TopRanking result={result} />
          </div>
        </div>
      ) : (
        /* ── 결과 없음: 로딩 중 또는 초기 안내 ── */
        <div
          className="flex-1 flex flex-col items-center justify-center text-center space-y-4"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {isAnalyzing ? (
            /* 분석 진행 중: 스피너 + 메시지 */
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
          ) : (
            /* 초기 상태: 안내 플레이스홀더 */
            <>
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "var(--color-bg-main)" }}
              >
                <MessageSquare
                  className="w-10 h-10"
                  style={{ color: "var(--color-accent-light)" }}
                />
              </div>
              <p className="text-base font-medium leading-relaxed">
                분석을 시작하면
                <br />
                <span className="font-bold" style={{ color: "var(--color-accent)" }}>
                  전체 리포트 화면
                </span>
                이 여기에 나타납니다.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
