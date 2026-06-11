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

---

## AI Integration Architecture (Phase 1)

전략 리포트 생성을 규칙 기반에서 **Claude API(기본 Sonnet 4.6)** 기반으로 전환했습니다.

```
사용자 입력(Wizard)
  → App.complete()
  → src/lib/api.ts (generateOutputRemote)
  → POST /api/generate            ← 서버리스 함수 (Anthropic API 키는 여기서만 사용)
  → Anthropic API (claude-sonnet-4-6, non-streaming, 구조화 JSON)
  → AppOutput(reportMarkdown 제외) JSON 반환
  → attachReportMarkdown() 로 마크다운 채워 완성
  → Results 화면 렌더
```

- **실패 시 fallback**: `/api/generate` 가 실패하거나 응답 구조가 깨지면, 기존 규칙 기반 `buildOutputLocal()`(`src/lib/report.ts`)로 자동 대체하고 화면에 "간이 결과" 배너를 표시합니다. 앱은 멈추지 않습니다.
- **결제/로그인 없음**: 현재 인증·결제는 미연동입니다. 무료/유료 분기(`src/lib/entitlement.ts`)는 **임시 UI 구조**로, localStorage 플래그를 토글하는 수준입니다. (무료=요약 탭만, 유료=전체+복사)
- **모델 교체**: `api/generate.ts` 상단의 `MODEL` 상수를 `"claude-opus-4-8"` 로 바꾸면 고품질 모드로 전환됩니다.

### 환경변수

`ANTHROPIC_API_KEY` 는 **서버에서만** 사용합니다. (`.env.example` 참고)

- 로컬: `.env.example` → `.env` 로 복사 후 키 입력, `vercel dev` 로 실행 (Vite dev 서버는 `/api` 함수를 실행하지 않음)
- 배포: Vercel → Settings → Environment Variables 에 `ANTHROPIC_API_KEY` 등록
- ⚠️ `VITE_` 접두어 금지 — 붙이면 프론트 번들에 노출됩니다.

---

## Phase 1 변경 요약 (변경 파일 / 변경 의도)

**추가**
- `api/generate.ts` — 서버리스 함수. 입력 검증 → Sonnet 4.6 non-streaming 구조화 호출 → AppOutput JSON 반환. (키 서버 전용)
- `api/_schema.ts` — Claude 구조화 출력 JSON 스키마 + 시스템/유저 프롬프트. (서버 전용, `AppOutput` 타입과 1:1)
- `src/lib/api.ts` — 프론트 호출 단일 지점 `generateOutputRemote` + 응답 구조 검증.
- `src/lib/entitlement.ts` — 무료/유료 임시 gating 플래그.
- `.env.example`, `vercel.json` — 환경변수 문서화, 함수 `maxDuration: 60`.

**수정**
- `src/lib/report.ts` — `buildOutput` → `buildOutputLocal`(fallback 유지) 개명, `attachReportMarkdown()` 추가.
- `src/App.tsx` — `complete()` 비동기화(로딩 화면 + 실패 시 로컬 fallback).
- `src/components/Results.tsx` — 무료/유료 잠금(요약만/전체) + fallback 배너 + 임시 플랜 토글.
- `package.json` — `@anthropic-ai/sdk`, `@vercel/node` 추가.

---

## 리뷰 체크리스트 (추후 Codex 등 외부 검수용)

- [ ] `ANTHROPIC_API_KEY` 가 프론트 번들에 노출되지 않는가 (`api/` 에서만 사용, `VITE_` 미사용)
- [ ] `/api/generate` 가 입력값(분야·목표·타깃 필수, 길이/배열) 검증을 하는가
- [ ] Claude API 실패 시 `buildOutputLocal` fallback 이 정상 동작하는가
- [ ] AI JSON 응답 구조가 `AppOutput`(reportMarkdown 제외)과 정확히 일치하는가 (`api/_schema.ts` ↔ `src/lib/types.ts`)
- [ ] 무료/유료 잠금이 **임시 gating** 임을 주석/문서에 명확히 남겼는가 (`entitlement.ts`, `Results.tsx`)
- [ ] Vercel 배포 시 환경변수 등록·`maxDuration` 설정 문제가 없는가
- [ ] `npm run build` / 타입체크(`tsc -b`)에서 오류가 없는가

> Phase 1 진행 방식: 구현은 1차로 완료된 상태이며, Codex 등 외부 도구를 통한 리뷰/검수는 **별도 단계**로 진행합니다(동시 편집 없음).
