import Link from "next/link";

export function BackLink() {
  return (
    <Link
      href="/"
      className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--rule-2)] bg-white px-3 py-1.5 text-[12px] font-semibold text-[var(--ink-2)] shadow-card-sm triage-btn"
    >
      <span aria-hidden>←</span>
      All prototypes
    </Link>
  );
}
