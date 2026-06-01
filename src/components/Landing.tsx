import { Card, Button, Tag } from "./ui";
import { RESULT_CARDS } from "../lib/constants";

export type StartMode = "design" | "diagnose" | "benchmark";

export default function Landing({ onStart, onSearch }: { onStart: (mode: StartMode) => void; onSearch?: () => void }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-16">
      <div className="text-center">
        <Tag color="brand">SNS Growth Helper · 베타</Tag>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight text-slate-900 md:text-5xl">
          SNS 계정, 감으로 키우지 말고
          <br className="hidden md:block" /> 구조로 설계하세요.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
          운영 분야와 목표만 입력하면 팔로우할 이유, 벤치마킹 포맷, 콘텐츠 실험안,
          수익화 동선까지 분석해 드립니다.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button onClick={() => onStart("design")} className="w-full sm:w-auto">
            내 계정 설계하기
          </Button>
          <Button variant="outline" onClick={() => onStart("diagnose")} className="w-full sm:w-auto">
            기존 계정 진단하기
          </Button>
          <Button variant="outline" onClick={onSearch} className="w-full sm:w-auto">
            🔍 인기 콘텐츠 서치
          </Button>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          필수 입력은 5개 이하 · 자료가 없어도 분석이 진행됩니다
        </p>
      </div>

      <div className="mt-12">
        <h2 className="mb-4 text-center text-sm font-semibold uppercase tracking-wide text-slate-400">
          이런 결과물을 받습니다
        </h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {RESULT_CARDS.map((c) => (
            <Card key={c.title} className="!p-4">
              <div className="text-sm font-bold text-slate-900">{c.title}</div>
              <div className="mt-1 text-xs text-slate-500">{c.desc}</div>
            </Card>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-slate-400">
        모든 점수·추천은 전략 수립을 위한 추정값입니다. 알고리즘은 시점에 따라 바뀌므로
        제안은 실험 가설로 보고 반응을 확인하며 조정하세요. 조회수보다 목적에 맞는 행동과
        전환 동선이 함께 설계되는 것이 중요합니다.
      </p>
    </div>
  );
}
