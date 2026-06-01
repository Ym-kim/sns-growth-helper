// rule-based 생성 함수 모음.
// 각 함수는 순수 함수 (input) => output 형태라, 추후 LLM/API 호출로 교체 가능하다.

import type {
  AppInput,
  ScoreItem,
  Concept,
  PlatformRec,
  ContentTypeBlock,
  ContentLayer,
  FormatExperiment,
  MonetizationFlow,
  ProfileSuggestion,
  CalendarItem,
} from "./types";

// 입력값이 비었을 때 결과가 어색하지 않도록 안전한 기본 표기로 치환한다.
function fb(v: string | undefined, fallback: string): string {
  const t = (v || "").trim();
  return t.length ? t : fallback;
}

interface Ctx {
  niche: string;
  goal: string;
  target: string;
  offer: string;
  conv: string;
  hasOffer: boolean;
}

function ctx(input: AppInput): Ctx {
  const offer = fb(input.offer, "아직 없음");
  return {
    niche: fb(input.niche, "선택한 분야"),
    goal: fb(input.goal, "아직 모르겠음"),
    target: fb(input.target, "관심 있는 일반 사용자"),
    offer,
    conv: fb(input.conversionPath, "아직 없음"),
    hasOffer: offer !== "아직 없음",
  };
}

