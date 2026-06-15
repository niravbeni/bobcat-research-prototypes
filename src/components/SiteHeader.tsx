import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[var(--rule)] bg-white/90 backdrop-blur">
      <div className="flex h-[60px] w-full items-center justify-between gap-6 px-5 sm:px-7 lg:px-10 xl:px-12">
        <Link
          href="/"
          className="text-[17px] font-bold tracking-tight text-[var(--ink)]"
          style={{ letterSpacing: "-0.02em" }}
        >
          bobcat
        </Link>
        <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-3)]">
          Sorting Prototypes
        </span>
      </div>
    </header>
  );
}
