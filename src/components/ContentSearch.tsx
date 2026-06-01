import { useEffect, useState } from "react";
import type { SearchResult, ApiKeys } from "../lib/searchApi";
import {
  loadApiKeys, saveApiKeys, searchContent,
  loadSavedResults, saveResult, removeSavedResult,
} from "../lib/searchApi";
import type { BenchmarkSource } from "../lib/types";
import { Button, Card, Collapse, CopyButton, Label, Pill, SectionTitle, Tag, TextInput } from "./ui";

const PLATFORM_INFO = {
  youtube: {
    label: "YouTube Shorts",
    color: "bg-red-500",
    keyLabel: "Google API 키",
    guide: `발급 방법:
1. https://console.cloud.google.com 접속 → 프로젝트 생성
2. 라이브러리 → "YouTube Data API v3" 사용 설정
3. 사용자 인증 정보 → "+ 사용자 인증 정보 만들기" → API 키
★ 무료 한도: 하루 10,000 units (검색 1회 ≈ 100 units)`,
  },
  instagram: {
    label: "Instagram Reels",
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    keyLabel: "RapidAPI 키",
    guide: `발급 방법:
1. https://rapidapi.com 가입 → 무료 플랜 선택
2. "Instagram Scraper API2" 검색 → Subscribe (무료 티어: 100 req/월)
   URL: rapidapi.com/mrpmohiburrahman/api/instagram-scraper-api2
3. API Keys 탭에서 X-RapidAPI-Key 복사

⚠️ RapidAPI 인스타그램 API는 공개 게시물만 조회합니다.
   비공개 계정·로그인 우회는 지원하지 않습니다.`,
  },
};

// 기본 minLikes 옵션
const MIN_LIKES_OPTIONS = [500, 1000, 5000, 10000];

interface Props {
  onAddToBenchmark?: (sources: BenchmarkSource[]) => void;
}

