// localStorage 입출력. 백엔드 없이 입력값과 결과를 보존한다.

import type { AppInput, AppOutput } from "./types";

const INPUT_KEY = "sgh.input.v1";
const OUTPUT_KEY = "sgh.output.v1";

export function saveInput(input: AppInput) {
  try {
    localStorage.setItem(INPUT_KEY, JSON.stringify(input));
  } catch {
    /* 저장 실패는 무시 (시크릿 모드 등) */
  }
}

export function loadInput(): AppInput | null {
  try {
    const raw = localStorage.getItem(INPUT_KEY);
    return raw ? (JSON.parse(raw) as AppInput) : null;
  } catch {
    return null;
  }
}

export function saveOutput(output: AppOutput) {
  try {
    localStorage.setItem(OUTPUT_KEY, JSON.stringify(output));
  } catch {
    /* 무시 */
  }
}

export function loadOutput(): AppOutput | null {
  try {
    const raw = localStorage.getItem(OUTPUT_KEY);
    return raw ? (JSON.parse(raw) as AppOutput) : null;
  } catch {
    return null;
  }
}

export function clearAll() {
  try {
    localStorage.removeItem(INPUT_KEY);
    localStorage.removeItem(OUTPUT_KEY);
  } catch {
    /* 무시 */
  }
}
