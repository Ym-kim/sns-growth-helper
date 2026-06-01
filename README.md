# SNS Growth Helper · SNS 계정 설계 헬퍼

누구나 적은 입력으로 SNS 계정의 **콘셉트 · 팔로우 이유 · 벤치마킹 분석 · 콘텐츠 포맷 실험 · 수익화 동선 · 14/30일 플랜 · AI 프롬프트**까지 한 번에 설계할 수 있는 범용 도구입니다. 백엔드 없이 브라우저(localStorage)에서 동작합니다.

## 실행 방법

```bash
npm install
npm run dev      # 개발 서버 (http://localhost:5173)
npm run build    # 프로덕션 빌드
npm run preview  # 빌드 결과 미리보기
```

## 사용 흐름

1. 첫 화면에서 "내 계정 설계하기" 선택
2. 3단계 입력 (필수: 분야 · 목표 · 타깃 / 선택: 오퍼 · 전환 방식 · 벤치마킹 자료 · 고급 설정)
3. 결과 탭에서 분석 확인 → "전략 리포트 복사하기"로 Markdown 내보내기

## 구조

```
src/
  lib/
    types.ts          입력/출력 타입
    constants.ts      선택 옵션·범용 프리셋
    generators.ts     analyzeAccount / generateConcepts / ContentMatrix /
                      ExperimentPlan / MonetizationFlow / ProfileSuggestions / ContentCalendar
    benchmark.ts      analyzeBenchmark + 찾기 도우미 + (확장 스텁) fetchUrlMetadata/runOcr/runVision
    prompts.ts        generateAIPrompts
    performance.ts    성공 포맷 검증 로직
    checklist.ts      업로드 전 체크리스트
    report.ts         buildOutput(오케스트레이터) + exportReport(Markdown)
    storage.ts        localStorage 입출력
  components/
    Landing / Wizard / Results / tabs / ui
```

## 확장 포인트 (현재는 스텁)

- `lib/benchmark.ts`의 `fetchUrlMetadata` / `runOcr` / `runVision`
- 모든 `generate*` 함수는 순수 함수라 LLM(Claude/OpenAI) 호출로 교체 가능

> 비공개 계정 접근·로그인 우회·약관 위반 크롤링은 구현하지 않습니다. 공개 정보와 사용자가 직접 붙여넣은 내용으로만 분석합니다.

## 표현 원칙

모든 점수·추천은 **전략 수립용 추정값**입니다. 알고리즘은 시점에 따라 바뀌므로 제안은 실험 가설로 보고 반응을 확인하며 조정하세요.
