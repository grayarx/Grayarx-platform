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

export const INTERVIEW_QUESTIONS: InterviewAnswer[] = [
  {
    id: "fourteen_days",
    question:
      "If one problem disappeared in the next 14 days, what would actually change in your week?",
    answer:
      "A named dealer principal would take a 15-minute call and I would leave with a yes, a date, or a hard no — not another week of product work pretending it is progress.",
  },
  {
    id: "wasted_week",
    question:
      "Where did you last spend a week building instead of talking to the person who can pay?",
    answer:
      "Prospect research, email quality rules, and agent pipelines. The list got cleaner. The calendar did not fill. I optimised the machine that finds names instead of sitting in conversations with the names I already have.",
  },
  {
    id: "who_says_yes",
    question:
      "Who has to say yes for money to hit the account, and why do they stall?",
    answer:
      "The dealer principal — the owner, not the receptionist, not info@. They stall because they are already in a contract, they do not trust unknown software, and most mail never reaches them. They buy like owner-operators: cash, trust, and 'will this make me a weekend'.",
  },
  {
    id: "skill_this_week",
    question:
      "Which skill, if you had it this week, would get a dealer to yes?",
    answer:
      "A demand-side sales conversation and a 15-minute pitch that is not a feature walkthrough. I can build. I need to help an owner see progress in their yard, then ask for a small yes they can make alone.",
  },
  {
    id: "already_tried",
    question: "What have you already tried that burned time without a close?",
    answer:
      "Generic mailboxes, mass outreach, LinkedIn-only hunting, and shipping more product as a substitute for selling. Bounce-bait wastes the domain. More agents do not get a principal on the phone.",
  },
  {
    id: "minutes",
    question:
      "How many minutes a day can you actually protect for learning plus applying — not browsing?",
    answer:
      "A 10-minute morning brief with coffee, then one applied block: ten named emails, three calls, or one rewritten offer. If it cannot be used the same day, it does not belong on the list.",
  },
  {
    id: "next_action",
    question:
      "What is the next concrete action this week — a call, an email, a price, or a decision?",
    answer:
      "Ten named principals on their own domain. Four-sentence emails. Phone follow-up the same day. A pilot price an owner can approve without a committee. Stop opening the codebase until those ten are done.",
  },
];

export const DEFAULT_STRUGGLES: Struggle[] = [
  "first_customers",
  "founder_outbound",
  "reach_the_owner",
  "build_trap",
  "pricing",
  "cash",
  "demand_side_sales",
  "time_split",
  "sa_b2b",
];
