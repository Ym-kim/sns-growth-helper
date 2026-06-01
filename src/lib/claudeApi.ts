// Claude API 직접 연동 모듈.
// 브라우저에서 Anthropic API를 직접 호출한다.
// (anthropic-dangerous-direct-browser-access 헤더 사용 — 개인/MVP 용도)
//
// 키가 없으면 rule-based 폴백으로 자동 전환된다.
// 추후 Vercel Functions 프록시로 교체 시 이 파일만 수정하면 된다.

import type { AppInput, AppOutput } from "./types";

// ─────────────────────────────────────────────
// 모델 옵션
// ─────────────────────────────────────────────
export const CLAUDE_MODELS = [
  { id: "claude-sonnet-4-5",  label: "Claude Sonnet 4.5 (권장, 균형)" },
  { id: "claude-haiku-4-5",   label: "Claude Haiku 4.5 (빠름, 저렴)" },
] as const;
export type ClaudeModelId = (typeof CLAUDE_MODELS)[number]["id"];

// ─────────────────────────────────────────────
// API 키 & 모델 설정 localStorage 관리
// ─────────────────────────────────────────────
const CLAUDE_KEY_STORAGE = "sgh.claude.key.v1";
const CLAUDE_MODEL_STORAGE = "sgh.claude.model.v1";

export function loadClaudeKey(): string {
  try { return localStorage.getItem(CLAUDE_KEY_STORAGE) || ""; } catch { return ""; }
}
export function saveClaudeKey(key: string) {
  try { localStorage.setItem(CLAUDE_KEY_STORAGE, key); } catch { /* 무시 */ }
}
export function loadClaudeModel(): ClaudeModelId {
  try {
    const m = localStorage.getItem(CLAUDE_MODEL_STORAGE);
    return (CLAUDE_MODELS.some((x) => x.id === m) ? m : CLAUDE_MODELS[0].id) as ClaudeModelId;
  } catch { return CLAUDE_MODELS[0].id; }
}
export function saveClaudeModel(model: ClaudeModelId) {
  try { localStorage.setItem(CLAUDE_MODEL_STORAGE, model); } catch { /* 무시 */ }
}

// ─────────────────────────────────────────────
// Claude API 호출 (단일 메시지, JSON 응답)
// ─────────────────────────────────────────────
async function callClaude(systemPrompt: string, userPrompt: string, apiKey: string, model: ClaudeModelId): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      // 브라우저 직접 호출 허용 헤더 (개인/MVP 용도)
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Claude API 오류 (${res.status}): ${(err as { error?: { message?: string } }).error?.message || JSON.stringify(err)}`);
  }

  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  return data.content.find((c) => c.type === "text")?.text ?? "";
}

// JSON 추출 — 마크다운 코드블록도 처리
function extractJson(text: string): string {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) return match[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1) return text.slice(start, end + 1);
  return text.trim();
}

// ─────────────────────────────────────────────
// Claude가 생성하는 향상 데이터 타입
// ─────────────────────────────────────────────
export interface ClaudeEnhancement {
  followReason: string;
  scores: Array<{ key: string; score: number; reason: string; improve: string; applyExample: string }>;
  concepts: Array<{
    name: string; oneLiner: string; forWhom: string; followReason: string;
    mainContentType: string; monetization: string; pros: string; cons: string; score: number;
  }>;
  contentTitles: { 재미: string[]; 정보: string[]; 이야기: string[]; 공감: string[] };
  hooks: Record<string, string[]>; // 포맷별 후킹 3개
  bios: string[];
  linkButtons: string[];
  highlights: string[];
  pinnedPosts: string[];
  calendarItems: Array<{ day: number; title: string; hook: string; cta: string }>;
  monetizationPath: string[];
  topPriorities: string[];
}

// ─────────────────────────────────────────────
// 분석 프롬프트 생성
// ─────────────────────────────────────────────
function buildAnalysisPrompt(input: AppInput): { system: string; user: string } {
  const adv = input.advanced || {};
  const system = `당신은 SNS 콘텐츠 전략 전문가입니다.

규칙:
- "무조건 터진다" "반드시 성공" 같은 과장 금지 — "실험 가설", "테스트 필요"로 표현
- 특정 브랜드·인물·사업명 예시 금지, 범용 예시만
- 모든 응답은 한국어
- 반드시 순수한 JSON만 반환 (다른 텍스트·마크다운 없음)
- 조회수보다 저장·댓글·전환 중심으로 설계`;

  const user = `다음 SNS 계정 정보를 분석해 JSON으로 응답하세요.

