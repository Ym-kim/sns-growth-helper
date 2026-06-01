import { useState } from "react";
import type { AppInput, BenchmarkSource, BenchmarkSourceType } from "../lib/types";
import { NICHE_OPTIONS, GOAL_OPTIONS, OFFER_OPTIONS, CONVERSION_PATHS, PLATFORM_OPTIONS, WEEKLY_TIME_OPTIONS, BENCHMARK_SOURCE_LABELS } from "../lib/constants";
import { Button, Card, Collapse, Label, Pill, TextArea, TextInput } from "./ui";

const STEPS = [
  { num: 1, title: "내 계정 방향",    icon: "🎯" },
  { num: 2, title: "수익화 / 전환",   icon: "💰" },
  { num: 3, title: "벤치마킹 자료",   icon: "🔍" },
];

const emptyInput: AppInput = { niche: "", goal: "", target: "", offer: "", conversionPath: "", benchmarkSources: [], advanced: {} };

export default function Wizard({ initial, onComplete, onCancel }: { initial?: AppInput | null; onComplete: (i: AppInput) => void; onCancel: () => void }) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<AppInput>(initial ?? emptyInput);
  const set = (p: Partial<AppInput>) => setInput((prev) => ({ ...prev, ...p }));
  const setAdv = (p: Partial<NonNullable<AppInput["advanced"]>>) => setInput((prev) => ({ ...prev, advanced: { ...prev.advanced, ...p } }));
  const canNext = step === 0 ? !!(input.niche.trim() && input.goal && input.target.trim()) : true;

  const next = () => step < 2 ? setStep(step + 1) : onComplete(input);
  const back = () => step > 0 ? setStep(step - 1) : onCancel();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Stepper */}
      <div className="mb-8 flex items-start justify-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-lg font-black transition-all ${
                i < step ? "bg-emerald-100 text-emerald-600" :
                i === step ? "bg-brand-gradient text-white shadow-btn-primary" :
                "bg-ink-100 text-ink-400"
              }`}>
                {i < step ? "✓" : s.icon}
              </div>
              <span className={`text-xs font-bold ${i === step ? "text-brand-600" : "text-ink-400"}`}>
                {s.title}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mb-6 h-0.5 w-12 rounded-full transition-all md:w-20 ${i < step ? "bg-emerald-300" : "bg-ink-100"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Card */}
      <Card className="!p-7">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-lg">
            {STEPS[step].icon}
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-brand-500">Step {step + 1} / 3</div>
            <div className="text-lg font-black text-ink-900">{STEPS[step].title}</div>
          </div>
        </div>

        {step === 0 && <Step1 input={input} set={set} />}
        {step === 1 && <Step2 input={input} set={set} />}
        {step === 2 && <Step3 input={input} set={set} setAdv={setAdv} />}
      </Card>

      {/* Actions */}
      <div className="mt-5 flex items-center justify-between">
        <button onClick={back} className="rounded-xl px-4 py-2.5 text-sm font-bold text-ink-500 transition hover:bg-ink-50">
          {step === 0 ? "← 취소" : "← 이전"}
        </button>
        <div className="flex flex-col items-end gap-1">
          <Button onClick={next} disabled={!canNext}>
            {step < 2 ? "다음 단계 →" : "✨ 분석 결과 보기"}
          </Button>
          {step === 0 && !canNext && (
            <span className="text-xs text-ink-400">분야 · 목표 · 타깃은 필수예요</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Step1({ input, set }: { input: AppInput; set: (p: Partial<AppInput>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <Label hint="필수">운영 분야</Label>
        <div className="mb-3 flex flex-wrap gap-2">
          {NICHE_OPTIONS.map((n) => (
            <Pill key={n} active={input.niche === n} onClick={() => set({ niche: n })}>{n}</Pill>
          ))}
        </div>
        <TextInput placeholder="직접 입력 (예: 홈카페, 미니멀 라이프…)" value={input.niche}
          onChange={(e) => set({ niche: e.target.value })} />
      </div>

      <div>
        <Label hint="필수">계정 목표</Label>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((g) => (
            <Pill key={g} active={input.goal === g} onClick={() => set({ goal: g })}>{g}</Pill>
          ))}
        </div>
      </div>

      <div>
        <Label hint="필수">타깃</Label>
        <TextInput placeholder="예: 20대 직장인, 초보 창업자, 반려동물 보호자"
          value={input.target} onChange={(e) => set({ target: e.target.value })} />
        <p className="mt-2 text-xs text-ink-400">구체적일수록 분석 정확도가 높아집니다</p>
      </div>
    </div>
  );
}

function Step2({ input, set }: { input: AppInput; set: (p: Partial<AppInput>) => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-700">
        💡 조회수와 수익은 달라요. 연결할 대상이 없어도 <strong>무료자료 동선</strong>부터 설계해 드립니다.
      </div>

      <div>
        <Label hint="선택">판매하거나 연결하고 싶은 것</Label>
        <div className="flex flex-wrap gap-2">
          {OFFER_OPTIONS.map((o) => (
            <Pill key={o} active={input.offer === o} onClick={() => set({ offer: o })}>{o}</Pill>
          ))}
        </div>
      </div>

      <div>
        <Label hint="선택">전환 방식</Label>
        <div className="flex flex-wrap gap-2">
          {CONVERSION_PATHS.map((c) => (
            <Pill key={c} active={input.conversionPath === c} onClick={() => set({ conversionPath: c })}>{c}</Pill>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3({ input, set, setAdv }: { input: AppInput; set: (p: Partial<AppInput>) => void; setAdv: (p: Partial<NonNullable<AppInput["advanced"]>>) => void }) {
  const [type, setType] = useState<BenchmarkSourceType>("manual_text");
  const [val, setVal] = useState("");
  const [note, setNote] = useState("");

  const addSource = () => {
    if (!val.trim() && !note.trim()) return;
    set({ benchmarkSources: [...input.benchmarkSources, { type, value: val.trim(), note: note.trim() || undefined }] });
    setVal(""); setNote("");
  };
  const removeSource = (i: number) => set({ benchmarkSources: input.benchmarkSources.filter((_, idx) => idx !== i) });
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    set({ benchmarkSources: [...input.benchmarkSources, { type: "screenshot", value: f.name, note: note.trim() || undefined }] });
    setNote("");
  };

  const adv = input.advanced || {};

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-ink-50 p-4 text-sm text-ink-600">
        📌 자료가 없어도 괜찮아요. 분야와 목표 기반으로 <strong>키워드·포맷 추천</strong>을 제공합니다.
      </div>

      <div>
        <Label hint="선택">벤치마킹 자료 유형</Label>
        <div className="mb-3 flex flex-wrap gap-2">
          {(Object.keys(BENCHMARK_SOURCE_LABELS) as BenchmarkSourceType[]).filter((t) => t !== "csv_import").map((t) => (
            <Pill key={t} active={type === t} onClick={() => setType(t)}>{BENCHMARK_SOURCE_LABELS[t]}</Pill>
          ))}
        </div>

        {type === "screenshot" ? (
          <div className="space-y-2">
            <TextArea rows={2} placeholder="스크린샷 내용을 한 줄 설명해 주세요 (분석 정확도↑)" value={note} onChange={(e) => setNote(e.target.value)} />
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-ink-200 px-4 py-3 transition hover:border-brand-300">
              <span className="text-lg">📷</span>
              <span className="text-sm font-medium text-ink-500">파일 선택</span>
              <input type="file" accept="image/*" onChange={onFile} className="sr-only" />
            </label>
          </div>
        ) : type === "caption_script" || type === "manual_text" ? (
          <TextArea rows={4} placeholder={type === "caption_script" ? "캡션 / 자막 / 대본을 붙여넣으세요" : "잘 됐다고 생각하는 콘텐츠를 설명해 주세요"} value={val} onChange={(e) => setVal(e.target.value)} />
        ) : (
          <div className="space-y-2">
            <TextInput placeholder={type === "url" ? "콘텐츠 URL 붙여넣기" : "계정 아이디 (@ 제외)"} value={val} onChange={(e) => setVal(e.target.value)} />
            <TextArea rows={2} placeholder="(권장) 내용이나 캡션을 추가하면 더 정확히 분석합니다" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        )}

        {type !== "screenshot" && (
          <button onClick={addSource} className="mt-2.5 flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-600 transition hover:bg-brand-100">
            + 자료 추가
          </button>
        )}

        {input.benchmarkSources.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {input.benchmarkSources.map((s, i) => (
              <li key={i} className="flex items-center justify-between rounded-xl bg-ink-50 px-3.5 py-2.5 text-xs">
                <span className="truncate font-medium text-ink-600">[{BENCHMARK_SOURCE_LABELS[s.type]}] {s.value || s.note}</span>
                <button onClick={() => removeSource(i)} className="ml-2 text-ink-400 hover:text-rose-500">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Collapse title="⚙️ 고급 설정 (더 정확한 분석을 원하면)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div><Label>현재 팔로워 수</Label><TextInput type="number" value={adv.followerCount ?? ""} onChange={(e) => setAdv({ followerCount: e.target.value ? Number(e.target.value) : undefined })} /></div>
          <div>
            <Label>선호 플랫폼</Label>
            <div className="flex flex-wrap gap-1.5">{PLATFORM_OPTIONS.map((p) => <Pill key={p} active={adv.preferredPlatform === p} onClick={() => setAdv({ preferredPlatform: p })}>{p}</Pill>)}</div>
          </div>
          <div className="sm:col-span-2"><Label>현재 계정 소개글</Label><TextArea rows={2} value={adv.profileBio ?? ""} onChange={(e) => setAdv({ profileBio: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label hint="쉼표로 구분">최근 콘텐츠 주제 3개</Label><TextInput value={(adv.recentTopics || []).join(", ")} onChange={(e) => setAdv({ recentTopics: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></div>
          <div>
            <Label>주당 제작 가능 시간</Label>
            <div className="flex flex-wrap gap-1.5">{WEEKLY_TIME_OPTIONS.map((w) => <Pill key={w} active={adv.weeklyTime === w} onClick={() => setAdv({ weeklyTime: w })}>{w}</Pill>)}</div>
          </div>
          <div className="flex flex-col justify-end gap-3">
            {[{ label: "얼굴 노출 가능", key: "canShowFace" as const, val: adv.canShowFace !== false }, { label: "영상 제작 가능", key: "canMakeVideo" as const, val: adv.canMakeVideo !== false }, { label: "링크/판매페이지 보유", key: "hasLinkPage" as const, val: adv.hasLinkPage === true }].map((t) => (
              <label key={t.key} className="flex cursor-pointer items-center gap-2.5">
                <div onClick={() => setAdv({ [t.key]: !t.val })} className={`relative h-5 w-9 rounded-full transition-colors ${t.val ? "bg-brand-500" : "bg-ink-200"}`}>
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${t.val ? "left-4" : "left-0.5"}`} />
                </div>
                <span className="text-sm font-medium text-ink-700">{t.label}</span>
              </label>
            ))}
          </div>
          <div><Label>잘된 콘텐츠 설명</Label><TextArea rows={2} value={adv.bestContent ?? ""} onChange={(e) => setAdv({ bestContent: e.target.value })} /></div>
          <div><Label>반응 없던 콘텐츠</Label><TextArea rows={2} value={adv.worstContent ?? ""} onChange={(e) => setAdv({ worstContent: e.target.value })} /></div>
        </div>
      </Collapse>
    </div>
  );
}
