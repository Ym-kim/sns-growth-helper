import { useState } from "react";
import type { AppInput, BenchmarkSource, BenchmarkSourceType } from "../lib/types";
import {
  NICHE_OPTIONS, GOAL_OPTIONS, OFFER_OPTIONS, CONVERSION_PATHS,
  PLATFORM_OPTIONS, WEEKLY_TIME_OPTIONS, BENCHMARK_SOURCE_LABELS,
} from "../lib/constants";
import { Button, Card, Collapse, Label, Pill, TextArea, TextInput } from "./ui";

const STEPS = ["내 계정 방향", "수익화 / 전환", "벤치마킹 자료"];

const emptyInput: AppInput = {
  niche: "", goal: "", target: "", offer: "", conversionPath: "",
  benchmarkSources: [], advanced: {},
};

export default function Wizard({
  initial, onComplete, onCancel,
}: {
  initial?: AppInput | null;
  onComplete: (input: AppInput) => void;
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);
  const [input, setInput] = useState<AppInput>(initial ?? emptyInput);

  const set = (patch: Partial<AppInput>) => setInput((p) => ({ ...p, ...patch }));
  const setAdv = (patch: Partial<NonNullable<AppInput["advanced"]>>) =>
    setInput((p) => ({ ...p, advanced: { ...p.advanced, ...patch } }));

  const canNext =
    step === 0 ? input.niche.trim() && input.goal && input.target.trim()
    : true;

  const next = () => (step < 2 ? setStep(step + 1) : onComplete(input));
  const back = () => (step > 0 ? setStep(step - 1) : onCancel());

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i <= step ? "bg-brand-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {i + 1}
            </div>
            <span className={`text-xs font-medium ${i === step ? "text-slate-900" : "text-slate-400"}`}>{s}</span>
            {i < STEPS.length - 1 && <div className="h-px flex-1 bg-slate-200" />}
          </div>
        ))}
      </div>

      <Card>
        {step === 0 && <Step1 input={input} set={set} />}
        {step === 1 && <Step2 input={input} set={set} />}
        {step === 2 && <Step3 input={input} set={set} setAdv={setAdv} />}
      </Card>

      <div className="mt-5 flex items-center justify-between">
        <Button variant="ghost" onClick={back}>{step === 0 ? "취소" : "이전"}</Button>
        <Button onClick={next} className={!canNext ? "pointer-events-none opacity-50" : ""}>
          {step < 2 ? "다음" : "분석 결과 보기"}
        </Button>
      </div>
      {step === 0 && !canNext && (
        <p className="mt-2 text-right text-xs text-slate-400">분야 · 목표 · 타깃은 필수입니다</p>
      )}
    </div>
  );
}

