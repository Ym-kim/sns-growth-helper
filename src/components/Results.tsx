import { useState } from "react";
import type { AppInput, AppOutput } from "../lib/types";
import { Button, CopyButton, Tag } from "./ui";
import { SummaryTab, ConceptsTab, BenchmarkTab, FormatTab, MonetizationTab, CalendarTab, PromptsTab, ChecklistTab } from "./tabs";
import { getPlan, isTabLocked, setPlan, type Plan } from "../lib/entitlement";

const TABS = [
  { id: "요약",       icon: "📊" },
  { id: "계정 콘셉트", icon: "💡" },
  { id: "벤치마킹",   icon: "🔍" },
  { id: "콘텐츠 포맷", icon: "🎬" },
  { id: "수익화 동선", icon: "💰" },
  { id: "콘텐츠 플랜", icon: "📅" },
  { id: "AI 프롬프트", icon: "🤖" },
  { id: "체크리스트",  icon: "✅" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function Results({ input, output, aiFallback, onEdit, onReset }: { input: AppInput; output: AppOutput; aiFallback?: boolean; onEdit: () => void; onReset: () => void }) {
  const [tab, setTab] = useState<TabId>("요약");
  // TEMP (Phase 1): 결제 미연동. plan 은 localStorage 플래그일 뿐 실제 권한이 아니다.
  const [plan, setPlanState] = useState<Plan>(getPlan());
  const togglePlan = () => {
    const next: Plan = plan === "paid" ? "free" : "paid";
    setPlan(next); setPlanState(next);
  };

  const locked = isTabLocked(tab, plan);
  const isPaid = plan === "paid";

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Report Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag color="brand">전략 리포트</Tag>
            <Tag color="slate">{input.niche || "분야 미입력"}</Tag>
            {input.goal && <Tag color="slate">{input.goal}</Tag>}
            {isPaid ? <Tag color="brand">PRO</Tag> : <Tag color="slate">무료</Tag>}
          </div>
          <h1 className="mt-2 text-2xl font-black text-ink-900">SNS 계정 전략 리포트</h1>
          <p className="text-sm text-ink-500">{output.summary.direction}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* 리포트 전체 복사: 유료에서만 (무료는 잠금 안내) */}
          {isPaid ? (
            <CopyButton text={output.reportMarkdown} label="리포트 전체 복사" />
          ) : (
            <Button variant="outline" onClick={togglePlan} className="!py-2 !text-xs">🔒 전체 복사 (유료)</Button>
          )}
          <Button variant="outline" onClick={onEdit} className="!py-2 !text-xs">수정</Button>
          <Button variant="ghost" onClick={onReset} className="!py-2 !text-xs">처음부터</Button>
        </div>
      </div>

      {/* TEMP 토글: 결제 연동 전, 유료 화면 확인용 (Phase 1 한정 — 추후 제거) */}
      <button onClick={togglePlan} className="mb-3 rounded-lg border border-dashed border-ink-200 px-2.5 py-1 text-[11px] font-medium text-ink-400 hover:text-ink-600">
        [임시] 플랜 토글: 현재 <strong>{isPaid ? "유료(PRO)" : "무료"}</strong> → 클릭 시 전환
      </button>

      {/* AI 생성 실패 시 fallback 안내 */}
      {aiFallback && (
        <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-sky-50 px-4 py-3 text-xs text-sky-800">
          <span className="mt-0.5 shrink-0">ℹ️</span>
          <span>AI 맞춤 생성에 일시적으로 실패해 <strong>기본(간이) 분석 결과</strong>를 표시하고 있어요. 잠시 후 ‘수정 → 다시 분석’으로 재시도할 수 있습니다.</span>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <span className="mt-0.5 shrink-0 text-amber-500">⚠</span>
        <span>{output.summary.note}</span>
      </div>

      {/* Tab Bar */}
      <div className="sticky top-[57px] z-10 -mx-4 mb-5 border-b border-ink-100 bg-canvas/95 px-4 backdrop-blur-sm">
        <div className="flex gap-0.5 overflow-x-auto pb-0 pt-1">
          {TABS.map((t) => {
            const tabLocked = isTabLocked(t.id, plan);
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-t-xl px-3.5 py-2.5 text-sm font-bold transition-all ${
                  tab === t.id
                    ? "bg-surface text-brand-600 shadow-[0_1px_0_0_white,0_-2px_0_0_#5B3CF5] border border-b-surface border-ink-100"
                    : "text-ink-500 hover:text-ink-900"
                }`}
              >
                <span className="text-base">{t.icon}</span>
                <span className="hidden sm:block">{t.id}</span>
                {tabLocked && <span className="text-xs">🔒</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {locked ? (
          <PaywallNotice onUnlock={togglePlan} />
        ) : (
          <>
            {tab === "요약"       && <SummaryTab output={output} />}
            {tab === "계정 콘셉트" && <ConceptsTab output={output} />}
            {tab === "벤치마킹"   && <BenchmarkTab input={input} output={output} />}
            {tab === "콘텐츠 포맷" && <FormatTab output={output} />}
            {tab === "수익화 동선" && <MonetizationTab output={output} />}
            {tab === "콘텐츠 플랜" && <CalendarTab input={input} output={output} />}
            {tab === "AI 프롬프트" && <PromptsTab output={output} />}
            {tab === "체크리스트"  && <ChecklistTab output={output} />}
          </>
        )}
      </div>
    </div>
  );
}

// 무료 플랜에서 유료 탭 접근 시 보여줄 잠금 안내 (TEMP gating UI)
function PaywallNotice({ onUnlock }: { onUnlock: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 px-6 py-12 text-center">
      <div className="text-3xl">🔒</div>
      <h3 className="mt-3 text-lg font-black text-ink-900">이 섹션은 전체 리포트(유료)에서 볼 수 있어요</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
        무료 플랜에서는 <strong>요약</strong>만 제공됩니다. 콘셉트·벤치마킹·14일 플랜·수익화 동선·AI 프롬프트 등 전체 분석은 유료에서 열람할 수 있어요.
      </p>
      <div className="mt-5">
        <Button onClick={onUnlock}>전체 리포트 보기</Button>
      </div>
      <p className="mt-3 text-[11px] text-ink-400">※ 임시 화면입니다 — 결제 연동은 다음 단계에서 추가됩니다.</p>
    </div>
  );
}
