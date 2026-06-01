import { useEffect, useState } from "react";
import type { AppInput, AppOutput, BenchmarkSource } from "./lib/types";
import { buildOutput } from "./lib/report";
import { clearAll, loadInput, loadOutput, saveInput, saveOutput } from "./lib/storage";
import Landing, { type StartMode } from "./components/Landing";
import Wizard from "./components/Wizard";
import Results from "./components/Results";
import ContentSearch from "./components/ContentSearch";

type View = "landing" | "wizard" | "results" | "search";

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [input, setInput] = useState<AppInput | null>(null);
  const [output, setOutput] = useState<AppOutput | null>(null);

  useEffect(() => {
    const si = loadInput(); const so = loadOutput();
    if (si && so) { setInput(si); setOutput(so); }
  }, []);

  const start = (_mode: StartMode) => setView("wizard");

  const complete = (i: AppInput) => {
    const o = buildOutput(i);
    setInput(i); setOutput(o);
    saveInput(i); saveOutput(o);
    setView("results");
    window.scrollTo(0, 0);
  };

  const reset = () => {
    clearAll(); setInput(null); setOutput(null); setView("landing");
  };

  const addSearchResultsToBenchmark = (sources: BenchmarkSource[]) => {
    const base = input ?? { niche: "", goal: "", target: "", offer: "", conversionPath: "", benchmarkSources: [], advanced: {} };
    const merged: AppInput = {
      ...base,
      benchmarkSources: [...(base.benchmarkSources || []), ...sources.filter((s) => !(base.benchmarkSources || []).some((e) => e.value === s.value))],
    };
    setInput(merged); saveInput(merged);
    if (output) { const o = buildOutput(merged); setOutput(o); saveOutput(o); }
  };

  const navItems: { label: string; view: View; active: boolean }[] = [
    { label: "계정 설계", view: "landing", active: view === "landing" || view === "wizard" },
    { label: "콘텐츠 서치", view: "search", active: view === "search" },
    ...(output ? [{ label: "전략 리포트", view: "results" as View, active: view === "results" }] : []),
  ];

  return (
    <div className="min-h-screen bg-canvas">
      {/* ── Header ──────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-ink-100 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-5 py-3.5">
          {/* 로고 */}
          <button onClick={() => setView("landing")} className="flex shrink-0 items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-gradient text-sm font-black text-white shadow-btn-primary group-hover:scale-105 transition-transform">
              S
            </div>
            <span className="hidden text-base font-black tracking-tight text-ink-900 sm:block">
              SNS Growth Helper
            </span>
          </button>

          {/* Nav */}
          <nav className="flex flex-1 items-center gap-1">
            {navItems.map((n) => (
              <button
                key={n.view}
                onClick={() => setView(n.view)}
                className={`rounded-xl px-3.5 py-2 text-sm font-bold transition-all duration-150 ${
                  n.active
                    ? "bg-brand-gradient text-white shadow-btn-primary"
                    : "text-ink-500 hover:bg-ink-50 hover:text-ink-900"
                }`}
              >
                {n.label}
              </button>
            ))}
          </nav>

          {/* CTA */}
          {view !== "wizard" && (
            <button
              onClick={() => setView("wizard")}
              className="hidden rounded-xl bg-brand-50 px-4 py-2 text-sm font-bold text-brand-600 transition hover:bg-brand-100 sm:block"
            >
              + 새 분석
            </button>
          )}
        </div>
      </header>

      <main>
        {view === "landing" && <Landing onStart={start} onSearch={() => setView("search")} />}
        {view === "wizard" && (
          <Wizard initial={input} onComplete={complete} onCancel={() => setView(output ? "results" : "landing")} />
        )}
        {view === "results" && input && output && (
          <Results input={input} output={output} onEdit={() => setView("wizard")} onReset={reset} />
        )}
        {view === "search" && <ContentSearch onAddToBenchmark={addSearchResultsToBenchmark} />}
      </main>

      <footer className="border-t border-ink-100 py-8 text-center text-xs text-ink-400">
        모든 점수·추천은 전략 수립용 추정값입니다 · 백엔드 없이 브라우저에 저장됩니다
      </footer>
    </div>
  );
}
