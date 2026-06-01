import { useState, type ReactNode } from "react";

// ── Card ──────────────────────────────────────
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-ink-100 bg-surface shadow-card ${className}`}>
      {children}
    </div>
  );
}

// ── Section Title ─────────────────────────────
export function SectionTitle({ children, sub, icon }: { children: ReactNode; sub?: string; icon?: string }) {
  return (
    <div className="mb-4">
      <h3 className="flex items-center gap-2 text-lg font-bold text-ink-900">
        {icon && <span className="text-xl">{icon}</span>}
        {children}
      </h3>
      {sub && <p className="mt-0.5 text-sm text-ink-500">{sub}</p>}
    </div>
  );
}

// ── Tag / Badge ───────────────────────────────
export function Tag({
  children,
  color = "default",
}: {
  children: ReactNode;
  color?: "default" | "brand" | "green" | "amber" | "rose" | "slate";
}) {
  const styles: Record<string, string> = {
    default: "bg-ink-50 text-ink-700 border border-ink-100",
    brand:   "bg-brand-50 text-brand-600 border border-brand-100",
    green:   "bg-emerald-50 text-emerald-700 border border-emerald-100",
    amber:   "bg-amber-50 text-amber-700 border border-amber-100",
    rose:    "bg-rose-50 text-rose-600 border border-rose-100",
    slate:   "bg-ink-50 text-ink-500 border border-ink-100",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[color]}`}>
      {children}
    </span>
  );
}

// ── Button ────────────────────────────────────
export function Button({
  children, onClick, variant = "primary", className = "", type = "button", disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline" | "danger";
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none select-none";
  const map: Record<string, string> = {
    primary: "bg-brand-gradient text-white shadow-btn-primary hover:shadow-btn-primary-hover hover:-translate-y-px active:translate-y-0",
    ghost:   "text-ink-500 hover:bg-ink-50 hover:text-ink-900",
    outline: "border-2 border-ink-100 bg-surface text-ink-700 hover:border-brand-200 hover:text-brand-600",
    danger:  "border-2 border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${map[variant]} ${className}`}>
      {children}
    </button>
  );
}

// ── Copy Button ───────────────────────────────
export function CopyButton({ text, label = "복사" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  };
  return (
    <button
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
        done
          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
          : "border-ink-100 bg-surface text-ink-500 hover:border-brand-200 hover:text-brand-600"
      }`}
    >
      {done ? "✓ 복사됨" : `⎘ ${label}`}
    </button>
  );
}

// ── Score Bar (그래디언트) ─────────────────────
export function ScoreBar({ score, label }: { score: number; label?: string }) {
  const pct = Math.min(100, score);
  const color =
    score >= 70
      ? "from-emerald-400 to-teal-500"
      : score >= 50
      ? "from-amber-400 to-orange-400"
      : "from-rose-400 to-rose-500";
  return (
    <div>
      {label && (
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-sm font-semibold text-ink-700">{label}</span>
          <span className={`text-sm font-bold tabular-nums ${score >= 70 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-rose-500"}`}>
            {score}
          </span>
        </div>
      )}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Collapse (접이식) ─────────────────────────
export function Collapse({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-semibold text-ink-700 hover:bg-ink-50 transition-colors"
      >
        <span>{title}</span>
        <span className={`text-lg text-ink-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          ‹
        </span>
      </button>
      {open && (
        <div className="collapse-enter border-t border-ink-100 p-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Pill (선택 칩) ────────────────────────────
export function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition-all duration-150 ${
        active
          ? "border-brand-500 bg-brand-gradient text-white shadow-btn-primary"
          : "border-ink-100 bg-surface text-ink-600 hover:border-brand-200 hover:text-brand-600"
      }`}
    >
      {children}
    </button>
  );
}

// ── TextInput ─────────────────────────────────
export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-2xl border-2 border-ink-100 bg-surface px-4 py-3 text-sm font-medium text-ink-900 outline-none transition-all placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-50 ${props.className || ""}`}
    />
  );
}

// ── TextArea ──────────────────────────────────
export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full resize-none rounded-2xl border-2 border-ink-100 bg-surface px-4 py-3 text-sm font-medium text-ink-900 outline-none transition-all placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-50 ${props.className || ""}`}
    />
  );
}

// ── Label ─────────────────────────────────────
export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <label className="mb-2 block text-sm font-bold text-ink-700">
      {children}
      {hint && <span className="ml-1.5 text-xs font-medium text-ink-400">{hint}</span>}
    </label>
  );
}

// ── Divider ───────────────────────────────────
export function Divider() {
  return <div className="my-5 h-px bg-ink-100" />;
}
