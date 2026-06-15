"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Lock,
  RotateCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import type { PriorityText } from "@/lib/priorities";

type Backend = "database" | "local-file" | null;

export default function AdminPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const [items, setItems] = useState<PriorityText[]>([]);
  const [backend, setBackend] = useState<Backend>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadContent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/content", { cache: "no-store" });
      const data = await res.json();
      setItems(data.priorities ?? []);
      setBackend(data.backend ?? null);
    } catch {
      setError("Could not load the current content.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (unlocked) loadContent();
  }, [unlocked, loadContent]);

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true);
    setPwError(null);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", password }),
      });
      if (res.ok) {
        setUnlocked(true);
      } else {
        setPwError("Incorrect password. Try again.");
      }
    } catch {
      setPwError("Something went wrong. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  const update = (id: string, field: keyof PriorityText, value: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );
    setStatus(null);
  };

  const save = async () => {
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, priorities: items }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not save changes.");
      } else {
        setItems(data.priorities ?? items);
        setStatus("Saved. Your changes are now live across all three prototypes.");
      }
    } catch {
      setError("Could not save changes.");
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = async () => {
    if (
      !window.confirm(
        "Reset every priority back to the original wording? This cannot be undone.",
      )
    )
      return;
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not reset.");
      } else {
        setItems(data.priorities ?? []);
        setStatus("Reset to the original wording.");
      }
    } catch {
      setError("Could not reset.");
    } finally {
      setSaving(false);
    }
  };

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-[calc(100svh-60px)] w-full max-w-[1040px] items-center justify-center px-5 py-10 sm:px-7">
        <form
          onSubmit={verify}
          className="w-full max-w-[400px] rounded-[24px] border border-[var(--rule)] bg-white px-6 py-8 shadow-card sm:px-8"
        >
          <span className="grid size-12 place-items-center rounded-2xl bg-grad-purple text-white">
            <Lock size={22} strokeWidth={2.2} />
          </span>
          <h1 className="mt-5 text-[22px] font-bold text-[var(--ink)]" style={{ letterSpacing: "-0.02em" }}>
            Content admin
          </h1>
          <p className="mt-1.5 text-[14px] leading-[1.5] text-[var(--ink-2)]">
            Enter the password to edit the priorities and card wording for all
            three prototypes.
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="mt-5 w-full rounded-xl border border-[var(--rule-2)] bg-white px-3.5 py-2.5 text-[15px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--purple-400)]"
          />
          {pwError && (
            <p className="mt-2 text-[13px] font-medium text-[var(--magenta-600)]">
              {pwError}
            </p>
          )}

          <button
            type="submit"
            disabled={verifying || !password}
            className="triage-btn mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-grad-purple px-5 py-2.5 text-[14px] font-semibold text-white shadow-purple disabled:opacity-40 disabled:shadow-none"
          >
            {verifying ? (
              <Loader2 size={16} className="animate-spin" strokeWidth={2.4} />
            ) : (
              <ShieldCheck size={16} strokeWidth={2.4} />
            )}
            Unlock
          </button>

          <Link
            href="/"
            className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-3)] no-underline transition-colors hover:text-[var(--ink-2)]"
          >
            <ArrowLeft size={14} strokeWidth={2.3} /> Back to prototypes
          </Link>
        </form>
      </div>
    );
  }

  const statusNode =
    status || error ? (
      <p
        className="text-[13.5px] font-medium"
        style={{ color: error ? "var(--magenta-600)" : "var(--purple-700)" }}
      >
        {error ?? status}
      </p>
    ) : null;

  const actions = (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={resetDefaults}
        disabled={saving || loading}
        className="triage-btn inline-flex items-center gap-1.5 rounded-full border border-[var(--rule-2)] bg-white px-4 py-2 text-[13px] font-semibold text-[var(--ink-2)] disabled:opacity-40"
      >
        <RotateCcw size={15} strokeWidth={2.3} /> Reset to defaults
      </button>
      <button
        type="button"
        onClick={save}
        disabled={saving || loading}
        className="triage-btn inline-flex items-center gap-1.5 rounded-full bg-grad-purple px-5 py-2 text-[13px] font-semibold text-white shadow-purple disabled:opacity-40 disabled:shadow-none"
      >
        {saving ? (
          <Loader2 size={15} className="animate-spin" strokeWidth={2.4} />
        ) : (
          <Save size={15} strokeWidth={2.4} />
        )}
        Save changes
      </button>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[860px] px-5 pb-20 pt-10 sm:px-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-3)] no-underline transition-colors hover:text-[var(--ink-2)]"
          >
            <ArrowLeft size={14} strokeWidth={2.3} /> Back to prototypes
          </Link>
          <h1
            className="mt-2 text-[28px] font-bold leading-[1.1] text-[var(--ink)] sm:text-[34px]"
            style={{ letterSpacing: "-0.025em" }}
          >
            Edit the priorities
          </h1>
          <p className="mt-1.5 max-w-[560px] text-[14.5px] leading-[1.55] text-[var(--ink-2)]">
            Changes apply to the Sorting Deck, Coins on the Table, and the
            Weighting Game. The category and icon for each priority stay fixed.
          </p>
        </div>
        {backend && (
          <span
            className="rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em]"
            style={{
              background:
                backend === "database" ? "var(--purple-50)" : "#fbe9f5",
              color:
                backend === "database"
                  ? "var(--purple-700)"
                  : "var(--magenta-600)",
            }}
            title={
              backend === "database"
                ? "Saving to the connected Redis database."
                : "Saving to a local file (dev only). Connect a Redis store on Vercel for the live site."
            }
          >
            {backend === "database" ? "Database connected" : "Local file (dev)"}
          </span>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--rule)] pt-5">
        <div className="min-h-[20px]">{statusNode}</div>
        {actions}
      </div>

      {loading ? (
        <div className="mt-10 flex items-center gap-2 text-[14px] text-[var(--ink-3)]">
          <Loader2 size={16} className="animate-spin" /> Loading current
          content…
        </div>
      ) : (
        <div className="mt-7 flex flex-col gap-4">
          {items.map((it, i) => (
            <div
              key={it.id}
              className="rounded-[18px] border border-[var(--rule)] bg-white p-5 shadow-card-sm"
            >
              <div className="mb-3 flex items-center gap-2">
                <span className="grid size-6 place-items-center rounded-full bg-[var(--ink)] text-[11px] font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--ink-3)]">
                  {it.id}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Title"
                  value={it.title}
                  onChange={(v) => update(it.id, "title", v)}
                />
                <Field
                  label="Short label (bubbles)"
                  value={it.short}
                  onChange={(v) => update(it.id, "short", v)}
                />
              </div>
              <div className="mt-3">
                <Field
                  label="Question (swipe deck)"
                  value={it.question}
                  onChange={(v) => update(it.id, "question", v)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="sticky bottom-4 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-[var(--rule)] bg-white/85 px-4 py-3 shadow-card backdrop-blur-md">
        <div className="min-h-[20px] pl-1">{statusNode}</div>
        {actions}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--ink-3)]">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[var(--rule-2)] bg-white px-3 py-2 text-[14px] text-[var(--ink)] outline-none transition-colors focus:border-[var(--purple-400)]"
      />
    </label>
  );
}
