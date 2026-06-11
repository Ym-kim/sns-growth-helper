import { useEffect, useState } from "react";
import type { AppInput, AppOutput, BenchmarkSource } from "./lib/types";
import { buildOutputLocal } from "./lib/report";
import { generateOutputRemote } from "./lib/api";
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
  const [generating, setGenerating] = useState(false);
  // AI 생성에 실패해 로컬(규칙 기반) 결과로 대체했을 때 사용자에게 알리는 배너
  const [aiFallback, setAiFallback] = useState(false);

  useEffect(() => {
    const si = loadInput(); const so = loadOutput();
    if (si && so) { setInput(si); setOutput(so); }
  }, []);

  const start = (_mode: StartMode) => setView("wizard");

  const complete = async (i: AppInput) => {
    setInput(i); saveInput(i);
    setGenerating(true); setAiFallback(false);
    try {
      // 1차: Claude API(서버)로 맞춤 리포트 생성
      const o = await generateOutputRemote(i);
      setOutput(o); saveOutput(o);
    } catch (err) {
      // 실패 시 fallback: 규칙 기반 로컬 생성기로 결과를 만들어 앱이 멈추지 않게 한다.
      console.warn("AI 생성 실패, 로컬 fallback 사용:", err);
      const o = buildOutputLocal(i);
      setOutput(o); saveOutput(o);
      setAiFallback(true);
    } finally {
      setGenerating(false);
      setView("results");
      window.scrollTo(0, 0);
    }
  };

  const reset = () => {
    clearAll(); setInput(null); setOutput(null); setAiFallback(false); setView("landing");
  };

  // 콘텐츠 서치 결과를 벤치마킹에 추가 (보조 기능 → 로컬 재계산 사용)
  const addSearchResultsToBenchmark = (sources: BenchmarkSource[]) => {
    const base = input ?? { niche: "", goal: "", target: "", offer: "", conversionPath: "", benchmarkSources: [], advanced: {} };
    const merged: AppInput = {
      ...base,
      benchmarkSources: [...(base.benchmarkSources || []), ...sources.filter((s) => !(base.benchmarkSources || []).some((e) => e.value === s.value))],
    };
    setInput(merged); saveInput(merged);
    if (output) { const o = buildOutputLocal(merged); setOutput(o); saveOutput(o); }
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
          {view !== "wizard" && !generating && (
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
        {generating ? (
          <Generating />
        ) : (
          <>
            {view === "landing" && <Landing onStart={start} onSearch={() => setView("search")} />}
            {view === "wizard" && (
              <Wizard initial={input} onComplete={complete} onCancel={() => setView(output ? "results" : "landing")} />
            )}
            {view === "results" && input && output && (
              <Results input={input} output={output} aiFallback={aiFallback} onEdit={() => setView("wizard")} onReset={reset} />
            )}
            {view === "search" && <ContentSearch onAddToBenchmark={addSearchResultsToBenchmark} />}
          </>
        )}
      </main>

      <footer className="border-t border-ink-100 py-8 text-center text-xs text-ink-400">
        모든 점수·추천은 전략 수립용 추정값입니다 · 백엔드 없이 브라우저에 저장됩니다
      </footer>
    </div>
  );
}

// AI 리포트 생성 중 로딩 화면
function Generating() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-ink-100 border-t-brand-500" />
      <h2 className="mt-6 text-xl font-black text-ink-900">AI가 맞춤 전략 리포트를 작성 중이에요</h2>
      <p className="mt-2 text-sm text-ink-500">입력하신 분야·목표·타깃을 분석하고 있어요. 보통 10~30초 정도 걸립니다.</p>
    </div>
  );
}
