"use client";

import { FlaskConical, Upload } from "lucide-react";

/** FileUploadCard props 타입 정의 */
interface FileUploadCardProps {
  /** 현재 선택된 오디오 파일 */
  audioFile: File | null;
  /** 분석 진행 여부 */
  isAnalyzing: boolean;
  /** 파일 업로드 변경 핸들러 */
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** 분석 시작 버튼 핸들러 */
  onAnalyze: () => void;
}

/**
 * 파일 업로드 카드 컴포넌트
 * - 사용자가 오디오 파일을 선택할 수 있는 드롭존 역할을 한다.
 * - 파일이 없을 때는 mock 결과 미리보기를 제공한다.
 * - 파일이 있을 때는 브라우저 로컬 Whisper 분석 버튼으로 동작한다.
 */
export default function FileUploadCard({
  audioFile,
  isAnalyzing,
  onFileUpload,
  onAnalyze,
}: FileUploadCardProps) {
  const isMockMode = !audioFile;

  return (
    <div
      className="p-7 rounded-3xl border transition-all duration-300"
      style={{
        background: "var(--color-bg-card)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <h2
        className="text-lg font-bold mb-5 flex items-center gap-2"
        style={{ color: "var(--color-text-primary)" }}
      >
        <Upload className="w-5 h-5" style={{ color: "var(--color-accent)" }} />
        파일 업로드
      </h2>

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
        <input
          type="file"
          className="hidden"
          onChange={onFileUpload}
          accept="audio/*"
        />
      </label>

      <button
        disabled={isAnalyzing}
        onClick={onAnalyze}
        className="w-full mt-6 py-5 rounded-2xl font-black text-base transition-all duration-300 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={
          isAnalyzing
            ? {
                background: "rgba(140,169,255,0.25)",
                color: "var(--color-text-secondary)",
              }
            : isMockMode
              ? {
                  background: "#FFF8DE",
                  color: "var(--color-accent)",
                  border: "2px dashed var(--color-accent-light)",
                }
              : {
                  background:
                    "linear-gradient(135deg, var(--color-accent-light), var(--color-accent))",
                  color: "#fff",
                  boxShadow: "var(--shadow-accent)",
                }
        }
      >
        {isAnalyzing ? (
          "브라우저에서 분석하고 있어요..."
        ) : isMockMode ? (
          <>
            <FlaskConical className="w-4 h-4" />
            Mock 결과 미리보기
          </>
        ) : (
          "브라우저에서 음성 분석 시작"
        )}
      </button>

      {isMockMode && !isAnalyzing && (
        <p
          className="text-center text-xs mt-3 font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          파일 없이 누르면 Mock 데이터로 결과 화면을 미리 보여줍니다.
        </p>
      )}

      {!isMockMode && !isAnalyzing && (
        <p
          className="text-center text-xs mt-3 font-medium"
          style={{ color: "var(--color-text-secondary)" }}
        >
          첫 분석은 음성 인식 준비 때문에 조금 더 걸릴 수 있어요. 준비가 끝나면 다음 분석은 더 빨라집니다.
        </p>
      )}
    </div>
  );
}
