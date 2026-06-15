"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { Check, CheckCheck, X, RotateCcw } from "lucide-react";
import { applyTexts, type Priority, type PriorityText } from "@/lib/priorities";

type Verdict = "essential" | "nice" | "skip";

const VERDICTS: Record<
  Verdict,
  { label: string; color: string; icon: typeof Check }
> = {
  skip: { label: "Don't optimise", color: "var(--ink-3)", icon: X },
  nice: { label: "Nice to have", color: "var(--magenta-500)", icon: Check },
  essential: { label: "Essential", color: "var(--purple-600)", icon: CheckCheck },
};

const SWIPE_X = 110;
const SWIPE_Y = 110;

export function SortingDeck({ texts }: { texts?: PriorityText[] }) {
  const priorities = useMemo(() => applyTexts(texts), [texts]);

  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, Verdict>>({});
  const [trigger, setTrigger] = useState<Verdict | null>(null);

  const current = priorities[index];
  const done = index >= priorities.length;

  const onCommitted = useCallback(
    (verdict: Verdict) => {
      const card = priorities[index];
      if (card) setDecisions((d) => ({ ...d, [card.id]: verdict }));
      setTrigger(null);
      setIndex((i) => i + 1);
    },
    [index, priorities],
  );

  useEffect(() => {
    if (done) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setTrigger("skip");
      else if (e.key === "ArrowRight") setTrigger("nice");
      else if (e.key === "ArrowUp") setTrigger("essential");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [done]);

  const reset = () => {
    setDecisions({});
    setTrigger(null);
    setIndex(0);
  };

  const grouped = useMemo(() => {
    const g: Record<Verdict, Priority[]> = { essential: [], nice: [], skip: [] };
    priorities.forEach((p) => {
      const v = decisions[p.id];
      if (v) g[v].push(p);
    });
    return g;
  }, [decisions, priorities]);

  if (done) {
    return <Results grouped={grouped} onReset={reset} />;
  }

  return (
    <div className="flex w-full flex-col items-center">
      <ProgressBar current={index} total={priorities.length} />

      <div className="relative mt-7 h-[330px] w-full max-w-[360px] sm:h-[360px]">
        {[2, 1].map((depth) => {
          const card = priorities[index + depth];
          if (!card) return null;
          return (
            <div
              key={card.id}
              className="absolute inset-0 overflow-hidden rounded-[26px] border border-[var(--rule)] bg-white shadow-card"
              style={{
                transform: `translateY(${depth * 14}px) scale(${1 - depth * 0.045})`,
                zIndex: 1,
              }}
            >
              <div style={{ opacity: depth === 1 ? 0.85 : 0.45 }}>
                <CardFace priority={card} />
              </div>
            </div>
          );
        })}

        <SwipeCard
          key={current.id}
          priority={current}
          trigger={trigger}
          onCommitted={onCommitted}
        />
      </div>

      <div className="mt-7 flex items-center gap-3 sm:gap-4">
        <ActionButton verdict="skip" onClick={() => setTrigger("skip")} />
        <ActionButton verdict="essential" onClick={() => setTrigger("essential")} />
        <ActionButton verdict="nice" onClick={() => setTrigger("nice")} />
      </div>
      <p className="mt-4 text-center text-[12.5px] text-[var(--ink-3)]">
        Swipe the card or use the buttons · ↑ essential · → nice to have · ← skip
      </p>
    </div>
  );
}

function SwipeCard({
  priority,
  trigger,
  onCommitted,
}: {
  priority: Priority;
  trigger: Verdict | null;
  onCommitted: (v: Verdict) => void;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-16, 0, 16]);

  const niceOpacity = useTransform(x, [40, 130], [0, 1]);
  const skipOpacity = useTransform(x, [-130, -40], [1, 0]);
  const essentialOpacity = useTransform(y, [-130, -40], [1, 0]);

  const flyOut = useCallback(
    (verdict: Verdict) => {
      const target =
        verdict === "nice"
          ? { x: 720, y: 40 }
          : verdict === "skip"
            ? { x: -720, y: 40 }
            : { x: 0, y: -820 };
      const opts = { duration: 0.36, ease: [0.32, 0, 0.2, 1] as const };
      animate(x, target.x, opts);
      animate(y, target.y, opts).then(() => onCommitted(verdict));
    },
    [x, y, onCommitted],
  );

  useEffect(() => {
    if (trigger) flyOut(trigger);
  }, [trigger, flyOut]);

  const handleDragEnd = useCallback(
    (
      _: unknown,
      info: { offset: { x: number; y: number }; velocity: { x: number; y: number } },
    ) => {
      const { offset, velocity } = info;
      if (offset.y < -SWIPE_Y || velocity.y < -750) {
        flyOut("essential");
      } else if (offset.x > SWIPE_X || velocity.x > 750) {
        flyOut("nice");
      } else if (offset.x < -SWIPE_X || velocity.x < -750) {
        flyOut("skip");
      } else {
        animate(x, 0, { type: "spring", stiffness: 500, damping: 34 });
        animate(y, 0, { type: "spring", stiffness: 500, damping: 34 });
      }
    },
    [flyOut, x, y],
  );

  return (
    <motion.div
      drag
      dragElastic={0.6}
      dragMomentum={false}
      onDragEnd={handleDragEnd}
      style={{ x, y, rotate, zIndex: 5 }}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 440, damping: 34 }}
      className="absolute inset-0 cursor-grab touch-none select-none overflow-hidden rounded-[26px] border border-[var(--rule)] bg-white shadow-card-lg active:cursor-grabbing"
    >
      <CardFace priority={priority} />

      <Stamp style={{ opacity: essentialOpacity }} verdict="essential" position="top" />
      <Stamp style={{ opacity: niceOpacity }} verdict="nice" position="left" />
      <Stamp style={{ opacity: skipOpacity }} verdict="skip" position="right" />
    </motion.div>
  );
}

