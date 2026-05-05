"use client";

import {
  env,
  pipeline,
  type AutomaticSpeechRecognitionOutput,
  type AutomaticSpeechRecognitionPipeline,
  type ProgressInfo,
} from "@huggingface/transformers";
import { decodeAudioFileToMonoPcm } from "@/lib/audio/decodeAudioFile";

export type LocalSttEngineMode = "auto" | "whisper" | "moonshine";
type LocalSttEngine = Exclude<LocalSttEngineMode, "auto">;
type LocalSttDtype = "fp32" | "q8";

export interface LocalWhisperStatus {
  message: string;
  progress: number | null;
}

export interface LocalWhisperResult {
  text: string;
  durationSeconds: number;
  runtimeLabel: string;
}

interface LocalSttRuntime {
  engine: LocalSttEngine;
  device: "webgpu" | "wasm";
  modelId: string;
  dtype: LocalSttDtype;
  runtimeLabel: string;
  maxAudioDurationSeconds: number;
  chunkLengthSeconds: number;
  strideLengthSeconds: number;
}

interface RuntimeNavigator extends Navigator {
  deviceMemory?: number;
  userAgentData?: {
    mobile?: boolean;
  };
}

interface DecodedAudioInput {
  pcmData: Float32Array;
  durationSeconds: number;
}

const TARGET_SAMPLE_RATE = 16_000;
const DESKTOP_MAX_AUDIO_DURATION_SECONDS = 90;
const MOBILE_MAX_AUDIO_DURATION_SECONDS = 30;
const LOW_MEMORY_DEVICE_THRESHOLD_GB = 4;

let transcriberPromise: Promise<AutomaticSpeechRecognitionPipeline> | null = null;
let transcriberRuntimeKey: string | null = null;

/**
 * 브라우저가 WebGPU를 안정적으로 사용할 수 있는지 확인한다.
 */
async function canUseWebGpu() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const gpuNavigator = navigator as Navigator & {
    gpu?: {
      requestAdapter?: () => Promise<unknown>;
    };
  };

  if (!gpuNavigator.gpu?.requestAdapter) {
    return false;
  }

  try {
    const adapter = await gpuNavigator.gpu.requestAdapter();
    return Boolean(adapter);
  } catch {
    return false;
  }
}

/**
 * 현재 환경이 모바일 브라우저에 가까운지 확인한다.
 */
function isLikelyMobileDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const runtimeNavigator = navigator as RuntimeNavigator;
  const normalizedUserAgent = runtimeNavigator.userAgent.toLowerCase();

  if (runtimeNavigator.userAgentData?.mobile) {
    return true;
  }

  if (/android|iphone|ipad|ipod|mobile/.test(normalizedUserAgent)) {
    return true;
  }

  return runtimeNavigator.maxTouchPoints > 1 && /macintosh/.test(normalizedUserAgent);
}

/**
 * 브라우저가 제공하는 deviceMemory 힌트로 저사양 기기 여부를 추정한다.
 */
function isLowMemoryDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const runtimeNavigator = navigator as RuntimeNavigator;
  return typeof runtimeNavigator.deviceMemory === "number"
    ? runtimeNavigator.deviceMemory <= LOW_MEMORY_DEVICE_THRESHOLD_GB
    : false;
}

/**
 * 자동 추천 모드에서 어떤 엔진을 우선 사용할지 결정한다.
 */
function getRecommendedSttEngine(): LocalSttEngine {
  return isLikelyMobileDevice() || isLowMemoryDevice() ? "moonshine" : "whisper";
}

/**
 * 데스크톱용 Whisper WebGPU 런타임을 만든다.
 */
function createDesktopWhisperWebGpuRuntime(): LocalSttRuntime {
  return {
    engine: "whisper",
    device: "webgpu",
    modelId: "Xenova/whisper-base",
    dtype: "fp32",
    runtimeLabel: "Whisper · WebGPU",
    maxAudioDurationSeconds: DESKTOP_MAX_AUDIO_DURATION_SECONDS,
    chunkLengthSeconds: 20,
    strideLengthSeconds: 4,
  };
}

/**
 * WASM 환경에서 사용할 기본 Whisper 런타임을 만든다.
 */