// ─────────────────────────────────────────────
// 팔로우할 이유 진단 (8개 추정 점수)
// ─────────────────────────────────────────────
export function analyzeAccount(input: AppInput): ScoreItem[] {
  const c = ctx(input);
  const adv = input.advanced || {};
  const hasBio = !!(adv.profileBio && adv.profileBio.trim());
  const hasBenchmark = input.benchmarkSources.some((s) => s.value.trim());
  const goalKnown = c.goal !== "아직 모르겠음";
  const targetSpecific = c.target.length > 4;
  const convKnown = c.conv !== "아직 없음";

  const items: ScoreItem[] = [
    {
      key: "purpose",
      label: "목적성",
      score: goalKnown ? 78 : 45,
      reason: goalKnown
        ? `목표가 "${c.goal}"로 정해져 있어 콘텐츠 방향을 잡기 쉽습니다.`
        : "계정 목표가 아직 모호해 콘텐츠가 흩어지기 쉽습니다.",
      improve: "팔로워 수집이 아니라 '이 계정으로 무엇을 이루고 싶은지' 한 문장으로 정의하세요.",
      applyExample: `이 계정은 ${c.target}가 ${c.niche}에서 ${c.goal === "아직 모르겠음" ? "원하는 결과" : c.goal}를 이루도록 돕습니다.`,
    },
    {
      key: "target",
      label: "타깃 명확도",
      score: targetSpecific ? 80 : 50,
      reason: targetSpecific
        ? `"${c.target}"로 대상이 좁혀져 메시지를 뾰족하게 만들 수 있습니다.`
        : "타깃이 넓어 누구에게 말하는지 흐려질 수 있습니다.",
      improve: "연령/상황/고민을 한 가지 더해 타깃을 좁히면 후킹이 강해집니다.",
      applyExample: `${c.target} 중에서도 '지금 막 시작한 사람'에게 먼저 말하기.`,
    },
    {
      key: "followReason",
      label: "팔로우 이유 강도",
      score: goalKnown && targetSpecific ? 72 : 48,
      reason: "팔로우 이유는 '왜 굳이 이 계정을 봐야 하는가'에 대한 답입니다.",
      improve: "매 콘텐츠가 같은 약속(얻는 것)을 반복해야 팔로우 이유가 쌓입니다.",
      applyExample: `팔로우하면 ${c.niche} 관련해 매주 바로 써먹을 ${c.offer === "아직 없음" ? "팁" : c.offer} 정보를 받습니다.`,
    },
    {
      key: "repeatable",
      label: "콘텐츠 반복 가능성",
      score: adv.canMakeVideo === false ? 60 : 70,
      reason: "혼자 오래 운영하려면 똑같은 포맷을 반복 제작할 수 있어야 합니다.",
      improve: "주제는 유지하고 포맷만 바꿔 실험한 뒤, 잘되는 포맷을 템플릿화하세요.",
      applyExample: `"${c.niche} ○○ 체크리스트" 같은 반복 가능한 포맷 1개를 먼저 고정.`,
    },
    {
      key: "benchmark",
      label: "벤치마킹 가능성",
      score: hasBenchmark ? 75 : 52,
      reason: hasBenchmark
        ? "참고 자료가 있어 구조 분석을 바로 시작할 수 있습니다."
        : "참고 콘텐츠가 없어 감으로 시작할 위험이 있습니다.",
      improve: "여러 콘텐츠가 반복적으로 잘되는 계정을 3개 골라 구조를 분해하세요.",
      applyExample: `"${c.niche}" 키워드로 저장·댓글이 많은 콘텐츠부터 분석.`,
    },
    {
      key: "monetization",
      label: "수익화 연결성",
      score: c.hasOffer && convKnown ? 74 : c.hasOffer ? 58 : 40,
      reason: c.hasOffer
        ? `연결할 대상(${c.offer})이 있어 전환 동선을 설계할 수 있습니다.`
        : "연결할 상품/서비스가 없어 조회수가 수익으로 이어지지 않습니다.",
      improve: "조회수와 수익은 다릅니다. 콘텐츠→프로필→링크로 가는 경로를 먼저 정하세요.",
      applyExample: c.hasOffer
        ? `콘텐츠 끝에 "${c.offer}는 프로필 링크에서" 한 줄 추가.`
        : "무료자료(뉴스레터/체크리스트)부터 만들어 연결 지점을 확보.",
    },
    {
      key: "profile",
      label: "프로필 전환 가능성",
      score: hasBio ? 68 : 46,
      reason: hasBio
        ? "소개글이 있어 방문자가 계정을 이해할 단서가 있습니다."
        : "소개글 정보가 부족해 방문자가 다음 행동을 모를 수 있습니다.",
      improve: "소개글 = 누구를 위한 계정 + 어떤 도움 + 어떤 행동, 이 3요소로 정리하세요.",
      applyExample: `${c.target}를 위한 ${c.niche} 팁 / 매주 업로드 / 자료는 아래 링크.`,
    },
    {
      key: "sustainability",
      label: "운영 지속 가능성",
      score: adv.weeklyTime ? 70 : 55,
      reason: adv.weeklyTime
        ? `주당 ${adv.weeklyTime} 확보 가능해 현실적 운영 계획을 세울 수 있습니다.`
        : "제작 가능 시간이 불명확해 무리한 계획이 되기 쉽습니다.",
      improve: "감당 가능한 주 업로드 수를 먼저 정하고 거기에 맞춰 포맷을 단순화하세요.",
      applyExample: "주 3회가 부담되면 주 2회 + 검증된 포맷 재활용으로 시작.",
    },
  ];
  return items;
}

