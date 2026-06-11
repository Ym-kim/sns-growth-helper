// ─────────────────────────────────────────────────────────────
// 프론트 → 서버(/api/generate) 연동 단일 지점.
//
// 변경 의도(Phase 1):
//   규칙 기반 buildOutputLocal 대신, Claude 가 생성한 맞춤 전략 리포트를
//   서버 함수에서 받아온다. (Anthropic API 키는 서버에만 존재)
//
// 흐름: App.complete() → generateOutputRemote() → POST /api/generate
//        → AppOutput(reportMarkdown 제외) JSON → attachReportMarkdown() 으로 완성
//   실패 시 호출부(App.tsx)에서 buildOutputLocal 로 fallback 한다.
// ─────────────────────────────────────────────────────────────

import type { AppInput, AppOutput } from "./types";
import { attachReportMarkdown } from "./report";

type PartialOutput = Omit<AppOutput, "reportMarkdown">;

// AI 응답이 AppOutput 구조를 충족하는지 최소 검증.
// (구조가 깨졌으면 throw → 호출부에서 로컬 fallback)
function isValidPartial(data: unknown): data is PartialOutput {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  const arrays = [
    "scores",
    "concepts",
    "platformRecommendation",
    "benchmarkAnalysis",
    "contentMatrix",
    "contentLayers",
    "experimentPlan",
    "calendar",
    "aiPrompts",
    "checklist",
  ];
  if (arrays.some((k) => !Array.isArray(d[k]))) return false;
  if (!d.summary || typeof d.summary !== "object") return false;
  if (!d.monetizationFlow || typeof d.monetizationFlow !== "object") return false;
  if (!d.profileSuggestions || typeof d.profileSuggestions !== "object") return false;
  if (!d.benchmarkFinder || typeof d.benchmarkFinder !== "object") return false;
  return true;
}

export async function generateOutputRemote(input: AppInput): Promise<AppOutput> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    let detail = "";
    try {
      detail = ((await res.json()) as { error?: string }).error ?? "";
    } catch {
      /* 무시 */
    }
    throw new Error(`generate 실패 (${res.status})${detail ? `: ${detail}` : ""}`);
  }

  const data: unknown = await res.json();
  if (!isValidPartial(data)) {
    throw new Error("AI 응답 구조가 AppOutput 과 맞지 않습니다.");
  }

  return attachReportMarkdown(input, data);
}
