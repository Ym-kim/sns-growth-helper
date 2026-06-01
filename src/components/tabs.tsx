import { useMemo, useState } from "react";
import type { AppInput, AppOutput, PerformanceInput } from "../lib/types";
import { Card, CopyButton, ScoreBar, SectionTitle, Tag, Button, TextInput, TextArea, Pill, Label } from "./ui";
import { generateContentCalendar } from "../lib/generators";
import { emptyReelsRow, type ReelsBenchmarkRow } from "../lib/benchmark";
import { evaluatePerformance } from "../lib/performance";

// ── 요약 ──────────────────────────────────────
export function SummaryTab({ output }: { output: AppOutput }) {
  const top5 = useMemo(() => {
    // 리포트 마지막 섹션에서 TOP5 추출
    const idx = output.reportMarkdown.indexOf("## 14. 다음 실행 우선순위");
    if (idx < 0) return [];
    return output.reportMarkdown.slice(idx).split("\n").filter((l) => /^\d+\./.test(l.trim()));
  }, [output]);

  return (
    <>
      <Card>
        <SectionTitle sub="입력값 기반 계정 방향 요약">계정 방향</SectionTitle>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field k="방향" v={output.summary.direction} />
          <Field k="타깃" v={output.summary.target} />
          <Field k="팔로우할 이유" v={output.summary.followReason} />
        </dl>
      </Card>

      <Card>
        <SectionTitle sub="100점 만점 추정 점수 · 전략 수립용">팔로우할 이유 진단</SectionTitle>
        <div className="space-y-4">
          {output.scores.map((s) => (
            <div key={s.key}>
              <ScoreBar score={s.score} label={s.label} />
              <p className="mt-1 text-xs text-slate-500">{s.reason}</p>
              <p className="mt-0.5 text-xs text-slate-700"><b>개선:</b> {s.improve}</p>
              <p className="mt-0.5 text-xs text-brand-700"><b>적용 예:</b> {s.applyExample}</p>
            </div>
          ))}
        </div>
      </Card>

      {top5.length > 0 && (
        <Card>
          <SectionTitle>다음 실행 우선순위 TOP 5</SectionTitle>
          <ol className="space-y-1.5 text-sm text-slate-700">
            {top5.map((l, i) => <li key={i}>{l.trim()}</li>)}
          </ol>
        </Card>
      )}

      <Card>
        <SectionTitle>플랫폼 추천</SectionTitle>
        <div className="space-y-3">
          {output.platformRecommendation.map((p) => (
            <div key={p.platform}>
              <ScoreBar score={p.fit} label={p.platform} />
              <p className="mt-1 text-xs text-slate-500">{p.reason}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-xs font-semibold text-slate-400">{k}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{v}</dd>
    </div>
  );
}

// ── 계정 콘셉트 ────────────────────────────────
export function ConceptsTab({ output }: { output: AppOutput }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {output.concepts.map((c) => (
        <Card key={c.name} className="flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900">{c.name}</h3>
            <Tag color="brand">추천 {c.score}</Tag>
          </div>
          <p className="mt-1 text-sm text-slate-600">{c.oneLiner}</p>
          <dl className="mt-3 space-y-2 text-xs">
            <CRow k="누구를 위한" v={c.forWhom} />
            <CRow k="팔로우하면" v={c.followReason} />
            <CRow k="주 콘텐츠" v={c.mainContentType} />
            <CRow k="수익화" v={c.monetization} />
          </dl>
          <div className="mt-3 grid grid-cols-1 gap-2 text-xs">
            <p className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><b>장점</b> {c.pros}</p>
            <p className="rounded-lg bg-rose-50 p-2 text-rose-700"><b>단점</b> {c.cons}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
function CRow({ k, v }: { k: string; v: string }) {
  return <div><dt className="font-semibold text-slate-400">{k}</dt><dd className="text-slate-700">{v}</dd></div>;
}

// ── 벤치마킹 ──────────────────────────────────
export function BenchmarkTab({ input, output }: { input: AppInput; output: AppOutput }) {
  const f = output.benchmarkFinder;
  return (
    <>
      {output.benchmarkAnalysis.length === 0 ? (
        <Card>
          <SectionTitle sub="입력된 자료가 없어 찾기 도우미를 제공합니다">벤치마킹 자료 없음</SectionTitle>
          <p className="text-sm text-slate-600">아래 키워드/해시태그로 직접 좋은 벤치마킹 콘텐츠를 찾아보세요.</p>
        </Card>
      ) : (
        output.benchmarkAnalysis.map((b, i) => (
          <Card key={i}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">분석 #{i + 1}</h3>
              <Tag color="slate">{b.sourceLabel}</Tag>
            </div>
            <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <BRow k="콘텐츠 주제" v={b.topic} />
              <BRow k="예상 타깃" v={b.audience} />
              <BRow k="첫 1~3초 후킹" v={b.hook} />
              <BRow k="썸네일/표지" v={b.thumbnail} />
              <BRow k="첫 장면 강점" v={b.firstSceneStrength} />
              <BRow k="전체 흐름" v={b.flow} />
              <BRow k="저장 유도" v={b.saveTrigger} />
              <BRow k="댓글 유도" v={b.commentTrigger} />
              <BRow k="공유 유도" v={b.shareTrigger} />
              <BRow k="프로필 방문 유도" v={b.profileVisitTrigger} />
              <BRow k="CTA 구조" v={b.cta} />
              <BRow k="반복 가능성" v={b.repeatable} />
            </div>
            <div className="mt-2">
              {b.emotions.map((e) => <span key={e} className="mr-1.5"><Tag color="amber">{e}</Tag></span>)}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <p className="rounded-lg bg-emerald-50 p-2 text-emerald-700"><b>따라 해도 OK</b> {b.safeToCopy}</p>
              <p className="rounded-lg bg-rose-50 p-2 text-rose-700"><b>그대로 따라하면 위험</b> {b.riskyToCopy}</p>
            </div>
            <div className="mt-3">
              <p className="mb-1 text-xs font-semibold text-slate-500">내 분야 변형 아이디어 5개</p>
              <ul className="list-disc space-y-0.5 pl-5 text-sm text-slate-700">
                {b.variations.map((v, j) => <li key={j}>{v}</li>)}
              </ul>
            </div>
          </Card>
        ))
      )}

      <Card>
        <SectionTitle sub="자료가 없어도 직접 찾을 수 있게">벤치마킹 찾기 도우미</SectionTitle>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <KeywordBlock title="검색 키워드 10개" items={f.keywords} />
          <KeywordBlock title="해시태그 10개" items={f.hashtags} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <ListBlock title="찾아봐야 할 콘텐츠 유형" items={f.contentTypes} />
          <ListBlock title="분석할 계정 유형" items={f.accountTypes} />
        </div>
        <div className="mt-4">
          <ListBlock title="좋은 벤치마킹 콘텐츠 고르는 기준" items={f.selectionCriteria} />
        </div>
      </Card>

      <ReelsTemplate />

      <div className="rounded-xl bg-slate-100 px-4 py-3 text-xs text-slate-600">
        ⚠️ 저작권/표절 주의: 아이디어의 <b>구조</b>를 참고하되, 영상·문구·디자인을 그대로 복제하지 마세요.
      </div>
    </>
  );
}
function BRow({ k, v }: { k: string; v: string }) {
  return <div className="rounded-lg bg-slate-50 p-2"><span className="text-xs font-semibold text-slate-400">{k}</span><p className="text-sm text-slate-700">{v}</p></div>;
}
function KeywordBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">{title}</p>
        <CopyButton text={items.join(" ")} label="복사" />
      </div>
      <div className="flex flex-wrap gap-1.5">{items.map((i) => <Tag key={i} color="slate">{i}</Tag>)}</div>
    </div>
  );
}
function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-slate-500">{title}</p>
      <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{items.map((i, idx) => <li key={idx}>{i}</li>)}</ul>
    </div>
  );
}

// 릴스 벤치마킹 분석 템플릿 (사용자가 직접 채우는 표)
function ReelsTemplate() {
  const [rows, setRows] = useState<ReelsBenchmarkRow[]>([emptyReelsRow()]);
  const cols: { key: keyof ReelsBenchmarkRow; label: string }[] = [
    { key: "account", label: "계정명" }, { key: "url", label: "URL" },
    { key: "views", label: "조회수" }, { key: "likes", label: "좋아요" },
    { key: "comments", label: "댓글" }, { key: "savesEst", label: "저장(추정)" },
    { key: "formatType", label: "포맷" }, { key: "coverStyle", label: "표지" },
    { key: "hook3s", label: "첫3초 후킹" }, { key: "captionStyle", label: "자막" },
    { key: "editTempo", label: "편집 템포" }, { key: "audio", label: "음악/TTS" },
    { key: "endingCta", label: "마무리 CTA" }, { key: "repeatability", label: "반복 가능성" },
    { key: "applyIdea", label: "적용 아이디어" },
  ];
  const update = (i: number, key: keyof ReelsBenchmarkRow, v: string) =>
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [key]: v } : row)));

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <SectionTitle sub="직접 채워가며 구조를 분해해 보세요 (인스타 릴스 기준)">릴스 벤치마킹 분석 템플릿</SectionTitle>
        <Button variant="outline" onClick={() => setRows((r) => [...r, emptyReelsRow()])} className="!py-1.5 text-xs">+ 행 추가</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-[900px] text-xs">
          <thead>
            <tr className="text-left text-slate-400">{cols.map((c) => <th key={c.key} className="px-1.5 py-1 font-semibold">{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-slate-100">
                {cols.map((c) => (
                  <td key={c.key} className="p-0.5">
                    <input value={row[c.key]} onChange={(e) => update(i, c.key, e.target.value)}
                      className="w-28 rounded border border-slate-200 px-1.5 py-1 outline-none focus:border-brand-400" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── 콘텐츠 포맷 ────────────────────────────────
export function FormatTab({ output }: { output: AppOutput }) {
  return (
    <>
      <Card>
        <SectionTitle sub="유형별 목적·구조·제목·CTA">콘텐츠 유형 매트릭스</SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {output.contentMatrix.map((m) => (
            <div key={m.type} className="rounded-xl border border-slate-200 p-3">
              <div className="flex items-center gap-2"><h4 className="font-bold text-slate-900">{m.type}</h4><Tag color="brand">{m.purpose}</Tag></div>
              <p className="mt-2 text-xs text-slate-500"><b>구조</b> · {m.structure}</p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-slate-700">{m.titles.map((t, i) => <li key={i}>{t}</li>)}</ul>
              <p className="mt-1.5 text-xs text-slate-600"><b>CTA</b> · {m.cta}</p>
              <p className="mt-1 rounded-lg bg-amber-50 p-2 text-xs text-amber-700">⚠️ {m.monetizationCaution}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle sub="운영 목적별 콘텐츠 레이어">유입 · 신뢰 · 관계 · 전환</SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {output.contentLayers.map((l) => (
            <div key={l.layer} className="rounded-xl bg-slate-50 p-3">
              <h4 className="font-bold text-slate-900">{l.layer}</h4>
              <p className="text-xs text-slate-500">{l.description}</p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-sm text-slate-700">{l.ideas.map((idea, i) => <li key={i}>{idea}</li>)}</ul>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle sub="주제는 유지하고 포맷만 바꿔 실험하세요">콘텐츠 포맷 실험실</SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {output.experimentPlan.map((e) => (
            <div key={e.format} className="rounded-xl border border-slate-200 p-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <h4 className="font-bold text-slate-900">{e.format}</h4>
                <Tag color="slate">{e.difficulty}</Tag><Tag color="slate">{e.estTime}</Tag><Tag color="brand">{e.bestPlatform}</Tag>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">{e.description}</p>
              <p className="mt-1.5 text-xs font-semibold text-slate-500">첫 3초 후킹</p>
              <ul className="list-disc space-y-0.5 pl-5 text-sm text-slate-700">{e.hooks.map((h, i) => <li key={i}>{h}</li>)}</ul>
              <p className="mt-1.5 text-xs text-slate-600"><b>흐름</b> · {e.flow}</p>
              <p className="text-xs text-slate-600"><b>자막 예</b> · {e.captionExample}</p>
              <p className="text-xs text-slate-600"><b>CTA</b> · {e.cta}</p>
              <p className="mt-1 rounded-lg bg-slate-50 p-1.5 text-xs text-slate-500"><b>검증</b> · {e.validation}</p>
            </div>
          ))}
        </div>
      </Card>

      <FormatValidator />
    </>
  );
}

// 성공 포맷 검증 로직
function FormatValidator() {
  const [p, setP] = useState<PerformanceInput>({
    title: "", format: "", platform: "Instagram",
    views: 0, likes: 0, comments: 0, saves: 0, shares: 0,
    profileVisits: 0, linkClicks: 0, dms: 0, sales: 0,
  });
  const [result, setResult] = useState<ReturnType<typeof evaluatePerformance> | null>(null);
  const num = (k: keyof PerformanceInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setP((s) => ({ ...s, [k]: Number(e.target.value) || 0 }));

  const metrics: { k: keyof PerformanceInput; label: string }[] = [
    { k: "views", label: "조회수" }, { k: "likes", label: "좋아요" }, { k: "comments", label: "댓글" },
    { k: "saves", label: "저장" }, { k: "shares", label: "공유" }, { k: "profileVisits", label: "프로필 방문" },
    { k: "linkClicks", label: "링크 클릭" }, { k: "dms", label: "DM/문의" }, { k: "sales", label: "판매/신청" },
  ];

  return (
    <Card>
      <SectionTitle sub="업로드한 콘텐츠 성과를 입력하면 반복 여부를 판단합니다">성공 포맷 검증</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label>콘텐츠 제목</Label><TextInput value={p.title} onChange={(e) => setP((s) => ({ ...s, title: e.target.value }))} /></div>
        <div><Label>포맷 유형</Label><TextInput value={p.format} onChange={(e) => setP((s) => ({ ...s, format: e.target.value }))} placeholder="예: 체크리스트형" /></div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {metrics.map((m) => (
          <div key={m.k}><Label>{m.label}</Label><TextInput type="number" value={(p[m.k] as number) || ""} onChange={num(m.k)} /></div>
        ))}
      </div>
      <Button onClick={() => setResult(evaluatePerformance(p))} className="mt-3">성과 분석</Button>

      {result && (
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Tag color={result.reachSuccess ? "green" : "slate"}>유입 {result.reachSuccess ? "✓" : "—"}</Tag>
            <Tag color={result.saveSuccess ? "green" : "slate"}>저장 {result.saveSuccess ? "✓" : "—"}</Tag>
            <Tag color={result.commentSuccess ? "green" : "slate"}>댓글 {result.commentSuccess ? "✓" : "—"}</Tag>
            <Tag color={result.conversionSuccess ? "green" : "slate"}>전환 {result.conversionSuccess ? "✓" : "—"}</Tag>
            <Tag color="brand">{result.verdict}</Tag>
          </div>
          <p className="rounded-lg bg-brand-50 p-2.5 text-sm text-brand-700">{result.repeat}</p>
          <div>
            <p className="text-xs font-semibold text-slate-500">같은 포맷으로 추가 제작 추천 3개</p>
            <ul className="list-disc space-y-0.5 pl-5 text-sm text-slate-700">{result.nextIdeas.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">포맷 수정 제안</p>
            <ul className="list-disc space-y-0.5 pl-5 text-sm text-slate-700">{result.fixSuggestions.map((n, i) => <li key={i}>{n}</li>)}</ul>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── 수익화 동선 ────────────────────────────────
export function MonetizationTab({ output }: { output: AppOutput }) {
  const m = output.monetizationFlow;
  return (
    <Card>
      <SectionTitle sub="조회수와 수익은 다릅니다. 전환 동선을 설계하세요.">수익화 동선</SectionTitle>
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {m.path.map((step, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{step}</span>
            {i < m.path.length - 1 && <span className="text-slate-300">→</span>}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
        <BRow2 k="현재 수익모델" v={m.hasModel} />
        <BRow2 k="콘텐츠-판매 연관성" v={m.contentOfferFit} />
        <BRow2 k="프로필 역할" v={m.profileRole} />
        <BRow2 k="링크 역할" v={m.linkRole} />
        <BRow2 k="하이라이트/고정글 역할" v={m.highlightRole} />
        <BRow2 k="DM/댓글 유도" v={m.dmCommentRole} />
      </div>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p className="mb-1.5 text-xs font-semibold text-rose-500">전환을 막는 요소</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">{m.blockers.map((b, i) => <li key={i}>{b}</li>)}</ul>
        </div>
        <div>
          <p className="mb-1.5 text-xs font-semibold text-emerald-600">개선 우선순위</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">{m.priorities.map((b, i) => <li key={i}>{b}</li>)}</ol>
        </div>
      </div>
    </Card>
  );
}
function BRow2({ k, v }: { k: string; v: string }) {
  return <div className="rounded-lg bg-slate-50 p-2.5"><span className="text-xs font-semibold text-slate-400">{k}</span><p className="text-slate-700">{v}</p></div>;
}

// ── 콘텐츠 플랜 (14/30일) ──────────────────────
export function CalendarTab({ input, output }: { input: AppInput; output: AppOutput }) {
  const [days, setDays] = useState<14 | 30>(14);
  const items = useMemo(() => (days === 14 ? output.calendar : generateContentCalendar(input, 30)), [days, input, output]);

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle sub={days === 14 ? "다양한 포맷을 빠르게 실험" : "실험 → 반응 확인 → 반복 → 전환 배치"}>
          {days}일 콘텐츠 플랜
        </SectionTitle>
        <div className="flex gap-2">
          <Pill active={days === 14} onClick={() => setDays(14)}>14일 빠른 실험</Pill>
          <Pill active={days === 30} onClick={() => setDays(30)}>30일 성장</Pill>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((c) => (
          <div key={c.day} className="rounded-xl border border-slate-200 p-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded-lg bg-slate-900 px-2 py-0.5 text-xs font-bold text-white">{c.date}</span>
              <span className="text-sm font-bold text-slate-900">{c.title}</span>
              <Tag color="brand">{c.contentType}</Tag><Tag color="slate">{c.platform}</Tag>
              <Tag color="slate">{c.difficulty}</Tag><Tag color="slate">{c.estTime}</Tag>
            </div>
            <div className="mt-1.5 grid grid-cols-1 gap-1 text-xs text-slate-600 sm:grid-cols-2">
              <p><b>후킹</b> · {c.hook}</p>
              <p><b>흐름</b> · {c.flow}</p>
              <p><b>CTA</b> · {c.cta}</p>
              <p><b>목표 지표</b> · {c.goalMetric}</p>
              <p className="sm:col-span-2"><b>벤치마킹 참고</b> · {c.benchmarkPoint}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── AI 프롬프트 ────────────────────────────────
export function PromptsTab({ output }: { output: AppOutput }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">입력값이 반영된 프롬프트입니다. 복사해서 AI에 바로 붙여넣으세요.</p>
      {output.aiPrompts.map((p) => (
        <Card key={p.name}>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-bold text-slate-900">{p.name}</h4>
            <CopyButton text={p.prompt} />
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-700">{p.prompt}</pre>
        </Card>
      ))}
    </div>
  );
}

// ── 체크리스트 ────────────────────────────────
export function ChecklistTab({ output }: { output: AppOutput }) {
  const [checked, setChecked] = useState<boolean[]>(output.checklist.map(() => false));
  return (
    <Card>
      <SectionTitle sub="콘텐츠를 올리기 전에 점검하세요">업로드 전 체크리스트</SectionTitle>
      <ul className="space-y-2">
        {output.checklist.map((c, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-700">
              <input type="checkbox" checked={checked[i]}
                onChange={(e) => setChecked((s) => s.map((v, idx) => (idx === i ? e.target.checked : v)))}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600" />
              <span className={checked[i] ? "line-through text-slate-400" : ""}>{c}</span>
            </label>
          </li>
        ))}
      </ul>
    </Card>
  );
}