export default function ContentSearch({ onAddToBenchmark }: Props) {
  const [keys, setKeys] = useState<ApiKeys>(loadApiKeys);
  const [keyword, setKeyword] = useState("");
  const [minLikes, setMinLikes] = useState(1000);
  const [platforms, setPlatforms] = useState<("youtube" | "instagram")[]>(["youtube"]);
  const [maxResults, setMaxResults] = useState(10);

  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [errors, setErrors] = useState<Array<{ platform: string; message: string }>>([]);

  const [saved, setSaved] = useState<SearchResult[]>(loadSavedResults);
  const [tab, setTab] = useState<"search" | "saved">("search");
  const [showKeySettings, setShowKeySettings] = useState(false);

  // API 키 저장
  const updateKey = (patch: Partial<ApiKeys>) => {
    setKeys((k) => {
      const next = { ...k, ...patch };
      saveApiKeys(next);
      return next;
    });
  };

  const togglePlatform = (p: "youtube" | "instagram") => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const hasKeyForPlatform = (p: "youtube" | "instagram") =>
    p === "youtube" ? !!keys.youtubeApiKey.trim() : !!keys.rapidApiKey.trim();

  const canSearch = keyword.trim().length > 0 && platforms.length > 0;

  const doSearch = async () => {
    if (!canSearch) return;
    // 키 없는 플랫폼 경고
    const missingKey = platforms.filter((p) => !hasKeyForPlatform(p));
    if (missingKey.length > 0) {
      alert(`${missingKey.map((p) => PLATFORM_INFO[p].label).join(", ")}의 API 키를 먼저 입력해 주세요.`);
      setShowKeySettings(true);
      return;
    }
    setStatus("loading");
    setResults([]);
    setErrors([]);
    try {
      const r = await searchContent({ keyword, minLikes, maxResults, platforms }, keys);
      setResults(r.results);
      setErrors(r.errors);
    } catch (e) {
      setErrors([{ platform: "general", message: String((e as Error).message) }]);
    }
    setStatus("done");
  };

  const handleSave = (r: SearchResult) => {
    saveResult(r);
    setSaved(loadSavedResults());
  };
  const handleRemove = (id: string) => {
    removeSavedResult(id);
    setSaved(loadSavedResults());
  };

  const addAllToAnalysis = (items: SearchResult[]) => {
    if (!onAddToBenchmark) return;
    const sources: BenchmarkSource[] = items.map((r) => ({
      type: r.platform === "youtube" ? "url" : "url",
      value: r.postUrl,
      note: `[${r.platform === "youtube" ? "YouTube" : "Instagram"}] ${r.title} | 좋아요 ${r.likes.toLocaleString()} | @${r.authorHandle}`,
    }));
    onAddToBenchmark(sources);
    alert(`${sources.length}개 콘텐츠를 벤치마킹 분석에 추가했습니다. 결과 페이지에서 분석을 실행하세요.`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">인기 콘텐츠 서치</h2>
          <p className="text-sm text-slate-500">키워드로 인기 영상을 찾아 저장하고 벤치마킹에 활용하세요</p>
        </div>
        <Button variant="outline" onClick={() => setShowKeySettings((s) => !s)} className="!py-1.5 text-xs">
          🔑 API 키 설정
        </Button>
      </div>

      {/* API 키 설정 패널 */}
      {showKeySettings && (
        <Card className="mb-5 border-brand-200 bg-brand-50">
          <SectionTitle sub="각 플랫폼별 API 키를 입력하세요 (브라우저에만 저장됩니다)">API 키 설정</SectionTitle>
          <div className="space-y-5">
            {(["youtube", "instagram"] as const).map((p) => (
              <div key={p}>
                <div className="mb-2 flex items-center gap-2">
                  <span className={`inline-block h-3 w-3 rounded-full ${PLATFORM_INFO[p].color}`} />
                  <span className="font-semibold text-slate-800">{PLATFORM_INFO[p].label}</span>
                </div>
                <Label>{PLATFORM_INFO[p].keyLabel}</Label>
                <TextInput
                  type="password"
                  placeholder={p === "youtube" ? "AIzaSy..." : "RapidAPI Key..."}
                  value={p === "youtube" ? keys.youtubeApiKey : keys.rapidApiKey}
                  onChange={(e) =>
                    updateKey(p === "youtube" ? { youtubeApiKey: e.target.value } : { rapidApiKey: e.target.value })
                  }
                />
                {p === "instagram" && (
                  <div className="mt-2">
                    <Label hint="(기본값 사용 권장)">RapidAPI 호스트</Label>
                    <TextInput
                      value={keys.rapidApiInstagramHost}
                      onChange={(e) => updateKey({ rapidApiInstagramHost: e.target.value })}
                    />
                  </div>
                )}
                <Collapse title={`${PLATFORM_INFO[p].label} API 키 발급 방법`} defaultOpen={false}>
                  <pre className="whitespace-pre-wrap text-xs text-slate-600">{PLATFORM_INFO[p].guide}</pre>
                </Collapse>
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => setShowKeySettings(false)} className="mt-3 !py-1.5 text-xs">
            설정 닫기
          </Button>
        </Card>
      )}

      {/* 탭 */}
      <div className="mb-4 flex gap-2">
        <Pill active={tab === "search"} onClick={() => setTab("search")}>검색하기</Pill>
        <Pill active={tab === "saved"} onClick={() => setTab("saved")}>
          저장된 콘텐츠 {saved.length > 0 && `(${saved.length})`}
        </Pill>
      </div>

      {tab === "search" && (
        <>
          {/* 검색 설정 */}
          <Card className="mb-4">
            <div className="flex flex-col gap-4">
              <div>
                <Label hint="(필수)">키워드 검색</Label>
                <div className="flex gap-2">
                  <TextInput
                    placeholder="예: 홈카페, 라떼아트, 다이어트 식단 ..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doSearch()}
                    className="flex-1"
                  />
                  <Button
                    onClick={doSearch}
                    className={!canSearch || status === "loading" ? "opacity-50" : ""}
                  >
                    {status === "loading" ? "검색 중…" : "검색"}
                  </Button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div>
                  <Label>최소 좋아요 수</Label>
                  <div className="flex gap-1.5">
                    {MIN_LIKES_OPTIONS.map((n) => (
                      <Pill key={n} active={minLikes === n} onClick={() => setMinLikes(n)}>
                        {n.toLocaleString()}+
                      </Pill>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>플랫폼</Label>
                  <div className="flex gap-1.5">
                    {(["youtube", "instagram"] as const).map((p) => (
                      <Pill key={p} active={platforms.includes(p)} onClick={() => togglePlatform(p)}>
                        {p === "youtube" ? "YouTube Shorts" : "Instagram Reels"}
                        {!hasKeyForPlatform(p) && " 🔑"}
                      </Pill>
                    ))}
                  </div>
                  {platforms.some((p) => !hasKeyForPlatform(p)) && (
                    <p className="mt-1 text-xs text-amber-600">
                      🔑 키가 없는 플랫폼은 검색 전에 API 키 설정이 필요합니다.
                    </p>
                  )}
                </div>

                <div>
                  <Label>최대 결과 수</Label>
                  <div className="flex gap-1.5">
                    {[5, 10, 20].map((n) => (
                      <Pill key={n} active={maxResults === n} onClick={() => setMaxResults(n)}>{n}개</Pill>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* 에러 */}
          {errors.length > 0 && (
            <div className="mb-3 space-y-1.5">
              {errors.map((e, i) => (
                <div key={i} className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <b>[{PLATFORM_INFO[e.platform as keyof typeof PLATFORM_INFO]?.label || e.platform}] 오류</b>{" "}
                  {e.message}
                </div>
              ))}
            </div>
          )}

          {/* 결과 */}
          {status === "done" && results.length === 0 && errors.length === 0 && (
            <div className="rounded-xl bg-slate-100 py-10 text-center text-slate-500">
              좋아요 {minLikes.toLocaleString()}개 이상 결과가 없습니다. 키워드나 최소 좋아요를 조정해 보세요.
            </div>
          )}

          {results.length > 0 && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-slate-600">
                  <b>{results.length}개</b> 결과 · 좋아요 {minLikes.toLocaleString()}개 이상
                </p>
                <Button
                  variant="outline"
                  onClick={() => addAllToAnalysis(results)}
                  className="!py-1.5 text-xs"
                >
                  전체 벤치마킹 분석 추가
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {results.map((r) => (
                  <ResultCard
                    key={r.id}
                    result={r}
                    isSaved={saved.some((s) => s.id === r.id)}
                    onSave={handleSave}
                    onAddAnalysis={(r) => addAllToAnalysis([r])}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      {tab === "saved" && (
        <>
          {saved.length === 0 ? (
            <div className="rounded-xl bg-slate-100 py-10 text-center text-slate-500">
              저장된 콘텐츠가 없습니다. 검색 후 ♥ 저장 버튼으로 추가하세요.
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm text-slate-600"><b>{saved.length}개</b> 저장됨</p>
                <Button
                  variant="outline"
                  onClick={() => addAllToAnalysis(saved)}
                  className="!py-1.5 text-xs"
                >
                  저장 전체 벤치마킹 분석 추가
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {saved.map((r) => (
                  <ResultCard
                    key={r.id}
                    result={r}
                    isSaved
                    onRemove={handleRemove}
                    onAddAnalysis={(r) => addAllToAnalysis([r])}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}

      <div className="mt-6 rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-500">
        ※ 모든 검색은 사용자가 직접 발급한 API 키로 수행됩니다. 공개 게시물만 조회하며 비공개 계정에는 접근하지 않습니다.
        API 키는 브라우저 localStorage에만 저장되고 서버로 전송되지 않습니다.
      </div>
    </div>
  );
}

// ── 결과 카드 ─────────────────────────────────
interface ResultCardProps {
  result: SearchResult;
  isSaved: boolean;
  onSave?: (r: SearchResult) => void;
  onRemove?: (id: string) => void;
  onAddAnalysis: (r: SearchResult) => void;
}
function ResultCard({ result: r, isSaved, onSave, onRemove, onAddAnalysis }: ResultCardProps) {
  const isYt = r.platform === "youtube";
  const date = r.publishedAt ? new Date(r.publishedAt).toLocaleDateString("ko-KR") : "";

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex gap-3">
        {/* 썸네일 */}
        <div className="relative flex-shrink-0">
          {r.thumbnailUrl ? (
            <img
              src={r.thumbnailUrl}
              alt={r.title}
              className="h-20 w-28 rounded-lg object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="flex h-20 w-28 items-center justify-center rounded-lg bg-slate-200 text-xs text-slate-400">
              썸네일 없음
            </div>
          )}
          <span
            className={`absolute left-1 top-1 rounded-md px-1.5 py-0.5 text-xs font-bold text-white ${
              isYt ? "bg-red-600" : "bg-purple-600"
            }`}
          >
            {isYt ? "YT" : "IG"}
          </span>
        </div>

        {/* 정보 */}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold text-slate-900 leading-snug">{r.title}</p>
          <p className="mt-0.5 text-xs text-slate-500">@{r.authorHandle || r.authorName}</p>
          <div className="mt-1.5 flex flex-wrap gap-2 text-xs text-slate-600">
            <Stat icon="♥" val={r.likes} label="좋아요" highlight={r.likes >= 1000} />
            <Stat icon="👁" val={r.views} label="조회" />
            <Stat icon="💬" val={r.comments} label="댓글" />
          </div>
          {date && <p className="mt-0.5 text-xs text-slate-400">{date}</p>}
        </div>
      </div>

      {/* 해시태그 */}
      {r.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {r.hashtags.slice(0, 5).map((h) => (
            <Tag key={h} color="slate">{h}</Tag>
          ))}
        </div>
      )}

      {/* 액션 */}
      <div className="flex flex-wrap gap-1.5">
        <a
          href={r.postUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          원본 보기 ↗
        </a>
        <CopyButton text={r.postUrl} label="URL 복사" />
        <Button variant="outline" onClick={() => onAddAnalysis(r)} className="!py-1 text-xs">
          분석 추가
        </Button>
        {isSaved ? (
          onRemove && (
            <Button variant="ghost" onClick={() => onRemove(r.id)} className="!py-1 text-xs text-rose-500">
              저장 취소
            </Button>
          )
        ) : (
          onSave && (
            <Button variant="ghost" onClick={() => onSave(r)} className="!py-1 text-xs text-brand-600">
              ♥ 저장
            </Button>
          )
        )}
      </div>
    </Card>
  );
}

function Stat({ icon, val, label, highlight }: { icon: string; val: number; label: string; highlight?: boolean }) {
  const display = val >= 10000 ? `${(val / 10000).toFixed(1)}만` : val.toLocaleString();
  return (
    <span className={highlight && val > 0 ? "font-bold text-rose-600" : ""}>
      {icon} {display}
    </span>
  );
}