입력:
- 운영 분야: ${input.niche || "미입력"}
- 계정 목표: ${input.goal || "미입력"}
- 타깃: ${input.target || "미입력"}
- 연결할 것: ${input.offer || "없음"}
- 전환 방식: ${input.conversionPath || "없음"}
- 팔로워 수: ${adv.followerCount ?? "미입력"}
- 현재 소개글: ${adv.profileBio || "없음"}
- 선호 플랫폼: ${adv.preferredPlatform || "미선택"}
- 얼굴 노출: ${adv.canShowFace === false ? "불가" : "가능"}
- 영상 제작: ${adv.canMakeVideo === false ? "불가" : "가능"}
- 주당 시간: ${adv.weeklyTime || "미입력"}
- 잘된 콘텐츠: ${adv.bestContent || "없음"}
- 반응 없던 콘텐츠: ${adv.worstContent || "없음"}

아래 JSON 구조 그대로 채워 반환하세요:
{
  "followReason": "이 계정을 팔로우해야 하는 이유 한 문장",
  "scores": [
    {"key":"purpose","score":75,"reason":"목적성 판단 이유","improve":"개선 방법","applyExample":"바로 적용할 문장"},
    {"key":"target","score":80,"reason":"...","improve":"...","applyExample":"..."},
    {"key":"followReason","score":72,"reason":"...","improve":"...","applyExample":"..."},
    {"key":"repeatable","score":70,"reason":"...","improve":"...","applyExample":"..."},
    {"key":"benchmark","score":65,"reason":"...","improve":"...","applyExample":"..."},
    {"key":"monetization","score":60,"reason":"...","improve":"...","applyExample":"..."},
    {"key":"profile","score":55,"reason":"...","improve":"...","applyExample":"..."},
    {"key":"sustainability","score":68,"reason":"...","improve":"...","applyExample":"..."}
  ],
  "concepts": [
    {"name":"콘셉트명","oneLiner":"한 줄 소개","forWhom":"누구를 위한","followReason":"팔로우 이유","mainContentType":"주 콘텐츠 유형","monetization":"수익화 방식","pros":"장점","cons":"단점","score":85},
    {"name":"...","oneLiner":"...","forWhom":"...","followReason":"...","mainContentType":"...","monetization":"...","pros":"...","cons":"...","score":78},
    {"name":"...","oneLiner":"...","forWhom":"...","followReason":"...","mainContentType":"...","monetization":"...","pros":"...","cons":"...","score":72}
  ],
  "contentTitles": {
    "재미": ["제목1","제목2","제목3","제목4","제목5"],
    "정보": ["제목1","제목2","제목3","제목4","제목5"],
    "이야기": ["제목1","제목2","제목3","제목4","제목5"],
    "공감": ["제목1","제목2","제목3","제목4","제목5"]
  },
  "hooks": {
    "정보전달형": ["후킹1","후킹2","후킹3"],
    "상황극형": ["후킹1","후킹2","후킹3"],
    "TTS 설명형": ["후킹1","후킹2","후킹3"],
    "감성 자막형": ["후킹1","후킹2","후킹3"],
    "얼굴 노출 브이로그형": ["후킹1","후킹2","후킹3"],
    "짧은 루프형": ["후킹1","후킹2","후킹3"],
    "밈 패러디형": ["후킹1","후킹2","후킹3"],
    "Before/After형": ["후킹1","후킹2","후킹3"],
    "체크리스트형": ["후킹1","후킹2","후킹3"],
    "실수/주의사항형": ["후킹1","후킹2","후킹3"],
    "후기/사례형": ["후킹1","후킹2","후킹3"],
    "질문 유도형": ["후킹1","후킹2","후킹3"]
  },
  "bios": ["소개글1","소개글2","소개글3","소개글4","소개글5"],
  "linkButtons": ["버튼문구1","버튼문구2","버튼문구3","버튼문구4","버튼문구5"],
  "highlights": ["하이라이트1","하이라이트2","하이라이트3","하이라이트4","하이라이트5"],
  "pinnedPosts": ["고정글1","고정글2","고정글3"],
  "calendarItems": [
    {"day":1,"title":"콘텐츠 제목","hook":"첫 3초 후킹","cta":"CTA 문구"},
    {"day":2,"title":"...","hook":"...","cta":"..."},
    {"day":3,"title":"...","hook":"...","cta":"..."},
    {"day":4,"title":"...","hook":"...","cta":"..."},
    {"day":5,"title":"...","hook":"...","cta":"..."},
    {"day":6,"title":"...","hook":"...","cta":"..."},
    {"day":7,"title":"...","hook":"...","cta":"..."},
    {"day":8,"title":"...","hook":"...","cta":"..."},
    {"day":9,"title":"...","hook":"...","cta":"..."},
    {"day":10,"title":"...","hook":"...","cta":"..."},
    {"day":11,"title":"...","hook":"...","cta":"..."},
    {"day":12,"title":"...","hook":"...","cta":"..."},
    {"day":13,"title":"...","hook":"...","cta":"..."},
    {"day":14,"title":"...","hook":"...","cta":"..."}
  ],
  "monetizationPath": ["단계1","단계2","단계3","단계4","단계5"],
  "topPriorities": ["우선순위1","우선순위2","우선순위3","우선순위4","우선순위5"]
}`;
  return { system, user };
}

// ─────────────────────────────────────────────
// rule-based 출력에 Claude 결과를 병합
// ─────────────────────────────────────────────
export function mergeClaudeEnhancement(base: AppOutput, enh: ClaudeEnhancement): AppOutput {
  const scoreKeyLabels: Record<string, string> = {
    purpose: "목적성", target: "타깃 명확도", followReason: "팔로우 이유 강도",
    repeatable: "콘텐츠 반복 가능성", benchmark: "벤치마킹 가능성",
    monetization: "수익화 연결성", profile: "프로필 전환 가능성", sustainability: "운영 지속 가능성",
  };

  // 점수: Claude reason/improve/example 반영, score는 Claude 우선
  const mergedScores = base.scores.map((s) => {
    const c = enh.scores.find((cs) => cs.key === s.key);
    return c ? { ...s, score: c.score, reason: c.reason, improve: c.improve, applyExample: c.applyExample, label: scoreKeyLabels[s.key] || s.label } : s;
  });

  // 콘텐츠 매트릭스: titles만 Claude로 교체
  const mergedMatrix = base.contentMatrix.map((m) => {
    const typeMap: Record<string, keyof typeof enh.contentTitles> = {
      "재미 콘텐츠": "재미", "정보 콘텐츠": "정보", "이야기 콘텐츠": "이야기", "공감 콘텐츠": "공감",
    };
    const k = typeMap[m.type];
    return k && enh.contentTitles[k]?.length ? { ...m, titles: enh.contentTitles[k] } : m;
  });

  // 실험 플랜: hooks만 Claude로 교체
  const mergedExperiment = base.experimentPlan.map((e) => {
    const h = enh.hooks[e.format];
    return h?.length ? { ...e, hooks: h } : e;
  });

  // 달력: Claude 제목/후킹으로 교체
  const mergedCalendar = base.calendar.map((c) => {
    const ci = enh.calendarItems.find((x) => x.day === c.day);
    return ci ? { ...c, title: ci.title, hook: ci.hook, cta: ci.cta } : c;
  });

  // 프로필 개선안: Claude 결과로 교체
  const mergedProfile = {
    ...base.profileSuggestions,
    bios: enh.bios.length ? enh.bios : base.profileSuggestions.bios,
    linkButtons: enh.linkButtons.length ? enh.linkButtons : base.profileSuggestions.linkButtons,
    highlights: enh.highlights.length ? enh.highlights : base.profileSuggestions.highlights,
    pinnedPosts: enh.pinnedPosts.length ? enh.pinnedPosts : base.profileSuggestions.pinnedPosts,
  };

  // 수익화 동선: path 교체
  const mergedMonetization = {
    ...base.monetizationFlow,
    path: enh.monetizationPath.length ? enh.monetizationPath : base.monetizationFlow.path,
  };

  return {
    ...base,
    summary: {
      ...base.summary,
      followReason: enh.followReason || base.summary.followReason,
    },
    scores: mergedScores,
    concepts: enh.concepts.length ? enh.concepts : base.concepts,
    contentMatrix: mergedMatrix,
    experimentPlan: mergedExperiment,
    monetizationFlow: mergedMonetization,
    profileSuggestions: mergedProfile,
    calendar: mergedCalendar,
  };
}

// ─────────────────────────────────────────────
// 메인 호출 함수
// onProgress: 진행 메시지 콜백 (UI 로딩 상태)
// ─────────────────────────────────────────────
export async function enhanceWithClaude(
  input: AppInput,
  base: AppOutput,
  apiKey: string,
  model: ClaudeModelId,
  onProgress?: (msg: string) => void
): Promise<{ output: AppOutput; usedClaude: true } | { output: AppOutput; usedClaude: false; error: string }> {
  try {
    onProgress?.("Claude에게 분석 요청 중…");
    const { system, user } = buildAnalysisPrompt(input);
    const raw = await callClaude(system, user, apiKey, model);

    onProgress?.("결과 처리 중…");
    const json = extractJson(raw);
    const enh: ClaudeEnhancement = JSON.parse(json);

    onProgress?.("리포트 생성 중…");
    const enhanced = mergeClaudeEnhancement(base, enh);

    return { output: enhanced, usedClaude: true };
  } catch (e) {
    const msg = String((e as Error).message);
    return { output: base, usedClaude: false, error: msg };
  }
}
