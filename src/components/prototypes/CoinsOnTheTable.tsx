"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, Wallet, Check, ListOrdered } from "lucide-react";
import { applyTexts, type Priority, type PriorityText } from "@/lib/priorities";
import { Coin } from "./Coin";
import { RankedResults, type RankedItem } from "./RankedResults";

const TOKENS = 7;

type DragState = {
  from: "pile" | string; // "pile" or a priority id
  x: number;
  y: number;
  moved: boolean;
};

export function CoinsOnTheTable({ texts }: { texts?: PriorityText[] }) {
  const priorities = useMemo(() => applyTexts(texts), [texts]);

  const [alloc, setAlloc] = useState<Record<string, number>>({});
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hover, setHover] = useState<"pile" | string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const pileRef = useRef<HTMLDivElement | null>(null);
  const bucketRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const spent = useMemo(
    () => Object.values(alloc).reduce((a, b) => a + b, 0),
    [alloc],
  );
  const remaining = TOKENS - spent;

  const findTarget = useCallback((x: number, y: number): "pile" | string | null => {
    for (const p of priorities) {
      const r = bucketRefs.current[p.id]?.getBoundingClientRect();
      if (r && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
        return p.id;
      }
    }
    const pr = pileRef.current?.getBoundingClientRect();
    if (pr && x >= pr.left && x <= pr.right && y >= pr.top && y <= pr.bottom) {
      return "pile";
    }
    return null;
  }, [priorities]);

  const commit = useCallback(
    (state: DragState, x: number, y: number) => {
      const target = findTarget(x, y);

      setAlloc((a) => {
        const next = { ...a };
        const cur = (id: string) => next[id] ?? 0;

        if (state.from === "pile") {
          // Place a coin from the pile onto a bucket.
          if (target && target !== "pile" && remaining > 0) {
            next[target] = cur(target) + 1;
          }
          return next;
        }

        // Dragging an existing coin out of a bucket.
        const fromId = state.from;
        if (cur(fromId) <= 0) return a;

        if (!state.moved || target === "pile" || target === null) {
          // Quick click or dropped on the pile / empty space → return to pile.
          next[fromId] = cur(fromId) - 1;
          return next;
        }
        if (target !== fromId) {
          // Move the coin to a different bucket.
          next[fromId] = cur(fromId) - 1;
          next[target] = cur(target) + 1;
        }
        return next;
      });
    },
    [findTarget, remaining],
  );

  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent) => {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      const moved = drag.moved || Math.hypot(dx, dy) > 5;
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY, moved } : d));
      setHover(findTarget(e.clientX, e.clientY));
    };
    const up = (e: PointerEvent) => {
      commit(drag, e.clientX, e.clientY);
      setDrag(null);
      setHover(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [drag, findTarget, commit]);

  const startDrag = (from: "pile" | string, e: React.PointerEvent) => {
    if (from === "pile" && remaining <= 0) return;
    e.preventDefault();
    setDrag({ from, x: e.clientX, y: e.clientY, moved: false });
    setHover(from);
  };

  const reset = () => {
    setAlloc({});
    setDrag(null);
    setHover(null);
    setShowResults(false);
  };

  const rankedItems: RankedItem[] = useMemo(() => {
    const sorted = priorities.map((p) => ({ p, count: alloc[p.id] ?? 0 })).sort(
      (a, b) => b.count - a.count,
    );
    const maxCount = sorted[0]?.count ?? 0;
    let rank = 0;
    let prev: number | null = null;
    return sorted.map(({ p, count }, i) => {
      // Competition ranking: equal coin counts share the same rank.
      if (count !== prev) {
        rank = i + 1;
        prev = count;
      }
      return {
        id: p.id,
        title: p.title,
        icon: p.icon,
        valueLabel: `${count} ${count === 1 ? "coin" : "coins"}`,
        fraction: maxCount > 0 ? count / maxCount : 0,
        accent:
          p.category === "need" ? "var(--purple-500)" : "var(--magenta-500)",
        meta: p.category === "need" ? "Need" : "Want",
        muted: count === 0,
        rank: count === 0 ? undefined : rank,
      };
    });
  }, [alloc, priorities]);

  if (showResults) {
    return (
      <RankedResults
        title="How you backed your priorities"
        subtitle={`You spent ${spent} of ${TOKENS} coins. Here's where they landed, most-funded first.`}
        items={rankedItems}
        onReset={reset}
        onBack={() => setShowResults(false)}
      />
    );
  }

  // Hide the lifted coin from its source while it's in the air.
  const pileVisible = remaining - (drag?.from === "pile" ? 1 : 0);

  return (
    <div className="flex w-full select-none flex-col gap-5">
      <Pile
        ref={pileRef}
        visible={Math.max(0, pileVisible)}
        spent={spent}
        remaining={remaining}
        highlight={hover === "pile" && drag?.from !== "pile" && drag !== null}
        onReset={reset}
        onCoinDown={(e) => startDrag("pile", e)}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {priorities.map((p) => {
          const count = alloc[p.id] ?? 0;
          const liftOne = drag?.from === p.id;
          const visible = count - (liftOne ? 1 : 0);
          return (
            <Bucket
              key={p.id}
              ref={(el) => {
                bucketRefs.current[p.id] = el;
              }}
              priority={p}
              count={count}
              visible={Math.max(0, visible)}
              highlight={hover === p.id && drag !== null}
              onCoinDown={(e) => startDrag(p.id, e)}
            />
          );
        })}
      </div>

      <p className="text-center text-[12.5px] text-[var(--ink-3)]">
        Drag a coin from the pile onto a priority · drag a coin back to the pile
        to take it off
      </p>

      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => setShowResults(true)}
          disabled={spent === 0}
          className="triage-btn inline-flex items-center gap-2 rounded-full bg-grad-purple px-5 py-2.5 text-[14px] font-semibold text-white shadow-purple disabled:opacity-40 disabled:shadow-none"
        >
          <ListOrdered size={16} strokeWidth={2.4} />
          See your ranking
        </button>
      </div>

      {drag && (
        <div
          className="pointer-events-none fixed z-[100] -translate-x-1/2 -translate-y-1/2"
          style={{ left: drag.x, top: drag.y }}
        >
          <span className="block drop-shadow-lg" style={{ transform: "scale(1.18)" }}>
            <Coin size={34} />
          </span>
        </div>
      )}
    </div>
  );
}

