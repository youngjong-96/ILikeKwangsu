"use client";

export interface DecodedAudioData {
  pcmData: Float32Array;
  durationSeconds: number;
  sampleRate: number;
}

interface BrowserWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
  webkitOfflineAudioContext?: typeof OfflineAudioContext;
}

/**
 * 브라우저가 제공하는 AudioContext 생성자를 안전하게 가져온다.
 */
function getAudioContextConstructor() {
  const browserWindow = window as BrowserWindow;
  return globalThis.AudioContext ?? browserWindow.webkitAudioContext;
}

/**
 * 브라우저가 제공하는 OfflineAudioContext 생성자를 안전하게 가져온다.
 */
function getOfflineAudioContextConstructor() {
  const browserWindow = window as BrowserWindow;
  return globalThis.OfflineAudioContext ?? browserWindow.webkitOfflineAudioContext;
}

/**
 * 멀티 채널 오디오를 평균내어 단일 모노 PCM 데이터로 변환한다.
 */
function mixToMono(audioBuffer: AudioBuffer) {
  if (audioBuffer.numberOfChannels === 1) {
    return audioBuffer.getChannelData(0).slice();
  }

  const monoData = new Float32Array(audioBuffer.length);

  for (let channelIndex = 0; channelIndex < audioBuffer.numberOfChannels; channelIndex += 1) {
    const channelData = audioBuffer.getChannelData(channelIndex);

    for (let sampleIndex = 0; sampleIndex < channelData.length; sampleIndex += 1) {
      monoData[sampleIndex] += channelData[sampleIndex] / audioBuffer.numberOfChannels;
    }
  }

  return monoData;
}

/**
 * Whisper 입력에 맞추기 위해 오디오를 목표 샘플레이트로 리샘플링한다.
 */
async function resampleAudioBuffer(audioBuffer: AudioBuffer, targetSampleRate: number) {
  if (audioBuffer.sampleRate === targetSampleRate) {
    return audioBuffer;
  }

  const OfflineAudioContextConstructor = getOfflineAudioContextConstructor();

  if (!OfflineAudioContextConstructor) {
    throw new Error("이 브라우저는 오디오 리샘플링을 지원하지 않습니다.");
  }

  const targetFrameCount = Math.ceil(audioBuffer.duration * targetSampleRate);
  const offlineContext = new OfflineAudioContextConstructor(1, targetFrameCount, targetSampleRate);
  const bufferSource = offlineContext.createBufferSource();

  bufferSource.buffer = audioBuffer;
  bufferSource.connect(offlineContext.destination);
  bufferSource.start(0);

  return offlineContext.startRendering();
}

/**
 * 업로드된 오디오 파일을 디코딩한 뒤 Whisper가 바로 사용할 수 있는 모노 PCM으로 변환한다.
 */
export async function decodeAudioFileToMonoPcm(file: File, targetSampleRate: number): Promise<DecodedAudioData> {
  if (typeof window === "undefined") {
    throw new Error("오디오 디코딩은 브라우저 환경에서만 실행할 수 있습니다.");
  }

  const AudioContextConstructor = getAudioContextConstructor();

  if (!AudioContextConstructor) {
    throw new Error("이 브라우저는 AudioContext를 지원하지 않습니다.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContextConstructor();

  try {
    const decodedAudioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    const resampledAudioBuffer = await resampleAudioBuffer(decodedAudioBuffer, targetSampleRate);

    return {
      pcmData: mixToMono(resampledAudioBuffer),
      durationSeconds: resampledAudioBuffer.duration,
      sampleRate: resampledAudioBuffer.sampleRate,
    };
  } finally {
    await audioContext.close().catch(() => undefined);
  }
}
