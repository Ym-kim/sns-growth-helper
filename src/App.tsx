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

  // 새로고침해도 직전 결과 복원
  useEffect(() => {
    const savedInput = loadInput();
    const savedOutput = loadOutput();
    if (savedInput && savedOutput) {
      setInput(savedInput);
      setOutput(savedOutput);
    }
  }, []);

  const start = (_mode: StartMode) => {
    setView("wizard");
  };

  const complete = (i: AppInput) => {
    const o = buildOutput(i);
    setInput(i);
    setOutput(o);
    saveInput(i);
    saveOutput(o);
    setView("results");
    window.scrollTo(0, 0);
  };

  const reset = () => {
    clearAll();
    setInput(null);
    setOutput(null);
    setView("landing");
  };

  // 서치 결과를 벤치마킹 소스에 추가 → 위저드를 다시 열어 반영
  const addSearchResultsToBenchmark = (sources: BenchmarkSource[]) => {
    const base = input ?? {
      niche: "", goal: "", target: "", offer: "",
      conversionPath: "", benchmarkSources: [], advanced: {},
    };
    const merged: AppInput = {
      ...base,
      benchmarkSources: [
        ...(base.benchmarkSources || []),
        ...sources.filter(
          (s) => !(base.benchmarkSources || []).some((e) => e.value === s.value)
        ),
      ],
    };
    setInput(merged);
    saveInput(merged);
    // 이미 결과가 있으면 재분석
    if (output) {
      const o = buildOutput(merged);
      setOutput(o);
      saveOutput(o);
    }
  };

  const navItems: { label: string; view: View; active: boolean }[] = [
    { label: "계정 설계", view: "landing", active: view === "landing" || view === "wizard" },
    { label: "인기 콘텐츠 서치", view: "search", active: view === "search" },
    ...(output ? [{ label: "전략 리포트", view: "results" as View, active: view === "results" }] : []),
  ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-4 py-3">
          {/* 로고 */}
          <button
            onClick={() => setView("landing")}
            className="flex shrink-0 items-center gap-2"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">S</span>
            <span className="hidden font-extrabold text-slate-900 sm:block">SNS Growth Helper</span>
          </button>

          {/* 네비게이션 */}
          <nav className="flex flex-1 items-center gap-1">
            {navItems.map((n) => (
              <button
                key={n.view}
                onClick={() => setView(n.view)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  n.active
                    ? "bg-brand-600 text-white"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main>
        {view === "landing" && <Landing onStart={start} onSearch={() => setView("search")} />}
        {view === "wizard" && (
          <Wizard
            initial={input}
            onComplete={complete}
            onCancel={() => setView(output ? "results" : "landing")}
          />
        )}
        {view === "results" && input && output && (
          <Results
            input={input}
            output={output}
            onEdit={() => setView("wizard")}
            onReset={reset}
          />
        )}
        {view === "search" && (
          <ContentSearch onAddToBenchmark={addSearchResultsToBenchmark} />
        )}
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        모든 점수·추천은 전략 수립용 추정값입니다 · 백엔드 없이 브라우저(localStorage)에 저장됩니다
      </footer>
    </div>
  );
}