// ─────────────────────────────────────────────
// 계정 콘셉트 3종
// ─────────────────────────────────────────────
export function generateConcepts(input: AppInput): Concept[] {
  const c = ctx(input);
  const offerLine = c.hasOffer ? c.offer : "무료자료/뉴스레터";

  return [
    {
      name: "정보형 계정",
      oneLiner: `${c.target}를 위한 ${c.niche} 핵심 정보를 정리해 주는 계정`,
      forWhom: `${c.niche}를 막 시작했거나 정보가 흩어져 답답한 ${c.target}`,
      followReason: "매번 바로 써먹을 수 있는 정리된 정보를 얻는다.",
      mainContentType: "정보 콘텐츠 (체크리스트, 정리, 비교)",
      monetization: `신뢰가 쌓이면 ${offerLine}로 자연스럽게 연결`,
      pros: "저장·전문성 쌓기 쉽고 전환과 연결이 자연스럽다.",
      cons: "초반 노출 폭발력은 약할 수 있어 후킹 설계가 필요하다.",
      score: 88,
    },
    {
      name: "공감/스토리형 계정",
      oneLiner: `${c.niche}를 겪는 ${c.target}의 감정과 상황에 공감하는 계정`,
      forWhom: `${c.niche} 과정에서 비슷한 고민을 하는 ${c.target}`,
      followReason: "내 이야기 같아서 다음 콘텐츠가 기다려진다.",
      mainContentType: "공감·이야기 콘텐츠 (상황극, 비하인드, 경험담)",
      monetization: `팬덤이 생기면 ${offerLine}나 커뮤니티로 연결`,
      pros: "댓글·공유가 잘 일어나고 관계가 깊어진다.",
      cons: "전환 설계를 안 하면 조회수만 높고 수익이 안 생길 수 있다.",
      score: 80,
    },
    {
      name: c.hasOffer ? "판매전환형 계정" : "개인브랜딩형 계정",
      oneLiner: c.hasOffer
        ? `${c.niche} 결과를 보여주고 ${c.offer}로 연결하는 계정`
        : `${c.niche} 분야에서 나만의 관점을 쌓는 개인브랜딩 계정`,
      forWhom: c.hasOffer
        ? `${c.offer}가 필요한지 고민 중인 ${c.target}`
        : `${c.niche}에 진지하게 임하는 ${c.target}`,
      followReason: c.hasOffer
        ? "결과와 사례를 보고 믿고 맡길 수 있다."
        : "이 사람의 관점과 기준을 신뢰하게 된다.",
      mainContentType: c.hasOffer
        ? "신뢰·전환 콘텐츠 (사례, 후기, Before/After)"
        : "관점·경험 콘텐츠 (인사이트, 기록)",
      monetization: c.hasOffer
        ? `${c.conv === "아직 없음" ? "링크/DM" : c.conv}을 통한 직접 전환`
        : "브랜딩이 쌓인 뒤 제휴/강의/협업으로 확장",
      pros: c.hasOffer ? "전환 목표에 가장 직접적이다." : "장기적으로 기회가 넓어진다.",
      cons: c.hasOffer ? "판매 톤이 강하면 초기 팔로우 저항이 생긴다." : "수익화까지 시간이 걸린다.",
      score: c.hasOffer ? 82 : 76,
    },
  ];
}

// ─────────────────────────────────────────────
// 플랫폼 추천
// ─────────────────────────────────────────────
export function generatePlatformRecommendation(input: AppInput): PlatformRec[] {
  const adv = input.advanced || {};
  const canVideo = adv.canMakeVideo !== false;
  const preferred = adv.preferredPlatform;

  const base: PlatformRec[] = [
    {
      platform: "Instagram",
      fit: canVideo ? 85 : 72,
      reason: "릴스(노출) + 피드/하이라이트(신뢰·전환)를 한 곳에서 운영할 수 있습니다.",
    },
    {
      platform: "YouTube Shorts",
      fit: canVideo ? 80 : 55,
      reason: "쇼츠 노출이 강하고, 영상 제작이 가능하면 검색 자산으로 누적됩니다.",
    },
    {
      platform: "TikTok",
      fit: canVideo ? 78 : 50,
      reason: "초기 노출 실험에 유리하나 영상 제작 역량이 전제됩니다.",
    },
    {
      platform: "Threads",
      fit: canVideo ? 65 : 80,
      reason: "텍스트 중심이라 영상 부담 없이 공감·관계 콘텐츠를 빠르게 실험할 수 있습니다.",
    },
    {
      platform: "Naver Blog",
      fit: 62,
      reason: "검색 유입과 긴 글 신뢰 자산에 강하나 즉각적 노출은 약합니다.",
    },
  ];

  return base
    .map((p) => (p.platform === preferred ? { ...p, fit: Math.min(99, p.fit + 8) } : p))
    .sort((a, b) => b.fit - a.fit);
}

