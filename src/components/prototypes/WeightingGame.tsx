"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ListOrdered,
  Minus,
  Plus,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
import {
  applyTexts,
  PRIORITIES,
  type Priority,
  type PriorityCategory,
  type PriorityText,
} from "@/lib/priorities";
import { RankedResults, type RankedItem } from "./RankedResults";

const ICON_BY_ID: Record<string, LucideIcon> = Object.fromEntries(
  PRIORITIES.map((p) => [p.id, p.icon]),
);

type Cat = PriorityCategory | null;

type Bubble = {
  id: string;
  title: string;
  short: string;
  category: Cat;
  weight: number;
  /** Centre position on the canvas as a 0..1 fraction. */
  fx: number;
  fy: number;
};

const MIN_W = 0.3;
const MAX_W = 18;
const MIN_D = 80;
const MAX_D = 210;
const DRAG_THRESHOLD = 5;
const CANVAS_H = 540;

// Fraction thresholds: left of NEED_MAX is a Need, right of WANT_MIN is a Want.
const NEED_MAX = 0.4;
const WANT_MIN = 0.6;

const clamp = (n: number) => Math.max(MIN_W, Math.min(MAX_W, n));
const clamp01 = (n: number) => Math.max(0.04, Math.min(0.96, n));

const diameter = (share: number) => MIN_D + Math.sqrt(share) * (MAX_D - MIN_D);

const regionOf = (fx: number): Cat =>
  fx < NEED_MAX ? "need" : fx > WANT_MIN ? "want" : null;

// Deterministic pseudo-random so server and client agree (no hydration jump).
const rand = (n: number) => {
  const x = Math.sin((n + 1) * 127.1) * 43758.5453;
  return x - Math.floor(x);
};

// Loose 2-column cluster sitting in the neutral middle band, with a little
// deterministic jitter so it reads as "randomly grouped".
const COLS = [0.445, 0.555];
const ROWS = [0.15, 0.38, 0.62, 0.85];

const initial = (priorities: Priority[]): Bubble[] =>
  priorities.map((p, i) => ({
    id: p.id,
    title: p.title,
    short: p.short,
    category: null,
    weight: 1,
    fx: COLS[i % 2] + (rand(i * 2) - 0.5) * 0.05,
    fy: ROWS[Math.floor(i / 2)] + (rand(i * 2 + 1) - 0.5) * 0.06,
  }));

