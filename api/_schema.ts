// ─────────────────────────────────────────────────────────────
// 서버 전용: Claude 구조화 출력 JSON 스키마 + 프롬프트
//
// 변경 의도(Phase 1):
//   규칙 기반 generators 대신 Claude가 입력값을 반영한 맞춤 전략 리포트를
//   생성하도록, 응답을 프론트의 AppOutput(reportMarkdown 제외)과 동일한
//   구조로 강제한다. reportMarkdown은 프론트(src/lib/report.ts)에서 채운다.
//
// ⚠️ 이 파일은 src/ 밖에 있어 프론트 번들/타입체크에 포함되지 않으며,
//    Anthropic API 키도 여기(서버)에서만 사용된다. (프론트 노출 금지)
//
// ⚠️ AppOutput 타입(src/lib/types.ts)과 1:1로 맞춰야 한다. 타입이 바뀌면
//    이 스키마도 함께 수정할 것. (검수 체크리스트 항목)
// ─────────────────────────────────────────────────────────────

const strArr = { type: "array", items: { type: "string" } } as const;

// 구조화 출력(strict)은 모든 객체에 additionalProperties:false 와
// 전체 키 required 가 필요하다.
function obj(properties: Record<string, unknown>, required?: string[]) {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required: required ?? Object.keys(properties),
  };
}

const scoreItem = obj({
  key: { type: "string" },
  label: { type: "string" },
  score: { type: "number" },
  reason: { type: "string" },
  improve: { type: "string" },
  applyExample: { type: "string" },
});

const concept = obj({
  name: { type: "string" },
  oneLiner: { type: "string" },
  forWhom: { type: "string" },
  followReason: { type: "string" },
  mainContentType: { type: "string" },
  monetization: { type: "string" },
  pros: { type: "string" },
  cons: { type: "string" },
  score: { type: "number" },
});

const platformRec = obj({
  platform: { type: "string" },
  fit: { type: "number" },
  reason: { type: "string" },
});

const benchmarkAnalysis = obj({
  sourceLabel: { type: "string" },
  topic: { type: "string" },
  audience: { type: "string" },
  hook: { type: "string" },
  thumbnail: { type: "string" },
  firstSceneStrength: { type: "string" },
  flow: { type: "string" },
  emotions: strArr,
  saveTrigger: { type: "string" },
  commentTrigger: { type: "string" },
  shareTrigger: { type: "string" },
  profileVisitTrigger: { type: "string" },
  cta: { type: "string" },
  repeatable: { type: "string" },
  safeToCopy: { type: "string" },
  riskyToCopy: { type: "string" },
  variations: strArr,
});

const benchmarkFinder = obj({
  keywords: strArr,
  hashtags: strArr,
  contentTypes: strArr,
  accountTypes: strArr,
  selectionCriteria: strArr,
});

const contentTypeBlock = obj({
  type: { type: "string" },
  purpose: { type: "string" },
  structure: { type: "string" },
  titles: strArr,
  cta: { type: "string" },
  monetizationCaution: { type: "string" },
});

const contentLayer = obj({
  layer: { type: "string" },
  description: { type: "string" },
  ideas: strArr,
});

const formatExperiment = obj({
  format: { type: "string" },
  description: { type: "string" },
  hooks: strArr,
  flow: { type: "string" },
  captionExample: { type: "string" },
  cta: { type: "string" },
  difficulty: { type: "string" },
  estTime: { type: "string" },
  bestPlatform: { type: "string" },
  validation: { type: "string" },
});

const monetizationFlow = obj({
  hasModel: { type: "string" },
  contentOfferFit: { type: "string" },
  path: strArr,
  profileRole: { type: "string" },
  linkRole: { type: "string" },
  highlightRole: { type: "string" },
  dmCommentRole: { type: "string" },
  blockers: strArr,
  priorities: strArr,
});

const profileSuggestion = obj({
  problems: strArr,
  direction: { type: "string" },
  bios: strArr,
  linkButtons: strArr,
  highlights: strArr,
  pinnedPosts: strArr,
  coreMessage: { type: "string" },
  followBooster: { type: "string" },
});