function Step1({ input, set }: { input: AppInput; set: (p: Partial<AppInput>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Label hint="(필수)">운영 분야</Label>
        <div className="mb-2 flex flex-wrap gap-2">
          {NICHE_OPTIONS.map((n) => (
            <Pill key={n} active={input.niche === n} onClick={() => set({ niche: n })}>{n}</Pill>
          ))}
        </div>
        <TextInput placeholder="직접 입력 (예: 홈카페, 캠핑 등)" value={input.niche}
          onChange={(e) => set({ niche: e.target.value })} />
      </div>

      <div>
        <Label hint="(필수)">계정 목표</Label>
        <div className="flex flex-wrap gap-2">
          {GOAL_OPTIONS.map((g) => (
            <Pill key={g} active={input.goal === g} onClick={() => set({ goal: g })}>{g}</Pill>
          ))}
        </div>
      </div>

      <div>
        <Label hint="(필수)">타깃</Label>
        <TextInput placeholder="예: 20대 직장인, 초보 창업자, 반려동물 보호자"
          value={input.target} onChange={(e) => set({ target: e.target.value })} />
      </div>
    </div>
  );
}

function Step2({ input, set }: { input: AppInput; set: (p: Partial<AppInput>) => void }) {
  return (
    <div className="space-y-5">
      <div>
        <Label hint="(선택)">판매하거나 연결하고 싶은 것</Label>
        <div className="flex flex-wrap gap-2">
          {OFFER_OPTIONS.map((o) => (
            <Pill key={o} active={input.offer === o} onClick={() => set({ offer: o })}>{o}</Pill>
          ))}
        </div>
      </div>
      <div>
        <Label hint="(선택)">전환 방식</Label>
        <div className="flex flex-wrap gap-2">
          {CONVERSION_PATHS.map((c) => (
            <Pill key={c} active={input.conversionPath === c} onClick={() => set({ conversionPath: c })}>{c}</Pill>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          조회수와 수익은 다릅니다. 연결할 대상이 없어도 무료자료 동선부터 설계해 드립니다.
        </p>
      </div>
    </div>
  );
}

function Step3({
  input, set, setAdv,
}: {
  input: AppInput;
  set: (p: Partial<AppInput>) => void;
  setAdv: (p: Partial<NonNullable<AppInput["advanced"]>>) => void;
}) {
  const [type, setType] = useState<BenchmarkSourceType>("manual_text");
  const [val, setVal] = useState("");
  const [note, setNote] = useState("");

  const addSource = () => {
    if (!val.trim() && !note.trim()) return;
    const s: BenchmarkSource = { type, value: val.trim(), note: note.trim() || undefined };
    set({ benchmarkSources: [...input.benchmarkSources, s] });
    setVal(""); setNote("");
  };
  const removeSource = (i: number) =>
    set({ benchmarkSources: input.benchmarkSources.filter((_, idx) => idx !== i) });

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // MVP: OCR/Vision 연결 전이므로 파일명만 기록하고 설명 입력을 권장
    set({ benchmarkSources: [...input.benchmarkSources, { type: "screenshot", value: f.name, note: note.trim() || undefined }] });
    setNote("");
  };

  const adv = input.advanced || {};

  return (
    <div className="space-y-5">
      <div>
        <Label hint="(선택 · 없어도 분석됩니다)">벤치마킹 자료 추가</Label>
        <div className="mb-3 flex flex-wrap gap-2">
          {(Object.keys(BENCHMARK_SOURCE_LABELS) as BenchmarkSourceType[])
            .filter((t) => t !== "csv_import")
            .map((t) => (
              <Pill key={t} active={type === t} onClick={() => setType(t)}>{BENCHMARK_SOURCE_LABELS[t]}</Pill>
            ))}
        </div>

        {type === "screenshot" ? (
          <div className="space-y-2">
            <TextArea rows={2} placeholder="스크린샷에 담긴 내용을 한 줄로 설명해 주세요 (분석 정확도↑)"
              value={note} onChange={(e) => setNote(e.target.value)} />
            <input type="file" accept="image/*" onChange={onFile} className="text-sm" />
            <p className="text-xs text-slate-400">※ MVP에서는 이미지 자동 분석(OCR/Vision) 대신 설명 기반으로 분석합니다.</p>
          </div>
        ) : type === "caption_script" || type === "manual_text" ? (
          <TextArea rows={4}
            placeholder={type === "caption_script" ? "콘텐츠 캡션 / 자막 / 대본을 붙여넣으세요" : "잘 됐다고 생각하는 콘텐츠를 설명해 주세요"}
            value={val} onChange={(e) => setVal(e.target.value)} />
        ) : (
          <div className="space-y-2">
            <TextInput placeholder={type === "url" ? "콘텐츠 URL (Instagram/YouTube/TikTok/Threads/Blog)" : "계정 아이디 (@ 제외)"}
              value={val} onChange={(e) => setVal(e.target.value)} />
            <TextArea rows={2} placeholder="(권장) 캡션이나 본 내용을 간단히 붙여넣으면 더 정확히 분석합니다"
              value={note} onChange={(e) => setNote(e.target.value)} />
            <p className="text-xs text-slate-400">※ 비공개 접근·로그인 우회 없이, 공개 정보와 직접 입력 내용으로만 분석합니다.</p>
          </div>
        )}

        {type !== "screenshot" && (
          <Button variant="outline" onClick={addSource} className="mt-2 !py-1.5 text-xs">+ 자료 추가</Button>
        )}

        {input.benchmarkSources.length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {input.benchmarkSources.map((s, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
                <span className="truncate text-slate-600">
                  [{BENCHMARK_SOURCE_LABELS[s.type]}] {s.value || s.note}
                </span>
                <button onClick={() => removeSource(i)} className="ml-2 text-slate-400 hover:text-rose-500">삭제</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Collapse title="고급 설정 (더 정확한 분석을 원하면)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>현재 팔로워 수</Label>
            <TextInput type="number" value={adv.followerCount ?? ""}
              onChange={(e) => setAdv({ followerCount: e.target.value ? Number(e.target.value) : undefined })} />
          </div>
          <div>
            <Label>선호 플랫폼</Label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORM_OPTIONS.map((p) => (
                <Pill key={p} active={adv.preferredPlatform === p} onClick={() => setAdv({ preferredPlatform: p })}>{p}</Pill>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label>현재 계정 소개글</Label>
            <TextArea rows={2} value={adv.profileBio ?? ""} onChange={(e) => setAdv({ profileBio: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label hint="(쉼표로 구분)">최근 콘텐츠 주제 3개</Label>
            <TextInput value={(adv.recentTopics || []).join(", ")}
              onChange={(e) => setAdv({ recentTopics: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
          </div>
          <div>
            <Label>주당 제작 가능 시간</Label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKLY_TIME_OPTIONS.map((w) => (
                <Pill key={w} active={adv.weeklyTime === w} onClick={() => setAdv({ weeklyTime: w })}>{w}</Pill>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-6">
            <Toggle label="얼굴 노출 가능" checked={adv.canShowFace !== false} onChange={(v) => setAdv({ canShowFace: v })} />
            <Toggle label="영상 제작 가능" checked={adv.canMakeVideo !== false} onChange={(v) => setAdv({ canMakeVideo: v })} />
            <Toggle label="링크/판매페이지 보유" checked={adv.hasLinkPage === true} onChange={(v) => setAdv({ hasLinkPage: v })} />
          </div>
          <div className="sm:col-span-2">
            <Label>가장 잘된 콘텐츠 설명</Label>
            <TextArea rows={2} value={adv.bestContent ?? ""} onChange={(e) => setAdv({ bestContent: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>가장 반응 없던 콘텐츠 설명</Label>
            <TextArea rows={2} value={adv.worstContent ?? ""} onChange={(e) => setAdv({ worstContent: e.target.value })} />
          </div>
        </div>
      </Collapse>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-slate-300 text-brand-600" />
      {label}
    </label>
  );
}
