import { BackLink } from "@/components/BackLink";
import { SortingDeck } from "@/components/prototypes/SortingDeck";
import { loadTexts } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function SortingDeckPage() {
  const texts = await loadTexts();
  return (
    <div className="mx-auto flex w-full max-w-[1040px] flex-col px-5 pb-8 pt-5 sm:px-7 lg:h-[calc(100svh-60px)] lg:overflow-hidden lg:pb-5">
      <BackLink />

      <div className="mx-auto mt-3 w-full max-w-[640px] text-center">
        <h1
          className="m-0 text-[24px] font-bold leading-[1.1] text-[var(--ink)] sm:text-[30px]"
          style={{ letterSpacing: "-0.025em", textWrap: "balance" }}
        >
          The Sorting Deck
        </h1>
        <p className="mx-auto mt-1.5 max-w-[480px] text-[14px] leading-[1.5] text-[var(--ink-2)]">
          Swipe each retirement priority into essential, nice-to-have, or skip.
        </p>
      </div>

      <div className="mt-4 flex flex-1 items-center justify-center lg:mt-5">
        <div className="w-full max-w-[700px] rounded-[26px] border border-[var(--rule)] bg-white px-5 py-7 shadow-card sm:px-8 sm:py-8">
          <SortingDeck texts={texts} />
        </div>
      </div>
    </div>
  );
}
