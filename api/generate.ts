// ─────────────────────────────────────────────────────────────
// POST /api/generate  (Vercel Node Serverless Function)
//
// 변경 의도(Phase 1):
//   프론트(src/lib/api.ts)에서 받은 사용자 입력을 Claude(Sonnet 4.6)로 보내
//   AppOutput(reportMarkdown 제외) 구조의 JSON 을 non-streaming 으로 생성해 반환.
//
// 흐름:
//   Frontend → src/lib/api.ts → (이 함수) → Anthropic API → JSON 반환
//   실패(4xx/5xx/파싱오류) 시 프론트가 buildOutputLocal 로 fallback.
//
// 보안:
//   ANTHROPIC_API_KEY 는 Vercel 환경변수에서만 읽는다. 프론트에 절대 노출 금지.
//   (VITE_ 접두어를 쓰지 않으므로 프론트 번들에 포함되지 않음)
// ─────────────────────────────────────────────────────────────

import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { STRATEGY_SCHEMA, SYSTEM_PROMPT, buildUserPrompt } from "./_schema";

// 기본 모델: Sonnet 4.6 (속도/비용 균형). 더 높은 품질이 필요하면 "claude-opus-4-8" 로 교체.
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 16000;
const MAX_FIELD_LEN = 2000;

function str(v: unknown, max = MAX_FIELD_LEN): string {
  return typeof v === "string" ? v.slice(0, max) : "";
}

// /api/generate 입력값 검증 (검수 체크리스트 항목)
function validateInput(body: unknown):
  | { ok: true; input: Record<string, unknown> }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "본문이 비어 있습니다." };
  const b = body as Record<string, unknown>;

  const niche = str(b.niche);
  const goal = str(b.goal);
  const target = str(b.target);
  if (!niche.trim() || !goal.trim() || !target.trim()) {
    return { ok: false, error: "필수 입력값(분야·목표·타깃)이 누락되었습니다." };
  }

  const rawSources = Array.isArray(b.benchmarkSources) ? b.benchmarkSources : [];
  const benchmarkSources = rawSources.slice(0, 10).map((s) => {
    const o = (s && typeof s === "object" ? s : {}) as Record<string, unknown>;
    return { type: str(o.type, 40), value: str(o.value), note: str(o.note) };
  });

  const advanced =
    b.advanced && typeof b.advanced === "object" ? (b.advanced as Record<string, unknown>) : {};

  return {
    ok: true,
    input: {
      niche,
      goal,
      target,
      offer: str(b.offer),
      conversionPath: str(b.conversionPath),
      benchmarkSources,
      advanced,
    },
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "POST만 허용됩니다." });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "서버에 ANTHROPIC_API_KEY 가 설정되지 않았습니다." });
  }

  // Vercel 은 application/json 본문을 자동 파싱하지만, 문자열로 올 경우도 대비
  let body: unknown = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "JSON 본문 파싱 실패" });
    }
  }

  const v = validateInput(body);
  if (!v.ok) return res.status(400).json({ error: v.error });

  try {
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      // 콘텐츠 생성 워크로드 → thinking off + effort low 로 빠르게(non-streaming)
      thinking: { type: "disabled" },
      // effort + 구조화 출력(format)을 함께 지정
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: STRATEGY_SCHEMA },
      },
      messages: [{ role: "user", content: buildUserPrompt(v.input) }],
    } as Anthropic.MessageCreateParamsNonStreaming);

    if (response.stop_reason === "refusal") {
      return res.status(502).json({ error: "모델이 요청을 거부했습니다." });
    }

    // 구조화 출력은 첫 text 블록에 유효한 JSON 을 담아 반환한다.
    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text : "";
    if (!text) return res.status(502).json({ error: "빈 응답" });

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({ error: "응답 JSON 파싱 실패" });
    }

    return res.status(200).json(parsed);
  } catch (e) {
    const message = e instanceof Error ? e.message : "알 수 없는 오류";
    return res.status(502).json({ error: `생성 실패: ${message}` });
  }
}
