// 벤치마킹 분석 + 찾기 도우미.
// MVP는 사용자가 붙여넣은 텍스트/설명 기반 rule-based 분석.
// 추후 fetchUrlMetadata / runOcr / runVision 자리에 실제 API를 연결한다.

import type {
  AppInput,
  BenchmarkSource,
  BenchmarkAnalysis,
  BenchmarkFinder,
} from "./types";
import { BENCHMARK_SOURCE_LABELS } from "./constants";

// ── 추후 확장 지점 (지금은 스텁) ──────────────
// 합법/공개 범위에서만 동작하도록 설계. 로그인 우회·비공개 접근·약관 위반 크롤링은 하지 않는다.
export async function fetchUrlMetadata(_url: string): Promise<{ title?: string; description?: string }> {
  // TODO: oEmbed / 공식 API / public metadata fetch 연결 예정
  return {};
}
export async function runOcr(_file: File): Promise<string> {
  // TODO: OCR API 연결 예정 (스크린샷 → 텍스트)
  return "";
}
export async function runVision(_file: File): Promise<string> {
  // TODO: Vision API 연결 예정 (스크린샷 구조 분석)
  return "";
}

// 텍스트에서 감정 신호를 추정 (아주 단순한 키워드 매칭 — 추후 LLM으로 교체)
function detectEmotions(text: string): string[] {
  const t = text.toLowerCase();
  const map: Record<string, RegExp> = {
    공감: /나만|우리|그쵸|진짜|현실|ㅋㅋ|ㅠ/,
    놀람: /충격|반전|이럴수가|대박|몰랐/,
    정보: /방법|정리|팁|이유|단계|체크|리스트/,
    욕망: /돈|수익|성공|결과|변화|얻는/,
    불안: /실수|위험|놓치|안 하면|주의|함정/,
    재미: /웃긴|밈|패러디|ㅋ|드립/,
    호기심: /\?|왜|뭐|어떻게|비밀|아무도/,
    신뢰: /후기|사례|검증|경험|실제|데이터/,
  };
  const found = Object.entries(map).filter(([, re]) => re.test(t)).map(([k]) => k);
  return found.length ? found : ["정보", "호기심"];
}

// 하나의 벤치마킹 소스를 분석
export function analyzeBenchmarkSource(source: BenchmarkSource, input: AppInput): BenchmarkAnalysis {
  const niche = input.niche.trim() || "내 분야";
  const text = `${source.value} ${source.note || ""}`.trim();
  const label = BENCHMARK_SOURCE_LABELS[source.type] || "자료";
  const hasText = text.length > 0;
  const emotions = hasText ? detectEmotions(text) : ["호기심", "정보"];

  // URL/계정 아이디만 있고 설명이 없으면 분석 한계를 명시
  const thin =
    (source.type === "url" || source.type === "account_id") &&
    !(source.note && source.note.trim());

  const firstLine = hasText ? text.split(/[.\n]/)[0].slice(0, 40) : "";

  return {
    sourceLabel: `${label}${source.value ? ` · ${source.value.slice(0, 40)}` : ""}`,
    topic: thin
      ? "설명/캡션이 없어 주제 추정에 한계가 있습니다. 캡션이나 한 줄 설명을 추가해 주세요."
      : `붙여넣은 내용 기준 주제: "${firstLine || niche + " 관련"}"`,
    audience: `${niche}에 관심 있는 사람, 특히 입력하신 타깃(${input.target || "미입력"})과 겹칠 가능성`,
    hook: hasText
      ? `첫 문장 "${firstLine}" 형태의 후킹 — 이런 식이면 호기심/문제 제기형 후킹입니다.`
      : "후킹을 분석하려면 첫 문장/첫 장면 설명이 필요합니다.",
    thumbnail: thin
      ? "표지 분석은 스크린샷 또는 표지 문구 설명이 있어야 가능합니다."
      : "표지에 핵심 단어 + 대비 강한 색이 쓰였는지 확인하세요.",
    firstSceneStrength: hasText
      ? "첫 장면이 '문제/질문/숫자' 중 하나로 시작하면 강합니다."
      : "첫 장면 정보가 부족합니다.",
    flow: "도입(후킹) → 본문(핵심/전개) → 마무리(CTA) 구조인지 단계별로 끊어 보세요.",
    emotions,
    saveTrigger: "정리/체크리스트/'나중에 볼 정보'가 있으면 저장이 유도됩니다.",
    commentTrigger: "질문·선택지·공감 포인트가 있으면 댓글이 유도됩니다.",
    shareTrigger: "'이거 너지' 식 태그 유도나 강한 공감이 있으면 공유가 일어납니다.",
    profileVisitTrigger: "더 보고 싶게 만드는 예고나 '프로필에서 ○○' 안내가 방문을 유도합니다.",
    cta: hasText && /링크|저장|댓글|팔로우|dm|디엠|신청/i.test(text)
      ? "명시적 CTA가 보입니다. 어떤 행동을 요청하는지 확인하세요."
      : "CTA가 약하거나 안 보입니다 — 어떤 행동을 유도하는지 체크하세요.",
    repeatable: "이 구조를 매주 다른 주제로 반복 제작할 수 있는지가 핵심입니다.",
    safeToCopy: "구조(후킹 방식, 흐름, CTA 위치)는 참고해도 됩니다.",
    riskyToCopy: "영상·문구·디자인·음악을 그대로 복제하면 표절/저작권 문제가 됩니다.",
    variations: [
      `${niche} 버전으로 같은 후킹 틀만 가져와 주제 교체`,
      `${niche} 초보용으로 난이도를 낮춘 변형`,
      `${niche} 흔한 실수 관점으로 각도 변경`,
      `${niche} 후기/사례 형식으로 신뢰형 변형`,
      `${niche} 체크리스트 형식으로 저장 유도형 변형`,
    ],
  };
}

