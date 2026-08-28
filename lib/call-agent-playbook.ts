import type { LeadContext } from "@/lib/sales-templates";

export type CallIntent =
  | "decision-maker"
  | "gatekeeper"
  | "busy"
  | "discovery-gap"
  | "discovery-strong"
  | "what-is-grayarx"
  | "send-information"
  | "pricing"
  | "pricing-tiers"
  | "existing-tools"
  | "current-process"
  | "not-now"
  | "ai-question"
  | "privacy"
  | "book-demo"
  | "not-interested"
  | "do-not-call"
  | "unknown";

export type SmartReply = {
  intent: CallIntent;
  situation: string;
  reply: string;
  nextStep: string;
  /** Log to CRM — tools, response times, pain, decision-maker name, etc. */
  intelNote?: string;
  endCall: boolean;
};

type ReplyBuilder = (lead: LeadContext) => Omit<SmartReply, "intent">;

const replies: Record<CallIntent, ReplyBuilder> = {
  "decision-maker": (lead) => ({
    situation: "You have the decision-maker — start discovery",
    reply: `Perfect — I'll keep this short. ${lead.callReason} When that happens, does someone respond the same evening, or does it usually wait until the next morning?`,
    nextStep:
      "Stop talking. Their answer drives the next branch — log process, tools, and response time.",
    intelNote:
      "Decision-maker confirmed. Capture: after-hours process, first-response time, channels used.",
    endCall: false,
  }),
  gatekeeper: () => ({
    situation: "Receptionist or gatekeeper",
    reply:
      "No problem — who handles online enquiries and test-drive bookings there? If they're free, would you mind putting me through?",
    nextStep:
      "Get a name and direct transfer. If not available, book a callback with the right person.",
    intelNote: "Gatekeeper — note contact name and best callback time if no transfer.",
    endCall: false,
  }),
  busy: () => ({
    situation: "They are busy",
    reply:
      "Totally fair — I caught you at the wrong moment. Would later today or tomorrow morning work for a two-minute call?",
    nextStep: "Lock one callback slot, confirm name and number, end promptly.",
    intelNote: "Busy — log agreed callback time.",
    endCall: false,
  }),
  "discovery-gap": () => ({
    situation: "They admit a gap — slow response, after-hours miss, lost leads",
    reply:
      "That's what we hear from a lot of yards — and the buyer usually books with whoever answers first. We help dealerships turn those enquiries into booked test drives while the interest is still hot. Would you be opposed to a free fifteen-minute look on your own stock — no card, nothing to replace?",
    nextStep:
      "If yes → book demo and capture intel. If hesitant → one more diagnostic question, not a pitch.",
    intelNote:
      "Pain confirmed: slow/after-hours response. Log channels, volume, and current tools.",
    endCall: false,
  }),
  "discovery-strong": () => ({
    situation: "They say their process is already solid",
    reply:
      "Good — sounds like you take it seriously. Out of curiosity, what's your average first response on WhatsApp or web — under an hour, or more like same-day?",
    nextStep:
      "Under an hour → probe weekends and after 6pm. Same-day → tie to cost of inaction, then offer pilot.",
    intelNote:
      "Claims strong process — log stated response time and who owns enquiries.",
    endCall: false,
  }),
  "what-is-grayarx": () => ({
    situation: "They ask what GrayArx is",
    reply:
      "Fair question — we help yards turn missed enquiries into booked test drives. Before I explain how, help me understand your world: when a buyer messages after hours, what happens on your side?",
    nextStep:
      "Redirect to discovery. Do not list features, tiers, or product names.",
    endCall: false,
  }),
  "send-information": () => ({
    situation: "They ask you to send information",
    reply:
      "Happy to — I'd rather send something useful than a brochure that gets buried. What's the best WhatsApp or email, and is your bigger headache after-hours enquiries or slow follow-up on warm leads?",
    nextStep:
      "Confirm contact detail, tailor the follow-up to their answer, agree when to check back.",
    intelNote: "Requested info — log preferred channel and stated priority pain.",
    endCall: false,
  }),
  pricing: () => ({
    situation: "They ask about price",
    reply:
      "Fair question. We start with a free pilot on your own stock — you see booked test drives before you pay anything. Paid plans depend on what you actually need; most yards decide after the pilot, not before. Would seeing it on your vehicles be the sensible next step?",
    nextStep:
      "Book the walkthrough. Do not quote numbers or tier names unless they push for plans.",
    endCall: false,
  }),
  "pricing-tiers": () => ({
    situation: "They ask about plans, packages, or tiers",
    reply:
      "We keep it simple — entry covers web enquiries and your live stock; higher tiers add WhatsApp and more volume. But honestly, most dealers pick a plan after the pilot proves ROI, not before. Want to run the pilot first and only pay if it's clearly worth it?",
    nextStep:
      "Steer back to pilot/demo. Full pricing sheet only if they insist — escalate if needed.",
    endCall: false,
  }),
  "existing-tools": () => ({
    situation: "They already have a provider or existing tools",
    reply:
      "That's fine — we're not asking you to cancel anything. GrayArx runs alongside your current setup as a free parallel pilot on your own stock. You compare results side by side, then decide. Would a no-commitment look be unreasonable?",
    nextStep:
      "If yes → book demo. Never trash their current provider.",
    intelNote: "Existing tools/provider — log names (AutoTrader, DMS, CRM, website vendor).",
    endCall: false,
  }),
  "current-process": () => ({
    situation: "They say their team already handles enquiries",
    reply:
      "That's a good sign. Quick follow-up: do you know roughly how many online enquiries you get in a week — and whether any sit unanswered over a weekend?",
    nextStep:
      "Use volume and weekend gap to quantify cost of inaction before offering a pilot.",
    intelNote: "Team handles enquiries — log weekly volume and weekend coverage.",
    endCall: false,
  }),
  "not-now": (lead) => ({
    situation: "Interested, but not right now",
    reply: `No problem — timing matters. Before I go: what's the one thing that would make this worth revisiting — more leads, faster response, or less admin for your team? You can also reach us on ${lead.phoneNumber} when it makes sense.`,
    nextStep:
      "Log their answer for product intel. Offer one WhatsApp summary only if they say yes.",
    intelNote: "Not now — log reactivation trigger they name.",
    endCall: false,
  }),
  "ai-question": () => ({
    situation: "They ask whether it uses AI",
    reply:
      "Yes — automation handles the first response from your live stock so your team gets a warm lead instead of a cold message the next morning. Your salespeople still close; we just stop enquiries going cold. Does slow after-hours response cost you deals today?",
    nextStep:
      "Return to discovery. Be transparent; no product names unless they ask.",
    endCall: false,
  }),
  privacy: () => ({
    situation: "POPIA, consent, or customer data",
    reply:
      "Important question — we don't go live until dealer agreement and POPIA consent are signed. I don't want to guess on legal detail; we cover that properly in the walkthrough. Is there a specific data concern you want answered?",
    nextStep:
      "Record the exact concern, escalate to a human for the demo.",
    intelNote: "Privacy concern — log exact question for compliance follow-up.",
    endCall: false,
  }),
  "book-demo": (lead) => ({
    situation: "They agree to see it",
    reply:
      "Great — best way is on your own stock, not a generic demo. Would Tuesday or Wednesday work for fifteen minutes? And who else should be on that call — owner, sales manager, or whoever owns online leads?",
    nextStep: `Confirm date, time, attendees, and contact details. Callback: ${lead.phoneNumber}. Log tools and weekly enquiry volume before ending.`,
    intelNote:
      "Demo booked — log: date/time, attendees, enquiry volume, current tools, main pain.",
    endCall: false,
  }),
  "not-interested": () => ({
    situation: "They are not interested",
    reply:
      "Fair enough — I appreciate your time. If anything changes, we're at grayarx.com. Enjoy the rest of your day. Goodbye.",
    nextStep:
      "Speak the full farewell, wait for audio to finish, then end. Do not re-pitch.",
    intelNote: "Not interested — log if they gave a reason before goodbye.",
    endCall: true,
  }),
  "do-not-call": () => ({
    situation: "They ask not to be contacted",
    reply:
      "Of course — I'll mark you as do not contact and we won't call again. Thank you for letting me know. Goodbye.",
    nextStep:
      "Persist suppression, speak full farewell, wait for audio, then end.",
    endCall: true,
  }),
  unknown: () => ({
    situation: "Unclear or outside approved facts",
    reply:
      "Good question — I don't want to make something up. Let me confirm with the team and come back to you. What's the best number or email?",
    nextStep: "Capture exact question and contact detail; hand to a human.",
    endCall: false,
  }),
};