function Pile({
  ref,
  visible,
  spent,
  remaining,
  highlight,
  onReset,
  onCoinDown,
}: {
  ref: React.Ref<HTMLDivElement>;
  visible: number;
  spent: number;
  remaining: number;
  highlight: boolean;
  onReset: () => void;
  onCoinDown: (e: React.PointerEvent) => void;
}) {
  const allSpent = remaining === 0;
  return (
    <div
      ref={ref}
      className="flex flex-col items-center justify-between gap-4 rounded-[20px] border bg-white p-5 shadow-card transition-colors sm:flex-row"
      style={{
        borderColor: highlight ? "var(--purple-300)" : "var(--rule)",
        background: highlight
          ? "color-mix(in srgb, var(--purple-50) 70%, white)"
          : "white",
      }}
    >
      <div className="flex items-center gap-4">
        <span className="grid size-12 place-items-center rounded-2xl bg-grad-purple text-white">
          <Wallet size={22} strokeWidth={2.2} />
        </span>
        <div>
          <div className="text-[13px] font-semibold uppercase tracking-[0.1em] text-[var(--ink-3)]">
            Coins to place
          </div>
          <div className="text-[20px] font-bold leading-tight text-[var(--ink)]">
            {remaining} left · {spent} placed
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex min-h-[40px] items-center">
          {allSpent ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--purple-50)] px-3 py-1.5 text-[12.5px] font-bold text-[var(--purple-700)]">
              <Check size={15} strokeWidth={2.6} /> All coins placed
            </span>
          ) : (
            Array.from({ length: visible }).map((_, i) => (
              <span
                key={i}
                onPointerDown={onCoinDown}
                className="block cursor-grab touch-none transition-transform hover:-translate-y-0.5 active:cursor-grabbing"
                style={{ marginLeft: i === 0 ? 0 : -8, zIndex: i }}
              >
                <Coin size={32} />
              </span>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={onReset}
          aria-label="Reset"
          title="Reset"
          className="triage-btn grid size-9 shrink-0 place-items-center rounded-full border border-[var(--rule-2)] bg-white text-[var(--ink-2)]"
        >
          <RotateCcw size={16} strokeWidth={2.3} />
        </button>
      </div>
    </div>
  );
}

function Bucket({
  ref,
  priority,
  count,
  visible,
  highlight,
  onCoinDown,
}: {
  ref: React.Ref<HTMLDivElement>;
  priority: Priority;
  count: number;
  visible: number;
  highlight: boolean;
  onCoinDown: (e: React.PointerEvent) => void;
}) {
  const Icon = priority.icon;
  const isNeed = priority.category === "need";
  const funded = count > 0;
  return (
    <div
      ref={ref}
      className="flex flex-col gap-2.5 rounded-[20px] border-2 bg-white p-4 shadow-card-sm transition-colors"
      style={{
        borderColor: highlight
          ? "var(--purple-400)"
          : funded
            ? "var(--purple-200)"
            : "var(--rule)",
        background: highlight
          ? "color-mix(in srgb, var(--purple-50) 60%, white)"
          : "white",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="grid size-9 place-items-center rounded-xl"
          style={{
            background: isNeed ? "var(--purple-50)" : "#fbe9f5",
            color: isNeed ? "var(--purple-600)" : "var(--magenta-500)",
          }}
        >
          <Icon size={18} strokeWidth={2.1} />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-3)]">
          {isNeed ? "Need" : "Want"}
        </span>
      </div>

      <h3 className="m-0 min-h-[38px] text-[15px] font-bold leading-[1.2] text-[var(--ink)]">
        {priority.title}
      </h3>

      <div className="mt-auto flex min-h-[44px] flex-wrap content-center items-center justify-center gap-y-1 rounded-[14px] border border-dashed px-2 py-2"
        style={{
          borderColor: funded || highlight ? "transparent" : "var(--rule)",
        }}
      >
        {count === 0 ? (
          <span className="text-[11.5px] font-medium text-[var(--ink-3)]">
            Drop a coin here
          </span>
        ) : (
          Array.from({ length: visible }).map((_, i) => (
            <span
              key={i}
              onPointerDown={onCoinDown}
              className="coin-drop block cursor-grab touch-none active:cursor-grabbing"
              style={{ marginLeft: i === 0 ? 0 : -9, zIndex: i }}
            >
              <Coin size={30} />
            </span>
          ))
        )}
      </div>
    </div>
  );
}
