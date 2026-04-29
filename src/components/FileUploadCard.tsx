"use client";

import { Upload } from "lucide-react";

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
 * - 파일이 선택되면 STT 분석 시작 버튼 활성화
 */
export default function FileUploadCard({
  audioFile,
  isAnalyzing,
  onFileUpload,
  onAnalyze,
}: FileUploadCardProps) {
  /** 분석 버튼 활성 상태 (파일 있음 && 분석 중 아님) */
  const isButtonActive = !!audioFile && !isAnalyzing;

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
          // 파일이 선택되면 크림 배경으로 하이라이트
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
        {/* 실제 파일 input - 시각적으로 숨김 */}
        <input
          type="file"
          className="hidden"
          onChange={onFileUpload}
          accept="audio/*"
        />
      </label>

      {/* STT 분석 시작 버튼 */}
      <button
        disabled={!isButtonActive}
        onClick={onAnalyze}
        className="w-full mt-6 py-5 rounded-2xl font-black text-base transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: isButtonActive
            ? "linear-gradient(135deg, var(--color-accent-light), var(--color-accent))"
            : "rgba(140,169,255,0.25)",
          color: isButtonActive ? "#fff" : "var(--color-text-secondary)",
          boxShadow: isButtonActive ? "var(--shadow-accent)" : "none",
        }}
      >
        {isAnalyzing ? "데이터 분석 중..." : "STT 분석 시작하기"}
      </button>
    </div>
  );
}