// ─────────────────────────────────────────────
// 콘텐츠 유형 매트릭스 (재미/정보/이야기/공감)
// ─────────────────────────────────────────────
export function generateContentMatrix(input: AppInput): ContentTypeBlock[] {
  const c = ctx(input);
  const n = c.niche;
  return [
    {
      type: "재미 콘텐츠",
      purpose: "빠른 노출, 공감, 공유",
      structure: "강한 첫 장면 → 예상 밖 전개 → 짧은 마무리",
      titles: [
        `${n} 할 때 누구나 한 번쯤 겪는 일`,
        `${n} 초보 vs 고수 차이`,
        `${n} 하면서 절대 안 하는 행동`,
        `${n} 밈으로 정리`,
        `${n} 1분 요약 (웃긴 버전)`,
      ],
      cta: "공감되면 친구 태그 / 저장보다 공유 유도",
      monetizationCaution: "재미만으로는 전환이 약합니다. 팔로우 이유와 연결되는 장치를 함께 두세요.",
    },
    {
      type: "정보 콘텐츠",
      purpose: "저장, 신뢰, 전문성",
      structure: "문제 제시 → 핵심 3가지 → 정리/체크리스트 → 저장 유도",
      titles: [
        `${n} 시작 전 꼭 알아야 할 5가지`,
        `${n} 흔한 실수 3가지`,
        `${n} 입문 체크리스트`,
        `${n} 용어 한 번에 정리`,
        `${n} 도구/방법 비교`,
      ],
      cta: "나중에 보게 저장 / 궁금한 점 댓글",
      monetizationCaution: "정보를 다 주되, 더 깊은 적용은 자료/상담으로 연결하면 자연스럽습니다.",
    },
    {
      type: "이야기 콘텐츠",
      purpose: "관계 형성, 몰입, 다음 콘텐츠 기대",
      structure: "상황 → 전환점 → 깨달음 → 다음 편 예고",
      titles: [
        `${n} 처음 시작했을 때 이야기`,
        `${n} 하다 크게 실패한 날`,
        `${n} 바뀌게 된 결정적 순간`,
        `${n} 하루 루틴 비하인드`,
        `${n} 6개월 기록 (1편)`,
      ],
      cta: "다음 편 보려면 팔로우 / 비슷한 경험 댓글",
      monetizationCaution: "스토리 끝에 판매를 바로 붙이면 몰입이 깨집니다. 신뢰 누적 후 연결하세요.",
    },
    {
      type: "공감 콘텐츠",
      purpose: "댓글, 공유, 팬덤 형성",
      structure: "'나만 그래?' 질문 → 구체 상황 나열 → 함께 공감 마무리",
      titles: [
        `${n} 하는 사람만 아는 고충`,
        `${n} 할 때 진짜 듣기 싫은 말`,
        `${n} 현실 vs 이상`,
        `${n} 하면서 매번 다짐하는 것`,
        `${n} 지인은 모르는 우리만의 언어`,
      ],
      cta: "공감되면 댓글로 한 마디 / 친구에게 공유",
      monetizationCaution: "공감은 팬덤엔 좋지만 전환은 약합니다. 커뮤니티/뉴스레터로 모으는 데 활용하세요.",
    },
  ];
}

// 운영 목적 레이어 (유입/신뢰/관계/전환)
export function generateContentLayers(input: AppInput): ContentLayer[] {
  const c = ctx(input);
  const n = c.niche;
  const offer = c.hasOffer ? c.offer : "무료자료";
  return [
    {
      layer: "유입 콘텐츠",
      description: "처음 보는 사람에게 노출되는 콘텐츠",
      ideas: [
        `${n} 흔한 오해 한 가지`,
        `${n} 1분 핵심 요약`,
        `${n} 초보가 가장 많이 묻는 질문`,
        `${n} 하기 전/후 비교`,
        `${n} 5초 만에 이해하는 ○○`,
      ],
    },
    {
      layer: "신뢰 콘텐츠",
      description: "전문성·경험·사례를 보여주는 콘텐츠",
      ideas: [
        `${n} 실제 적용 사례 정리`,
        `${n} 내가 검증한 방법`,
        `${n} 자주 묻는 질문 답변`,
        `${n} 데이터/근거로 보는 ○○`,
        `${n} 단계별 가이드`,
      ],
    },
    {
      layer: "관계 콘텐츠",
      description: "일상·생각·비하인드·스토리 콘텐츠",
      ideas: [
        `${n} 하면서 느낀 점`,
        `${n} 하루 기록`,
        `${n} 실패담과 배운 것`,
        `${n}에 대한 솔직한 생각`,
        `${n} 시작하게 된 계기`,
      ],
    },
    {
      layer: "전환 콘텐츠",
      description: "문의·신청·구매·상담으로 연결하는 콘텐츠",
      ideas: [
        `${offer} 어떤 사람에게 맞을까`,
        `${offer} 자주 묻는 질문 정리`,
        `${n} 결과/후기 모아보기`,
        `${offer} 신청 전 체크사항`,
        `지금 ${c.conv === "아직 없음" ? "프로필 링크" : c.conv}로 시작하는 법`,
      ],
    },
  ];
}

