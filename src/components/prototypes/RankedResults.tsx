"use client";

import { motion } from "motion/react";
import { RotateCcw, type LucideIcon } from "lucide-react";

export type RankedItem = {
  id: string;
  title: string;
  icon: LucideIcon;
  /** Right-aligned value, e.g. "3 coins" or "24%". Omit for rank-only. */
  valueLabel?: string;
  /** 0..1 — width of the bar. */
  fraction: number;
  /** Bar + badge colour. */
  accent: string;
  /** Optional small tag, e.g. "Need" / "Want". */
  meta?: string;
  /** Dim the row (e.g. nothing allocated). */
  muted?: boolean;
  /** Tie-aware rank to show in the badge. Falls back to row position. */
  rank?: number;
};

export function RankedResults({
  title,
  subtitle,
  items,
  onReset,
  onBack,
  backLabel = "Keep adjusting",
}: {
  title: string;
  subtitle: string;
  items: RankedItem[];
  onReset: () => void;
  onBack?: () => void;
  backLabel?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[680px] rounded-[26px] border border-[var(--rule)] bg-white px-5 py-7 shadow-card sm:px-8 sm:py-8"
    >
      <div className="text-center">
        <h2
          className="m-0 text-[22px] font-bold text-[var(--ink)] sm:text-[24px]"
          style={{ letterSpacing: "-0.02em" }}
        >
          {title}
        </h2>
        <p className="mx-auto mt-1.5 max-w-[460px] text-[13.5px] leading-[1.5] text-[var(--ink-2)]">
          {subtitle}
        </p>
      </div>

      <ol className="mt-6 flex flex-col gap-2.5">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <li
              key={it.id}
              className="flex items-center gap-3"
              style={{ opacity: it.muted ? 0.5 : 1 }}
            >
              <span
                className="grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-bold tabular-nums text-white"
                style={{ background: it.muted ? "var(--ink-3)" : it.accent }}
              >
                {it.muted ? "–" : (it.rank ?? i + 1)}
              </span>
              <span
                className="grid size-8 shrink-0 place-items-center rounded-lg"
                style={{
                  background: `color-mix(in srgb, ${it.accent} 14%, white)`,
                  color: it.accent,
                }}
              >
                <Icon size={16} strokeWidth={2.1} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13.5px] font-semibold text-[var(--ink)]">
                    {it.title}
                    {it.meta && (
                      <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ink-3)]">
                        {it.meta}
                      </span>
                    )}
                  </span>
                  {it.valueLabel && (
                    <span
                      className="shrink-0 text-[13px] font-bold tabular-nums"
                      style={{ color: it.muted ? "var(--ink-3)" : it.accent }}
                    >
                      {it.valueLabel}
                    </span>
                  )}
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--rule)]">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: it.accent }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(it.fraction * 100)}%` }}
                    transition={{
                      duration: 0.5,
                      delay: 0.06 * i,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-7 flex items-center justify-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="triage-btn inline-flex items-center gap-2 rounded-full border border-[var(--rule-2)] bg-white px-5 py-2.5 text-[14px] font-semibold text-[var(--ink-2)]"
          >
            {backLabel}
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="triage-btn inline-flex items-center gap-2 rounded-full bg-grad-purple px-5 py-2.5 text-[14px] font-semibold text-white shadow-purple"
        >
          <RotateCcw size={16} strokeWidth={2.4} />
          Start over
        </button>
      </div>
    </motion.div>
  );
}
