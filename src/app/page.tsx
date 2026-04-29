"use client";

import React, { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import RecordingCard from "@/components/RecordingCard";
import FileUploadCard from "@/components/FileUploadCard";
import AnalysisReport from "@/components/AnalysisReport";
import { WordResult } from "@/components/ResultBadges";

/**
 * 메인 페이지 (컨테이너 역할)
 * - 모든 상태(state)와 핸들러(handler)를 관리
 * - 각 UI 구성 컴포넌트에 props로 내려줌
 * - 레이아웃 그리드만 담당하고 UI 세부사항은 컴포넌트에 위임
 */
export default function Home() {
  // ===================================================
  // 전역 상태
  // ===================================================
  const [mounted, setMounted] = useState(false);                        // SSR Hydration 방지
  const [isRecording, setIsRecording] = useState(false);               // 녹음 진행 중 여부
  const [audioFile, setAudioFile] = useState<File | null>(null);       // 선택/녹음된 오디오 파일
  const [audioUrl, setAudioUrl] = useState<string | null>(null);       // 오디오 미리듣기 URL
  const [isAnalyzing, setIsAnalyzing] = useState(false);               // STT 분석 진행 중 여부
  const [result, setResult] = useState<WordResult[] | null>(null);     // 분석 결과 배열
  const [transcribedText, setTranscribedText] = useState<string>("");  // STT 변환 텍스트

  const mediaRecorder = useRef<MediaRecorder | null>(null); // MediaRecorder 인스턴스
  const audioChunks = useRef<Blob[]>([]);                   // 녹음 청크 임시 저장 버퍼

  // 클라이언트 마운트 감지 (브라우저 확장 프로그램 Hydration 충돌 방지)
  useEffect(() => {
    setMounted(true);
  }, []);

  // ===================================================
  // 녹음 시작/중지 토글 핸들러
  // ===================================================
  const handleToggleRecording = async () => {
    if (!isRecording) {
      try {
        // 마이크 권한 요청 및 스트림 획득
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);
        audioChunks.current = [];

        // 데이터 청크 누적
        mediaRecorder.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };

        // 녹음 종료 시 Blob → File 변환 및 미리듣기 URL 생성
        mediaRecorder.current.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
          const url = URL.createObjectURL(audioBlob);
          const file = new File([audioBlob], "recorded_audio.webm", { type: "audio/webm" });
          setAudioUrl(url);
          setAudioFile(file);
        };

        mediaRecorder.current.start();
        setIsRecording(true);
      } catch (err) {
        alert("마이크 접근 권한이 필요합니다.");
        console.error(err);
      }
    } else {
      // 녹음 중지 및 스트림 트랙 해제
      if (mediaRecorder.current) {
        mediaRecorder.current.stop();
        mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
      }
    }
  };

  // ===================================================
  // 녹음 삭제 핸들러 (RecordingCard에서 호출)
  // ===================================================
  const handleDeleteAudio = () => {
    setAudioUrl(null);
    setAudioFile(null);
  };

  // ===================================================
  // 파일 업로드 핸들러 (FileUploadCard에서 호출)
  // ===================================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  // ===================================================
  // STT 분석 요청 핸들러 (FileUploadCard에서 호출)
  // ===================================================
  const handleAnalyze = async () => {
    if (!audioFile) return;

    setIsAnalyzing(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", audioFile);

    try {
      const response = await fetch("/api/stt", {
        method: "POST",
        body: formData,
      });

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
  // 전체 초기화 핸들러 (AnalysisReport에서 호출)
  // ===================================================
  const handleReset = () => {
    setResult(null);
    setAudioFile(null);
    setAudioUrl(null);
    setTranscribedText("");
  };

  // SSR 중에는 렌더링하지 않음 (Hydration 불일치 방지)
  if (!mounted) return null;

  return (
    <main
      style={{ background: "var(--color-bg-main)" }}
      className="min-h-screen p-4 md:p-10 transition-all duration-500"
    >
      <div className="max-w-6xl mx-auto">

        {/* 헤더: 로고 + 서비스명 */}
        <Header />

        {/* ── 초기 상태: 입력 카드만 표시 (스크롤 없이 뷰포트에 맞게) ── */}
        {!result && !isAnalyzing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-slide-up">
            {/* 녹음 카드 */}
            <RecordingCard
              isRecording={isRecording}
              audioUrl={audioUrl}
              onToggle={handleToggleRecording}
              onDelete={handleDeleteAudio}
            />

            {/* 파일 업로드 카드 */}
            <FileUploadCard
              audioFile={audioFile}
              isAnalyzing={isAnalyzing}
              onFileUpload={handleFileUpload}
              onAnalyze={handleAnalyze}
            />
          </div>
        )}

        {/* ── 분석 중 또는 결과 있음: 리포트 패널이 전체 너비 차지 ── */}
        {(result || isAnalyzing) && (
          <AnalysisReport
            result={result}
            transcribedText={transcribedText}
            isAnalyzing={isAnalyzing}
            onReset={handleReset}
          />
        )}
      </div>
    </main>
  );
}