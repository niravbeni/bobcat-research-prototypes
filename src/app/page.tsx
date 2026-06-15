import Link from "next/link";
import { LayersIcon, CoinsIcon, CircleDotIcon } from "lucide-react";
import { PROTOTYPES } from "@/lib/priorities";

const ICONS = {
  "sorting-deck": LayersIcon,
  "coins-on-the-table": CoinsIcon,
  "the-weighting-game": CircleDotIcon,
} as const;

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 pb-20 pt-14 sm:px-7">
      <section className="mb-12 max-w-[720px]">
        <h1
          className="m-0 text-[34px] font-semibold leading-[1.05] text-[var(--ink)] sm:text-[46px] md:text-[54px] md:leading-[1.02]"
          style={{ letterSpacing: "-0.03em", textWrap: "balance" }}
        >
          Three ways to sort what matters in retirement.
        </h1>
        <p className="mt-[18px] max-w-[600px] text-[16px] leading-[1.55] text-[var(--ink-2)] sm:text-[17px]">
          Each prototype is a different interaction mode for collecting and
          ranking the same set of retirement priorities.
        </p>
      </section>

      <div className="mb-[18px] text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--ink-3)]">
        Prototypes
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 sm:gap-6">
        {PROTOTYPES.map((p, i) => {
          const Icon = ICONS[p.slug as keyof typeof ICONS];
          return (
            <Link
              key={p.slug}
              href={`/${p.slug}`}
              className="group relative flex flex-col gap-5 overflow-hidden rounded-[20px] border border-[var(--rule)] bg-white p-6 text-inherit no-underline shadow-card-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--purple-200)] hover:shadow-card sm:p-7"
            >
              <div className="flex items-center justify-between">
                <span
                  className="grid size-11 place-items-center rounded-2xl text-white"
                  style={{
                    background:
                      p.accent === "magenta"
                        ? "var(--grad-purple-magenta)"
                        : "var(--grad-purple)",
                  }}
                >
                  <Icon size={20} strokeWidth={2.2} />
                </span>
                <span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-3)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                <span className="inline-flex w-fit items-center rounded-full bg-[var(--purple-50)] px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--purple-700)]">
                  {p.method}
                </span>
                <h3
                  className="m-0 mt-1 text-[22px] font-bold leading-[1.15] text-[var(--ink)]"
                  style={{ letterSpacing: "-0.015em", textWrap: "balance" }}
                >
                  {p.name}
                </h3>
                <p className="m-0 text-[14.5px] leading-[1.55] text-[var(--ink-2)]">
                  {p.tagline}
                </p>
              </div>

              <div className="flex items-center justify-end border-t border-[var(--rule)] pt-4 text-[12px]">
                <span className="font-semibold text-[var(--purple-700)] transition-transform duration-200 group-hover:translate-x-0.5">
                  Open →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