// ─────────────────────────────────────────────
// 콘텐츠 포맷 실험실 (주제 유지, 포맷만 변경)
// ─────────────────────────────────────────────
export function generateExperimentPlan(input: AppInput): FormatExperiment[] {
  const c = ctx(input);
  const adv = input.advanced || {};
  const topic = adv.recentTopics?.[0]?.trim() || `${c.niche} 기본 주제`;
  const platform = adv.preferredPlatform || "Instagram";
  const faceOk = adv.canShowFace !== false;

  const make = (
    format: string,
    description: string,
    hooks: string[],
    flow: string,
    caption: string,
    cta: string,
    difficulty: string,
    estTime: string,
    bestPlatform: string,
    validation: string
  ): FormatExperiment => ({
    format, description, hooks, flow, captionExample: caption, cta,
    difficulty, estTime, bestPlatform, validation,
  });

  const all: FormatExperiment[] = [
    make("정보전달형", `"${topic}"를 핵심 3가지로 압축해 전달`,
      [`${topic}, 이거 모르면 시간 낭비합니다`, `${topic} 핵심만 30초`, `${topic} 초보가 놓치는 것`],
      "문제 → 핵심3 → 정리 → 저장 유도", "오늘은 핵심만 3가지. 1) … 2) … 3) … 저장해두고 보세요.",
      "도움 됐으면 저장!", "쉬움", "30~60분", platform, "저장 수가 평소보다 높은지 확인"),
    make("상황극형", `"${topic}" 상황을 짧은 연기로 재현`,
      [`${topic} 할 때 우리 모습…`, `이거 나만 그런 거 아니죠?`, `${topic} 현실 재현`],
      "공감 상황 → 과장 전개 → 한 줄 마무리", "이런 적 있으면 댓글 ㅋㅋ",
      "공감되면 친구 태그", faceOk ? "보통" : "어려움", "1~2시간", platform, "공유·댓글 반응 확인"),
    make("TTS 설명형", `"${topic}"를 자막+TTS로 설명 (얼굴 노출 불필요)`,
      [`${topic}, 3가지만 알면 됩니다`, `${topic} 정리해드립니다`, `${topic} 모를 때 보세요`],
      "후킹 자막 → 항목 나열 → 정리", "소리 켜고 보세요 🔊", "저장하고 천천히",
      "쉬움", "30~50분", "YouTube Shorts", "끝까지 시청 비율 확인"),
    make("감성 자막형", `"${topic}"에 대한 생각을 감성 자막으로`,
      [`${topic}, 사실 이런 거였어요`, `아무도 말 안 해준 ${topic}`, `${topic} 하다 알게 된 것`],
      "감정 한 줄 → 전개 → 여운", "오늘의 한 줄.", "공감되면 ♥",
      "쉬움", "30분", "Threads", "공유·저장 반응 확인"),
    make("얼굴 노출 브이로그형", `"${topic}" 과정을 일상처럼`,
      [`${topic} 하는 하루`, `같이 ${topic} 해요`, `${topic} 리얼 과정`],
      "인트로 → 과정 → 느낀 점", "오늘 기록 ☺️", "다음 편 보려면 팔로우",
      faceOk ? "보통" : "불가", "1~3시간", platform, "팔로우 전환·댓글 확인"),
    make("짧은 루프형", `"${topic}" 한 장면을 반복 재생되게`,
      [`${topic} 만족 구간`, `계속 보게 되는 ${topic}`, `${topic} ASMR`],
      "강한 비주얼 → 루프 포인트", "소리 추천 🔊", "저장해서 또 보기",
      "보통", "1시간", "Instagram", "재생 반복·시청시간 확인"),
    make("밈 패러디형", `유행 밈 구조에 "${topic}" 대입`,
      [`${topic} 버전 밈`, `${topic} 하는 사람 특`, `${topic} MBTI`],
      "익숙한 밈 틀 → 분야 대입", "공감? ㅋㅋ", "친구 태그",
      "쉬움", "30분", "Instagram", "공유 수 확인 (트렌드 의존 주의)"),
    make("Before/After형", `"${topic}" 전후 변화 비교`,
      [`${topic} 전후 차이`, `이렇게 바뀝니다`, `${topic} 결과 공개`],
      "Before → 과정 요약 → After", "과정 궁금하면 댓글", "방법은 프로필 링크",
      "보통", "1~2시간", platform, "프로필 방문·링크 클릭 확인"),
    make("체크리스트형", `"${topic}" 체크리스트로 정리`,
      [`${topic} 체크리스트 저장하세요`, `${topic} 빠짐없이 점검`, `${topic} 준비물 리스트`],
      "리스트 제목 → 항목 → 저장 유도", "저장 필수 📌", "저장하고 하나씩 체크",
      "쉬움", "30분", "Instagram", "저장 수 확인"),
    make("실수/주의사항형", `"${topic}"에서 흔한 실수 모음`,
      [`${topic} 이거 하면 안 됩니다`, `${topic} 흔한 실수 3`, `나만 몰랐던 ${topic} 함정`],
      "경고 후킹 → 실수 나열 → 대안", "혹시 하고 있었다면 저장", "더 궁금하면 댓글",
      "쉬움", "30~50분", platform, "저장·댓글 반응 확인"),
    make("후기/사례형", `"${topic}" 실제 후기/사례 공유`,
      [`${topic} 해보니 이랬습니다`, `실제 ${topic} 후기`, `${topic} 결과 솔직 리뷰`],
      "기대 → 실제 경험 → 결론", "비슷한 경험 댓글로", c.hasOffer ? `${c.offer} 궁금하면 DM` : "더 보려면 팔로우",
      "보통", "1시간", platform, "신뢰 지표(댓글 질·DM) 확인"),
    make("질문 유도형", `"${topic}"에 대해 시청자에게 질문`,
      [`${topic}, 당신은 어떻게 하세요?`, `${topic} 둘 중 뭐가 맞을까요?`, `${topic} 고민 있나요?`],
      "질문 제시 → 선택지 → 댓글 유도", "당신의 답은? 댓글로", "댓글 달면 다음 콘텐츠에 반영",
      "쉬움", "20~40분", "Threads", "댓글 수 확인"),
  ];

  // 영상 제작 불가면 영상 의존 포맷 후순위로
  if (adv.canMakeVideo === false) {
    return all.sort((a, b) => {
      const videoHeavy = (f: string) => /브이로그|루프|상황극/.test(f);
      return Number(videoHeavy(a.format)) - Number(videoHeavy(b.format));
    });
  }
  return all;
}