function CardFace({ priority }: { priority: Priority }) {
  const Icon = priority.icon;
  const isNeed = priority.category === "need";
  return (
    <div className="flex h-full flex-col p-7">
      <div className="flex items-center justify-between">
        <span
          className="grid size-12 place-items-center rounded-2xl"
          style={{
            background: isNeed ? "var(--purple-50)" : "#fbe9f5",
            color: isNeed ? "var(--purple-600)" : "var(--magenta-500)",
          }}
        >
          <Icon size={24} strokeWidth={2.1} />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-3)]">
          {isNeed ? "Need" : "Want"}
        </span>
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <h2
          className="m-0 text-[26px] font-bold leading-[1.12] text-[var(--ink)] sm:text-[28px]"
          style={{ letterSpacing: "-0.02em", textWrap: "balance" }}
        >
          {priority.title}
        </h2>
        <p className="mt-3 text-[15px] leading-[1.5] text-[var(--ink-2)]">
          {priority.question}
        </p>
      </div>
    </div>
  );
}

function Stamp({
  verdict,
  position,
  style,
}: {
  verdict: Verdict;
  position: "left" | "right" | "top";
  style: React.ComponentProps<typeof motion.div>["style"];
}) {
  const v = VERDICTS[verdict];
  const pos =
    position === "left"
      ? "left-6 top-1/2 -translate-y-1/2 -rotate-[14deg]"
      : position === "right"
        ? "right-6 top-1/2 -translate-y-1/2 rotate-[14deg]"
        : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2";
  return (
    <motion.div
      style={{ ...style, color: v.color, borderColor: v.color }}
      className={`pointer-events-none absolute ${pos} rounded-xl border-[3px] bg-white/85 px-3 py-1.5 text-[15px] font-extrabold uppercase tracking-wide backdrop-blur-sm`}
    >
      {v.label}
    </motion.div>
  );
}