export function analyzeBenchmark(input: AppInput): BenchmarkAnalysis[] {
  const sources = input.benchmarkSources.filter((s) => s.value.trim() || (s.note && s.note.trim()));
  return sources.map((s) => analyzeBenchmarkSource(s, input));
}

// 벤치마킹 찾기 도우미 (자료가 없어도 동작)
export function generateBenchmarkFinder(input: AppInput): BenchmarkFinder {
  const n = input.niche.trim() || "내 분야";
  const t = input.target.trim() || "타깃";
  return {
    keywords: [
      `${n} 초보`, `${n} 팁`, `${n} 정리`, `${n} 추천`, `${n} 실수`,
      `${n} 후기`, `${n} 방법`, `${n} 입문`, `${n} 체크리스트`, `${n} ${t}`,
    ],
    hashtags: [
      `#${n}`, `#${n}스타그램`, `#${n}팁`, `#${n}정보`, `#${n}추천`,
      `#${n}초보`, `#${n}일상`, `#${n}기록`, `#${n}공부`, `#${n}꿀팁`,
    ],
    contentTypes: [
      "여러 콘텐츠가 반복적으로 잘되는 정보형 계정",
      "저장이 많이 유도되는 체크리스트/정리형 콘텐츠",
      "댓글이 활발한 공감/질문형 콘텐츠",
      "전후 비교(Before/After)로 전환을 유도하는 콘텐츠",
      "내가 실제 제작 가능한 단순 포맷의 콘텐츠",
    ],
    accountTypes: [
      `같은 ${n} 분야의 중소형 계정 (포맷이 명확)`,
      "다른 분야지만 포맷이 뛰어난 계정 (구조만 참고)",
      "전환(판매/신청) 동선이 잘 설계된 계정",
      "꾸준히 같은 포맷을 반복하는 계정",
    ],
    selectionCriteria: [
      "한두 개만 터진 계정보다, 여러 콘텐츠가 반복적으로 잘되는 계정",
      "조회수만 높은 콘텐츠보다 저장/댓글/공유가 유도되는 콘텐츠",
      "내가 실제로 제작 가능한 포맷인지",
      "내 판매/전환 목표와 연결 가능한 포맷인지",
      "주제는 비슷하지만 표현 방식은 변형 가능한 포맷인지",
    ],
  };
}

// 인스타 릴스 기준 벤치마킹 분석 템플릿(빈 행) — 사용자가 채워 넣는 표
export interface ReelsBenchmarkRow {
  account: string;
  url: string;
  views: string;
  likes: string;
  comments: string;
  savesEst: string;
  formatType: string;
  coverStyle: string;
  hook3s: string;
  captionStyle: string;
  editTempo: string;
  audio: string;
  endingCta: string;
  repeatability: string;
  applyIdea: string;
}

export function emptyReelsRow(): ReelsBenchmarkRow {
  return {
    account: "", url: "", views: "", likes: "", comments: "", savesEst: "",
    formatType: "", coverStyle: "", hook3s: "", captionStyle: "", editTempo: "",
    audio: "", endingCta: "", repeatability: "", applyIdea: "",
  };
}
