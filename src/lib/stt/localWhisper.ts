"use client";

import {
  env,
  pipeline,
  type AutomaticSpeechRecognitionOutput,
  type AutomaticSpeechRecognitionPipeline,
  type ProgressInfo,
} from "@huggingface/transformers";
import { decodeAudioFileToMonoPcm } from "@/lib/audio/decodeAudioFile";

export interface LocalWhisperStatus {
  message: string;
  progress: number | null;
}

export interface LocalWhisperResult {
  text: string;
  durationSeconds: number;
  runtimeLabel: string;
}

type LocalWhisperDtype = "fp32" | "q8";

interface LocalWhisperRuntime {
  device: "webgpu" | "wasm";
  modelId: string;
  runtimeLabel: string;
  maxAudioDurationSeconds: number;
  chunkLengthSeconds: number;
  strideLengthSeconds: number;
  dtype: LocalWhisperDtype;
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
const MOBILE_MAX_AUDIO_DURATION_SECONDS = 20;
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
 * 모바일 브라우저나 태블릿처럼 추론 자원이 제한될 가능성이 높은 환경인지 확인한다.
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
 * 브라우저가 노출하는 기기 메모리 정보를 바탕으로 저사양 장치를 추정한다.
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
 * 모바일에서 기본으로 사용할 가장 안전한 Whisper 런타임 구성을 만든다.
 */
function createPrimaryMobileRuntime(): LocalWhisperRuntime {
  return {
    device: "wasm",
    modelId: "Xenova/whisper-tiny",
    runtimeLabel: "Local Whisper · Mobile Safe",
    maxAudioDurationSeconds: MOBILE_MAX_AUDIO_DURATION_SECONDS,
    chunkLengthSeconds: 8,
    strideLengthSeconds: 2,
    dtype: "fp32",
  };
}

/**
 * 모바일에서 세션 생성 실패가 반복될 때 사용할 대체 모델 구성을 만든다.
 */
function createFallbackMobileRuntime(): LocalWhisperRuntime {
  return {
    device: "wasm",
    modelId: "onnx-community/whisper-tiny",
    runtimeLabel: "Local Whisper · Mobile Fallback",
    maxAudioDurationSeconds: MOBILE_MAX_AUDIO_DURATION_SECONDS,
    chunkLengthSeconds: 8,
    strideLengthSeconds: 2,
    dtype: "fp32",
  };
}

/**
 * 데스크톱 WebGPU 환경에서 사용할 런타임 구성을 만든다.
 */
function createWebGpuRuntime(): LocalWhisperRuntime {
  return {
    device: "webgpu",
    modelId: "Xenova/whisper-base",
    runtimeLabel: "Local Whisper · WebGPU",
    maxAudioDurationSeconds: DESKTOP_MAX_AUDIO_DURATION_SECONDS,
    chunkLengthSeconds: 20,
    strideLengthSeconds: 4,
    dtype: "fp32",
  };
}

/**
 * 데스크톱 WASM 환경에서 사용할 기본 런타임 구성을 만든다.
 */
function createDesktopWasmRuntime(): LocalWhisperRuntime {
  return {
    device: "wasm",
    modelId: "Xenova/whisper-tiny",
    runtimeLabel: "Local Whisper · WASM",
    maxAudioDurationSeconds: DESKTOP_MAX_AUDIO_DURATION_SECONDS,
    chunkLengthSeconds: 20,
    strideLengthSeconds: 4,
    dtype: "q8",
  };
}

/**
 * 현재 브라우저 성능 조건에 맞는 Whisper 실행 경로와 모델 구성을 고른다.
 */
async function resolveLocalWhisperRuntime(): Promise<LocalWhisperRuntime> {
  if (isLikelyMobileDevice() || isLowMemoryDevice()) {
    return createPrimaryMobileRuntime();
  }

  if (await canUseWebGpu()) {
    return createWebGpuRuntime();
  }

  return createDesktopWasmRuntime();
}

/**
 * 에러 객체를 사용자 친화적인 판별용 문자열로 정규화한다.
 */
function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * 현재 오류가 모바일 ONNX 세션 생성 실패로 볼 수 있는 패턴인지 확인한다.
 */
function shouldRetryWithMobileFallback(error: unknown) {
  const errorMessage = toErrorMessage(error);

  return /Can't create a session|Missing required scale|TransposeDQWeightsForMatMulNBits|DequantizeLinear/i.test(
    errorMessage,
  );
}

/**
 * 파이프라인 캐시 키를 런타임 구성 단위로 안정적으로 만든다.
 */
function buildRuntimeCacheKey(runtime: LocalWhisperRuntime) {
  return `${runtime.device}:${runtime.modelId}:${runtime.dtype}`;
}

/**
 * transformers.js 진행 상태를 사용자에게 보여주기 쉬운 문장으로 바꾼다.
 */
