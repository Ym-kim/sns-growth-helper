import { useState } from "react";
import type { AppInput, AppOutput } from "../lib/types";
import { Button, Card, CopyButton, Tag } from "./ui";
import {
  SummaryTab, ConceptsTab, BenchmarkTab, FormatTab,
  MonetizationTab, CalendarTab, PromptsTab, ChecklistTab,
} from "./tabs";

const TABS = [
  "요약", "계정 콘셉트", "벤치마킹", "콘텐츠 포맷",
  "수익화 동선", "콘텐츠 플랜", "AI 프롬프트", "체크리스트",
] as const;

export default function Results({
  input, output, onEdit, onReset,
}: {
  input: AppInput;
  output: AppOutput;
  onEdit: () => void;
  onReset: () => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("요약");

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">SNS 계정 전략 리포트</h1>
          <p className="text-sm text-slate-500">{output.summary.direction}</p>
        </div>
        <div className="flex gap-2">
          <CopyButton text={output.reportMarkdown} label="전략 리포트 복사하기" />
          <Button variant="outline" onClick={onEdit} className="!py-1.5 text-xs">입력 수정</Button>
          <Button variant="ghost" onClick={onReset} className="!py-1.5 text-xs">처음부터</Button>
        </div>
      </div>

      <div className="mb-3 rounded-xl bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
        {output.summary.note}
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 -mx-4 mb-5 overflow-x-auto bg-slate-50/90 px-4 py-2 backdrop-blur">
        <div className="flex gap-1.5">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                tab === t ? "bg-brand-600 text-white" : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {tab === "요약" && <SummaryTab output={output} />}
        {tab === "계정 콘셉트" && <ConceptsTab output={output} />}
        {tab === "벤치마킹" && <BenchmarkTab input={input} output={output} />}
        {tab === "콘텐츠 포맷" && <FormatTab output={output} />}
        {tab === "수익화 동선" && <MonetizationTab output={output} />}
        {tab === "콘텐츠 플랜" && <CalendarTab input={input} output={output} />}
        {tab === "AI 프롬프트" && <PromptsTab output={output} />}
        {tab === "체크리스트" && <ChecklistTab output={output} />}
      </div>
    </div>
  );
}

export { Card, Tag };
