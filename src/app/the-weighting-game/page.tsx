import { BackLink } from "@/components/BackLink";
import { WeightingGame } from "@/components/prototypes/WeightingGame";
import { loadTexts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function WeightingGamePage() {
  const texts = await loadTexts();
  return (
    <div className="mx-auto flex w-full max-w-[1040px] flex-col px-5 pb-8 pt-5 sm:px-7 lg:h-[calc(100svh-60px)] lg:overflow-hidden lg:pb-5">
      <BackLink />

      <div className="mx-auto mt-3 w-full max-w-[680px] text-center">
        <h1
          className="m-0 text-[24px] font-bold leading-[1.1] text-[var(--ink)] sm:text-[30px]"
          style={{ letterSpacing: "-0.025em", textWrap: "balance" }}
        >
          The Weighting Game
        </h1>
        <p className="mx-auto mt-1.5 max-w-[540px] text-[14px] leading-[1.5] text-[var(--ink-2)]">
          Sort each priority into Needs or Wants, then grow the ones that matter
          most. Bigger bubble means higher priority.
        </p>
      </div>

      <div className="mt-4 flex flex-1 items-center justify-center lg:mt-5">
        <WeightingGame texts={texts} />
      </div>
    </div>
  );
}
