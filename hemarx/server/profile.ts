import type { InterviewAnswer, Struggle } from "./types";

export const LEARNER = {
  name: "Henrique",
  city: "Roodepoort",
  country: "South Africa",
  posture:
    "Solo technical founder selling a B2B product to owner-operators in used-car retail. Pre-revenue close. Builds more than he sells.",
  rule: "Just-in-time. Apply this week. No shelf-help. No learning for the sake of learning.",
};

export const STRUGGLE_LABELS: Record<Struggle, string> = {
  first_customers: "First paying customers this month",
  founder_outbound: "Founder-led outbound that books meetings",
  reach_the_owner: "Reach the owner, not the info@ bounce",
  build_trap: "Building instead of selling",
  pricing: "An offer a principal can say yes to without a board",
  cash: "Cash, runway, getting paid in South Africa",
  demand_side_sales: "Stop pitching features. Help the dealer buy.",
  time_split: "Protect selling hours on a maker calendar",
  ship_ai: "Ship AI the buyer will pay for, not more agents",
  sa_b2b: "South African owner-operator buying reality",
};

export const INTERVIEW_PROMPTS: Array<{ id: string; question: string }> = [
  {
    id: "fourteen_days",
    question:
      "If one problem disappeared in the next 14 days, what would actually change in your week?",
  },
  {
    id: "wasted_week",
    question:
      "Where did you last spend a week building instead of talking to the person who can pay?",
  },
  {
    id: "who_says_yes",
    question: "Who has to say yes for money to hit the account, and why do they stall?",
  },
  {
    id: "skill_this_week",
    question: "Which skill, if you had it this week, would get a dealer to yes?",
  },
  {
    id: "already_tried",
    question: "What have you already tried that burned time without a close?",
  },
  {
    id: "minutes",
    question:
      "How many minutes a day can you actually protect for learning plus applying — not browsing?",
  },
  {
    id: "next_action",
    question:
      "What is the next concrete action this week — a call, an email, a price, or a decision?",
  },
];

export const INTERVIEW_QUESTIONS: InterviewAnswer[] = INTERVIEW_PROMPTS.map((q) => ({
  ...q,
  answer: "",
}));

/** Test-only fixture. Never pre-fill the Ask User tool with these. */
export const SAMPLE_ANSWERS: InterviewAnswer[] = INTERVIEW_PROMPTS.map((q, i) => ({
  ...q,
  answer: [
    "A named dealer principal would take a 15-minute call and I would leave with a yes, a date, or a hard no.",
    "Prospect research and agent pipelines. The list got cleaner. The calendar did not fill.",
    "The dealer principal — the owner, not info@. They stall on contracts, trust, and mail that never reaches them.",
    "A demand-side sales conversation and a 15-minute pitch that is not a feature walkthrough.",
    "Generic mailboxes, mass outreach, and shipping more product as a substitute for selling.",
    "A 10-minute morning brief, then one applied block: ten named emails, three calls, or one rewritten offer.",
    "Ten named principals on their own domain. Four-sentence emails. Phone follow-up the same day.",
  ][i]!,
}));

export const DEFAULT_STRUGGLES: Struggle[] = [];
