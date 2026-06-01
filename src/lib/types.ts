// 앱 전역에서 쓰는 데이터 타입 정의.
// 입력/출력 구조는 요구사항의 데이터 구조 예시를 따른다.

export type BenchmarkSourceType =
  | "url"
  | "manual_text"
  | "screenshot"
  | "account_id"
  | "caption_script"
  | "csv_import";

export interface BenchmarkSource {
  type: BenchmarkSourceType;
  value: string; // URL, 아이디, 붙여넣은 텍스트, 파일명 등
  note?: string; // URL일 때 사용자가 덧붙인 설명/캡션
}

export interface AdvancedInput {
  followerCount?: number;
  profileBio?: string;
  recentTopics?: string[]; // 최근 콘텐츠 주제 3개
  preferredPlatform?: string;
  canShowFace?: boolean;
  canMakeVideo?: boolean;
  weeklyTime?: string; // 주당 제작 가능 시간
  hasLinkPage?: boolean;
  bestContent?: string;
  worstContent?: string;
}

export interface AppInput {
  niche: string;
  goal: string;
  target: string;
  offer: string;
  conversionPath: string;
  benchmarkSources: BenchmarkSource[];
  advanced?: AdvancedInput;
}

export interface ScoreItem {
  key: string;
  label: string;
  score: number; // 0-100 (전략 수립용 추정 점수)
  reason: string;
  improve: string;
  applyExample: string;
}

export interface Concept {
  name: string;
  oneLiner: string;
  forWhom: string;
  followReason: string;
  mainContentType: string;
  monetization: string;
  pros: string;
  cons: string;
  score: number; // 추천 점수
}

export interface PlatformRec {
  platform: string;
  fit: number; // 0-100
  reason: string;
}

export interface BenchmarkAnalysis {
  sourceLabel: string;
  topic: string;
  audience: string;
  hook: string;
  thumbnail: string;
  firstSceneStrength: string;
  flow: string;
  emotions: string[];
  saveTrigger: string;
  commentTrigger: string;
  shareTrigger: string;
  profileVisitTrigger: string;
  cta: string;
  repeatable: string;
  safeToCopy: string;
  riskyToCopy: string;
  variations: string[]; // 내 분야 변형 아이디어 5개
}

export interface ContentTypeBlock {
  type: string; // 재미/정보/이야기/공감
  purpose: string;
  structure: string;
  titles: string[];
  cta: string;
  monetizationCaution: string;
}

export interface ContentLayer {
  layer: string; // 유입/신뢰/관계/전환
  description: string;
  ideas: string[];
}

export interface FormatExperiment {
  format: string;
  description: string;
  hooks: string[]; // 첫 3초 후킹 3개
  flow: string;
  captionExample: string;
  cta: string;
  difficulty: string;
  estTime: string;
  bestPlatform: string;
  validation: string;
}

export interface MonetizationFlow {
  hasModel: string;
  contentOfferFit: string;
  path: string[]; // 동선 단계
  profileRole: string;
  linkRole: string;
  highlightRole: string;
  dmCommentRole: string;
  blockers: string[];
  priorities: string[];
}

export interface ProfileSuggestion {
  problems: string[];
  direction: string;
  bios: string[]; // 한 줄 소개 5개
  linkButtons: string[]; // 링크 버튼 문구 5개
  highlights: string[];
  pinnedPosts: string[];
  coreMessage: string;
  followBooster: string;
}

export interface CalendarItem {
  day: number;
  date: string; // 상대 표기: D+1 등
  title: string;
  contentType: string;
  format: string;
  platform: string;
  hook: string;
  flow: string;
  cta: string;
  difficulty: string;
  estTime: string;
  goalMetric: string;
  benchmarkPoint: string;
}

export interface AIPrompt {
  name: string;
  prompt: string;
}

export interface BenchmarkFinder {
  keywords: string[];
  hashtags: string[];
  contentTypes: string[];
  accountTypes: string[];
  selectionCriteria: string[];
}

export interface AppOutput {
  summary: {
    direction: string;
    target: string;
    followReason: string;
    note: string;
  };
  scores: ScoreItem[];
  concepts: Concept[];
  platformRecommendation: PlatformRec[];
  benchmarkAnalysis: BenchmarkAnalysis[];
  benchmarkFinder: BenchmarkFinder;
  contentMatrix: ContentTypeBlock[];
  contentLayers: ContentLayer[];
  experimentPlan: FormatExperiment[];
  monetizationFlow: MonetizationFlow;
  profileSuggestions: ProfileSuggestion;
  calendar: CalendarItem[];
  aiPrompts: AIPrompt[];
  checklist: string[];
  reportMarkdown: string;
}

// 성공 포맷 검증 로직용
export interface PerformanceInput {
  title: string;
  format: string;
  platform: string;
  views: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  profileVisits: number;
  linkClicks: number;
  dms: number;
  sales: number;
}

export interface PerformanceResult {
  reachSuccess: boolean;
  saveSuccess: boolean;
  commentSuccess: boolean;
  conversionSuccess: boolean;
  repeat: string;
  nextIdeas: string[];
  fixSuggestions: string[];
  verdict: string;
}