export function WeightingGame({ texts }: { texts?: PriorityText[] }) {
  const priorities = useMemo(() => applyTexts(texts), [texts]);

  const [bubbles, setBubbles] = useState<Bubble[]>(() => initial(priorities));
  const [showResults, setShowResults] = useState(false);
  const [hover, setHover] = useState<Cat>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  const setWeight = useCallback((id: string, fn: (w: number) => number) => {
    setBubbles((prev) =>
      prev.map((b) => (b.id === id ? { ...b, weight: clamp(fn(b.weight)) } : b)),
    );
  }, []);

  const step = (id: string, delta: number) => setWeight(id, (w) => w + delta);

  // Hold-to-grow via interval (CSS transition smooths each nudge) ----------
  const holdStartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const growInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopGrow = useCallback(() => {
    if (holdStartTimer.current) {
      clearTimeout(holdStartTimer.current);
      holdStartTimer.current = null;
    }
    if (growInterval.current) {
      clearInterval(growInterval.current);
      growInterval.current = null;
    }
  }, []);

  const beginHold = useCallback(
    (id: string) => {
      stopGrow();
      holdStartTimer.current = setTimeout(() => {
        growInterval.current = setInterval(() => {
          setWeight(id, (w) => w + 0.5);
        }, 70);
      }, 140);
    },
    [setWeight, stopGrow],
  );

  useEffect(() => {
    const up = () => stopGrow();
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      stopGrow();
    };
  }, [stopGrow]);

  // Move a bubble so its centre follows the pointer, recolouring by region.
  // The centre is clamped so the whole bubble stays inside the canvas.
  const moveBubble = useCallback((id: string, cx: number, cy: number) => {
    const r = canvasRef.current?.getBoundingClientRect();
    if (!r) return;
    setHover(regionOf(clamp01((cx - r.left) / r.width)));
    setBubbles((prev) => {
      const tot = prev.reduce((s, b) => s + b.weight, 0) || 1;
      return prev.map((b) => {
        if (b.id !== id) return b;
        const d = diameter(b.weight / tot);
        const hx = d / 2 / r.width;
        const hy = d / 2 / r.height;
        const fx = Math.max(hx, Math.min(1 - hx, (cx - r.left) / r.width));
        const fy = Math.max(hy, Math.min(1 - hy, (cy - r.top) / r.height));
        return { ...b, fx, fy, category: regionOf(fx) };
      });
    });
  }, []);

  const reset = () => {
    stopGrow();
    setBubbles(initial(priorities));
    setShowResults(false);
    setHover(null);
  };

  const total = bubbles.reduce((s, b) => s + b.weight, 0) || 1;
  const maxW = bubbles.reduce((m, b) => Math.max(m, b.weight), MIN_W);

  const unsortedCount = bubbles.filter((b) => b.category === null).length;
  const allSorted = unsortedCount === 0;
  const needCount = bubbles.filter((b) => b.category === "need").length;
  const wantCount = bubbles.filter((b) => b.category === "want").length;

  const rankedItems: RankedItem[] = useMemo(() => {
    const sorted = [...bubbles].sort((a, b) => b.weight - a.weight);
    let rank = 0;
    let prev: number | null = null;
    return sorted.map((b, i) => {
      // Competition ranking: equally weighted bubbles share the same rank.
      if (b.weight !== prev) {
        rank = i + 1;
        prev = b.weight;
      }
      return {
        id: b.id,
        title: b.title,
        icon: ICON_BY_ID[b.id],
        fraction: b.weight / maxW,
        accent:
          b.category === "need" ? "var(--purple-500)" : "var(--magenta-500)",
        meta: b.category === "need" ? "Need" : "Want",
        rank,
      };
    });
  }, [bubbles, maxW]);

  if (showResults) {
    return (
      <RankedResults
        title="How you ranked your priorities"
        subtitle="Your priorities in order, biggest bubble first."
        items={rankedItems}
        onReset={reset}
        onBack={() => setShowResults(false)}
      />
    );
  }

  return (
    <div className="flex w-full flex-col gap-3">
      <p className="text-center text-[13px] text-[var(--ink-3)]">
        Drag each bubble into the Needs or Wants circle · press &amp; hold a
        bubble to grow how important it is
        {!allSorted && (
          <span className="ml-1 font-semibold text-[var(--ink-2)]">
            · {unsortedCount} left to sort
          </span>
        )}
      </p>

      <div
        ref={canvasRef}
        className="relative w-full touch-none select-none overflow-hidden rounded-[24px]"
        style={{ height: CANVAS_H }}
      >
        <ZoneCircle side="need" active={hover === "need"} count={needCount} />
        <ZoneCircle side="want" active={hover === "want"} count={wantCount} />

        {bubbles.map((b) => (
          <BubbleView
            key={b.id}
            bubble={b}
            share={b.weight / total}
            onHoldStart={() => beginHold(b.id)}
            onDragStart={stopGrow}
            onDragMove={(cx, cy) => moveBubble(b.id, cx, cy)}
            onDragEnd={() => setHover(null)}
            onStep={(d) => step(b.id, d)}
          />
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="triage-btn inline-flex items-center gap-1.5 rounded-full border border-[var(--rule-2)] bg-white px-4 py-2 text-[13px] font-semibold text-[var(--ink-2)]"
        >
          <RotateCcw size={15} strokeWidth={2.3} /> Reset
        </button>
        <button
          type="button"
          onClick={() => setShowResults(true)}
          disabled={!allSorted}
          className="triage-btn inline-flex items-center gap-1.5 rounded-full bg-grad-purple px-5 py-2 text-[13px] font-semibold text-white shadow-purple disabled:opacity-40 disabled:shadow-none"
        >
          <ListOrdered size={15} strokeWidth={2.4} /> Submit
        </button>
      </div>
    </div>
  );
}

function ZoneCircle({
  side,
  active,
  count,
}: {
  side: PriorityCategory;
  active: boolean;
  count: number;
}) {
  const isNeed = side === "need";
  const accent = isNeed ? "var(--purple-500)" : "var(--magenta-500)";
  const accentDeep = isNeed ? "var(--purple-700)" : "var(--magenta-600)";
  const fill = isNeed
    ? "color-mix(in srgb, var(--purple-50) 75%, transparent)"
    : "color-mix(in srgb, #fbe9f5 70%, transparent)";

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-1/2 aspect-square -translate-y-1/2 rounded-full transition-[background,border-color,box-shadow] duration-200"
      style={{
        width: "36%",
        [isNeed ? "left" : "right"]: "2.5%",
        borderWidth: 2,
        borderStyle: "dashed",
        borderColor: active
          ? accent
          : `color-mix(in srgb, ${accent} 45%, transparent)`,
        background: active ? fill : "transparent",
        boxShadow: active
          ? `inset 0 0 0 3px color-mix(in srgb, ${accent} 16%, transparent)`
          : "none",
      }}
    >
      <span
        className="absolute left-1/2 top-[6%] -translate-x-1/2 whitespace-nowrap text-[13px] font-bold uppercase tracking-[0.14em]"
        style={{ color: `color-mix(in srgb, ${accentDeep} 80%, white)` }}
      >
        {isNeed ? "Needs" : "Wants"}
        {count > 0 && (
          <span className="ml-1.5 opacity-70">({count})</span>
        )}
      </span>
    </div>
  );
}

function BubbleView({
  bubble,
  share,
  onHoldStart,
  onDragStart,
  onDragMove,
  onDragEnd,
  onStep,
}: {
  bubble: Bubble;
  share: number;
  onHoldStart: () => void;
  onDragStart: () => void;
  onDragMove: (centerClientX: number, centerClientY: number) => void;
  onDragEnd: () => void;
  onStep: (delta: number) => void;
}) {
  const cat = bubble.category;
  const d = diameter(share);
  const accent =
    cat === "need"
      ? "var(--purple-500)"
      : cat === "want"
        ? "var(--magenta-500)"
        : "var(--ink)";
  const accentSoft =
    cat === "need"
      ? "var(--purple-50)"
      : cat === "want"
        ? "#fbe9f5"
        : "color-mix(in srgb, var(--ink) 7%, white)";
  const t = (d - MIN_D) / (MAX_D - MIN_D);
  const titleSize = 12.5 + t * 4;

  const [dragging, setDragging] = useState(false);
  // Offset between pointer and bubble centre, captured at drag start.
  const grab = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const start = useRef<{ x: number; y: number; moved: boolean } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    grab.current = {
      dx: e.clientX - (rect.left + rect.width / 2),
      dy: e.clientY - (rect.top + rect.height / 2),
    };
    start.current = { x: e.clientX, y: e.clientY, moved: false };
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    onHoldStart();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const s = start.current;
    if (!s) return;
    if (
      !s.moved &&
      Math.hypot(e.clientX - s.x, e.clientY - s.y) > DRAG_THRESHOLD
    ) {
      s.moved = true;
      setDragging(true);
      onDragStart();
    }
    if (s.moved) onDragMove(e.clientX - grab.current.dx, e.clientY - grab.current.dy);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const s = start.current;
    start.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {}
    if (s?.moved) onDragEnd();
    setDragging(false);
  };

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="absolute flex cursor-pointer touch-none select-none flex-col items-center justify-center gap-2 rounded-full px-2"
      style={{
        left: `${bubble.fx * 100}%`,
        top: `${bubble.fy * 100}%`,
        width: d,
        height: d,
        transform: `translate(-50%, -50%) scale(${dragging ? 1.07 : 1})`,
        zIndex: dragging ? 50 : 1,
        cursor: "pointer",
        transition: dragging
          ? "width 0.42s cubic-bezier(0.22,1,0.36,1), height 0.42s cubic-bezier(0.22,1,0.36,1), transform 0.12s ease-out, background 0.3s, border-color 0.3s"
          : "width 0.42s cubic-bezier(0.22,1,0.36,1), height 0.42s cubic-bezier(0.22,1,0.36,1), transform 0.3s cubic-bezier(0.34,1.56,0.64,1), left 0.3s ease-out, top 0.3s ease-out, background 0.3s, border-color 0.3s",
        background: `color-mix(in srgb, ${accentSoft} 55%, white)`,
        border: `1px solid ${cat ? accent : "var(--rule-2)"}`,
        boxShadow: dragging
          ? "0 12px 28px -8px color-mix(in srgb, var(--ink) 28%, transparent)"
          : "0 1px 3px color-mix(in srgb, var(--ink) 9%, transparent)",
      }}
    >
      <span
        className="text-center font-semibold leading-[1.18] text-[var(--ink)]"
        style={{ fontSize: titleSize, maxWidth: d - 34 }}
      >
        {bubble.short}
      </span>

      <div className="flex items-center gap-1.5">
        <StepDot icon="minus" onClick={() => onStep(-3.5)} accent={accent} />
        <StepDot icon="plus" onClick={() => onStep(3.5)} accent={accent} />
      </div>
    </div>
  );
}

function StepDot({
  icon,
  onClick,
  accent,
}: {
  icon: "plus" | "minus";
  onClick: () => void;
  accent: string;
}) {
  return (
    <button
      type="button"
      aria-label={icon === "plus" ? "Increase" : "Decrease"}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="grid size-6 place-items-center rounded-full border bg-white/90 backdrop-blur transition-transform active:scale-90"
      style={{ borderColor: accent, color: accent }}
    >
      {icon === "plus" ? (
        <Plus size={13} strokeWidth={2.8} />
      ) : (
        <Minus size={13} strokeWidth={2.8} />
      )}
    </button>
  );
}