function createWasmWhisperRuntime(isMobileRuntime: boolean, useAutoLabel: boolean): LocalSttRuntime {
  return {
    engine: "whisper",
    device: "wasm",
    modelId: "Xenova/whisper-tiny",
    dtype: isMobileRuntime ? "fp32" : "q8",
    runtimeLabel: useAutoLabel ? "Auto · Whisper" : "Whisper · WASM",
    maxAudioDurationSeconds: isMobileRuntime
      ? MOBILE_MAX_AUDIO_DURATION_SECONDS
      : DESKTOP_MAX_AUDIO_DURATION_SECONDS,
    chunkLengthSeconds: isMobileRuntime ? 10 : 20,
    strideLengthSeconds: isMobileRuntime ? 2 : 4,
  };
}

/**
 * Moonshine 런타임을 만든다.
 */
function createMoonshineRuntime(isMobileRuntime: boolean, useAutoLabel: boolean): LocalSttRuntime {
  return {
    engine: "moonshine",
    device: "wasm",
    modelId: "onnx-community/moonshine-tiny-ko-ONNX",
    dtype: "fp32",
    runtimeLabel: useAutoLabel ? "Auto · Moonshine" : "Moonshine · Korean",
    maxAudioDurationSeconds: isMobileRuntime
      ? MOBILE_MAX_AUDIO_DURATION_SECONDS
      : DESKTOP_MAX_AUDIO_DURATION_SECONDS,
    chunkLengthSeconds: isMobileRuntime ? 0 : 0,
    strideLengthSeconds: 0,
  };
}

/**
 * 현재 선택 모드와 기기 조건에 맞는 런타임 구성을 결정한다.
 */
async function resolveLocalSttRuntime(engineMode: LocalSttEngineMode): Promise<LocalSttRuntime> {
  const isMobileRuntime = isLikelyMobileDevice() || isLowMemoryDevice();
  const resolvedEngine = engineMode === "auto" ? getRecommendedSttEngine() : engineMode;

  if (resolvedEngine === "moonshine") {
    return createMoonshineRuntime(isMobileRuntime, engineMode === "auto");
  }

  if (!isMobileRuntime && (await canUseWebGpu())) {
    const webGpuRuntime = createDesktopWhisperWebGpuRuntime();
    return engineMode === "auto"
      ? { ...webGpuRuntime, runtimeLabel: "Auto · Whisper WebGPU" }
      : webGpuRuntime;
  }

  return createWasmWhisperRuntime(isMobileRuntime, engineMode === "auto");
}

/**
 * 런타임 구성 기반으로 파이프라인 캐시 키를 만든다.
 */
function buildRuntimeCacheKey(runtime: LocalSttRuntime) {
  return `${runtime.engine}:${runtime.device}:${runtime.modelId}:${runtime.dtype}`;
}

/**
 * transformers.js 진행 상태를 사용자용 메시지로 바꾼다.
 */
function toStatusMessage(progressInfo: ProgressInfo, runtime: LocalSttRuntime): LocalWhisperStatus {
  switch (progressInfo.status) {
    case "initiate":
      return {
        message: `${runtime.runtimeLabel} 준비를 시작하고 있어요.`,
        progress: null,
      };
    case "download":
      return {
        message: `${runtime.runtimeLabel} 준비에 필요한 파일을 받고 있어요.`,
        progress: null,
      };
    case "progress":
    case "progress_total":
      return {
        message: `${runtime.runtimeLabel} 준비 중... ${Math.round(progressInfo.progress)}%`,
        progress: progressInfo.progress,
      };
    case "done":
      return {
        message: `${runtime.runtimeLabel} 준비 파일을 모두 받았어요.`,
        progress: 100,
      };
    case "ready":
      return {
        message: `${runtime.runtimeLabel} 분석 준비가 끝났어요.`,
        progress: 100,
      };
    default:
      return {
        message: `${runtime.runtimeLabel} 준비 중이에요.`,
        progress: null,
      };
  }
}

/**
 * WASM 경로에서는 스레드를 1개로 제한해 브라우저 메모리 부담을 줄인다.
 */
function configureOnnxWasmRuntime(runtime: LocalSttRuntime) {
  if (runtime.device !== "wasm" || !env.backends.onnx.wasm) {
    return;
  }

  env.backends.onnx.wasm.numThreads = 1;
}

/**
 * 파이프라인 캐시를 초기화해 다른 런타임으로 안전하게 전환할 수 있게 한다.
 */
function resetCachedPipeline() {
  transcriberPromise = null;
  transcriberRuntimeKey = null;
}

/**
 * 지정한 런타임 구성으로 STT 파이프라인을 생성한다.
 */
