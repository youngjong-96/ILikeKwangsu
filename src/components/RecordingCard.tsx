"use client";

import { Mic, Square, Headphones, Trash2 } from "lucide-react";

/** RecordingCard props 타입 정의 */
interface RecordingCardProps {
  /** 현재 녹음 중 여부 */
  isRecording: boolean;
  /** 녹음/업로드된 오디오 미리듣기 URL */
  audioUrl: string | null;
  /** 녹음 시작/중지 토글 핸들러 */
  onToggle: () => void;
  /** 녹음 삭제 핸들러 */
  onDelete: () => void;
}

/**
 * RecordingCard 컴포넌트
 * - 마이크 녹음 시작/중지 버튼 제공
 * - 녹음 완료 시 오디오 미리듣기 및 삭제 기능 표시
 */
export default function RecordingCard({
  isRecording,
  audioUrl,
  onToggle,
  onDelete,
}: RecordingCardProps) {
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
        <Mic className="w-5 h-5" style={{ color: "var(--color-accent)" }} />
        음성 녹음
      </h2>

      {/* 녹음 시작/중지 버튼 */}
      <button
        onClick={onToggle}
        className="w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-bold text-base transition-all duration-300 active:scale-95"
        style={
          isRecording
            ? { background: "#FFF2C6", color: "#E25353", border: "2px solid #F9A8A8" }
            : {
                background: "linear-gradient(135deg, var(--color-accent-light), var(--color-accent))",
                color: "#fff",
                boxShadow: "var(--shadow-accent)",
                border: "none",
              }
        }
      >
        {isRecording ? (
          <>
            <Square className="fill-current w-4 h-4" />
            {/* 녹음 중 pulse 애니메이션 */}
            <span className="animate-scale-pulse">녹음 중지 및 저장</span>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            새로운 녹음 시작
          </>
        )}
      </button>

      {/* 녹음 완료 시 미리듣기 영역 */}
      {audioUrl && !isRecording && (
        <div
          className="mt-5 p-4 rounded-2xl border"
          style={{ background: "#FFF8DE", borderColor: "var(--color-accent-light)" }}
        >
          {/* 미리듣기 헤더 - 라벨 & 삭제 버튼 */}
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-xs font-black flex items-center gap-1 uppercase tracking-widest"
              style={{ color: "var(--color-accent)" }}
            >
              <Headphones className="w-3 h-3" /> Recorded
            </span>
            <button
              onClick={onDelete}
              className="text-xs font-bold flex items-center gap-1 transition-opacity hover:opacity-70"
              style={{ color: "#E25353" }}
            >
              <Trash2 className="w-3 h-3" /> 삭제
            </button>
          </div>
          {/* 오디오 플레이어 */}
          <audio src={audioUrl} controls className="w-full h-10" />
        </div>
      )}
    </div>
  );
}
