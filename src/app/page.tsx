"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, BarChart3, MessageSquare, Play, Trash2, Headphones } from 'lucide-react';

export default function Home() {
  // 1. Hydration 오류 방지를 위한 마운트 상태 관리
  const [mounted, setMounted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null); // 녹음 재생용 URL
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ word: string; count: number }[] | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>(""); // 전체 변환 텍스트 저장

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  // 컴포넌트 마운트 시 실행
  useEffect(() => {
    setMounted(true);
  }, []);

  // 녹음 시작/중지 핸들러
  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder.current = new MediaRecorder(stream);
        audioChunks.current = [];

        mediaRecorder.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.current.push(event.data);
          }
        };

        mediaRecorder.current.onstop = () => {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(audioBlob); // 재생 가능한 URL 생성
          const file = new File([audioBlob], "recorded_audio.webm", { type: 'audio/webm' });
          
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
      if (mediaRecorder.current) {
        mediaRecorder.current.stop();
        mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      }
    }
  };

  // 파일 업로드 핸들러
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file)); // 업로드한 파일도 들어볼 수 있게 설정
    }
  };

  // 분석 시작 핸들러
  const handleAnalyze = async () => {
    if (!audioFile) return;

    setIsAnalyzing(true);
    setResult(null); // 이전 결과 초기화
    
    const formData = new FormData();
    formData.append('file', audioFile);

    try {
      const response = await fetch('/api/stt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('서버 분석 실패');
      }

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

  // 초기 렌더링 시 Hydration 오류 방지
  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎙️ Ko-WordCounter</h1>
          <p className="text-gray-600">음성을 녹음하고 어떤 단어를 가장 많이 썼는지 확인하세요.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 입력 섹션 */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Mic className="w-5 h-5 text-blue-500" /> 음성 녹음
              </h2>
              <button
                onClick={toggleRecording}
                className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-medium transition-all ${
                  isRecording 
                    ? 'bg-red-50 text-red-600 border-2 border-red-200 animate-pulse' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isRecording ? <Square className="fill-current w-4 h-4" /> : <Mic className="w-5 h-5" />}
                {isRecording ? '녹음 중지 및 저장' : '새로운 녹음 시작'}
              </button>

              {/* 녹음 확인용 플레이어 */}
              {audioUrl && !isRecording && (
                <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                      <Headphones className="w-3 h-3" /> 녹음 데이터 확인
                    </span>
                    <button 
                      onClick={() => { setAudioUrl(null); setAudioFile(null); }}
                      className="text-xs text-red-500 hover:underline flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> 삭제
                    </button>
                  </div>
                  <audio src={audioUrl} controls className="w-full h-10" />
                </div>
              )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-green-500" /> 파일 직접 업로드
              </h2>
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 text-center px-4">
                    {audioFile ? audioFile.name : 'MP3, WAV, M4A 파일 선택'}
                  </p>
                </div>
                <input type="file" className="hidden" onChange={handleFileUpload} accept="audio/*" />
              </label>
              
              <button
                disabled={!audioFile || isAnalyzing}
                onClick={handleAnalyze}
                className="w-full mt-6 py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg disabled:bg-gray-300 active:scale-[0.98] transition-all"
              >
                {isAnalyzing ? 'GMS 분석 중...' : 'STT 분석 시작하기'}
              </button>
            </div>
          </div>

          {/* 결과 섹션 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 min-h-[500px] flex flex-col">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2 border-b pb-4">
              <BarChart3 className="w-5 h-5 text-purple-500" /> 분석 리포트
            </h2>
            
            {result ? (
              <div className="flex-1 space-y-4">
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-xs font-bold text-gray-400 mb-2 uppercase">전체 변환 텍스트</p>
                  <p className="text-gray-700 leading-relaxed text-sm italic">"{transcribedText}"</p>
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase">단어 빈도 순위</p>
                <div className="space-y-2">
                  {result.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                      <span className="font-semibold text-gray-800">
                        <span className="text-gray-300 mr-2">{index + 1}</span>
                        {item.word}
                      </span>
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-black">
                        {item.count}회
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-blue-500 font-medium">GMS가 음성을 텍스트로 변환하고 있습니다...</p>
                  </div>
                ) : (
                  <>
                    <MessageSquare className="w-16 h-16 mb-4 opacity-10" />
                    <p className="text-center">왼쪽에서 음성을 녹음하거나<br />파일을 업로드하면 분석이 시작됩니다.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}