async function createPipelineForRuntime(
  runtime: LocalSttRuntime,
  onStatusChange?: (status: LocalWhisperStatus) => void,
) {
  configureOnnxWasmRuntime(runtime);

  return pipeline("automatic-speech-recognition", runtime.modelId, {
    device: runtime.device,
    dtype: runtime.dtype,
    progress_callback: (progressInfo) => {
      onStatusChange?.(toStatusMessage(progressInfo, runtime));
    },
  });
}

/**
 * 런타임 구성에 맞는 파이프라인을 싱글톤으로 로드한다.
 */
async function getLocalSttPipeline(
  runtime: LocalSttRuntime,
  onStatusChange?: (status: LocalWhisperStatus) => void,
): Promise<AutomaticSpeechRecognitionPipeline> {
  env.allowRemoteModels = true;

  const runtimeKey = buildRuntimeCacheKey(runtime);

  if (!transcriberPromise || transcriberRuntimeKey !== runtimeKey) {
    transcriberRuntimeKey = runtimeKey;
    transcriberPromise = createPipelineForRuntime(runtime, onStatusChange).catch(async (error) => {
      if (runtime.engine === "whisper" && runtime.device === "webgpu") {
        const fallbackRuntime = createWasmWhisperRuntime(false, false);

        transcriberRuntimeKey = buildRuntimeCacheKey(fallbackRuntime);
        onStatusChange?.({
          message: "빠른 모드를 사용할 수 없어 Whisper 호환 모드로 전환했어요.",
          progress: null,
        });

        return createPipelineForRuntime(fallbackRuntime, onStatusChange);
      }

      resetCachedPipeline();
      throw error;
    });
  } else {
    onStatusChange?.({
      message: `${runtime.runtimeLabel} 준비가 이미 끝나 있어서 바로 분석할게요.`,
      progress: 100,
    });
  }

  return await transcriberPromise;
}

/**
 * 엔진별 전사 옵션을 구성한다.
 */
function buildTranscriptionOptions(runtime: LocalSttRuntime) {
  if (runtime.engine === "whisper") {
    return {
      chunk_length_s: runtime.chunkLengthSeconds,
      stride_length_s: runtime.strideLengthSeconds,
      language: "korean",
      task: "transcribe" as const,
    };
  }

  return {};
}

/**
 * 디코딩된 오디오 길이가 현재 런타임 제한을 넘는지 확인한다.
 */
function validateAudioDuration(decodedAudio: DecodedAudioInput, runtime: LocalSttRuntime) {
  if (decodedAudio.durationSeconds <= runtime.maxAudioDurationSeconds) {
    return;
  }

  throw new Error(
    `이 모드에서는 ${runtime.maxAudioDurationSeconds}초 이하 음성만 안정적으로 분석할 수 있습니다.`,
  );
}

/**
 * 지정한 런타임으로 오디오를 실제 전사한다.
 */
async function transcribeDecodedAudioWithRuntime(
  decodedAudio: DecodedAudioInput,
  runtime: LocalSttRuntime,
  onStatusChange?: (status: LocalWhisperStatus) => void,
): Promise<LocalWhisperResult> {
  validateAudioDuration(decodedAudio, runtime);

  const transcriber = await getLocalSttPipeline(runtime, onStatusChange);

  onStatusChange?.({
    message: `${runtime.runtimeLabel}로 음성을 텍스트로 바꾸고 있어요.`,
    progress: null,
  });

  const output = (await transcriber(
    decodedAudio.pcmData,
    buildTranscriptionOptions(runtime),
  )) as AutomaticSpeechRecognitionOutput;

  return {
    text: output.text.trim(),
    durationSeconds: decodedAudio.durationSeconds,
    runtimeLabel: runtime.runtimeLabel,
  };
}

/**
 * 업로드 또는 녹음된 오디오 파일을 현재 선택 모드에 맞는 로컬 STT로 전사한다.
 */
export async function transcribeAudioFileLocally(
  file: File,
  engineMode: LocalSttEngineMode,
  onStatusChange?: (status: LocalWhisperStatus) => void,
): Promise<LocalWhisperResult> {
  const runtime = await resolveLocalSttRuntime(engineMode);

  onStatusChange?.({
    message: "업로드한 음성을 분석하기 좋은 형식으로 정리하고 있어요.",
    progress: null,
  });

  const decodedAudio = await decodeAudioFileToMonoPcm(file, TARGET_SAMPLE_RATE);

  return await transcribeDecodedAudioWithRuntime(decodedAudio, runtime, onStatusChange);
}