function ActionButton({
  verdict,
  onClick,
}: {
  verdict: Verdict;
  onClick: () => void;
}) {
  const v = VERDICTS[verdict];
  const Icon = v.icon;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={v.label}
      title={v.label}
      className="triage-btn grid size-14 place-items-center rounded-full border bg-white shadow-card"
      style={{ borderColor: v.color }}
    >
      <Icon size={24} strokeWidth={2.4} style={{ color: v.color }} />
    </button>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = current / total;
  return (
    <div className="flex w-full max-w-[380px] items-center gap-3">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--rule)]">
        <motion.div
          className="h-full w-full origin-left rounded-full bg-grad-purple"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: pct }}
          transition={{ type: "spring", stiffness: 200, damping: 26 }}
        />
      </div>
      <span className="min-w-[42px] text-right text-[13px] font-semibold tabular-nums text-[var(--ink-2)]">
        {current}/{total}
      </span>
    </div>
  );
}

function Results({
  grouped,
  onReset,
}: {
  grouped: Record<Verdict, Priority[]>;
  onReset: () => void;
}) {
  // Global ranking: essentials first, then nice-to-haves, then skips.
  const ranked = [...grouped.essential, ...grouped.nice, ...grouped.skip];
  const rankOf = (id: string) => ranked.findIndex((p) => p.id === id) + 1;

  // Left → right reads as lower → higher priority.
  const columns: { key: Verdict; tint: string }[] = [
    { key: "skip", tint: "var(--ink-3)" },
    { key: "nice", tint: "var(--magenta-500)" },
    { key: "essential", tint: "var(--purple-500)" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <div className="text-center">
        <h2
          className="m-0 text-[22px] font-bold text-[var(--ink)] sm:text-[24px]"
          style={{ letterSpacing: "-0.02em" }}
        >
          How you ranked your priorities
        </h2>
        <p className="mx-auto mt-2 max-w-[440px] text-[13.5px] leading-[1.5] text-[var(--ink-2)]">
          Each priority placed on the line from least to most important.
        </p>
      </div>

      <div className="mt-10">
        <div className="mb-5 flex items-center justify-between px-1 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-3)]">
          <span>Lower priority</span>
          <span>Higher priority</span>
        </div>

        <div className="relative">
          {/* The horizontal spectrum line behind the three nodes */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[12%] top-[21px] h-[3px] rounded-full"
            style={{
              background:
                "linear-gradient(90deg, var(--ink-3) 0%, var(--magenta-400) 52%, var(--purple-500) 100%)",
              opacity: 0.45,
            }}
          />

          <div className="grid grid-cols-3 gap-2.5 sm:gap-5">
          {columns.map(({ key, tint }) => {
            const v = VERDICTS[key];
            const Icon = v.icon;
            const items = grouped[key];
            return (
              <div key={key} className="flex flex-col items-center gap-4">
                <div
                  className="relative z-[1] grid size-11 place-items-center rounded-full text-white shadow-card"
                  style={{ background: tint }}
                >
                  <Icon size={20} strokeWidth={2.5} />
                </div>
                <div className="text-center">
                  <div
                    className="text-[12.5px] font-bold leading-tight"
                    style={{ color: tint }}
                  >
                    {v.label}
                  </div>
                  <div className="text-[11px] font-semibold text-[var(--ink-3)]">
                    {items.length} {items.length === 1 ? "card" : "cards"}
                  </div>
                </div>

                <div className="flex w-full flex-col items-stretch gap-2.5">
                  {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--rule-2)] py-3 text-center text-[11.5px] text-[var(--ink-3)]">
                      None
                    </div>
                  ) : (
                    items.map((p) => {
                      const ItemIcon = p.icon;
                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-2 rounded-xl border border-[var(--rule)] bg-white px-2.5 py-2.5 shadow-card-sm"
                        >
                          <span
                            className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold tabular-nums text-white"
                            style={{ background: tint }}
                          >
                            {rankOf(p.id)}
                          </span>
                          <ItemIcon
                            size={15}
                            strokeWidth={2.1}
                            className="shrink-0"
                            style={{ color: tint }}
                          />
                          <span className="text-[12px] font-semibold leading-[1.2] text-[var(--ink)]">
                            {p.title}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>

      <div className="mt-10 flex justify-center">
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
