// 콘텐츠 서치 API 어댑터.
// - YouTube: Google Data API v3 (공식, 무료, 하루 1만 쿼리)
// - Instagram: RapidAPI 기반 (사용자 본인 API 키 필요)
//
// ⚠️ 비공개 계정 접근·로그인 우회·약관 위반 크롤링은 구현하지 않습니다.
// ⚠️ 모든 요청은 사용자가 직접 발급한 API 키로만 이루어집니다.

// ─────────────────────────────────────────────
// 공통 타입
// ─────────────────────────────────────────────
export interface SearchResult {
  id: string;
  platform: "youtube" | "instagram";
  title: string;
  description: string;
  thumbnailUrl: string;
  postUrl: string;
  authorName: string;
  authorHandle: string;
  likes: number;
  views: number;
  comments: number;
  publishedAt: string;
  hashtags: string[];
  duration?: string; // YouTube 전용
}

export interface SearchConfig {
  keyword: string;
  minLikes: number;
  maxResults: number; // 페이지당 최대
  platforms: ("youtube" | "instagram")[];
}

export interface ApiKeys {
  youtubeApiKey: string;
  rapidApiKey: string;
  // RapidAPI 인스타그램 제공자 설정
  // 권장: https://rapidapi.com 에서 "Instagram Scraper" 또는 "Instagram Data" 검색
  // 무료 티어가 있는 주요 API:
  //   - instagram-scraper-api2.p.rapidapi.com (Instagram Scraper API2)
  //   - instagram-data.p.rapidapi.com
  rapidApiInstagramHost: string; // 예: "instagram-scraper-api2.p.rapidapi.com"
}

// ─────────────────────────────────────────────
// API 키 localStorage 저장/로드
// ─────────────────────────────────────────────
const KEYS_STORAGE_KEY = "sgh.apikeys.v1";

export function saveApiKeys(keys: Partial<ApiKeys>) {
  try {
    const prev = loadApiKeys();
    localStorage.setItem(KEYS_STORAGE_KEY, JSON.stringify({ ...prev, ...keys }));
  } catch { /* 무시 */ }
}

export function loadApiKeys(): ApiKeys {
  try {
    const raw = localStorage.getItem(KEYS_STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ApiKeys;
  } catch { /* 무시 */ }
  return { youtubeApiKey: "", rapidApiKey: "", rapidApiInstagramHost: "instagram-scraper-api2.p.rapidapi.com" };
}

// ─────────────────────────────────────────────
// 저장된 서치 결과 localStorage
// ─────────────────────────────────────────────
const SAVED_KEY = "sgh.saved_searches.v1";

export function loadSavedResults(): SearchResult[] {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? (JSON.parse(raw) as SearchResult[]) : [];
  } catch { return []; }
}

export function saveResult(r: SearchResult) {
  const prev = loadSavedResults();
  if (prev.find((x) => x.id === r.id)) return; // 중복 제외
  try { localStorage.setItem(SAVED_KEY, JSON.stringify([r, ...prev].slice(0, 200))); } catch { /* 무시 */ }
}

export function removeSavedResult(id: string) {
  const prev = loadSavedResults().filter((x) => x.id !== id);
  try { localStorage.setItem(SAVED_KEY, JSON.stringify(prev)); } catch { /* 무시 */ }
}

