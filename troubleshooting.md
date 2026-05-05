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

## 2026-05-05 - 모바일 STT 세션 생성 실패 2차 대응

### 증상

- 1차 대응 이후에도 모바일에서 동일한 세션 생성 오류가 반복되었다.
- 사용자가 확인한 에러 메시지는 여전히 아래와 같은 형태였다.

```text
Can't create a session. ERROR_CODE: 1
TransposeDQWeightsForMatMulNBits
Missing required scale
```

### 재현 조건

- 모바일 브라우저에서 녹음 후 분석을 시작한다.
- 모델 다운로드가 완료된 이후 실제 Whisper 세션 초기화 단계에서 오류가 발생한다.

### 원인 추정

- `automatic-speech-recognition` 파이프라인의 Whisper는 `AutoModelForSpeechSeq2Seq` 경로를 사용한다.
- 따라서 모바일에서 실제로 여는 주요 세션은 `encoder_model`, `decoder_model_merged` 중심인데, 이전 대응은 모바일 dtype 재시도 방향이 충분히 보수적이지 않았다.
- 또한 같은 모델 소스 안에서 dtype만 바꾸는 우회로는 특정 모바일 브라우저 조합에서 동일한 세션 생성 오류를 완전히 피하지 못했을 가능성이 있다.

### 수정 내용

- 모바일 기본 런타임을 `Xenova/whisper-tiny + WASM + fp32`로 더 보수적으로 고정했다.
- 모바일 분석 허용 길이를 20초로 더 줄이고, chunk 길이도 8초 기준으로 더 짧게 잡았다.
- 모바일에서 현재 오류 패턴이 감지되면 캐시된 파이프라인을 초기화한 뒤, `onnx-community/whisper-tiny + WASM + fp32` 대체 경로로 한 번 더 재시도하도록 변경했다.
- 즉, 이번 대응부터는 단순 dtype 재시도가 아니라 `모바일 기본 경로`와 `모바일 대체 경로`를 분리해 시도한다.

### 검증 결과

- `npm run lint` 통과
- `npm run build` 통과
- 로컬 코드 기준으로 모바일 재시도 흐름과 대체 모델 경로가 반영된 것을 확인했다.

### 남은 리스크 / 다음 액션

- 모바일 브라우저 메모리 한계가 더 작으면 fp32 경로도 실패할 수 있다.
- 이 경우 다음 단계는 브라우저 로컬 Whisper만으로는 한계가 있을 수 있다.
- 다음 우선순위는 아래와 같다.
  1. 모바일 한정 Web Speech API fallback 도입
  2. 모바일에서는 녹음 기능만 허용하고 분석은 데스크톱 권장 안내 제공
  3. 모바일 전용 초경량 STT 경로 별도 검토

---

## 메모

- 현재 프로젝트의 버그 기록 기준 문서는 이 파일이다.
- 앞으로 새로운 버그를 수정할 때도 같은 형식으로 항목을 추가한다.

---

## 2026-05-05 - 모바일 Moonshine 분기와 STT 엔진 선택 UI 도입

### 증상

- 모바일에서 Whisper 기반 브라우저 로컬 STT가 반복적으로 세션 생성에 실패했다.
- 데스크톱에서는 Whisper 성능이 만족스러웠기 때문에 전체 모델을 단일하게 교체하는 것은 품질 측면에서 부담이 있었다.

### 재현 조건

- 모바일 브라우저에서 Whisper 경로를 사용할 때 세션 생성 오류가 반복된다.
- 데스크톱에서는 같은 흐름이 비교적 안정적으로 동작한다.

### 원인 추정

- 문제는 “브라우저 로컬 STT 전체”가 아니라 “모바일 환경에서의 Whisper ONNX 세션 생성 안정성”에 더 가깝다.
- 따라서 데스크톱과 모바일을 같은 모델로 강제하기보다, 환경에 따라 다른 모델을 선택하는 편이 현실적이다.
- 사용자에 따라 정확도 우선과 호환성 우선의 선호가 다를 수 있어 수동 선택 UI도 필요했다.

### 수정 내용

- 자동 추천 모드를 새로 정의했다.
  - 데스크톱: Whisper 우선
  - 모바일 및 저사양 환경: Moonshine 우선
- `src/lib/stt/localWhisper.ts`를 확장해 `auto`, `whisper`, `moonshine` 세 가지 STT 엔진 모드를 지원하도록 변경했다.
- 자동 모드에서 모바일은 `onnx-community/moonshine-tiny-ko-ONNX`를 우선 사용하도록 바꿨다.
- `src/components/FileUploadCard.tsx`에 STT 엔진 선택 UI를 추가했다.
  - 자동 추천
  - Whisper
  - Moonshine
- 각 모드에 대해 사용자 안내 문구를 다르게 노출하도록 수정했다.

### 검증 결과

- `npm run lint` 통과
- `npm run build` 통과
- 코드 기준으로 자동 분기와 수동 선택 흐름이 모두 반영된 것을 확인했다.

### 남은 리스크 / 다음 액션

- 모바일에서 Moonshine 실기기 검증은 배포 후 다시 확인이 필요하다.
- Moonshine이 모바일에서 안정적이라면 현재 구조를 유지한다.
- Moonshine도 모바일에서 실패하면 다음 단계는 Web Speech API fallback을 우선 검토한다.