// ─────────────────────────────────────────────
// 수익화 동선
// ─────────────────────────────────────────────
export function generateMonetizationFlow(input: AppInput): MonetizationFlow {
  const c = ctx(input);
  const adv = input.advanced || {};
  const conv = c.conv;

  let path: string[];
  if (conv === "DM" || conv === "오픈채팅" || conv === "카카오채널") {
    path = ["콘텐츠 노출", "댓글 참여 유도", `${conv} 연결`, "무료자료/안내 제공", "상담·구매 전환"];
  } else if (conv === "뉴스레터" || c.goal === "커뮤니티 모집") {
    path = ["콘텐츠 노출", "프로필 방문", "고정 게시물로 신뢰 형성", "링크 클릭", "뉴스레터/커뮤니티 가입"];
  } else {
    path = ["콘텐츠 노출", "저장/댓글/공유", "프로필 방문", "하이라이트 확인", "링크 클릭", "신청/구매/문의"];
  }

  return {
    hasModel: c.hasOffer
      ? `연결 대상(${c.offer})이 있어 수익모델의 출발점이 있습니다.`
      : "아직 연결할 상품/서비스가 없어, 무료자료부터 만들어 동선을 확보해야 합니다.",
    contentOfferFit: c.hasOffer
      ? `${c.niche} 콘텐츠와 ${c.offer}의 연관성을 매 콘텐츠에서 한 번씩 상기시키세요.`
      : "콘텐츠 주제와 향후 판매 대상이 이어지도록 지금부터 일관된 주제를 쌓으세요.",
    path,
    profileRole: "3초 안에 '누구를 위한 계정인지 + 다음 행동'을 보여줘야 합니다.",
    linkRole: c.hasOffer
      ? `방문자가 ${c.offer}로 가는 단 하나의 명확한 버튼을 최상단에 두세요.`
      : "무료자료 신청 링크 하나로 시작해 이메일/연락 접점을 모으세요.",
    highlightRole: "후기/자주 묻는 질문/시작 방법을 하이라이트로 고정해 신뢰를 보강하세요.",
    dmCommentRole:
      conv === "DM"
        ? "특정 키워드 댓글 → DM 안내 흐름을 만들어 자연스럽게 1:1로 연결하세요."
        : "댓글 질문에 빠르게 답해 신뢰를 쌓고 필요 시 DM으로 이어가세요.",
    blockers: [
      c.hasOffer ? "콘텐츠와 상품의 연결고리가 안 보임" : "연결할 대상(오퍼)이 없음",
      adv.hasLinkPage === false ? "정리된 링크/판매페이지가 없음" : "링크가 여러 개라 선택을 분산시킴",
      "프로필만 보고 무엇을 하면 되는지 알기 어려움",
      "조회수는 나오지만 저장·프로필 방문 유도 장치가 없음",
    ],
    priorities: [
      "프로필 소개글을 '대상+도움+행동' 공식으로 정리",
      c.hasOffer ? "링크를 단일 목적지로 단순화" : "무료자료 1개 제작 후 링크 연결",
      "전환 콘텐츠를 주 1회 정기 배치",
      "댓글→프로필→링크 동선을 콘텐츠 마무리 멘트로 안내",
    ],
  };
}

