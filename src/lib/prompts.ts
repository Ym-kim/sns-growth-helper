// AI 콘텐츠 제작 프롬프트 생성. 입력값을 변수로 채워 바로 복사해 쓸 수 있게 만든다.

import type { AppInput, AIPrompt } from "./types";

export function generateAIPrompts(input: AppInput): AIPrompt[] {
  const adv = input.advanced || {};
  const v = {
    niche: input.niche.trim() || "{운영분야}",
    target: input.target.trim() || "{타깃}",
    goal: input.goal.trim() || "{계정목표}",
    offer: input.offer.trim() && input.offer !== "아직 없음" ? input.offer : "{판매상품}",
    platform: adv.preferredPlatform || "{플랫폼}",
    tone: "친근하고 신뢰감 있는",
  };

  const header =
    `너는 ${v.niche} 분야 SNS 콘텐츠 전문가다.\n` +
    `- 운영분야: ${v.niche}\n- 타깃: ${v.target}\n- 계정목표: ${v.goal}\n` +
    `- 연결할 것: ${v.offer}\n- 플랫폼: ${v.platform}\n- 톤앤매너: ${v.tone}\n` +
    `규칙: "무조건 터진다" 같은 과장 표현 금지. 실험 가설로 제안하고, 전환 동선을 함께 고려할 것.\n`;

  return [
    {
      name: "릴스/쇼츠 대본 생성",
      prompt: header +
        `\n위 정보를 바탕으로 ${v.platform}용 30초 릴스/쇼츠 대본을 작성해줘.\n` +
        `구성: [첫 3초 후킹] [본문 흐름 3단계] [마무리 CTA].\n` +
        `${v.target}가 끝까지 보게 만들고, 저장 또는 댓글 중 하나를 유도해줘.`,
    },
    {
      name: "첫 3초 후킹 10개 생성",
      prompt: header +
        `\n${v.niche} 주제로 ${v.target}의 스크롤을 멈추게 할 첫 3초 후킹 문장 10개를 만들어줘.\n` +
        `문제 제기형/숫자형/질문형/반전형을 섞고, 각 문장 옆에 어떤 유형인지 표기해줘.`,
    },
    {
      name: "카드뉴스 문안 생성",
      prompt: header +
        `\n${v.niche} 주제로 8장짜리 카드뉴스 문안을 작성해줘.\n` +
        `1장=후킹 표지, 2~7장=핵심 내용, 8장=CTA. 각 장은 한 줄로 짧게.`,
    },
    {
      name: "인스타 캡션 생성",
      prompt: header +
        `\n방금 콘텐츠에 어울리는 인스타그램 캡션을 작성해줘.\n` +
        `도입 한 줄 후킹 → 핵심 3줄 → 저장/댓글 유도 → 해시태그 10개.`,
    },
    {
      name: "스레드(Threads) 글 생성",
      prompt: header +
        `\n${v.niche} 주제로 ${v.target}가 공감하거나 댓글 달고 싶게 만드는 Threads용 짧은 글 3개를 작성해줘.\n` +
        `각 글은 2~4줄, 마지막에 가벼운 질문 한 줄 포함.`,
    },
    {
      name: "블로그 글 초안 생성",
      prompt: header +
        `\n${v.niche} 주제로 검색 유입을 노린 블로그 글 초안을 작성해줘.\n` +
        `제목 후보 3개 + 목차 + 본문 800자 내외 + 마무리 CTA(${v.offer} 연결).`,
    },
    {
      name: "댓글 유도 문장 생성",
      prompt: header +
        `\n${v.target}가 댓글을 남기고 싶게 만드는 마무리 문장 10개를 만들어줘.\n` +
        `선택지 제시형/경험 공유 요청형/의견 묻기형을 섞어줘.`,
    },
    {
      name: "DM 유도 문장 생성",
      prompt: header +
        `\n특정 키워드를 댓글로 남기면 DM으로 ${v.offer} 안내를 보내는 흐름의 유도 문장 5개를 만들어줘.\n` +
        `과장 없이 자연스럽게, 강요하지 않는 톤으로.`,
    },
    {
      name: "프로필 소개글 생성",
      prompt: header +
        `\n'누구를 위한 계정인지 + 어떤 도움을 주는지 + 어떤 행동을 하면 되는지' 공식으로\n` +
        `${v.platform} 프로필 소개글 5개를 만들어줘. 각 80자 이내.`,
    },
    {
      name: "하이라이트 구성 생성",
      prompt: header +
        `\n${v.niche} 계정의 인스타 하이라이트 구성안을 만들어줘.\n` +
        `방문자가 신뢰를 느끼고 ${v.offer}까지 이어지도록 5개 카테고리 + 각 카테고리에 넣을 콘텐츠 예시.`,
    },
  ];
}
