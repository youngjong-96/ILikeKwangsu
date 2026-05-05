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

interface LocalWhisperRuntime {
  device: "webgpu" | "wasm";
  modelId: string;
  runtimeLabel: string;
}

const TARGET_SAMPLE_RATE = 16_000;
const MAX_AUDIO_DURATION_SECONDS = 90;

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
 * 현재 브라우저 성능 조건에 맞는 Whisper 런타임과 모델 구성을 고른다.
 */
async function resolveLocalWhisperRuntime(): Promise<LocalWhisperRuntime> {
  if (await canUseWebGpu()) {
    return {
      device: "webgpu",
      modelId: "Xenova/whisper-base",
      runtimeLabel: "Local Whisper · WebGPU",
    };
  }

  return {
    device: "wasm",
    modelId: "Xenova/whisper-tiny",
    runtimeLabel: "Local Whisper · WASM",
  };
}

/**
 * transformers.js 진행 상태를 사람이 읽기 쉬운 한국어 메시지로 바꾼다.
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
 * 싱글톤 형태로 브라우저 로컬 Whisper 파이프라인을 로드한다.
 */
async function getLocalWhisperPipeline(
  onStatusChange?: (status: LocalWhisperStatus) => void,
): Promise<{ runtime: LocalWhisperRuntime; transcriber: AutomaticSpeechRecognitionPipeline }> {
  env.allowRemoteModels = true;

  const runtime = await resolveLocalWhisperRuntime();
  const runtimeKey = `${runtime.device}:${runtime.modelId}`;

  if (!transcriberPromise || transcriberRuntimeKey !== runtimeKey) {
    transcriberRuntimeKey = runtimeKey;
    transcriberPromise = pipeline("automatic-speech-recognition", runtime.modelId, {
      device: runtime.device,
      progress_callback: (progressInfo) => {
        onStatusChange?.(toStatusMessage(progressInfo, runtime));
      },
    }).catch(async (error) => {
      if (runtime.device === "webgpu") {
        const fallbackRuntime: LocalWhisperRuntime = {
          device: "wasm",
          modelId: "Xenova/whisper-tiny",
          runtimeLabel: "Local Whisper · WASM",
        };

        transcriberRuntimeKey = `${fallbackRuntime.device}:${fallbackRuntime.modelId}`;
        onStatusChange?.({
          message: "빠른 모드를 사용할 수 없어 호환 모드로 전환했어요. 분석은 계속됩니다.",
          progress: null,
        });

        return pipeline("automatic-speech-recognition", fallbackRuntime.modelId, {
          device: fallbackRuntime.device,
          progress_callback: (progressInfo) => {
            onStatusChange?.(toStatusMessage(progressInfo, fallbackRuntime));
          },
        });
      }

      transcriberPromise = null;
      transcriberRuntimeKey = null;
      throw error;
    });
  } else {
    onStatusChange?.({
      message: `${runtime.runtimeLabel} 준비가 이미 끝나 있어서 바로 분석할게요.`,
      progress: 100,
    });
  }

  const transcriber = await transcriberPromise;
  const resolvedRuntime = transcriberRuntimeKey?.startsWith("wasm:")
    ? {
        device: "wasm" as const,
        modelId: "Xenova/whisper-tiny",
        runtimeLabel: "Local Whisper · WASM",
      }
    : runtime;

  return {
    runtime: resolvedRuntime,
    transcriber,
  };
}

/**
 * 업로드 또는 녹음된 오디오 파일을 브라우저 로컬 Whisper로 전사한다.
 */
export async function transcribeAudioFileWithLocalWhisper(
  file: File,
  onStatusChange?: (status: LocalWhisperStatus) => void,
): Promise<LocalWhisperResult> {
  onStatusChange?.({
    message: "업로드한 음성을 분석하기 좋은 형식으로 정리하고 있어요.",
    progress: null,
  });

  const decodedAudio = await decodeAudioFileToMonoPcm(file, TARGET_SAMPLE_RATE);

  if (decodedAudio.durationSeconds > MAX_AUDIO_DURATION_SECONDS) {
    throw new Error(`토이 배포에서는 ${MAX_AUDIO_DURATION_SECONDS}초 이하 음성만 분석할 수 있습니다.`);
  }

  const { runtime, transcriber } = await getLocalWhisperPipeline(onStatusChange);

  onStatusChange?.({
    message: `${runtime.runtimeLabel}로 음성을 텍스트로 바꾸고 있어요.`,
    progress: null,
  });

  const output = (await transcriber(decodedAudio.pcmData, {
    chunk_length_s: 20,
    stride_length_s: 4,
    language: "korean",
    task: "transcribe",
  })) as AutomaticSpeechRecognitionOutput;

  return {
    text: output.text.trim(),
    durationSeconds: decodedAudio.durationSeconds,
    runtimeLabel: runtime.runtimeLabel,
  };
}