// ─────────────────────────────────────────────
// 프로필/링크/하이라이트 개선안
// ─────────────────────────────────────────────
export function generateProfileSuggestions(input: AppInput): ProfileSuggestion {
  const c = ctx(input);
  const adv = input.advanced || {};
  const bio = (adv.profileBio || "").trim();
  const offer = c.hasOffer ? c.offer : "무료자료";

  const problems: string[] = [];
  if (!bio) problems.push("소개글 정보가 없어 방문자가 계정 목적을 파악하기 어렵습니다.");
  else {
    if (!/링크|아래|신청|받기|자료/.test(bio)) problems.push("소개글에 다음 행동(CTA)이 없습니다.");
    if (bio.length > 80) problems.push("소개글이 길어 핵심이 묻힙니다.");
    if (!new RegExp(c.niche).test(bio)) problems.push("소개글에서 분야가 드러나지 않습니다.");
  }
  if (adv.hasLinkPage === false) problems.push("정리된 링크/판매페이지가 없어 전환 지점이 비어 있습니다.");
  if (problems.length === 0) problems.push("큰 문제는 없으나, 한 줄 소개와 링크 문구를 더 뾰족하게 다듬을 수 있습니다.");

  return {
    problems,
    direction: "소개글은 '누구를 위한 계정인지 + 어떤 도움을 주는지 + 어떤 행동을 하면 되는지' 3요소로 정리하세요.",
    bios: [
      `${c.target}를 위한 쉬운 ${c.niche} 팁`,
      `매주 ${c.niche} 정보를 정리합니다`,
      `${c.niche} 막막한 ${c.target}를 돕습니다 · 자료는 아래 링크`,
      `${c.niche} 초보 → 능숙까지 함께`,
      `${c.niche} 핵심만 골라드려요 | ${offer} 아래 링크`,
    ],
    linkButtons: [
      `${offer} 받기`,
      `무료로 시작하기`,
      `${c.niche} 자료 보기`,
      c.hasOffer ? `${c.offer} 자세히` : "지금 신청하기",
      "프로필 안내 보기",
    ],
    highlights: [
      "시작하기 (이 계정 200% 활용법)",
      "자주 묻는 질문",
      "후기/사례",
      c.hasOffer ? `${c.offer} 안내` : "무료자료 안내",
      "공지/이벤트",
    ],
    pinnedPosts: [
      `이 계정은 ${c.target}를 위한 ${c.niche} 계정입니다 (소개)`,
      `${c.niche} 입문 핵심 정리 (대표 정보 콘텐츠)`,
      c.hasOffer ? `${c.offer} 한눈에 보기 (전환 콘텐츠)` : "무료자료 받는 법 (전환 콘텐츠)",
    ],
    coreMessage: `이 계정을 보면 ${c.target}가 ${c.niche}에서 무엇을 얻는지 한 문장으로 전달되어야 합니다.`,
    followBooster: `"매주 ${c.niche} 정보를 놓치지 않으려면 팔로우" 처럼 팔로우 이유를 명시하세요.`,
  };
}

