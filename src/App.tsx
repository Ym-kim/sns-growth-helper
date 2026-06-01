import { useEffect, useState } from "react";
import type { AppInput, AppOutput, BenchmarkSource } from "./lib/types";
import { buildOutput } from "./lib/report";
import { clearAll, loadInput, loadOutput, saveInput, saveOutput } from "./lib/storage";
import { loadClaudeKey } from "./lib/claudeApi";
import Landing, { type StartMode } from "./components/Landing";
import Wizard from "./components/Wizard";
import Results from "./components/Results";
import ContentSearch from "./components/ContentSearch";
import SettingsModal from "./components/SettingsModal";

type View = "landing" | "wizard" | "results" | "search";

export default function App() {
  const [view, setView] = useState<View>("landing");
  const [input, setInput] = useState<AppInput | null>(null);
  const [output, setOutput] = useState<AppOutput | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // 분석 로딩 상태
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState("");
  const [claudeError, setClaudeError] = useState<string | null>(null);
  const [usedClaude, setUsedClaude] = useState(false);

  // 새로고침해도 직전 결과 복원
  useEffect(() => {
    const savedInput = loadInput();
    const savedOutput = loadOutput();
    if (savedInput && savedOutput) {
      setInput(savedInput);
      setOutput(savedOutput);
    }
  }, []);

  const start = (_mode: StartMode) => setView("wizard");

  const complete = async (i: AppInput) => {
    setInput(i);
    saveInput(i);
    setAnalyzing(true);
    setClaudeError(null);
    setView("results");
    window.scrollTo(0, 0);

    const { output: o, usedClaude: uc, claudeError: ce } = await buildOutput(i, setAnalyzeProgress);
    setOutput(o);
    saveOutput(o);
    setUsedClaude(uc);
    setClaudeError(ce || null);
    setAnalyzing(false);
    setAnalyzeProgress("");
  };

  const reset = () => {
    clearAll();
    setInput(null);
    setOutput(null);
    setUsedClaude(false);
    setClaudeError(null);
    setView("landing");
  };

  const addSearchResultsToBenchmark = (sources: BenchmarkSource[]) => {
    const base = input ?? { niche: "", goal: "", target: "", offer: "", conversionPath: "", benchmarkSources: [], advanced: {} };
    const merged: AppInput = {
      ...base,
      benchmarkSources: [
        ...(base.benchmarkSources || []),
        ...sources.filter((s) => !(base.benchmarkSources || []).some((e) => e.value === s.value)),
      ],
    };
    setInput(merged);
    saveInput(merged);
    if (output) {
      buildOutput(merged).then(({ output: o }) => { setOutput(o); saveOutput(o); });
    }
  };

  const hasClaudeKey = !!loadClaudeKey();

  const navItems: { label: string; view: View; active: boolean }[] = [
    { label: "계정 설계", view: "landing", active: view === "landing" || view === "wizard" },
    { label: "인기 콘텐츠 서치", view: "search", active: view === "search" },
    ...(output ? [{ label: "전략 리포트", view: "results" as View, active: view === "results" }] : []),
  ];

  return (
    <div className="min-h-screen">
      {/* 헤더 */}
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3">
          <button onClick={() => setView("landing")} className="flex shrink-0 items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">S</span>
            <span className="hidden font-extrabold text-slate-900 sm:block">SNS Growth Helper</span>
          </button>

          <nav className="flex flex-1 items-center gap-1">
            {navItems.map((n) => (
              <button key={n.view} onClick={() => setView(n.view)}
                className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
                  n.active ? "bg-brand-600 text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}>
                {n.label}
              </button>
            ))}
          </nav>

          {/* 설정 버튼 */}
          <button onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            ⚙️ API 설정
            {hasClaudeKey && <span className="h-2 w-2 rounded-full bg-emerald-500" />}
          </button>
        </div>
      </header>

      <main>
        {view === "landing" && <Landing onStart={start} onSearch={() => setView("search")} />}
        {view === "wizard" && (
          <Wizard initial={input} onComplete={complete} onCancel={() => setView(output ? "results" : "landing")} />
        )}
        {view === "results" && (
          <>
            {analyzing ? (
              <AnalyzingScreen message={analyzeProgress} hasClaudeKey={hasClaudeKey} />
            ) : output && input ? (
              <>
                {/* Claude 사용 여부 배지 */}
                <div className={`border-b px-4 py-2 text-xs ${usedClaude ? "border-brand-200 bg-brand-50 text-brand-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                  <div className="mx-auto max-w-5xl flex items-center gap-2">
                    {usedClaude ? (
                      <>✨ <b>Claude AI</b>로 개인화 분석이 완료됐습니다.</>
                    ) : (
                      <>📋 기본 분석 결과입니다. <button onClick={() => setShowSettings(true)} className="font-semibold underline hover:text-slate-700">Claude API 키를 설정</button>하면 더 정확한 개인화 분석이 가능합니다.</>
                    )}
                    {claudeError && (
                      <span className="ml-2 text-amber-700">⚠️ Claude 오류 (rule-based 폴백): {claudeError.slice(0, 80)}</span>
                    )}
                  </div>
                </div>
                <Results input={input} output={output} onEdit={() => setView("wizard")} onReset={reset} />
              </>
            ) : null}
          </>
        )}
        {view === "search" && <ContentSearch onAddToBenchmark={addSearchResultsToBenchmark} />}
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        모든 점수·추천은 전략 수립용 추정값입니다 · 백엔드 없이 브라우저(localStorage)에 저장됩니다
      </footer>

      {/* 설정 모달 */}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  );
}

// 분석 중 로딩 화면
function AnalyzingScreen({ message, hasClaudeKey }: { message: string; hasClaudeKey: boolean }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4">
      {/* 스피너 */}
      <div className="relative flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        <span className="text-2xl">✨</span>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-extrabold text-slate-900">
          {hasClaudeKey ? "Claude가 분석 중입니다" : "분석 중입니다"}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {hasClaudeKey ? "AI가 입력값을 바탕으로 개인화된 전략을 생성하고 있어요 (10~20초)" : "결과를 생성하고 있어요…"}
        </p>
      </div>

      {message && (
        <div className="rounded-xl bg-brand-50 px-4 py-2.5 text-sm font-medium text-brand-700">
          {message}
        </div>
      )}

      <div className="mt-2 max-w-sm text-center text-xs text-slate-400">
        입력값이 구체적일수록 더 정확한 결과를 받습니다.
      </div>
    </div>
  );
}
