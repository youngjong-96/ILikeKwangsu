/**
 * STT 분석 Mock 데이터
 * - 광수의 실제 구어체 말투를 참고한 한국어 단어 빈도 데이터
 * - 파일 없이 버튼을 눌렀을 때 API 호출 없이 결과 화면을 미리볼 수 있음
 */

/** Mock STT 변환 원문 텍스트 */
export const MOCK_STT_TEXT =
  "그니까 어 우리가 이제 뭐 그거를 좀 어 되게 진짜 완전 어 바꿔야 한다고 생각해요. " +
  "근데 그니까 아 이게 어 사실 좀 어려운 문제긴 한데, 그래서 어 이제 막 좀 그냥 어 " +
  "생각해봤는데 그니까 뭐 되게 어 좋은 방법이 있을 것 같기도 하고. 진짜로 그니까 " +
  "어 우리 팀이 이제 뭐 좀 더 열심히 해야 되지 않나 싶어요. 그니까 어 정말로 이거는 " +
  "뭐 확실히 그냥 어 넘어갈 문제가 아닌 것 같고. 그니까 음 되게 어 신중하게 접근해야 " +
  "될 것 같아요. 근데 막 어 진짜 그니까 이게 쉽지가 않아서.";

/** Mock 단어 빈도 결과 배열 (내림차순 정렬) */
export const MOCK_STT_RESULT: { word: string; count: number }[] = [
  { word: "그니까", count: 8 },
  { word: "어",     count: 12 },
  { word: "이제",   count: 5 },
  { word: "뭐",     count: 5 },
  { word: "좀",     count: 5 },
  { word: "되게",   count: 4 },
  { word: "진짜",   count: 4 },
  { word: "그래서", count: 3 },
  { word: "근데",   count: 3 },
  { word: "막",     count: 3 },
  { word: "우리",   count: 2 },
  { word: "사실",   count: 2 },
  { word: "그냥",   count: 2 },
  { word: "완전",   count: 2 },
  { word: "아",     count: 2 },
  { word: "정말로", count: 1 },
  { word: "신중하게", count: 1 },
  { word: "확실히", count: 1 },
  { word: "열심히", count: 1 },
  { word: "음",     count: 1 },
];
