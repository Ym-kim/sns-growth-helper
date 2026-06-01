// 전체 분석 오케스트레이터 + Markdown 리포트 생성.

import type { AppInput, AppOutput } from "./types";
import {
  analyzeAccount,
  generateConcepts,
  generatePlatformRecommendation,
  generateContentMatrix,
  generateContentLayers,
  generateExperimentPlan,
  generateMonetizationFlow,
  generateProfileSuggestions,
  generateContentCalendar,
} from "./generators";
import { analyzeBenchmark, generateBenchmarkFinder } from "./benchmark";
import { generateAIPrompts } from "./prompts";
import { generateChecklist } from "./checklist";

const DISCLAIMER =
  "※ 점수와 추천은 절대적 정답이 아니라 전략 수립을 위한 추정값입니다. 알고리즘은 시점에 따라 바뀌므로 모든 제안은 실험 가설로 보고 반응을 확인하며 조정하세요.";

// 다음 실행 우선순위 TOP 5 도출
function topPriorities(input: AppInput, scores: ReturnType<typeof analyzeAccount>): string[] {
  const weakest = [...scores].sort((a, b) => a.score - b.score).slice(0, 3);
  const list = [
    "프로필 소개글을 '대상 + 도움 + 행동' 공식으로 다시 작성",
    ...weakest.map((s) => `${s.label} 개선: ${s.improve}`),
    input.offer && input.offer !== "아직 없음"
      ? `전환 콘텐츠 1개 제작해 ${input.offer}로 가는 동선 테스트`
      : "무료자료 1개 제작해 연결 지점 확보",
    "잘되는 포맷 1개를 정해 2~3개 더 만들어 검증",
  ];
  return list.slice(0, 5);
}

export function buildOutput(input: AppInput): AppOutput {
  const scores = analyzeAccount(input);
  const concepts = generateConcepts(input);
  const platformRecommendation = generatePlatformRecommendation(input);
  const benchmarkAnalysis = analyzeBenchmark(input);
  const benchmarkFinder = generateBenchmarkFinder(input);
  const contentMatrix = generateContentMatrix(input);
  const contentLayers = generateContentLayers(input);
  const experimentPlan = generateExperimentPlan(input);
  const monetizationFlow = generateMonetizationFlow(input);
  const profileSuggestions = generateProfileSuggestions(input);
  const calendar = generateContentCalendar(input, 14);
  const aiPrompts = generateAIPrompts(input);
  const checklist = generateChecklist(input);

  const out: AppOutput = {
    summary: {
      direction: `${input.niche || "선택한 분야"} 분야에서 ${input.goal || "목표 미정"}을(를) 위한 계정`,
      target: input.target || "타깃 미입력",
      followReason: `${input.target || "타깃"}가 ${input.niche || "이 분야"}에서 바로 써먹을 것을 얻기 위해 팔로우`,
      note: DISCLAIMER,
    },
    scores,
    concepts,
    platformRecommendation,
    benchmarkAnalysis,
    benchmarkFinder,
    contentMatrix,
    contentLayers,
    experimentPlan,
    monetizationFlow,
    profileSuggestions,
    calendar,
    aiPrompts,
    checklist,
    reportMarkdown: "",
  };

  out.reportMarkdown = exportReport(input, out, topPriorities(input, scores));
  return out;
}

export function exportReport(input: AppInput, out: AppOutput, priorities: string[]): string {
  const L: string[] = [];
  const h = (s: string) => L.push(`\n## ${s}\n`);
  const top = out.concepts[0];

  L.push(`# SNS 계정 전략 리포트`);
  L.push(`> ${out.summary.note}`);

  h("1. 계정 방향 요약");
  L.push(`- 분야: ${input.niche || "-"}`);
  L.push(`- 목표: ${input.goal || "-"}`);
  L.push(`- 연결할 것: ${input.offer || "-"}`);
  L.push(`- 전환 방식: ${input.conversionPath || "-"}`);

  h("2. 타깃 정의");
  L.push(`- ${out.summary.target}`);

  h("3. 팔로우할 이유");
  L.push(`- ${out.summary.followReason}`);
  out.scores.forEach((s) => L.push(`- **${s.label}** (추정 ${s.score}점): ${s.reason} → ${s.improve}`));

  h("4. 추천 계정 콘셉트");
  out.concepts.forEach((c) =>
    L.push(`- **${c.name}** (추천 ${c.score}점): ${c.oneLiner}\n  - 팔로우 이유: ${c.followReason}\n  - 수익화: ${c.monetization}`)
  );

  h("5. 플랫폼 추천");
  out.platformRecommendation.forEach((p) => L.push(`- ${p.platform} (적합도 ${p.fit}): ${p.reason}`));

  h("6. 벤치마킹 분석 결과");
  if (out.benchmarkAnalysis.length === 0) {
    L.push("- 입력된 벤치마킹 자료가 없어 '찾기 도우미'를 활용하세요.");
    L.push(`- 추천 키워드: ${out.benchmarkFinder.keywords.join(", ")}`);
  } else {
    out.benchmarkAnalysis.forEach((b, i) => {
      L.push(`- (${i + 1}) ${b.sourceLabel}`);
      L.push(`  - 후킹: ${b.hook}`);
      L.push(`  - 감정: ${b.emotions.join(", ")}`);
      L.push(`  - 따라 해도 되는 것: ${b.safeToCopy} / 위험: ${b.riskyToCopy}`);
    });
  }

  h("7. 콘텐츠 유형 매트릭스");
  out.contentMatrix.forEach((m) => L.push(`- **${m.type}** (${m.purpose}): 제목 예) ${m.titles[0]}`));

  h("8. 콘텐츠 포맷 실험안 (주제 유지·포맷 변경)");
  out.experimentPlan.slice(0, 6).forEach((e) =>
    L.push(`- **${e.format}** (${e.difficulty}, ${e.estTime}): 후킹 예) ${e.hooks[0]}`)
  );

  h("9. 수익화 동선");
  L.push(`- 경로: ${out.monetizationFlow.path.join(" → ")}`);
  L.push(`- 개선 우선순위: ${out.monetizationFlow.priorities.join(" / ")}`);

  h("10. 프로필 개선안");
  L.push(`- 한 줄 소개 예: ${out.profileSuggestions.bios[0]}`);
  L.push(`- 링크 버튼 예: ${out.profileSuggestions.linkButtons[0]}`);
  L.push(`- 하이라이트: ${out.profileSuggestions.highlights.join(", ")}`);

  h("11. 14일 콘텐츠 플랜 (요약)");
  out.calendar.slice(0, 14).forEach((c) =>
    L.push(`- ${c.date} | ${c.format} | ${c.title} | 목표: ${c.goalMetric}`)
  );

  h("12. AI 제작 프롬프트");
  out.aiPrompts.forEach((p) => L.push(`- ${p.name}`));
  L.push(`\n(전체 프롬프트는 앱의 'AI 프롬프트' 탭에서 복사하세요.)`);

  h("13. 업로드 전 체크리스트");
  out.checklist.forEach((c) => L.push(`- [ ] ${c}`));

  h("14. 다음 실행 우선순위 TOP 5");
  priorities.forEach((p, i) => L.push(`${i + 1}. ${p}`));

  return L.join("\n");
}
