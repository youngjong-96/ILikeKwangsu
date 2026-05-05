# Troubleshooting

이 문서는 배포 후 발생한 버그, 원인 분석, 수정 내용, 검증 결과를 누적 기록하는 용도입니다.  
앞으로 발생하는 버그 수정사항도 이 파일에 같은 형식으로 계속 추가합니다.

## 기록 규칙

- 새 이슈는 날짜 기준으로 아래에 추가합니다.
- 각 항목에는 가능한 한 `증상`, `재현 조건`, `원인 추정`, `수정 내용`, `검증 결과`, `남은 리스크`를 함께 적습니다.
- 원인이 100% 확정되지 않았으면 `원인 추정`이라고 명시합니다.
- 배포 이슈는 로컬 검증 결과와 실제 배포 환경 차이를 함께 적습니다.

## 템플릿

```md
## YYYY-MM-DD - 이슈 제목

### 증상

### 재현 조건

### 원인 추정

### 수정 내용

### 검증 결과

### 남은 리스크 / 다음 액션
```

---

## 2026-05-05 - 모바일 녹음 포맷 호환성 보완

### 증상

- 일부 모바일 브라우저에서 녹음 후 생성된 오디오 파일이 정상적으로 분석되지 않을 가능성이 있었다.
- 기존 구현은 녹음 결과를 `audio/webm`으로 고정하고 있었기 때문에 iPhone, iPad, 일부 모바일 브라우저에서 호환성 문제가 생길 수 있었다.

### 재현 조건

- 모바일 브라우저에서 마이크 녹음을 사용한다.
- 브라우저가 `audio/webm` 녹음을 기본 지원하지 않거나 다른 MIME 타입을 우선 사용하는 환경이다.

### 원인 추정

- `MediaRecorder`는 브라우저마다 지원하는 MIME 타입이 다르다.
- 기존 구현은 지원 여부 확인 없이 `audio/webm`으로 Blob과 파일명을 고정해 저장하고 있었다.
- 이 때문에 실제 브라우저가 생성한 포맷과 앱이 기대하는 포맷이 어긋날 수 있었다.

### 수정 내용

- `src/app/page.tsx`에서 `MediaRecorder.isTypeSupported()`를 사용해 지원 가능한 녹음 포맷을 우선 선택하도록 변경했다.
- `audio/webm;codecs=opus`, `audio/mp4`, `audio/webm`, `audio/ogg;codecs=opus` 순서로 후보를 확인하도록 했다.
- 실제 녹음 결과의 `mimeType`을 기준으로 파일 확장자를 결정하도록 바꿨다.
- 결과 파일도 브라우저가 생성한 실제 타입에 맞게 `recorded_audio.webm`, `recorded_audio.m4a`, `recorded_audio.ogg` 등으로 저장되도록 수정했다.

### 검증 결과

- `npm run lint` 통과
- `npm run build` 통과

### 남은 리스크 / 다음 액션

- 모바일 브라우저마다 `MediaRecorder` 구현 차이가 있어 실제 단말 테스트는 계속 필요하다.
- iOS Safari 계열에서는 브라우저 버전에 따라 녹음 방식 편차가 있으므로 실기기 테스트를 우선한다.

---

## 2026-05-05 - 모바일 STT 세션 생성 실패

### 증상

- 모바일에서 녹음 후 분석을 시작하면 모델 다운로드는 정상적으로 100%까지 진행되는 것처럼 보인다.
- 그러나 실제 분석 단계 직전에 아래와 같은 에러가 발생하며 중단된다.

```text
Can't create a session. ERROR_CODE: 1
TransposeDQWeightsForMatMulNBits
Missing required scale: model.decoder.embed_tokens.weight_merged_0_scale
```

- 즉, 다운로드 실패가 아니라 ONNX Runtime 세션 생성 단계에서 실패하는 패턴이었다.

### 재현 조건

- 모바일 브라우저에서 브라우저 로컬 Whisper 경로를 사용한다.
- 모델 준비 후 텍스트 전사 세션을 생성하는 시점에 에러가 발생한다.

### 원인 추정

- 이 프로젝트는 `@huggingface/transformers` 기반 브라우저 로컬 Whisper를 사용한다.
- WASM 경로에서 기본적으로 양자화된 dtype이 선택될 수 있는데, 모바일 브라우저 조합에서 Whisper decoder 쪽 양자화 세션 생성이 불안정할 가능성이 높았다.
- 실제 에러 메시지도 `Missing required scale`, `TransposeDQWeightsForMatMulNBits`처럼 양자화된 가중치 복원 과정에서 발생하는 형태였다.
- 특히 Whisper의 audio-text-to-text 구조는 `audio_encoder`, `embed_tokens`, `decoder_model_merged` 세션을 함께 쓰는데, 이 중 decoder 관련 세션이 모바일에서 깨지는 것으로 추정했다.

### 수정 내용

- `src/lib/stt/localWhisper.ts`에 모바일 및 저사양 장치 감지 로직을 추가했다.
- 모바일 경로에서는 `Xenova/whisper-tiny` + `WASM` + `1 thread` + 짧은 청크 길이로 더 보수적인 설정을 사용하도록 했다.
- 모바일 경로의 dtype을 아래처럼 더 안전한 조합으로 명시했다.

```ts
{
  audio_encoder: "q8",
  embed_tokens: "fp32",
  decoder_model_merged: "fp32"
}
```

- 세션 생성 중 아래 패턴의 에러가 발생하면 안전 모드로 한 번 더 재시도하도록 했다.
  - `Can't create a session`
  - `Missing required scale`
  - `TransposeDQWeightsForMatMulNBits`
- 재시도 시에는 전체 dtype을 `fp32`로 올려 더 안전한 경로로 다시 파이프라인을 생성하도록 했다.
- 사용자에게는 `"현재 기기와 더 잘 맞는 안전 모드로 다시 준비하고 있어요."`라는 상태 메시지를 보여주도록 했다.

### 검증 결과

- `npm run lint` 통과
- `npm run build` 통과
- 로컬 코드 기준으로 모바일 우회 로직이 정상 반영된 것을 확인했다.
- 실제 최종 검증은 배포 후 모바일 실기기에서 다시 확인이 필요하다.

### 남은 리스크 / 다음 액션

- `fp32` 안전 모드는 다운로드 용량과 메모리 사용량이 늘 수 있다.
- 아주 저사양 모바일 기기에서는 안전 모드로도 메모리 한계에 걸릴 수 있다.
- 같은 문제가 계속되면 다음 우선순위로 검토한다.
  1. 모바일 한정으로 Web Speech API fallback 제공
  2. 모바일 한정으로 더 작은 전용 모델 경로 분리
  3. 모바일 안정성이 최우선이면 서버 추론 경로를 별도로 두는 구조 검토

---

## 메모

- 현재 프로젝트의 버그 기록 기준 문서는 이 파일이다.
- 앞으로 새로운 버그를 수정할 때도 같은 형식으로 항목을 추가한다.