// ─────────────────────────────────────────────
// YouTube Shorts 검색 (Google Data API v3)
// 공식 문서: https://developers.google.com/youtube/v3/docs/search/list
//
// API 키 발급 방법:
//  1. https://console.cloud.google.com → 새 프로젝트 생성
//  2. YouTube Data API v3 사용 설정
//  3. 사용자 인증 정보 → API 키 생성
//  무료 한도: 하루 10,000 quota units (검색 1회 = 100 units)
// ─────────────────────────────────────────────
export async function searchYouTubeShorts(
  keyword: string,
  apiKey: string,
  minLikes: number = 1000,
  maxResults: number = 20
): Promise<SearchResult[]> {
  if (!apiKey.trim()) throw new Error("YouTube API 키가 없습니다. 설정에서 입력해 주세요.");

  // 1단계: 키워드로 쇼츠 검색 (videoDuration=short → 4분 이하 영상)
  const searchParams = new URLSearchParams({
    part: "snippet",
    q: `${keyword} #shorts`,
    type: "video",
    videoDuration: "short",
    order: "viewCount",
    maxResults: String(Math.min(50, maxResults * 3)), // 필터 후 maxResults 맞추려고 여유있게 요청
    key: apiKey,
    relevanceLanguage: "ko",
  });

  const searchRes = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${searchParams}`
  );
  if (!searchRes.ok) {
    const err = await searchRes.json().catch(() => ({}));
    throw new Error(
      `YouTube 검색 오류 (${searchRes.status}): ${(err as { error?: { message?: string } }).error?.message || "알 수 없는 오류"}`
    );
  }
  const searchData = await searchRes.json() as {
    items?: Array<{ id: { videoId: string }; snippet: { title: string; description: string; thumbnails: { medium?: { url: string }; default?: { url: string } }; channelTitle: string; channelId: string; publishedAt: string } }>;
  };
  const items = searchData.items || [];
  if (items.length === 0) return [];

  // 2단계: 좋아요 수·조회수 조회 (videos.list)
  const videoIds = items.map((i) => i.id.videoId).join(",");
  const statsParams = new URLSearchParams({
    part: "statistics,contentDetails",
    id: videoIds,
    key: apiKey,
  });

  const statsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${statsParams}`
  );
  if (!statsRes.ok) throw new Error(`YouTube 통계 조회 오류 (${statsRes.status})`);
  const statsData = await statsRes.json() as {
    items?: Array<{ id: string; statistics: { likeCount?: string; viewCount?: string; commentCount?: string }; contentDetails: { duration: string } }>;
  };
  const statsMap = new Map(
    (statsData.items || []).map((v) => [v.id, { stats: v.statistics, details: v.contentDetails }])
  );

  // 3단계: 조합 + 필터
  const results: SearchResult[] = [];
  for (const item of items) {
    const vid = item.id.videoId;
    const stat = statsMap.get(vid);
    const likes = parseInt(stat?.stats.likeCount || "0", 10);
    const views = parseInt(stat?.stats.viewCount || "0", 10);
    const comments = parseInt(stat?.stats.commentCount || "0", 10);

    if (likes < minLikes) continue; // 최소 좋아요 필터

    results.push({
      id: `yt_${vid}`,
      platform: "youtube",
      title: item.snippet.title,
      description: item.snippet.description.slice(0, 300),
      thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url || "",
      postUrl: `https://www.youtube.com/shorts/${vid}`,
      authorName: item.snippet.channelTitle,
      authorHandle: item.snippet.channelId,
      likes,
      views,
      comments,
      publishedAt: item.snippet.publishedAt,
      hashtags: extractHashtags(item.snippet.description),
      duration: stat?.details.duration || "",
    });
    if (results.length >= maxResults) break;
  }
  return results;
}

