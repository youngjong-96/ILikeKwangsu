"use client";

import { Upload, FlaskConical } from "lucide-react";

/** FileUploadCard props 타입 정의 */
interface FileUploadCardProps {
  /** 현재 선택/녹음된 오디오 파일 (없으면 null) */
  audioFile: File | null;
  /** STT 분석 진행 중 여부 */
  isAnalyzing: boolean;
  /** 파일 선택 input change 핸들러 */
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** 분석 시작 버튼 클릭 핸들러 */
  onAnalyze: () => void;
}

/**
 * FileUploadCard 컴포넌트
 * - 오디오 파일 선택(드래그 앤 드롭 스타일) 영역 제공
 * - 파일이 없어도 버튼 클릭 가능 → mock 데이터로 결과 미리보기
 * - 파일 유무에 따라 버튼 스타일·라벨을 구분하여 사용자에게 명확히 전달
 */
export default function FileUploadCard({
  audioFile,
  isAnalyzing,
  onFileUpload,
  onAnalyze,
}: FileUploadCardProps) {
  /**
   * 버튼 활성 상태
   * - 파일 있음: 실제 STT 분석 모드
   * - 파일 없음: mock 미리보기 모드 (항상 활성)
   * - 분석 중: 비활성
   */
  const isMockMode = !audioFile;
  const isButtonDisabled = isAnalyzing;

  return (
    <div
      className="p-7 rounded-3xl border transition-all duration-300"
      style={{
        background: "var(--color-bg-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* 카드 제목 */}
      <h2
        className="text-lg font-bold mb-5 flex items-center gap-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        <Upload className="w-5 h-5" style={{ color: "var(--color-accent)" }} />
        파일 업로드
      </h2>

      {/* 파일 선택 드롭 영역 */}
      <label
        className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 group"
        style={{
          borderColor: "var(--color-accent-light)",
          background: audioFile ? "#FFF2C6" : "transparent",
        }}
      >
        <Upload
          className="w-9 h-9 mb-2 transition-transform duration-300 group-hover:scale-110"
          style={{ color: "var(--color-accent-light)" }}
        />
        <p
          className="text-sm font-medium transition-colors"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {audioFile ? audioFile.name : "MP3, WAV, M4A 파일을 선택하세요"}
        </p>
        {/* 실제 파일 input — 시각적으로 숨김 */}
        <input
          type="file"
          className="hidden"
          onChange={onFileUpload}
          accept="audio/*"
        />
      </label>

      {/* STT 분석 / Mock 미리보기 버튼 */}
      <button
        disabled={isButtonDisabled}
        onClick={onAnalyze}
        className="w-full mt-6 py-5 rounded-2xl font-black text-base transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={
          isButtonDisabled
            ? {
                // 분석 중: 비활성 스타일
                background: "rgba(140,169,255,0.25)",
                color: "var(--color-text-secondary)",
              }
            : isMockMode
            ? {
                // 파일 없음: mock 모드 — 점선 테두리 + 연한 스타일로 구분
                background: "#FFF8DE",
                color: "var(--color-accent)",
                border: "2px dashed var(--color-accent-light)",
              }
            : {
                // 파일 있음: 실제 분석 모드 — 강조 그라디언트
                background: "linear-gradient(135deg, var(--color-accent-light), var(--color-accent))",
                color: "#fff",
                boxShadow: "var(--shadow-accent)",
              }
        }
      >
        {isAnalyzing ? (
          "데이터 분석 중..."
        ) : isMockMode ? (
          <>
            <FlaskConical className="w-4 h-4" />
            Mock으로 결과 미리보기
          </>
        ) : (
          "STT 분석 시작하기"
        )}
      </button>

      {/* 파일이 없을 때 안내 문구 */}
      {isMockMode && !isAnalyzing && (
        <p
          className="text-center text-xs mt-3 font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          파일 없이 누르면 Mock 데이터로 결과 화면을 미리볼 수 있어요
        </p>
      )}
    </div>
  );
}
