"use client";

import React, { useEffect, useRef, useState } from "react";
import Header from "@/components/Header";
import RecordingCard from "@/components/RecordingCard";
import FileUploadCard from "@/components/FileUploadCard";
import AnalysisReport from "@/components/AnalysisReport";
import type { WordResult } from "@/components/ResultBadges";
import { MOCK_STT_RESULT, MOCK_STT_TEXT } from "@/app/mock/sttMockData";
import { transcribeAudioFileWithLocalWhisper } from "@/lib/stt/localWhisper";

const MOCK_ANALYSIS_LABEL = "Mock Demo";

interface RecordingFormatConfig {
  mimeType: string;
  fileExtension: string;
}

const DEFAULT_RECORDING_FORMAT: RecordingFormatConfig = {
  mimeType: "audio/webm",
  fileExtension: "webm",
};

const RECORDING_FORMAT_CANDIDATES: RecordingFormatConfig[] = [
  { mimeType: "audio/webm;codecs=opus", fileExtension: "webm" },
  { mimeType: "audio/mp4", fileExtension: "m4a" },
  { mimeType: "audio/webm", fileExtension: "webm" },
  { mimeType: "audio/ogg;codecs=opus", fileExtension: "ogg" },
];

/**
 * 공백 기준으로 단어를 분리해 출현 빈도를 계산한 뒤 많이 나온 순서로 정렬한다.
 */
function buildWordFrequencyResult(text: string): WordResult[] {
  const words = text
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 0);

  const wordCounts: Record<string, number> = {};

  words.forEach((word) => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });

  return Object.entries(wordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 현재 브라우저가 지원하는 녹음 포맷 중 가장 호환성이 높은 후보를 고른다.
 */
function getSupportedRecordingFormat(): RecordingFormatConfig {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    return DEFAULT_RECORDING_FORMAT;
  }

  return (
    RECORDING_FORMAT_CANDIDATES.find((candidate) =>
      MediaRecorder.isTypeSupported(candidate.mimeType),
    ) ?? DEFAULT_RECORDING_FORMAT
  );
}

/**
 * 실제 녹음 결과의 MIME 타입을 보고 파일 확장자를 안정적으로 결정한다.
 */
function getFileExtensionForMimeType(mimeType: string, fallbackExtension: string) {
  if (mimeType.includes("mp4")) {
    return "m4a";
  }

  if (mimeType.includes("ogg")) {
    return "ogg";
  }

  if (mimeType.includes("wav")) {
    return "wav";
  }

  if (mimeType.includes("mpeg") || mimeType.includes("mp3")) {
    return "mp3";
  }

  if (mimeType.includes("webm")) {
    return "webm";
  }

  return fallbackExtension;
}

/**
 * 메인 페이지 컨테이너
 * - 초기 상태에서는 녹음 카드와 업로드 카드를 보여준다.
 * - 분석을 시작하면 결과 화면으로 전환해 워드클라우드와 랭킹을 보여준다.
 */
