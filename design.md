# 컬러 팔레트

| 변수명                  | HEX       | RGB                   | 용도                     |
|-------------------------|-----------|-----------------------|--------------------------|
| `--color-bg-main`       | `#FFF2C6` | rgb(255, 242, 198)    | 메인 배경                |
| `--color-bg-card`       | `#FFF8DE` | rgb(255, 248, 222)    | 카드/섹션 배경           |
| `--color-accent-light`  | `#AAC4F5` | rgb(170, 196, 245)    | 포인트 (밝은 파스텔 파란) |
| `--color-accent`        | `#8CA9FF` | rgb(140, 169, 255)    | 포인트 (진한 파스텔 파란) |

# 글꼴

**온글잎 박다현체** (`Ownglyph_ParkDaHyun`)

- 출처: [눈누(noonnu.cc)](https://noonnu.cc)
- 라이선스: (주)보이저엑스 / 온글잎 — 사용 전 최신 라이선스 확인 필요
- CDN: jsdelivr (projectnoonnu/2411-3@1.0)

```css
@font-face {
  font-family: 'Ownglyph_ParkDaHyun';
  src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/2411-3@1.0/Ownglyph_ParkDaHyun.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
```

적용 우선순위: `Ownglyph_ParkDaHyun` → `Noto Sans KR` → `Apple SD Gothic Neo` → `sans-serif`

# 그림자 / 보더

| 변수명           | 값                                          | 용도          |
|------------------|---------------------------------------------|---------------|
| `--shadow-card`  | `0 4px 24px rgba(140,169,255,0.15)`         | 카드 기본 그림자 |
| `--shadow-accent`| `0 4px 16px rgba(140,169,255,0.35)`         | 강조 그림자   |
| `--color-border` | `rgba(140, 169, 255, 0.25)`                 | 테두리 색상   |
