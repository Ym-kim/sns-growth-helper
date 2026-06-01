import { useMemo, useState } from "react";
import type { AppInput, AppOutput, PerformanceInput } from "../lib/types";
import { Card, CopyButton, ScoreBar, SectionTitle, Tag, Button, TextInput, Pill, Label } from "./ui";
import { generateContentCalendar } from "../lib/generators";
import { emptyReelsRow, type ReelsBenchmarkRow } from "../lib/benchmark";
import { evaluatePerformance } from "../lib/performance";

// ── 공통 유틸 ─────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-ink-50 p-3.5">
      <div className="mb-0.5 text-xs font-bold text-ink-400">{label}</div>
      <div className="text-sm font-medium text-ink-800">{value}</div>
    </div>
  );
}

// ── 요약 탭 ──────────────────────────────────
export function SummaryTab({ output }: { output: AppOutput }) {
  const top5 = useMemo(() => {
    const idx = output.reportMarkdown.indexOf("## 14. 다음 실행 우선순위");
    if (idx < 0) return [];
    return output.reportMarkdown.slice(idx).split("\n").filter((l) => /^\d+\./.test(l.trim()));
  }, [output]);

  return (
    <>
      <Card className="!p-6">
        <SectionTitle icon="🎯" sub="입력값 기반 계정 방향">계정 방향 요약</SectionTitle>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <InfoRow label="방향" value={output.summary.direction} />
          <InfoRow label="타깃" value={output.summary.target} />
          <InfoRow label="팔로우할 이유" value={output.summary.followReason} />
        </div>
      </Card>

      <Card className="!p-6">
        <SectionTitle icon="📈" sub="8개 항목 추정 점수 · 전략 수립 참고용">팔로우할 이유 진단</SectionTitle>
        <div className="space-y-5">
          {output.scores.map((s) => (
            <div key={s.key} className="space-y-1.5">
              <ScoreBar score={s.score} label={s.label} />
              <p className="text-xs text-ink-500">{s.reason}</p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-xl bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">개선 · {s.improve}</span>
                <span className="rounded-xl bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">적용 예 · {s.applyExample}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {top5.length > 0 && (
        <Card className="!p-6">
          <SectionTitle icon="🚀">다음 실행 우선순위 TOP 5</SectionTitle>
          <ol className="space-y-3">
            {top5.map((l, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-gradient text-xs font-black text-white">{i + 1}</span>
                <span className="text-sm font-medium text-ink-700">{l.replace(/^\d+\.\s*/, "")}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <Card className="!p-6">
        <SectionTitle icon="📱">플랫폼 추천</SectionTitle>
        <div className="space-y-4">
          {output.platformRecommendation.map((p) => (
            <div key={p.platform}>
              <ScoreBar score={p.fit} label={p.platform} />
              <p className="mt-1 text-xs text-ink-500">{p.reason}</p>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

// ── 계정 콘셉트 탭 ─────────────────────────────
export function ConceptsTab({ output }: { output: AppOutput }) {
  const gradients = [
    "from-violet-500 to-purple-600",
    "from-pink-500 to-rose-500",
    "from-blue-500 to-indigo-600",
  ];
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {output.concepts.map((c, idx) => (
        <Card key={c.name} className="!p-0 overflow-hidden">
          <div className={`bg-gradient-to-br ${gradients[idx]} p-5 text-white`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black">{c.name}</h3>
              <span className="rounded-xl bg-white/20 px-2.5 py-0.5 text-xs font-bold backdrop-blur-sm">추천 {c.score}</span>
            </div>
            <p className="mt-1.5 text-sm opacity-90">{c.oneLiner}</p>
          </div>
          <div className="p-5">
            <dl className="space-y-2.5 text-sm">
              {[["👤 누구를 위한", c.forWhom], ["❤️ 팔로우하면", c.followReason], ["📝 주 콘텐츠", c.mainContentType], ["💰 수익화", c.monetization]].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-bold text-ink-400">{k}</dt>
                  <dd className="mt-0.5 font-medium text-ink-700">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 space-y-2">
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">✓ {c.pros}</p>
              <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-600">⚡ {c.cons}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

// ── 벤치마킹 탭 ───────────────────────────────
export function BenchmarkTab({ input, output }: { input: AppInput; output: AppOutput }) {
  const f = output.benchmarkFinder;
  return (
    <>
      {output.benchmarkAnalysis.length === 0 ? (
        <Card className="!p-6">
          <SectionTitle icon="💬" sub="자료 없이도 시작할 수 있어요">벤치마킹 찾기 도우미</SectionTitle>
          <p className="text-sm text-ink-500">아래 키워드·해시태그로 직접 좋은 벤치마킹 콘텐츠를 찾아보세요.</p>
        </Card>
      ) : output.benchmarkAnalysis.map((b, i) => (
        <Card key={i} className="!p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h3 className="font-black text-ink-900">분석 #{i + 1}</h3>
            <Tag color="slate">{b.sourceLabel}</Tag>
          </div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {[["콘텐츠 주제", b.topic], ["예상 타깃", b.audience], ["첫 1~3초 후킹", b.hook], ["전체 흐름", b.flow], ["저장 유도", b.saveTrigger], ["댓글 유도", b.commentTrigger], ["CTA 구조", b.cta], ["반복 가능성", b.repeatable]].map(([k, v]) => (
              <InfoRow key={k} label={k} value={v} />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">{b.emotions.map((e) => <Tag key={e} color="brand">{e}</Tag>)}</div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-2xl bg-emerald-50 p-3"><p className="text-xs font-bold text-emerald-600 mb-1">✓ 따라 해도 OK</p><p className="text-xs text-emerald-700">{b.safeToCopy}</p></div>
            <div className="rounded-2xl bg-rose-50 p-3"><p className="text-xs font-bold text-rose-500 mb-1">⚠ 주의</p><p className="text-xs text-rose-600">{b.riskyToCopy}</p></div>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-xs font-bold text-ink-500">내 분야 변형 아이디어</p>
            <ul className="space-y-1">{b.variations.map((v, j) => <li key={j} className="flex items-start gap-2 text-sm text-ink-700"><span className="mt-0.5 text-brand-400">→</span>{v}</li>)}</ul>
          </div>
        </Card>
      ))}

      <Card className="!p-6">
        <SectionTitle icon="🗝️">벤치마킹 찾기 도우미</SectionTitle>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <KeyBlock title="🔎 검색 키워드 10개" items={f.keywords} />
          <KeyBlock title="# 해시태그 10개" items={f.hashtags} />
          <ListBlock title="📹 찾아봐야 할 콘텐츠 유형" items={f.contentTypes} />
          <ListBlock title="👥 분석할 계정 유형" items={f.accountTypes} />
          <div className="md:col-span-2"><ListBlock title="✅ 좋은 벤치마킹 고르는 기준" items={f.selectionCriteria} /></div>
        </div>
      </Card>

      <ReelsTemplate />

      <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
        ⚠️ 저작권 주의 — 아이디어 <strong>구조</strong>를 참고하되, 영상·문구·디자인을 그대로 복제하지 마세요.
      </div>
    </>
  );
}

function KeyBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-ink-100 p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-xs font-bold text-ink-600">{title}</p>
        <CopyButton text={items.join(" ")} label="복사" />
      </div>
      <div className="flex flex-wrap gap-1.5">{items.map((i) => <Tag key={i} color="slate">{i}</Tag>)}</div>
    </div>
  );
}
function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-ink-100 p-4">
      <p className="mb-2.5 text-xs font-bold text-ink-600">{title}</p>
      <ul className="space-y-1.5">{items.map((i, idx) => <li key={idx} className="flex items-start gap-2 text-sm text-ink-700"><span className="mt-0.5 font-bold text-brand-400">·</span>{i}</li>)}</ul>
    </div>
  );
}

function ReelsTemplate() {
  const [rows, setRows] = useState<ReelsBenchmarkRow[]>([emptyReelsRow()]);
  const cols: { key: keyof ReelsBenchmarkRow; label: string }[] = [
    { key: "account", label: "계정명" }, { key: "url", label: "URL" }, { key: "views", label: "조회수" },
    { key: "likes", label: "좋아요" }, { key: "comments", label: "댓글" }, { key: "savesEst", label: "저장추정" },
    { key: "formatType", label: "포맷" }, { key: "hook3s", label: "첫3초" }, { key: "captionStyle", label: "자막" },
    { key: "endingCta", label: "CTA" }, { key: "repeatability", label: "반복성" }, { key: "applyIdea", label: "적용" },
  ];
  const update = (i: number, k: keyof ReelsBenchmarkRow, v: string) => setRows((r) => r.map((row, idx) => idx === i ? { ...row, [k]: v } : row));

  return (
    <Card className="!p-6">
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle icon="📊" sub="직접 채워 구조를 분해하세요 (인스타 릴스 기준)">릴스 벤치마킹 템플릿</SectionTitle>
        <Button variant="outline" onClick={() => setRows((r) => [...r, emptyReelsRow()])} className="!py-1.5 !text-xs">+ 행 추가</Button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-ink-100">
        <table className="min-w-[800px] text-xs">
          <thead>
            <tr className="bg-ink-50">{cols.map((c) => <th key={c.key} className="px-3 py-2.5 text-left font-bold text-ink-500">{c.label}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-ink-100">
                {cols.map((c) => (
                  <td key={c.key} className="p-1">
                    <input value={row[c.key]} onChange={(e) => update(i, c.key, e.target.value)}
                      className="w-24 rounded-xl border border-ink-100 px-2 py-1.5 text-xs outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-50" />
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

// ── 콘텐츠 포맷 탭 ─────────────────────────────
export function FormatTab({ output }: { output: AppOutput }) {
  return (
    <>
      <Card className="!p-6">
        <SectionTitle icon="🎭" sub="유형별 목적 · 구조 · 제목 · CTA">콘텐츠 유형 매트릭스</SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {output.contentMatrix.map((m) => (
            <div key={m.type} className="rounded-2xl border border-ink-100 p-4">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-black text-ink-900">{m.type}</span>
                <Tag color="brand">{m.purpose}</Tag>
              </div>
              <p className="mb-2 text-xs text-ink-500">📐 {m.structure}</p>
              <ul className="mb-2 space-y-1">{m.titles.map((t, i) => <li key={i} className="flex items-start gap-1.5 text-sm text-ink-700"><span className="font-bold text-brand-400">{i + 1}.</span>{t}</li>)}</ul>
              <div className="rounded-xl bg-ink-50 px-3 py-2 text-xs"><span className="font-bold text-ink-500">CTA</span> · {m.cta}</div>
              <div className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700">⚡ {m.monetizationCaution}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-6">
        <SectionTitle icon="🔄" sub="운영 목적별 4레이어">유입 · 신뢰 · 관계 · 전환</SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {output.contentLayers.map((l) => (
            <div key={l.layer} className="rounded-2xl bg-ink-50 p-4">
              <div className="mb-1 font-black text-ink-900">{l.layer}</div>
              <div className="mb-2 text-xs text-ink-500">{l.description}</div>
              <ul className="space-y-1">{l.ideas.map((idea, i) => <li key={i} className="flex items-start gap-1.5 text-sm text-ink-700"><span className="text-brand-400">→</span>{idea}</li>)}</ul>
            </div>
          ))}
        </div>
      </Card>

      <Card className="!p-6">
        <SectionTitle icon="🧪" sub="주제 유지 · 포맷만 바꿔 실험">포맷 실험실 (12가지)</SectionTitle>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {output.experimentPlan.map((e) => (
            <div key={e.format} className="rounded-2xl border border-ink-100 p-4">
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                <span className="font-black text-ink-900">{e.format}</span>
                <Tag color="slate">{e.difficulty}</Tag><Tag color="slate">{e.estTime}</Tag><Tag color="brand">{e.bestPlatform}</Tag>
              </div>
              <p className="mb-2 text-xs text-ink-500">{e.description}</p>
              <div className="mb-2">
                <p className="mb-1 text-xs font-bold text-ink-500">첫 3초 후킹</p>
                <ul className="space-y-0.5">{e.hooks.map((h, i) => <li key={i} className="text-xs text-ink-700">· {h}</li>)}</ul>
              </div>
              <div className="rounded-xl bg-brand-50 px-3 py-2 text-xs"><span className="font-bold text-brand-600">검증</span> · {e.validation}</div>
            </div>
          ))}
        </div>
      </Card>

      <FormatValidator />
    </>
  );
}

function FormatValidator() {
  const [p, setP] = useState<PerformanceInput>({ title: "", format: "", platform: "Instagram", views: 0, likes: 0, comments: 0, saves: 0, shares: 0, profileVisits: 0, linkClicks: 0, dms: 0, sales: 0 });
  const [result, setResult] = useState<ReturnType<typeof evaluatePerformance> | null>(null);
  const num = (k: keyof PerformanceInput) => (e: React.ChangeEvent<HTMLInputElement>) => setP((s) => ({ ...s, [k]: Number(e.target.value) || 0 }));

  return (
    <Card className="!p-6">
      <SectionTitle icon="📊" sub="성과 입력 → 반복 여부 판단">성공 포맷 검증</SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label>콘텐츠 제목</Label><TextInput value={p.title} onChange={(e) => setP((s) => ({ ...s, title: e.target.value }))} /></div>
        <div><Label>포맷 유형</Label><TextInput value={p.format} onChange={(e) => setP((s) => ({ ...s, format: e.target.value }))} placeholder="예: 체크리스트형" /></div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {[{k:"views",l:"조회수"},{k:"likes",l:"좋아요"},{k:"comments",l:"댓글"},{k:"saves",l:"저장"},{k:"shares",l:"공유"},{k:"profileVisits",l:"프로필"},{k:"linkClicks",l:"링크"},{k:"dms",l:"DM"},{k:"sales",l:"판매"}].map((m) => (
          <div key={m.k}><Label>{m.l}</Label><TextInput type="number" value={(p[m.k as keyof PerformanceInput] as number) || ""} onChange={num(m.k as keyof PerformanceInput)} /></div>
        ))}
      </div>
      <Button onClick={() => setResult(evaluatePerformance(p))} className="mt-4">성과 분석하기</Button>
      {result && (
        <div className="mt-5 space-y-3">
          <div className="flex flex-wrap gap-2">
            {[["유입", result.reachSuccess], ["저장", result.saveSuccess], ["댓글", result.commentSuccess], ["전환", result.conversionSuccess]].map(([label, ok]) => (
              <Tag key={String(label)} color={ok ? "green" : "slate"}>{String(label)} {ok ? "✓" : "—"}</Tag>
            ))}
            <Tag color="brand">{result.verdict}</Tag>
          </div>
          <div className="rounded-2xl bg-brand-50 p-4 text-sm font-medium text-brand-700">{result.repeat}</div>
          <div>
            <p className="mb-2 text-xs font-bold text-ink-500">추가 제작 추천 3개</p>
            <ul className="space-y-1">{result.nextIdeas.map((n, i) => <li key={i} className="flex items-start gap-2 text-sm text-ink-700"><span className="text-brand-400">→</span>{n}</li>)}</ul>
          </div>
        </div>
      )}
    </Card>
  );
}

// ── 수익화 동선 탭 ─────────────────────────────
export function MonetizationTab({ output }: { output: AppOutput }) {
  const m = output.monetizationFlow;
  return (
    <Card className="!p-6">
      <SectionTitle icon="💰" sub="조회수와 수익은 다릅니다">수익화 동선</SectionTitle>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {m.path.map((step, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700">{step}</span>
            {i < m.path.length - 1 && <span className="text-ink-300">→</span>}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {[["현재 수익모델", m.hasModel], ["콘텐츠-판매 연관성", m.contentOfferFit], ["프로필 역할", m.profileRole], ["링크 역할", m.linkRole], ["하이라이트 역할", m.highlightRole], ["DM/댓글 유도", m.dmCommentRole]].map(([k, v]) => (
          <InfoRow key={k} label={k} value={v} />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <p className="mb-2 text-xs font-bold text-rose-500">⛔ 전환을 막는 요소</p>
          <ul className="space-y-1">{m.blockers.map((b, i) => <li key={i} className="text-sm text-rose-700">· {b}</li>)}</ul>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="mb-2 text-xs font-bold text-emerald-600">✅ 개선 우선순위</p>
          <ol className="space-y-1">{m.priorities.map((b, i) => <li key={i} className="flex gap-1.5 text-sm text-emerald-700"><span className="font-bold">{i + 1}.</span>{b}</li>)}</ol>
        </div>
      </div>
    </Card>
  );
}

// ── 콘텐츠 플랜 탭 ─────────────────────────────
export function CalendarTab({ input, output }: { input: AppInput; output: AppOutput }) {
  const [days, setDays] = useState<14 | 30>(14);
  const items = useMemo(() => days === 14 ? output.calendar : generateContentCalendar(input, 30), [days, input, output]);
  const typeColors: Record<string, string> = { "재미/정보": "bg-violet-50 text-violet-700", "정보": "bg-blue-50 text-blue-700", "이야기/공감": "bg-pink-50 text-pink-700", "전환": "bg-amber-50 text-amber-700" };

  return (
    <Card className="!p-6">
      <div className="mb-4 flex items-center justify-between">
        <SectionTitle icon="📅" sub={days === 14 ? "다양한 포맷 실험 위주" : "실험 → 반복 → 전환 배치"}>
          {days}일 콘텐츠 플랜
        </SectionTitle>
        <div className="flex gap-2">
          <Pill active={days === 14} onClick={() => setDays(14)}>14일</Pill>
          <Pill active={days === 30} onClick={() => setDays(30)}>30일</Pill>
        </div>
      </div>
      <div className="space-y-2.5">
        {items.map((c) => (
          <div key={c.day} className="rounded-2xl border border-ink-100 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-7 w-10 items-center justify-center rounded-xl bg-ink-900 text-xs font-black text-white">{c.date}</span>
              <span className="text-sm font-bold text-ink-900">{c.title}</span>
              <span className={`rounded-xl px-2.5 py-0.5 text-xs font-bold ${typeColors[c.contentType] || "bg-ink-50 text-ink-600"}`}>{c.contentType}</span>
              <Tag color="slate">{c.platform}</Tag>
              <Tag color="slate">{c.difficulty}</Tag>
            </div>
            <div className="mt-2 grid grid-cols-1 gap-1.5 text-xs text-ink-600 sm:grid-cols-2">
              <span>⚡ <b>후킹</b> · {c.hook}</span>
              <span>🔄 <b>흐름</b> · {c.flow}</span>
              <span>📢 <b>CTA</b> · {c.cta}</span>
              <span>📊 <b>목표</b> · {c.goalMetric}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── AI 프롬프트 탭 ─────────────────────────────
export function PromptsTab({ output }: { output: AppOutput }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-700">
        ✨ 입력값이 반영된 프롬프트입니다. 복사해서 ChatGPT·Claude에 바로 붙여넣으세요.
      </div>
      {output.aiPrompts.map((p) => (
        <Card key={p.name} className="!p-5">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="font-black text-ink-900">{p.name}</h4>
            <CopyButton text={p.prompt} />
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-2xl bg-ink-50 p-4 text-xs leading-relaxed text-ink-600">{p.prompt}</pre>
        </Card>
      ))}
    </div>
  );
}

// ── 체크리스트 탭 ─────────────────────────────
export function ChecklistTab({ output }: { output: AppOutput }) {
  const [checked, setChecked] = useState<boolean[]>(output.checklist.map(() => false));
  const done = checked.filter(Boolean).length;

  return (
    <Card className="!p-6">
      <div className="mb-5 flex items-center justify-between">
        <SectionTitle icon="✅" sub="업로드 전에 확인하세요">업로드 전 체크리스트</SectionTitle>
        <div className="rounded-2xl bg-brand-50 px-4 py-2 text-sm font-black text-brand-600">
          {done} / {output.checklist.length}
        </div>
      </div>
      {done === output.checklist.length && done > 0 && (
        <div className="mb-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          🎉 모든 항목을 확인했습니다. 업로드할 준비가 됐어요!
        </div>
      )}
      <ul className="space-y-2.5">
        {output.checklist.map((c, i) => (
          <li key={i}>
            <label className="flex cursor-pointer items-start gap-3">
              <div
                onClick={() => setChecked((s) => s.map((v, idx) => idx === i ? !v : v))}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
                  checked[i] ? "border-brand-500 bg-brand-gradient text-white" : "border-ink-200 bg-surface"
                }`}
              >
                {checked[i] && <span className="text-xs font-black">✓</span>}
              </div>
              <span className={`text-sm font-medium leading-snug ${checked[i] ? "text-ink-400 line-through" : "text-ink-700"}`}>{c}</span>
            </label>
          </li>
        ))}
      </ul>
    </Card>
  );
}
