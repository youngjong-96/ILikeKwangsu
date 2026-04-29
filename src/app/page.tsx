"use client";

import React, { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import RecordingCard from "@/components/RecordingCard";
import FileUploadCard from "@/components/FileUploadCard";
import AnalysisReport from "@/components/AnalysisReport";
import { WordResult } from "@/components/ResultBadges";
import { MOCK_STT_TEXT, MOCK_STT_RESULT } from "@/app/mock/sttMockData";

/**
 * 메인 페이지 (컨테이너 역할)
 * - 결과/분석 중 상태: h-screen overflow-hidden → 스크롤 없이 한 화면에 표시
 * - 초기 상태: min-h-screen (카드 2개만 표시)
 */
export default function Home() {
  // ===================================================
  // 전역 상태
  // ===================================================
  const [mounted, setMounted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<WordResult[] | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>("");

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // 클라이언트 마운트 감지 (Hydration 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  // ===================================================
  // 녹음 시작/중지 핸들러
  // ===================================================
  const handleToggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);
        audioChunks.current = [];

        mediaRecorder.current.ondataavailable = (event) => {
          if (event.data.size > 0) audioChunks.current.push(event.data);
        };

        mediaRecorder.current.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
          setAudioUrl(URL.createObjectURL(audioBlob));
          setAudioFile(new File([audioBlob], "recorded_audio.webm", { type: "audio/webm" }));
        };

        mediaRecorder.current.start();
        setIsRecording(true);
      } catch (err) {
        alert("마이크 접근 권한이 필요합니다.");
        console.error(err);
      }
    } else {
      if (mediaRecorder.current) {
        mediaRecorder.current.stop();
        mediaRecorder.current.stream.getTracks().forEach((t) => t.stop());
        setIsRecording(false);
      }
    }
  };

  // ===================================================
  // 녹음 삭제 핸들러
  // ===================================================
  const handleDeleteAudio = () => {
    setAudioUrl(null);
    setAudioFile(null);
  };

  // ===================================================
  // 파일 업로드 핸들러
  // ===================================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  // ===================================================
  // STT 분석 요청 핸들러
  // - 파일 없음: mock 데이터로 결과 미리보기 (API 호출 없음)
  // - 파일 있음: GMS STT API 실제 호출
  // ===================================================
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);

    // ── Mock 모드: 파일이 없으면 mock 데이터 사용 ──
    if (!audioFile) {
      // 로딩 애니메이션을 확인할 수 있도록 1.2초 딜레이
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setResult(MOCK_STT_RESULT);
      setTranscribedText(MOCK_STT_TEXT);
      setIsAnalyzing(false);
      return;
    }

    // ── 실제 분석 모드: GMS STT API 호출 ──
    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      const response = await fetch("/api/stt", { method: "POST", body: formData });
      if (!response.ok) throw new Error("서버 분석 실패");

      const data = await response.json();
      if (data.result) {
        setResult(data.result);
        setTranscribedText(data.text);
      } else {
        alert("분석 결과가 없습니다.");
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      alert("분석 중 오류가 발생했습니다. API 설정을 확인해주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ===================================================
  // 초기화 핸들러
  // ===================================================
  const handleReset = () => {
    setResult(null);
    setAudioFile(null);
    setAudioUrl(null);
    setTranscribedText("");
  };

  if (!mounted) return null;

  /** 결과/분석 중 여부 — 레이아웃 전환 기준 */
  const isResultMode = !!(result || isAnalyzing);

  return (
    <main
      style={{ background: "var(--color-bg-main)" }}
      className={`transition-all duration-500 ${
        isResultMode
          // 결과 화면: 뷰포트 전체 고정, overflow 차단 → 스크롤 없음
          ? "h-screen overflow-hidden flex flex-col p-4 md:p-6"
          // 초기 화면: 일반 스크롤 레이아웃
          : "min-h-screen p-4 md:p-10"
      }`}
    >
      {/* 콘텐츠 래퍼: 결과 모드에서 남은 높이를 flex로 채움 */}
      <div
        className={`max-w-6xl mx-auto w-full ${
          isResultMode ? "flex flex-col flex-1 min-h-0" : ""
        }`}
      >
        {/* 헤더: 결과 모드에서 compact 크기로 축소 */}
        <Header compact={isResultMode} />

        {/* ── 초기 입력 화면 ── */}
        {!isResultMode && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-slide-up">
            <RecordingCard
              isRecording={isRecording}
              audioUrl={audioUrl}
              onToggle={handleToggleRecording}
              onDelete={handleDeleteAudio}
            />
            <FileUploadCard
              audioFile={audioFile}
              isAnalyzing={isAnalyzing}
              onFileUpload={handleFileUpload}
              onAnalyze={handleAnalyze}
            />
          </div>
        )}

        {/* ── 결과/분석 중 화면: 남은 높이를 전부 차지 ── */}
        {isResultMode && (
          <AnalysisReport
            result={result}
            transcribedText={transcribedText}
            isAnalyzing={isAnalyzing}
            onReset={handleReset}
            className="flex-1 min-h-0"
          />
        )}
      </div>
    </main>
  );
}