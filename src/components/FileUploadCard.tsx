"use client";

import { FlaskConical, Sparkles, Upload } from "lucide-react";
import type { LocalSttEngineMode } from "@/lib/stt/localWhisper";

interface SttModeOption {
  value: LocalSttEngineMode;
  label: string;
  description: string;
}

const STT_MODE_OPTIONS: SttModeOption[] = [
  {
    value: "auto",
    label: "자동 추천",
    description: "데스크톱은 Whisper, 모바일은 Moonshine을 우선 사용해요.",
  },
  {
    value: "whisper",
    label: "Whisper",
    description: "정확도 우선 모드예요. 모바일에서는 호환성이 낮을 수 있어요.",
  },
  {
    value: "moonshine",
    label: "Moonshine",
    description: "모바일 호환성과 가벼운 실행을 우선한 한국어 STT예요.",
  },
];

/** FileUploadCard props 타입 정의 */
interface FileUploadCardProps {
  /** 현재 선택된 오디오 파일 */
  audioFile: File | null;
  /** 분석 진행 여부 */
  isAnalyzing: boolean;
  /** 현재 선택된 STT 엔진 모드 */
  sttEngineMode: LocalSttEngineMode;
  /** 파일 업로드 변경 핸들러 */
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** 분석 시작 버튼 핸들러 */
  onAnalyze: () => void;
  /** STT 엔진 모드 변경 핸들러 */
  onSttEngineModeChange: (mode: LocalSttEngineMode) => void;
}

/**
 * 현재 선택된 STT 모드에 맞는 안내 문구를 반환한다.
 */
function getSttModeHelperText(sttEngineMode: LocalSttEngineMode, isMockMode: boolean) {
  if (isMockMode) {
    return "파일 없이 누르면 Mock 데이터로 결과 화면을 미리 보여줍니다.";
  }

  switch (sttEngineMode) {
    case "auto":
      return "자동 추천은 데스크톱에서 Whisper, 모바일에서 Moonshine을 우선 사용해요.";
    case "whisper":
      return "Whisper는 정확도가 좋지만 모바일 브라우저에서는 준비 시간이 길거나 호환성 이슈가 있을 수 있어요.";
    case "moonshine":
      return "Moonshine은 모바일과 저사양 환경을 고려한 가벼운 한국어 STT 모델이에요.";
    default:
      return "첫 분석은 음성 인식 준비 때문에 조금 더 걸릴 수 있어요.";
  }
}

/**
 * 파일 업로드 카드 컴포넌트
 * - 오디오 파일 업로드와 STT 엔진 선택을 함께 제공한다.
 * - 파일이 없을 때는 Mock 결과 미리보기를 제공한다.
 * - 파일이 있을 때는 선택된 엔진 모드에 맞춰 브라우저 로컬 분석을 시작한다.
 */
export default function FileUploadCard({
  audioFile,
  isAnalyzing,
  sttEngineMode,
  onFileUpload,
  onAnalyze,
  onSttEngineModeChange,
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
        <input type="file" className="hidden" onChange={onFileUpload} accept="audio/*" />
      </label>

      <div
        className="mt-5 p-4 rounded-2xl border"
        style={{
          background: "#FFFDF5",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
          <p
            className="text-sm font-black tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            STT 엔진 선택
          </p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          {STT_MODE_OPTIONS.map((option) => {
            const isSelected = sttEngineMode === option.value;

            return (
              <button
                key={option.value}
                type="button"
                disabled={isAnalyzing}
                onClick={() => onSttEngineModeChange(option.value)}
                className="w-full text-left rounded-2xl px-4 py-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: isSelected ? "#EEF4FF" : "var(--color-bg-card)",
                  border: isSelected
                    ? "1.5px solid var(--color-accent-light)"
                    : "1.5px solid var(--color-border)",
                  boxShadow: isSelected ? "var(--shadow-accent)" : "none",
                }}
              >
                <p
                  className="text-sm font-black"
                  style={{
                    color: isSelected ? "var(--color-accent)" : "var(--color-text-primary)",
                  }}
                >
                  {option.label}
                </p>
                <p
                  className="text-xs mt-1 leading-5"
                  style={{ color: "var(--color-text-secondary)" }}
                >
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

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

      <p
        className="text-center text-xs mt-3 font-medium leading-5"
        style={{ color: "var(--color-text-secondary)" }}
      >
        {getSttModeHelperText(sttEngineMode, isMockMode)}
      </p>
    </div>
  );
}