// ─────────────────────────────────────────────
// 14일/30일 콘텐츠 플랜
// ─────────────────────────────────────────────
export function generateContentCalendar(input: AppInput, days: 14 | 30): CalendarItem[] {
  const c = ctx(input);
  const experiments = generateExperimentPlan(input);
  const layers = ["유입", "신뢰", "관계", "전환"];
  const adv = input.advanced || {};
  const platform = adv.preferredPlatform || "Instagram";
  const topic = adv.recentTopics?.[0]?.trim() || `${c.niche} 핵심 주제`;

  const items: CalendarItem[] = [];
  for (let d = 1; d <= days; d++) {
    // 14일: 다양한 포맷 실험 중심. 30일: 실험→반복→전환 배치.
    let exp: FormatExperiment;
    let layer: string;

    if (days === 14) {
      exp = experiments[(d - 1) % experiments.length];
      layer = layers[(d - 1) % layers.length];
    } else {
      // 30일: 1주 실험 다양화 → 2~3주 잘된 포맷 반복 → 매주 전환 1회
      if (d % 7 === 0) {
        exp = experiments.find((e) => e.format === "Before/After형") || experiments[7];
        layer = "전환";
      } else if (d <= 7) {
        exp = experiments[(d - 1) % experiments.length];
        layer = layers[(d - 1) % 3]; // 유입/신뢰/관계 위주
      } else {
        // 검증 단계: 앞서 나온 포맷 반복
        exp = experiments[(d % 4)];
        layer = layers[(d - 1) % layers.length];
      }
    }

    const goalMetric =
      layer === "유입" ? "도달/시청 시간" :
      layer === "신뢰" ? "저장 수" :
      layer === "관계" ? "댓글 수" : "프로필 방문/링크 클릭";

    items.push({
      day: d,
      date: `D+${d}`,
      title: `${topic} · ${exp.format}`,
      contentType:
        layer === "유입" ? "재미/정보" :
        layer === "신뢰" ? "정보" :
        layer === "관계" ? "이야기/공감" : "전환",
      format: exp.format,
      platform: exp.bestPlatform === "Threads" && platform !== "Threads" ? platform : exp.bestPlatform,
      hook: exp.hooks[0],
      flow: exp.flow,
      cta: layer === "전환" ? (c.hasOffer ? `${c.offer} 안내 (${c.conv === "아직 없음" ? "프로필 링크" : c.conv})` : "무료자료 신청 안내") : exp.cta,
      difficulty: exp.difficulty,
      estTime: exp.estTime,
      goalMetric: `${goalMetric} (전환 동선과 함께 보기)`,
      benchmarkPoint: `같은 ${layer} 콘텐츠 중 저장/댓글이 반복적으로 잘되는 사례의 후킹·CTA 참고`,
    });
  }
  return items;
}