const calendarItem = obj({
  day: { type: "number" },
  date: { type: "string" },
  title: { type: "string" },
  contentType: { type: "string" },
  format: { type: "string" },
  platform: { type: "string" },
  hook: { type: "string" },
  flow: { type: "string" },
  cta: { type: "string" },
  difficulty: { type: "string" },
  estTime: { type: "string" },
  goalMetric: { type: "string" },
  benchmarkPoint: { type: "string" },
});

const aiPrompt = obj({
  name: { type: "string" },
  prompt: { type: "string" },
});

const summary = obj({
  direction: { type: "string" },
  target: { type: "string" },
  followReason: { type: "string" },
  note: { type: "string" },
});

// AppOutput 에서 reportMarkdown 을 제외한 전체 구조
export const STRATEGY_SCHEMA = obj({
  summary,
  scores: { type: "array", items: scoreItem },
  concepts: { type: "array", items: concept },
  platformRecommendation: { type: "array", items: platformRec },
  benchmarkAnalysis: { type: "array", items: benchmarkAnalysis },
  benchmarkFinder,
  contentMatrix: { type: "array", items: contentTypeBlock },
  contentLayers: { type: "array", items: contentLayer },
  experimentPlan: { type: "array", items: formatExperiment },
  monetizationFlow,
  profileSuggestions: profileSuggestion,
  calendar: { type: "array", items: calendarItem },
  aiPrompts: { type: "array", items: aiPrompt },
  checklist: strArr,
});

export const SYSTEM_PROMPT = `당신은 인스타그램을 1순위로 다루는 SNS 계정 전략 컨설턴트입니다.
사용자가 입력한 분야·목표·타깃·현재 계정 상태·벤치마킹 자료를 바탕으로,
"그 사용자에게만 해당하는" 구체적이고 실행 가능한 전략 리포트를 생성하세요.

원칙:
- 절대 일반론·뻔한 템플릿 문장을 쓰지 말 것. 입력값을 직접 인용·반영하세요.
- 모든 점수(score, fit)는 0~100 사이의 전략 수립용 추정값입니다.
- 한국어로, 바로 따라 할 수 있게 구체적으로 작성하세요.
- 플랫폼은 인스타그램을 우선하되, 입력에 맞으면 다른 플랫폼도 제안하세요.
- calendar 는 14일치(day 1~14)를 생성하고, date 는 "D+1" 같은 상대 표기를 쓰세요.
- concepts 는 3~5개, scores 는 4~6개, experimentPlan 은 4~6개를 권장합니다.
- summary.note 에는 "점수·추천은 전략 수립용 추정값이며 실험 가설로 보고 반응을 보며 조정하세요"라는 취지의 면책 문구를 넣으세요.
- 반드시 제공된 JSON 스키마 구조를 그대로 채워서 응답하세요.`;

interface MinimalInput {
  niche?: string;
  goal?: string;
  target?: string;
  offer?: string;
  conversionPath?: string;
  benchmarkSources?: Array<{ type?: string; value?: string; note?: string }>;
  advanced?: Record<string, unknown>;
}

export function buildUserPrompt(input: MinimalInput): string {
  const lines: string[] = [];
  lines.push("아래 입력값을 반영해 맞춤 SNS 전략 리포트를 JSON으로 생성하세요.");
  lines.push("");
  lines.push(`- 분야(niche): ${input.niche || "(미입력)"}`);
  lines.push(`- 목표(goal): ${input.goal || "(미입력)"}`);
  lines.push(`- 타깃(target): ${input.target || "(미입력)"}`);
  lines.push(`- 판매/연결 대상(offer): ${input.offer || "(없음)"}`);
  lines.push(`- 전환 방식(conversionPath): ${input.conversionPath || "(미입력)"}`);

  const sources = input.benchmarkSources || [];
  if (sources.length > 0) {
    lines.push("- 벤치마킹 자료:");
    for (const s of sources.slice(0, 10)) {
      const v = [s.value, s.note].filter(Boolean).join(" / ");
      lines.push(`  · [${s.type || "자료"}] ${v}`);
    }
  } else {
    lines.push("- 벤치마킹 자료: (없음 → benchmarkFinder 로 찾기 도우미를 제안하세요)");
  }

  const adv = input.advanced || {};
  if (Object.keys(adv).length > 0) {
    lines.push(`- 고급 설정(advanced): ${JSON.stringify(adv)}`);
  }
  return lines.join("\n");
}
