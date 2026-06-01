// 성공 포맷 검증 로직. 한 번 터졌다고 확정하지 않고, 같은 포맷 2~3개 추가 실험을 안내한다.

import type { PerformanceInput, PerformanceResult } from "./types";

export function evaluatePerformance(p: PerformanceInput): PerformanceResult {
  const views = Math.max(1, p.views);
  const saveRate = p.saves / views;
  const commentRate = p.comments / views;
  const shareRate = p.shares / views;
  const profileRate = p.profileVisits / views;
  const convRate = (p.linkClicks + p.dms + p.sales) / views;

  // 추정 기준선 (절대 정답 아님 — 계정/분야별로 조정 필요)
  const reachSuccess = views >= 3000 || shareRate >= 0.01;
  const saveSuccess = saveRate >= 0.02;
  const commentSuccess = commentRate >= 0.01;
  const conversionSuccess = profileRate >= 0.02 || convRate >= 0.005 || p.sales > 0;

  const wins = [reachSuccess, saveSuccess, commentSuccess, conversionSuccess].filter(Boolean).length;

  let repeat: string;
  if (wins >= 2) {
    repeat = `반응 신호가 있습니다. 같은 "${p.format}" 포맷으로 2~3개 더 만들어 검증하세요. 비슷한 성과가 3개 이상 반복되면 '검증된 포맷 후보'로 봅니다.`;
  } else if (wins === 1) {
    repeat = `한 가지 지표만 반응했습니다. 주제는 유지하고 후킹·자막·CTA를 바꿔 1~2개 더 실험해 보세요.`;
  } else {
    repeat = `뚜렷한 신호가 약합니다. 주제를 바꾸기보다 첫 장면·후킹·길이·CTA부터 바꿔 다시 실험하세요.`;
  }

  const fixSuggestions: string[] = [];
  if (!reachSuccess) fixSuggestions.push("도달이 약함 → 첫 3초 후킹과 표지 문구를 더 강하게.");
  if (!saveSuccess) fixSuggestions.push("저장이 약함 → '나중에 볼 가치'(체크리스트/정리)를 추가.");
  if (!commentSuccess) fixSuggestions.push("댓글이 약함 → 마무리에 선택지·질문을 배치.");
  if (!conversionSuccess) fixSuggestions.push("전환이 약함 → 프로필 방문/링크로 가는 멘트와 동선을 명확히.");
  if (fixSuggestions.length === 0) fixSuggestions.push("전반적으로 양호 → 동일 포맷 반복 제작으로 검증 단계 진입.");

  return {
    reachSuccess,
    saveSuccess,
    commentSuccess,
    conversionSuccess,
    repeat,
    nextIdeas: [
      `"${p.title}"와 같은 ${p.format} 포맷 + 다른 소주제 (검증용 1)`,
      `같은 ${p.format} 포맷 + 후킹만 교체 (검증용 2)`,
      `같은 ${p.format} 포맷 + CTA만 전환형으로 교체 (검증용 3)`,
    ],
    fixSuggestions,
    verdict:
      wins >= 2
        ? "반복 실험 권장 (포맷 후보)"
        : wins === 1
        ? "부분 반응 — 변수 조정 후 재실험"
        : "신호 약함 — 요소 개선 후 재실험",
  };
}
