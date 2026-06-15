import {
  Banknote,
  Infinity as InfinityIcon,
  PiggyBank,
  HeartPulse,
  Plane,
  Gift,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

export type PriorityCategory = "need" | "want";

export type Priority = {
  id: string;
  title: string;
  /** Compact 1-2 word label for tight spaces (e.g. bubbles). */
  short: string;
  /** Short supporting line shown under the title. */
  subtitle: string;
  /** Framed as a yes/no/maybe question for the swipe deck. */
  question: string;
  category: PriorityCategory;
  icon: LucideIcon;
};

/**
 * Single shared source of truth for all three prototypes so the interaction
 * modes can be compared head-to-head in research. Edit here to change the
 * priorities everywhere.
 */
export const PRIORITIES: Priority[] = [
  {
    id: "income",
    title: "Reliable monthly income",
    short: "Steady income",
    subtitle: "A steady paycheck I can count on every month.",
    question: "Should your plan guarantee steady monthly income?",
    category: "need",
    icon: Banknote,
  },
  {
    id: "longevity",
    title: "Money that lasts my whole life",
    short: "Money for life",
    subtitle: "Never outliving my savings, however long I live.",
    question: "Should your plan make sure the money never runs out?",
    category: "need",
    icon: InfinityIcon,
  },
  {
    id: "liquidity",
    title: "Access to savings for emergencies",
    short: "Emergency cash",
    subtitle: "Cash I can reach quickly when life happens.",
    question: "Should your plan keep savings easy to access?",
    category: "need",
    icon: PiggyBank,
  },
  {
    id: "healthcare",
    title: "Cover healthcare & long-term care",
    short: "Healthcare",
    subtitle: "Protection against medical and care surprises.",
    question: "Should your plan cover big healthcare costs?",
    category: "need",
    icon: HeartPulse,
  },
  {
    id: "enjoy",
    title: "Enjoy retirement more now",
    short: "Enjoy now",
    subtitle: "Travel and spend while I'm young enough to enjoy it.",
    question: "Should your plan let you spend more in early retirement?",
    category: "want",
    icon: Plane,
  },
  {
    id: "legacy",
    title: "Leave money behind for loved ones",
    short: "Leave a legacy",
    subtitle: "An inheritance for my kids or causes I care about.",
    question: "Should your plan leave money behind for loved ones?",
    category: "want",
    icon: Gift,
  },
  {
    id: "spouse",
    title: "Protect my spouse or family",
    short: "Protect family",
    subtitle: "Make sure they're secure after I'm gone.",
    question: "Should your plan protect your spouse or family?",
    category: "want",
    icon: ShieldCheck,
  },
  {
    id: "inflation",
    title: "Keep up with inflation",
    short: "Beat inflation",
    subtitle: "Maintain my buying power as prices rise.",
    question: "Should your plan keep pace with rising prices?",
    category: "want",
    icon: TrendingUp,
  },
];

export const PROTOTYPES = [
  {
    slug: "sorting-deck",
    name: "The Sorting Deck",
    tagline: "Swipe each priority into essential, nice-to-have, or skip.",
    method: "Card swipe",
    accent: "purple" as const,
  },
  {
    slug: "coins-on-the-table",
    name: "Coins on the Table",
    tagline: "Spend a limited set of tokens on what matters most.",
    method: "Token budgeting",
    accent: "magenta" as const,
  },
  {
    slug: "the-weighting-game",
    name: "The Weighting Game",
    tagline: "Grow, shrink, and sort bubbles into needs and wants.",
    method: "Bubble weighting",
    accent: "purple" as const,
  },
];
