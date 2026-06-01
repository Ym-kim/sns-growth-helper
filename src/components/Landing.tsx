import { Button, Tag } from "./ui";
import { RESULT_CARDS } from "../lib/constants";

export type StartMode = "design" | "diagnose" | "benchmark";

const CARD_ICONS = ["💡", "❤️", "📱", "🎬", "🔍", "📅", "💰", "✏️", "🤖"];

export default function Landing({
  onStart, onSearch,
}: {
  onStart: (mode: StartMode) => void;
  onSearch?: () => void;
}) {
  return (
    <div className="overflow-x-hidden">
      {/* ── Hero ──────────────────────────────── */}
      <section className="relative px-4 pb-20 pt-16 md:pb-28 md:pt-24">
        {/* 배경 그래디언트 블롭 */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-brand-50 opacity-60 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-[400px] w-[400px] rounded-full bg-rose-50 opacity-50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* 배지 */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5">
            <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
            <span className="text-xs font-bold tracking-wide text-brand-600">SNS Growth Helper · 무료 베타</span>
          </div>

          {/* 헤드라인 */}
          <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-ink-900 md:text-6xl">
            SNS 계정,{" "}
            <span className="gradient-text">감으로 키우지 말고</span>
            <br />
            구조로 설계하세요.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-500 md:text-lg">
            운영 분야와 목표만 입력하면{" "}
            <strong className="text-ink-700">팔로우할 이유 · 벤치마킹 포맷 · 콘텐츠 실험안 · 수익화 동선</strong>을
            한 번에 설계해 드립니다.
          </p>

          {/* CTA 버튼 */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button onClick={() => onStart("design")} className="w-full !px-8 !py-3.5 text-base sm:w-auto">
              내 계정 설계 시작하기 →
            </Button>
            <button
              onClick={onSearch}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-ink-100 bg-surface px-6 py-3 text-sm font-bold text-ink-600 transition hover:border-brand-200 hover:text-brand-600 sm:w-auto"
            >
              🔍 인기 콘텐츠 서치
            </button>
          </div>

          <p className="mt-4 text-xs text-ink-400">
            필수 입력 5개 이하 · 자료 없어도 바로 분석 · 무료
          </p>
        </div>
      </section>

      {/* ── 소셜 프루프 라인 ──────────────────── */}
      <div className="border-y border-ink-100 bg-surface py-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4">
          {["팔로우할 이유 진단", "콘텐츠 포맷 실험", "수익화 동선 설계", "AI 프롬프트 생성", "벤치마킹 분석"].map((t) => (
            <div key={t} className="flex items-center gap-1.5 text-sm text-ink-500">
              <span className="text-brand-500">✓</span>
              <span className="font-medium">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 결과 카드 그리드 ──────────────────── */}
      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <Tag color="brand">결과물 미리보기</Tag>
            <h2 className="mt-3 text-2xl font-black text-ink-900 md:text-3xl">
              한 번 입력으로 받는 9가지 전략
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {RESULT_CARDS.map((c, i) => (
              <div
                key={c.title}
                className="group rounded-3xl border border-ink-100 bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient-soft text-lg">
                  {CARD_ICONS[i]}
                </div>
                <div className="text-sm font-bold text-ink-900">{c.title}</div>
                <div className="mt-1 text-xs leading-relaxed text-ink-500">{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 사용법 3단계 ──────────────────────── */}
      <section className="bg-surface px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-black text-ink-900 md:text-3xl">3분이면 충분합니다</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { step: "01", title: "분야와 목표 입력", desc: "운영 분야, 계정 목표, 타깃 3가지만 고르면 됩니다.", emoji: "✏️" },
              { step: "02", title: "수익화 방향 선택", desc: "판매할 것과 전환 경로를 선택합니다. 없어도 괜찮아요.", emoji: "💰" },
              { step: "03", title: "전략 리포트 수령", desc: "9가지 분석 결과를 탭으로 확인하고 바로 실행하세요.", emoji: "🚀" },
            ].map((s) => (
              <div key={s.step} className="relative rounded-3xl border border-ink-100 bg-canvas p-6">
                <div className="mb-4 text-3xl">{s.emoji}</div>
                <div className="mb-1 text-xs font-bold tracking-widest text-brand-500">STEP {s.step}</div>
                <div className="text-base font-bold text-ink-900">{s.title}</div>
                <div className="mt-1.5 text-sm leading-relaxed text-ink-500">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 하단 CTA ──────────────────────────── */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="rounded-4xl bg-brand-gradient p-10 text-white shadow-btn-primary">
            <h2 className="text-2xl font-black md:text-3xl">지금 바로 설계해보세요</h2>
            <p className="mt-3 text-sm leading-relaxed opacity-80">
              특정 브랜드·인물에 종속되지 않는 범용 도구입니다. 모든 결과는 전략 수립용
              추정값으로, 반응을 보며 조정하세요.
            </p>
            <button
              onClick={() => onStart("design")}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-sm font-black text-brand-600 transition hover:scale-105"
            >
              무료로 시작하기 →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