function toStatusMessage(progressInfo: ProgressInfo, runtime: LocalWhisperRuntime): LocalWhisperStatus {
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
 * WASM 경로에서는 스레드를 1개로 제한해 모바일 브라우저의 메모리 부담을 줄인다.
 */
function configureOnnxWasmRuntime(runtime: LocalWhisperRuntime) {
  if (runtime.device !== "wasm" || !env.backends.onnx.wasm) {
    return;
  }

  env.backends.onnx.wasm.numThreads = 1;
}

/**
 * 새 런타임으로 재시도할 수 있도록 캐시된 파이프라인 정보를 초기화한다.
 */
function resetCachedPipeline() {
  transcriberPromise = null;
  transcriberRuntimeKey = null;
}

/**
 * 지정한 런타임 구성으로 Whisper 파이프라인을 실제 생성한다.
 */
async function createPipelineForRuntime(
  runtime: LocalWhisperRuntime,
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
 * 싱글톤 형태로 브라우저 로컬 Whisper 파이프라인을 로드한다.
 */
async function getLocalWhisperPipeline(
  onStatusChange?: (status: LocalWhisperStatus) => void,
  preferredRuntime?: LocalWhisperRuntime,
): Promise<{ runtime: LocalWhisperRuntime; transcriber: AutomaticSpeechRecognitionPipeline }> {
  env.allowRemoteModels = true;

  const runtime = preferredRuntime ?? (await resolveLocalWhisperRuntime());
  const runtimeKey = buildRuntimeCacheKey(runtime);

  if (!transcriberPromise || transcriberRuntimeKey !== runtimeKey) {
    transcriberRuntimeKey = runtimeKey;
    transcriberPromise = createPipelineForRuntime(runtime, onStatusChange).catch(async (error) => {
      if (runtime.device === "webgpu") {
        const fallbackRuntime = createDesktopWasmRuntime();

        transcriberRuntimeKey = buildRuntimeCacheKey(fallbackRuntime);
        onStatusChange?.({
          message: "빠른 모드를 사용할 수 없어 호환 모드로 전환했어요. 분석은 계속됩니다.",
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

  return {
    runtime,
    transcriber: await transcriberPromise,
  };
}

/**
 * 디코딩된 오디오를 지정한 런타임으로 실제 전사한다.
 */
async function transcribeDecodedAudioWithRuntime(
  decodedAudio: DecodedAudioInput,
  runtime: LocalWhisperRuntime,
  onStatusChange?: (status: LocalWhisperStatus) => void,
): Promise<LocalWhisperResult> {
  if (decodedAudio.durationSeconds > runtime.maxAudioDurationSeconds) {
    throw new Error(`이 기기에서는 ${runtime.maxAudioDurationSeconds}초 이하 음성만 안정적으로 분석할 수 있습니다.`);
  }

  const { runtime: resolvedRuntime, transcriber } = await getLocalWhisperPipeline(onStatusChange, runtime);

  onStatusChange?.({
    message: `${resolvedRuntime.runtimeLabel}로 음성을 텍스트로 바꾸고 있어요.`,
    progress: null,
  });

  const output = (await transcriber(decodedAudio.pcmData, {
    chunk_length_s: resolvedRuntime.chunkLengthSeconds,
    stride_length_s: resolvedRuntime.strideLengthSeconds,
    language: "korean",
    task: "transcribe",
  })) as AutomaticSpeechRecognitionOutput;

  return {
    text: output.text.trim(),
    durationSeconds: decodedAudio.durationSeconds,
    runtimeLabel: resolvedRuntime.runtimeLabel,
  };
}

/**
 * 업로드 또는 녹음된 오디오 파일을 브라우저 로컬 Whisper로 전사한다.
 */
export async function transcribeAudioFileWithLocalWhisper(
  file: File,
  onStatusChange?: (status: LocalWhisperStatus) => void,
): Promise<LocalWhisperResult> {
  const preferredRuntime = await resolveLocalWhisperRuntime();

  onStatusChange?.({
    message: "업로드한 음성을 분석하기 좋은 형식으로 정리하고 있어요.",
    progress: null,
  });

  const decodedAudio = await decodeAudioFileToMonoPcm(file, TARGET_SAMPLE_RATE);

  try {
    return await transcribeDecodedAudioWithRuntime(decodedAudio, preferredRuntime, onStatusChange);
  } catch (error) {
    const shouldUseMobileFallback =
      preferredRuntime.runtimeLabel.includes("Mobile") && shouldRetryWithMobileFallback(error);

    if (!shouldUseMobileFallback) {
      throw error;
    }

    resetCachedPipeline();
    onStatusChange?.({
      message: "현재 기기와의 호환성 문제로 다른 모바일 안전 모드로 다시 시도하고 있어요.",
      progress: null,
    });

    return await transcribeDecodedAudioWithRuntime(
      decodedAudio,
      createFallbackMobileRuntime(),
      onStatusChange,
    );
  }
}