export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<WordResult[] | null>(null);
  const [transcribedText, setTranscribedText] = useState("");
  const [analysisLabel, setAnalysisLabel] = useState("");
  const [analysisStatusText, setAnalysisStatusText] = useState("");

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const recordingFormat = useRef<RecordingFormatConfig>(DEFAULT_RECORDING_FORMAT);

  /**
   * 생성한 오브젝트 URL을 정리해 페이지를 벗어날 때 메모리 누수를 줄인다.
   */
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  /**
   * 마이크 녹음을 시작하거나 종료하고, 종료 시 브라우저가 만든 실제 포맷으로 파일을 저장한다.
   */
  const handleToggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const nextRecordingFormat = getSupportedRecordingFormat();

        recordingFormat.current = nextRecordingFormat;
        mediaRecorder.current = nextRecordingFormat.mimeType
          ? new MediaRecorder(stream, { mimeType: nextRecordingFormat.mimeType })
          : new MediaRecorder(stream);
        audioChunks.current = [];

        mediaRecorder.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };

        mediaRecorder.current.onstop = () => {
          const recordedMimeType =
            audioChunks.current.find((chunk) => chunk.type)?.type ||
            recordingFormat.current.mimeType ||
            DEFAULT_RECORDING_FORMAT.mimeType;
          const fileExtension = getFileExtensionForMimeType(
            recordedMimeType,
            recordingFormat.current.fileExtension,
          );
          const audioBlob = recordedMimeType
            ? new Blob(audioChunks.current, { type: recordedMimeType })
            : new Blob(audioChunks.current);
          const nextAudioUrl = URL.createObjectURL(audioBlob);

          if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
          }

          setAudioUrl(nextAudioUrl);
          setAudioFile(
            new File([audioBlob], `recorded_audio.${fileExtension}`, {
              type: audioBlob.type || recordedMimeType,
            }),
          );
        };

        mediaRecorder.current.start();
        setIsRecording(true);
      } catch (error) {
        alert("마이크 접근 권한이 필요합니다.");
        console.error(error);
      }

      return;
    }

    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
    }
  };

  /**
   * 현재 선택된 녹음 또는 업로드 파일을 비운다.
   */
  const handleDeleteAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioUrl(null);
    setAudioFile(null);
  };

  /**
   * 업로드한 오디오 파일을 상태에 반영하고 미리듣기용 URL을 다시 만든다.
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0]) {
      return;
    }

    const file = event.target.files[0];

    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
  };

  /**
   * 실제 오디오가 있으면 브라우저 로컬 Whisper로, 없으면 mock 데이터로 분석을 진행한다.
   */
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setResult(null);
    setAnalysisLabel("");
    setAnalysisStatusText("");

    if (!audioFile) {
      await new Promise((resolve) => setTimeout(resolve, 1200));
      setResult(MOCK_STT_RESULT);
      setTranscribedText(MOCK_STT_TEXT);
      setAnalysisLabel(MOCK_ANALYSIS_LABEL);
      setAnalysisStatusText("Mock 데이터로 결과를 미리 보여주고 있습니다.");
      setIsAnalyzing(false);
      return;
    }

    try {
      const transcriptionResult = await transcribeAudioFileWithLocalWhisper(audioFile, (status) => {
        setAnalysisStatusText(status.message);
      });
      const wordFrequencyResult = buildWordFrequencyResult(transcriptionResult.text);

      if (wordFrequencyResult.length === 0) {
        throw new Error("전사된 텍스트가 비어 있어 단어 빈도를 계산할 수 없습니다.");
      }

      setResult(wordFrequencyResult);
      setTranscribedText(transcriptionResult.text);
      setAnalysisLabel(transcriptionResult.runtimeLabel);
    } catch (error) {
      console.error("Analysis failed:", error);
      alert(
        error instanceof Error
          ? error.message
          : "브라우저 로컬 Whisper 분석 중 오류가 발생했습니다.",
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  /**
   * 분석 결과와 선택된 오디오를 모두 초기 상태로 되돌린다.
   */
  const handleReset = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    setResult(null);
    setAudioFile(null);
    setAudioUrl(null);
    setTranscribedText("");
    setAnalysisLabel("");
    setAnalysisStatusText("");
  };

  const isResultMode = Boolean(result || isAnalyzing);

  return (
    <main
      style={{ background: "var(--color-bg-main)" }}
      className={`transition-all duration-500 ${
        isResultMode
          ? "h-screen overflow-hidden flex flex-col p-4 md:p-6"
          : "min-h-screen p-4 md:p-10"
      }`}
    >
      <div
        className={`max-w-6xl mx-auto w-full ${
          isResultMode ? "flex flex-col flex-1 min-h-0" : ""
        }`}
      >
        <Header compact={isResultMode} />

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

        {isResultMode && (
          <AnalysisReport
            result={result}
            transcribedText={transcribedText}
            isAnalyzing={isAnalyzing}
            analysisLabel={analysisLabel}
            loadingStatusText={analysisStatusText}
            onReset={handleReset}
            className="flex-1 min-h-0"
          />
        )}
      </div>
    </main>
  );
}