const intentMatchers: Array<{
  intent: CallIntent;
  pattern: RegExp;
}> = [
  {
    intent: "do-not-call",
    pattern:
      /\b(do not call|don't call|stop calling|remove me|take me off|never contact)\b/i,
  },
  {
    intent: "gatekeeper",
    pattern:
      /\b(reception|receptionist|switchboard|not the (right )?person|doesn'?t handle|speak to the manager|wrong person)\b/i,
  },
  {
    intent: "not-interested",
    pattern: /\b(not interested|no thanks|no thank you|don'?t need it)\b/i,
  },
  {
    intent: "busy",
    pattern:
      /\b(busy|bad time|in a meeting|with a customer|call (me )?back|can'?t talk|not a good time)\b/i,
  },
  {
    intent: "book-demo",
    pattern:
      /\b(show me|book (a )?(demo|meeting)|walk-?through|sounds good|let'?s do it|yes,? (please|that works)|i'?m (in|open to it))\b/i,
  },
  {
    intent: "pricing-tiers",
    pattern:
      /\b(tier|tiers|package|packages|plan|plans|growth|starter|whatsapp plan|what'?s included)\b/i,
  },
  {
    intent: "pricing",
    pattern: /\b(price|pricing|cost|how much|monthly|per month|fee|what do you charge)\b/i,
  },
  {
    intent: "privacy",
    pattern:
      /\b(POPIA|privacy|personal information|customer data|consent|secure|security)\b/i,
  },
  {
    intent: "ai-question",
    pattern:
      /\b(is (it|this) ai|artificial intelligence|robot|bot|automated|automation)\b/i,
  },
  {
    intent: "send-information",
    pattern:
      /\b(send (me )?(info|information|details|an email|a message)|email me|whatsapp me)\b/i,
  },
  {
    intent: "discovery-gap",
    pattern:
      /\b(next (day|morning|week)|monday|after hours|after-?hours|nobody|no one|slow|wait until|miss(ed|ing)?|lose (leads|deals)|don'?t (reply|respond)|weekend|overnight|cold)\b/i,
  },
  {
    intent: "discovery-strong",
    pattern:
      /\b(under an hour|same day|quickly|fast|we (reply|respond|answer)|team handles|someone (always|usually)|pretty good|no problem|we'?re fine|works well)\b/i,
  },
  {
    intent: "existing-tools",
    pattern:
      /\b(already (have|use)|current (provider|supplier|system)|service provider|someone already|our (website|DMS|CRM)|AutoTrader|dealer management system)\b/i,
  },
  {
    intent: "current-process",
    pattern:
      /\b(we (already )?(reply|respond|handle|manage|follow up)|sales team handles|someone answers)\b/i,
  },
  {
    intent: "not-now",
    pattern:
      /\b(not (right )?now|not at the moment|maybe later|another time|not ready|later (this year|on)|call (me )?(next|in|after))\b/i,
  },
  {
    intent: "what-is-grayarx",
    pattern:
      /\b(what (is|does)|tell me (more|about)|what are you selling|reason for (the )?call|what'?s this about|never heard of)\b/i,
  },
  {
    intent: "decision-maker",
    pattern:
      /^(yes|yes,? (that'?s|it is|this is) me|speaking|i am|that would be me|you are|sixty seconds|go ahead|that'?s fine)[\s.!]*$/i,
  },
];

export function getSmartReply(
  dealershipMessage: string,
  lead: LeadContext,
): SmartReply {
  const normalizedMessage = dealershipMessage.trim();
  const matchedIntent =
    intentMatchers.find(({ pattern }) => pattern.test(normalizedMessage))
      ?.intent ?? "unknown";

  return {
    intent: matchedIntent,
    ...replies[matchedIntent](lead),
  };
}

export const smartReplyExamples = [
  "I'm just the receptionist.",
  "Yes, that's me — you've got sixty seconds.",
  "You caught me at a bad time.",
  "What exactly does GrayArx do?",
  "It usually waits until the next morning.",
  "We're pretty quick — someone always replies.",
  "Just send me some information.",
  "How much does it cost?",
  "What plans do you offer?",
  "We already use AutoTrader and a DMS.",
  "Our sales team already handles that.",
  "It sounds good, but not right now.",
  "Is this AI?",
  "How do you handle customer data?",
  "Sure, let's do a quick look.",
  "I'm not interested.",
  "Don't call us again.",
] as const;
