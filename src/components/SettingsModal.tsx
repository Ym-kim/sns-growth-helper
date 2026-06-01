// 전역 API 키 설정 모달. 헤더의 ⚙️ 버튼으로 열린다.
// Claude / YouTube / RapidAPI 키를 한 곳에서 관리.

import { useState } from "react";
import {
  CLAUDE_MODELS, loadClaudeKey, loadClaudeModel, saveClaudeKey, saveClaudeModel,
  type ClaudeModelId,
} from "../lib/claudeApi";
import { loadApiKeys, saveApiKeys } from "../lib/searchApi";
import { Button, Card, Collapse, Label, Pill, TextInput } from "./ui";

interface Props { onClose: () => void }

export default function SettingsModal({ onClose }: Props) {
  const [claudeKey, setClaudeKeyState] = useState(loadClaudeKey);
  const [claudeModel, setClaudeModelState] = useState<ClaudeModelId>(loadClaudeModel);
  const [apiKeys, setApiKeysState] = useState(loadApiKeys);
  const [saved, setSaved] = useState(false);

  const save = () => {
    saveClaudeKey(claudeKey);
    saveClaudeModel(claudeModel);
    saveApiKeys(apiKeys);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 800);
  };

  return (
    // 오버레이
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-12 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-slate-900">⚙️ API 키 설정</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">✕</button>
        </div>
        <p className="mb-5 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
          API 키는 브라우저(localStorage)에만 저장됩니다. 서버로 전송되지 않습니다.
        </p>

        {/* ── Claude API ─────────────────────── */}
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-brand-600" />
            <span className="font-bold text-slate-800">Claude API (분석 품질 향상)</span>
            {claudeKey && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">연결됨 ✓</span>}
          </div>

          <Label>Anthropic API 키</Label>
          <TextInput
            type="password"
            placeholder="sk-ant-api03-..."
            value={claudeKey}
            onChange={(e) => setClaudeKeyState(e.target.value)}
          />

          {claudeKey && (
            <div className="mt-2">
              <Label hint="(비용 차이 있음)">모델 선택</Label>
              <div className="flex flex-wrap gap-2">
                {CLAUDE_MODELS.map((m) => (
                  <Pill key={m.id} active={claudeModel === m.id} onClick={() => setClaudeModelState(m.id)}>
                    {m.label}
                  </Pill>
                ))}
              </div>
            </div>
          )}

          <Collapse title="Anthropic API 키 발급 방법">
            <pre className="whitespace-pre-wrap text-xs text-slate-600">{`1. https://console.anthropic.com 접속 후 가입
2. Settings → API Keys → Create Key
3. 키 복사 후 위에 붙여넣기

★ 비용 (개인 사용 기준)
  · Sonnet: 분석 1회 ≈ 120원
  · Haiku:  분석 1회 ≈ 30원
  · 하루 10분 사용 시 월 1~2만원 예상`}</pre>
          </Collapse>
        </div>

        <hr className="my-4 border-slate-200" />

        {/* ── YouTube API ─────────────────────── */}
        <div className="mb-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-red-500" />
            <span className="font-bold text-slate-800">YouTube Data API (콘텐츠 서치)</span>
            {apiKeys.youtubeApiKey && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">연결됨 ✓</span>}
          </div>
          <Label>Google API 키</Label>
          <TextInput
            type="password"
            placeholder="AIzaSy..."
            value={apiKeys.youtubeApiKey}
            onChange={(e) => setApiKeysState((k) => ({ ...k, youtubeApiKey: e.target.value }))}
          />
          <Collapse title="YouTube API 키 발급 방법">
            <pre className="whitespace-pre-wrap text-xs text-slate-600">{`1. https://console.cloud.google.com 접속
2. 새 프로젝트 생성 → 라이브러리 → YouTube Data API v3 사용 설정
3. 사용자 인증 정보 → API 키 생성
★ 무료: 하루 10,000 units (검색 1회 ≈ 100 units)`}</pre>
          </Collapse>
        </div>

        <hr className="my-4 border-slate-200" />

        {/* ── RapidAPI ─────────────────────── */}
        <div className="mb-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full bg-purple-500" />
            <span className="font-bold text-slate-800">RapidAPI (Instagram 서치)</span>
            {apiKeys.rapidApiKey && <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">연결됨 ✓</span>}
          </div>
          <Label>RapidAPI 키</Label>
          <TextInput
            type="password"
            placeholder="RapidAPI Key..."
            value={apiKeys.rapidApiKey}
            onChange={(e) => setApiKeysState((k) => ({ ...k, rapidApiKey: e.target.value }))}
          />
          <Collapse title="RapidAPI 키 발급 방법">
            <pre className="whitespace-pre-wrap text-xs text-slate-600">{`1. https://rapidapi.com 가입 (무료)
2. "Instagram Scraper API2" 검색 → Subscribe
   rapidapi.com/mrpmohiburrahman/api/instagram-scraper-api2
3. API Keys 탭 → X-RapidAPI-Key 복사
★ 무료 티어: 월 100 요청`}</pre>
          </Collapse>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>취소</Button>
          <Button onClick={save}>{saved ? "저장됨 ✓" : "저장하기"}</Button>
        </div>
      </div>
    </div>
  );
}