// ─────────────────────────────────────────────
// Instagram Reels 검색 (RapidAPI 기반)
//
// 권장 API: Instagram Scraper API2 (무료 티어 100 req/월)
//   → https://rapidapi.com/mrpmohiburrahman/api/instagram-scraper-api2
//   엔드포인트: GET /v1/hashtag?hashtag={tag}
//
// 다른 옵션: "Instagram Data API", "Instagram Scraper" 등
//   → host만 바꾸면 어댑터가 동작하도록 설계
//
// ⚠️ RapidAPI 제공자가 데이터를 수집하는 방식은 각 제공자 정책에 따릅니다.
//    공개 게시물 정보만 조회하며, 비공개 계정은 접근하지 않습니다.
// ─────────────────────────────────────────────
export async function searchInstagramReels(
  hashtag: string,
  rapidApiKey: string,
  rapidApiHost: string,
  minLikes: number = 1000,
  maxResults: number = 20
): Promise<SearchResult[]> {
  if (!rapidApiKey.trim()) throw new Error("RapidAPI 키가 없습니다. 설정에서 입력해 주세요.");

  // 해시태그에서 # 제거
  const tag = hashtag.replace(/^#/, "").trim();

  const url = `https://${rapidApiHost}/v1/hashtag?hashtag=${encodeURIComponent(tag)}`;
  const res = await fetch(url, {
    headers: {
      "x-rapidapi-key": rapidApiKey,
      "x-rapidapi-host": rapidApiHost,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      `Instagram API 오류 (${res.status}): ${JSON.stringify(err).slice(0, 200)}\n` +
        "RapidAPI 키와 호스트 설정을 확인해 주세요."
    );
  }

  const data = await res.json() as {
    data?: {
      top?: { sections?: InstagramSection[] };
      recent?: { sections?: InstagramSection[] };
    };
  };

  // 다양한 API 응답 구조를 파싱하는 범용 파서
  const posts = parseInstagramResponse(data);

  return posts
    .filter((p) => p.likes >= minLikes)
    .slice(0, maxResults);
}

// RapidAPI Instagram 응답 파싱 (API 제공자마다 구조가 다름 → 범용 처리)
interface InstagramSection {
  layout_content?: { medias?: InstagramMediaWrapper[] };
}
interface InstagramMediaWrapper {
  media?: InstagramMedia;
}
interface InstagramMedia {
  pk?: string;
  id?: string;
  like_count?: number;
  view_count?: number;
  comment_count?: number;
  caption?: { text?: string };
  user?: { username?: string; full_name?: string };
  taken_at?: number;
  image_versions2?: { candidates?: Array<{ url: string }> };
  video_url?: string;
  code?: string;
}

function parseInstagramResponse(data: unknown): SearchResult[] {
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  function processMedia(m: InstagramMedia) {
    const id = String(m.pk || m.id || "");
    if (!id || seen.has(id)) return;
    seen.add(id);

    const likes = m.like_count || 0;
    const code = m.code || id;
    results.push({
      id: `ig_${id}`,
      platform: "instagram",
      title: (m.caption?.text || "").slice(0, 100) || `인스타 게시물 ${id.slice(0, 8)}`,
      description: (m.caption?.text || "").slice(0, 300),
      thumbnailUrl: m.image_versions2?.candidates?.[0]?.url || "",
      postUrl: `https://www.instagram.com/reel/${code}/`,
      authorName: m.user?.full_name || m.user?.username || "알 수 없음",
      authorHandle: m.user?.username || "",
      likes,
      views: m.view_count || 0,
      comments: m.comment_count || 0,
      publishedAt: m.taken_at ? new Date(m.taken_at * 1000).toISOString() : "",
      hashtags: extractHashtags(m.caption?.text || ""),
    });
  }

  // 트리 순회로 미디어 추출
  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;
    const obj = node as Record<string, unknown>;

    // 직접 미디어 객체인지 확인
    if (typeof obj.pk === "string" || typeof obj.pk === "number") {
      processMedia(obj as InstagramMedia);
      return;
    }
    // sections → medias 구조
    if (Array.isArray(obj.sections)) {
      for (const sec of obj.sections as InstagramSection[]) {
        for (const mw of sec.layout_content?.medias || []) {
          if (mw.media) processMedia(mw.media);
        }
      }
    }
    // 재귀
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") walk(v);
    }
  }
  walk(data);

  return results.sort((a, b) => b.likes - a.likes);
}

// 해시태그 추출 헬퍼
function extractHashtags(text: string): string[] {
  return (text.match(/#[\w가-힣]+/g) || []).slice(0, 10);
}

// ─────────────────────────────────────────────
// 통합 검색 (여러 플랫폼 병렬 실행)
// ─────────────────────────────────────────────
export interface SearchError { platform: string; message: string; }

export async function searchContent(
  config: SearchConfig,
  keys: ApiKeys
): Promise<{ results: SearchResult[]; errors: SearchError[] }> {
  const results: SearchResult[] = [];
  const errors: SearchError[] = [];

  await Promise.allSettled(
    config.platforms.map(async (platform) => {
      try {
        if (platform === "youtube") {
          const r = await searchYouTubeShorts(config.keyword, keys.youtubeApiKey, config.minLikes, config.maxResults);
          results.push(...r);
        } else if (platform === "instagram") {
          const r = await searchInstagramReels(
            config.keyword, keys.rapidApiKey, keys.rapidApiInstagramHost,
            config.minLikes, config.maxResults
          );
          results.push(...r);
        }
      } catch (e) {
        errors.push({ platform, message: String((e as Error).message) });
      }
    })
  );

  // 좋아요 내림차순 정렬
  results.sort((a, b) => b.likes - a.likes);
  return { results, errors };
}
