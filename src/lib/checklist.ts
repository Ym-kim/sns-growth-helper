// 업로드 전 체크리스트. 입력값에 맞춰 일부 문구를 구체화한다.

import type { AppInput } from "./types";

export function generateChecklist(input: AppInput): string[] {
  const niche = input.niche.trim() || "이 분야";
  const conv = input.conversionPath && input.conversionPath !== "아직 없음" ? input.conversionPath : "링크/DM";
  return [
    `이 콘텐츠는 누구를 위한 것인가? (${input.target || "타깃"} 기준)`,
    "첫 3초 안에 계속 볼 이유가 있는가?",
    "썸네일/첫 문장이 충분히 강한가?",
    "저장·댓글·공유 중 하나를 분명히 유도하는가?",
    `${niche} 계정을 팔로우할 이유와 연결되는가?`,
    "프로필 방문 후 다음 행동이 명확한가?",
    `링크/DM/신청 경로(${conv})가 정리되어 있는가?`,
    "기존 콘텐츠와 톤이 너무 다르지 않은가?",
    "이번 콘텐츠는 어떤 가설을 테스트하는가?",
    "성과를 어떤 지표로 판단할 것인가? (도달/저장/댓글/전환)",
  ];
}
