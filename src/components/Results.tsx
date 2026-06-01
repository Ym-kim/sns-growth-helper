import { useState } from "react";
import type { AppInput, AppOutput } from "../lib/types";
import { Button, CopyButton, Tag } from "./ui";
import { SummaryTab, ConceptsTab, BenchmarkTab, FormatTab, MonetizationTab, CalendarTab, PromptsTab, ChecklistTab } from "./tabs";

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

export default function Results({ input, output, onEdit, onReset }: { input: AppInput; output: AppOutput; onEdit: () => void; onReset: () => void }) {
  const [tab, setTab] = useState<TabId>("요약");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Report Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Tag color="brand">전략 리포트</Tag>
            <Tag color="slate">{input.niche || "분야 미입력"}</Tag>
            {input.goal && <Tag color="slate">{input.goal}</Tag>}
          </div>
          <h1 className="mt-2 text-2xl font-black text-ink-900">SNS 계정 전략 리포트</h1>
          <p className="text-sm text-ink-500">{output.summary.direction}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <CopyButton text={output.reportMarkdown} label="리포트 전체 복사" />
          <Button variant="outline" onClick={onEdit} className="!py-2 !text-xs">수정</Button>
          <Button variant="ghost" onClick={onReset} className="!py-2 !text-xs">처음부터</Button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
        <span className="mt-0.5 shrink-0 text-amber-500">⚠</span>
        <span>{output.summary.note}</span>
      </div>

      {/* Tab Bar */}
      <div className="sticky top-[57px] z-10 -mx-4 mb-5 border-b border-ink-100 bg-canvas/95 px-4 backdrop-blur-sm">
        <div className="flex gap-0.5 overflow-x-auto pb-0 pt-1">
          {TABS.map((t) => (
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
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {tab === "요약"       && <SummaryTab output={output} />}
        {tab === "계정 콘셉트" && <ConceptsTab output={output} />}
        {tab === "벤치마킹"   && <BenchmarkTab input={input} output={output} />}
        {tab === "콘텐츠 포맷" && <FormatTab output={output} />}
        {tab === "수익화 동선" && <MonetizationTab output={output} />}
        {tab === "콘텐츠 플랜" && <CalendarTab input={input} output={output} />}
        {tab === "AI 프롬프트" && <PromptsTab output={output} />}
        {tab === "체크리스트"  && <ChecklistTab output={output} />}
      </div>
    </div>
  );
}
