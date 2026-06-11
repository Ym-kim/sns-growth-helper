// ─────────────────────────────────────────────────────────────
// 무료 / 유료 분기 (entitlement)
//
// ⚠️ TEMP (Phase 1): 결제·로그인 미연동 상태의 "임시 UI 구조"다.
//    현재는 localStorage 플래그로만 plan 을 흉내내며, 실제 권한 검증이 아니다.
//    추후 Phase(결제/인증)에서 서버 검증 기반으로 교체할 것.
//
//    무료: 요약 탭만 열람, 리포트 복사/마크다운 다운로드 비활성
//    유료: 전체 탭 + 복사/다운로드
// ─────────────────────────────────────────────────────────────

export type Plan = "free" | "paid";

const PLAN_KEY = "sgh.plan.v1"; // TEMP 저장소

export function getPlan(): Plan {
  try {
    return localStorage.getItem(PLAN_KEY) === "paid" ? "paid" : "free";
  } catch {
    return "free";
  }
}

export function setPlan(plan: Plan) {
  try {
    localStorage.setItem(PLAN_KEY, plan);
  } catch {
    /* 무시 */
  }
}

// 무료 플랜에서 열람 가능한 탭(요약만)
export const FREE_TAB_IDS = ["요약"] as const;

export function isTabLocked(tabId: string, plan: Plan): boolean {
  return plan === "free" && !FREE_TAB_IDS.includes(tabId as (typeof FREE_TAB_IDS)[number]);
}
