"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Upload, BarChart3, MessageSquare, Trash2, Headphones, Play } from 'lucide-react';
import WordCloud from '@/components/WordCloud';

export default function Home() {
  // 1. Hydration 오류 방지 및 상태 관리
  const [mounted, setMounted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ word: string; count: number }[] | null>(null);
  const [transcribedText, setTranscribedText] = useState<string>("");

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

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
          const url = URL.createObjectURL(audioBlob);
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
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  // 분석 시작 핸들러
  const handleAnalyze = async () => {
    if (!audioFile) return;

    setIsAnalyzing(true);
    setResult(null); 
    
    const formData = new FormData();
    formData.append('file', audioFile);

    try {
      const response = await fetch('/api/stt', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('서버 분석 실패');

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

  // 분석 초기화 (새로 분석하기)
  const handleReset = () => {
    setResult(null);
    setAudioFile(null);
    setAudioUrl(null);
    setTranscribedText("");
  };

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-12 transition-all duration-500">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight flex justify-center items-center gap-3">
            <span className="bg-blue-600 text-white p-2 rounded-xl">🎙️</span> Ko-WordCounter
          </h1>
          <p className="text-gray-500 font-medium italic">음성을 데이터로, 키워드를 한눈에.</p>
        </header>

        {/* 결과(result) 유무에 따라 그리드 컬럼 수를 조절 (1개 vs 2개) */}
        <div className={`grid gap-8 transition-all duration-700 ${result ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          
          {/* 입력 섹션: 분석 결과가 없을 때만 표시 */}
          {!result && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
              {/* 녹음 카드 */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Mic className="w-6 h-6 text-blue-500" /> 음성 녹음
                </h2>
                <button
                  onClick={toggleRecording}
                  className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-bold text-lg transition-all ${
                    isRecording 
                      ? 'bg-red-50 text-red-600 border-2 border-red-200 animate-pulse' 
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 shadow-lg'
                  }`}
                >
                  {isRecording ? <Square className="fill-current w-4 h-4" /> : <Mic className="w-5 h-5" />}
                  {isRecording ? '녹음 중지 및 저장' : '새로운 녹음 시작'}
                </button>

                {audioUrl && !isRecording && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-blue-600 flex items-center gap-1 uppercase tracking-tighter">
                        <Headphones className="w-3 h-3" /> Recorded Content
                      </span>
                      <button 
                        onClick={() => { setAudioUrl(null); setAudioFile(null); }}
                        className="text-xs text-red-500 hover:underline flex items-center gap-1 font-bold"
                      >
                        <Trash2 className="w-3 h-3" /> DELETE
                      </button>
                    </div>
                    <audio src={audioUrl} controls className="w-full h-10" />
                  </div>
                )}
              </div>

              {/* 파일 업로드 카드 */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <Upload className="w-6 h-6 text-green-500" /> 파일 업로드
                </h2>
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-blue-50/30 transition-all group">
                  <Upload className="w-10 h-10 text-gray-300 group-hover:text-blue-400 mb-2 transition-colors" />
                  <p className="text-sm text-gray-500 font-medium group-hover:text-blue-500">
                    {audioFile ? audioFile.name : 'MP3, WAV, M4A 파일을 선택하세요'}
                  </p>
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="audio/*" />
                </label>
                
                <button
                  disabled={!audioFile || isAnalyzing}
                  onClick={handleAnalyze}
                  className="w-full mt-8 py-5 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl disabled:bg-gray-200 active:scale-95 transition-all"
                >
                  {isAnalyzing ? '데이터 분석 중...' : 'STT 분석 시작하기'}
                </button>
              </div>
            </div>
          )}

          {/* 결과 섹션: 결과가 나오면 grid-cols-1에 의해 자동으로 전체 확장 */}
          <div className={`bg-white p-8 rounded-3xl shadow-sm border border-gray-100 min-h-[600px] flex flex-col transition-all duration-700 ${result ? 'ring-2 ring-blue-500/10 shadow-2xl' : ''}`}>
            <div className="flex items-center justify-between mb-8 border-b pb-6">
              <h2 className="text-2xl font-black flex items-center gap-2 italic tracking-tighter">
                <BarChart3 className="w-7 h-7 text-purple-500" /> ANALYSIS REPORT
              </h2>
              {result && (
                <button 
                  onClick={handleReset} 
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> 새로 분석하기
                </button>
              )}
            </div>
            
            {result ? (
              <div className="animate-in zoom-in-95 duration-700 space-y-10">
                {/* 뱃지 요약 정보 */}
                <div className="flex gap-3 overflow-x-auto pb-2">
                  <div className="bg-blue-50 px-5 py-3 rounded-2xl border border-blue-100 flex-shrink-0">
                    <p className="text-[10px] text-blue-500 font-black uppercase tracking-widest mb-1">Total Keywords</p>
                    <p className="text-2xl font-black text-blue-700">{result.length}</p>
                  </div>
                  <div className="bg-purple-50 px-5 py-3 rounded-2xl border border-purple-100 flex-shrink-0">
                    <p className="text-[10px] text-purple-500 font-black uppercase tracking-widest mb-1">Most Used</p>
                    <p className="text-2xl font-black text-purple-700">"{result[0]?.word}"</p>
                  </div>
                </div>

                {/* 워드 클라우드 영역 */}
                <div className="space-y-4">
                  <p className="text-xs font-black text-gray-400 mb-3 uppercase tracking-widest text-center">Visual Keyword Cloud</p>
                  <div className="bg-gray-50 rounded-3xl p-4 shadow-inner border border-gray-100">
                    <WordCloud words={result} />
                  </div>
                </div>

                {/* 텍스트 & 상세 리스트 그리드 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col">
                    <p className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Transcribed text</p>
                    <div className="text-gray-700 leading-relaxed italic text-sm overflow-y-auto max-h-40 pr-2">
                      "{transcribedText}"
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest">Top 5 Ranking</p>
                    {result.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                        <span className="font-bold text-gray-700">
                          <span className="text-blue-500 font-black mr-3 opacity-50">0{index+1}</span>
                          {item.word}
                        </span>
                        <span className="font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-lg text-sm">{item.count}회</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center space-y-4">
                {isAnalyzing ? (
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
                    <p className="text-blue-600 font-black text-xl animate-pulse">GMS ANALYZING...</p>
                    <p className="text-sm text-gray-400 mt-2">음성을 텍스트로 변환하고 단어를 세는 중입니다.</p>
                  </div>
                ) : (
                  <>
                    <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <MessageSquare className="w-12 h-12 opacity-10" />
                    </div>
                    <p className="text-lg font-medium">분석을 시작하면<br /><span className="text-blue-500 font-bold">전체 리포트 화면</span>이 여기에 나타납니다.</p>
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