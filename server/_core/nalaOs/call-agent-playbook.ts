import type { CallIntel } from "@nalaOs/call-intel";
import { formatIntelNote, mergeIntel } from "@nalaOs/call-intel";
import type {
  CallContext,
  CallIntent,
  ReplyBundle,
  SmartReplyResult,
} from "@nalaOs/call-intents";
import type { LeadContext } from "@nalaOs/sales-templates";
import { defaultStage, nextStage } from "@nalaOs/call-stages";
import {
  battlecardFromMessage,
  competitorIntentPattern,
  findCompetitor,
} from "@nalaOs/competitors";

export type { CallContext, CallIntent, SmartReply, SmartReplyResult } from "@nalaOs/call-intents";

type ReplyBuilder = (
  lead: LeadContext,
  message: string,
) => ReplyBundle;

const replies: Record<CallIntent, ReplyBuilder> = {
  "permission-granted": (lead) => ({
    situation: "They have time — qualify the decision-maker",
    reply: `Appreciate it — I'll keep this tight. I'm trying to reach whoever handles online enquiries for ${lead.dealershipName}. Would that be you?`,
    nextStep: "Stop. If yes → discovery. If gatekeeper → get a name and transfer.",
    endCall: false,
  }),
  "decision-maker": (lead) => ({
    situation: "Decision-maker on the line — open discovery",
    reply: `Perfect — sixty seconds, I promise. ${lead.callReason} When that happens, does someone respond the same evening, or does it usually wait until the next morning?`,
    nextStep:
      "Listen. Their answer selects the branch. Log process, channels, and response time.",
    intel: {
      outcome: "ongoing",
      mainPain: "unknown",
    },
    endCall: false,
  }),
  gatekeeper: () => ({
    situation: "Receptionist or gatekeeper",
    reply:
      "No problem — who handles online enquiries and test-drive bookings there? If they're free, would you mind putting me through?",
    nextStep:
      "Capture name and role. Transfer if possible; otherwise book a callback with the decision-maker.",
    intel: { outcome: "ongoing" },
    endCall: false,
  }),
  busy: () => ({
    situation: "Bad timing — book a callback, don't pitch",
    reply:
      "Totally fair — wrong moment. Would later today or tomorrow morning suit a two-minute call?",
    nextStep: "Lock one callback slot with name and number. End promptly — no pitch on a busy contact.",
    intel: { outcome: "callback_scheduled" },
    endCall: false,
  }),
  "discovery-gap": () => ({
    situation: "Pain confirmed — slow or missed after-hours response",
    reply:
      "That's what we hear from a lot of yards — and the buyer usually books with whoever answers first. We help dealerships turn those enquiries into booked test drives while the interest is still hot. Would you be opposed to a free fifteen-minute look on your own stock — no card, nothing to replace?",
    nextStep:
      "Yes → book demo. Hesitation → one diagnostic question, not a feature list.",
    intel: {
      mainPain: "after_hours",
      pilotInterest: "maybe",
      outcome: "ongoing",
    },
    endCall: false,
  }),
  "discovery-strong": () => ({
    situation: "They claim a solid process — probe the gap",
    reply:
      "Good — sounds like you take it seriously. What's your average first response on WhatsApp or web — under an hour, or more like same-day?",
    nextStep:
      "Under an hour → probe weekends and after 6pm. Same-day → quantify cost of inaction.",
    intel: { mainPain: "unknown", outcome: "ongoing" },
    endCall: false,
  }),
  "weekend-gap": () => ({
    situation: "Weekend or after-hours gap confirmed",
    reply:
      "So weekdays are covered but weekends sit — that's when buyers often shop. If even one extra test drive a month came from those messages, would a free pilot on your stock be worth fifteen minutes to see?",
    nextStep: "Soft close on pilot. Log weekend volume if they mention it.",
    intel: {
      weekendCoverage: "no",
      mainPain: "after_hours",
      pilotInterest: "maybe",
    },
    endCall: false,
  }),
  "volume-high": () => ({
    situation: "High enquiry volume — speed and consistency matter",
    reply:
      "That's a healthy pipeline — the risk at that volume is enquiries slipping when someone's off or it's after hours. Are any of those sitting unanswered over a weekend, or does your team catch every one?",
    nextStep: "Use their answer to quantify leakage, then offer parallel pilot.",
    intel: { weeklyEnquiryVolume: "high", outcome: "ongoing" },
    endCall: false,
  }),
  "volume-low": () => ({
    situation: "Low enquiry volume — focus on conversion not volume",
    reply:
      "Makes sense — at lower volume every lead counts more. When one does come in after hours, does it get the same attention as a walk-in, or does it wait until someone is free?",
    nextStep: "Tie to conversion and lost-deal cost. Offer pilot if gap exists.",
    intel: { weeklyEnquiryVolume: "low", mainPain: "lost_leads" },
    endCall: false,
  }),
  "what-is-grayarx": () => ({
    situation: "They ask what GrayArx is — redirect to discovery",
    reply:
      "Fair question — we help yards turn missed enquiries into booked test drives. Before I explain how, help me understand your world: when a buyer messages after hours, what happens on your side?",
    nextStep: "Do not list features, tiers, or product names.",
    endCall: false,
  }),
  "send-information": () => ({
    situation: "They want info sent — qualify pain first",
    reply:
      "Happy to — I'd rather send something useful than a brochure that gets buried. Best WhatsApp or email? And is the bigger headache after-hours enquiries or slow follow-up on warm leads?",
    nextStep: "Confirm contact, tailor follow-up, agree check-back date.",
    intel: { outcome: "info_sent" },
    endCall: false,
  }),
  pricing: () => ({
    situation: "Price question — pilot before plans",
    reply:
      "Fair question. We start with a free pilot on your own stock — you see booked test drives before you pay anything. Paid plans depend on what you actually need; most yards decide after the pilot. Would seeing it on your vehicles be the sensible next step?",
    nextStep: "Book walkthrough. No numbers unless they push for plans.",
    intel: { objections: ["pricing"], pilotInterest: "maybe" },
    endCall: false,
  }),
  "pricing-tiers": () => ({
    situation: "Plans/tiers question — only when they ask",
    reply:
      "We keep it simple — entry covers web enquiries and live stock; higher tiers add WhatsApp and more volume. Most dealers pick a plan after the pilot proves ROI. Want to run the pilot first and only pay if it's clearly worth it?",
    nextStep: "Steer back to pilot. Escalate if they need exact pricing.",
    intel: { objections: ["pricing_tiers"] },
    endCall: false,
  }),
  "existing-tools": (_lead, message) => ({
    situation: "They have existing tools — parallel pilot, no cancel",
    reply:
      "That's fine — we're not asking you to cancel anything. GrayArx runs alongside your current setup as a free parallel pilot on your own stock. You compare results side by side, then decide. Would a no-commitment look be unreasonable?",
    nextStep: "Log every tool they name. Never trash their current provider.",
    intel: {
      currentTools: extractTools(message),
      objections: ["existing_tools"],
      pilotInterest: "maybe",
    },
    endCall: false,
  }),
  "current-process": () => ({
    situation: "Team handles enquiries — quantify the leak",
    reply:
      "That's a good sign. Roughly how many online enquiries in a week — and do any sit unanswered over a weekend?",
    nextStep: "Use volume + weekend gap before offering pilot.",
    intel: { outcome: "ongoing" },
    endCall: false,
  }),
  "competitor-named": (_lead, message) => {
    const card = battlecardFromMessage(message);
    if (card) {
      return {
        situation: `${card.competitor.name} named — coexistence + wedge`,
        reply: card.spokenReply,
        nextStep: `${card.nextStep} Beat lines: ${card.beatBullets.slice(0, 3).join(" | ")} Pricing: ${card.pricingContrast}`,
        intel: {
          competitorMentioned: card.competitor.name,
          objections: ["competitor"],
          pilotInterest: "maybe",
          productFeedback: card.competitor.productLessons[0],
        },
        endCall: false,
      };
    }
    return {
      situation: "Named competitor or alternative — don't trash, compare",
      reply:
        "Makes sense — a lot of yards already have something in place. We usually run a free parallel pilot so you can compare on your own stock without switching anything off. Would that kind of side-by-side look be fair?",
      nextStep: "Log competitor name for product intel. Never criticize them.",
      intel: {
        competitorMentioned: extractCompetitor(message),
        objections: ["competitor"],
        pilotInterest: "maybe",
      },
      endCall: false,
    };
  },
  "not-now": (lead) => ({
    situation: "Timing off — capture reactivation trigger",
    reply: `No problem — timing matters. Before I go: what would make this worth revisiting — more leads, faster response, or less admin for your team? You can reach us on ${lead.phoneNumber} when it suits.`,
    nextStep: "Log their answer. WhatsApp summary only if they ask.",
    intel: { outcome: "not_now", pilotInterest: "no" },
    endCall: false,
  }),
  "think-about-it": () => ({
    situation: "Needs internal discussion — leave a door open",
    reply:
      "Completely fair — I'd rather you decide properly than rush it. What would you need to see in a fifteen-minute walkthrough to know if it's worth taking to your team?",
    nextStep: "Their answer shapes the demo. Book if they name a criterion you can show.",
    intel: { pilotInterest: "maybe", outcome: "ongoing" },
    endCall: false,
  }),
  "ai-question": () => ({
    situation: "AI question — honest, back to their pain",
    reply:
      "Yes — automation handles the first response from your live stock so your team gets a warm lead instead of a cold message the next morning. Your salespeople still close. Does slow after-hours response cost you deals today?",
    nextStep: "Return to discovery. No product names unless they ask.",
    intel: { objections: ["ai"] },
    endCall: false,
  }),
  "already-tried-ai": () => ({
    situation: "Burned by chatbot before — differentiate on outcomes",
    reply:
      "I hear that a lot — generic bots frustrate buyers. We work from your live stock and hand off warm enquiries to your team, not endless loops. What went wrong with what you tried before?",
    nextStep: "Log their answer as product feedback. Tie back to booked test drives.",
    intel: {
      objections: ["bad_ai_experience"],
      productFeedback: "Prior bad chatbot experience",
    },
    endCall: false,
  }),
  privacy: (_lead, message) => ({
    situation: "POPIA or data — escalate detail, don't guess",
    reply:
      "Important question — we don't go live until dealer agreement and POPIA consent are signed. I don't want to guess on legal detail; we cover that properly in the walkthrough. What specific concern should we address?",
    nextStep: "Record exact concern. Human handles legal in demo.",
    intel: { popiaConcern: message.slice(0, 200) },
    endCall: false,
  }),
  "objection-trust": (lead) => ({
    situation: "Trust objection — who we are, verifiable next step",
    reply: `Fair — you shouldn't trust a cold call. We're GrayArx — grayarx.com — and ${lead.agentName} on this line. Happy to send one line to your WhatsApp so you can verify us before a demo. Would that help?`,
    nextStep: "Send approved follow-up only if they agree. No pressure.",
    intel: { objections: ["trust"] },
    endCall: false,
  }),
  "objection-contract": () => ({
    situation: "Locked into contract — parallel pilot, no cancel",
    reply:
      "Understood — we're not asking you to break anything. A free parallel pilot on your stock lets you see results alongside your current contract. When that contract comes up for review, you'll have real numbers. Would that be unreasonable?",
    nextStep: "Log contract provider if mentioned. Offer low-commitment look.",
    intel: { objections: ["contract"], pilotInterest: "maybe" },
    endCall: false,
  }),
  "objection-no-budget": () => ({
    situation: "Budget concern — pilot is free",
    reply:
      "That's exactly why we start with a free pilot — no card, no invoice until you've seen booked test drives on your own stock. If it doesn't pay for itself in the pilot, you walk away. Would fifteen minutes to see that be a waste of time?",
    nextStep: "Reframe to ROI, not cost. Book demo if they soften.",
    intel: { objections: ["budget"], pilotInterest: "maybe" },
    endCall: false,
  }),
  "objection-no-need": () => ({
    situation: "They say they don't need help — one diagnostic probe",
    reply:
      "Fair enough — sounds like things are working. Out of curiosity, when was the last time an after-hours enquiry turned into a test drive the same weekend?",
    nextStep: "If they engage → discovery. If firm no → polite exit.",
    intel: { objections: ["no_need"] },
    endCall: false,
  }),
  "needs-owner": () => ({
    situation: "Not the budget holder — get to the owner",
    reply:
      "Makes sense — who usually signs off on anything that affects enquiries or the website? Would it help if I sent a two-line summary you can forward, or is there a better time when they're available?",
    nextStep: "Capture owner name/role and callback window.",
    intel: { outcome: "ongoing" },
    endCall: false,
  }),
  hesitation: () => ({
    situation: "Soft no or maybe — isolate the real objection",
    reply:
      "Totally fair — sounds like you're not sure yet. Is it more about time, trust, or whether this actually moves the needle for your yard?",
    nextStep: "Their answer picks the objection branch. One question only.",
    intel: { pilotInterest: "maybe" },
    endCall: false,
  }),
  "pilot-terms": () => ({
    situation: "What's involved in the pilot",
    reply:
      "Simple — we load your live stock, turn on enquiries for a set period, and you see whether more test drives get booked. No card, nothing to cancel, runs alongside what you have. Does that sound low-risk enough to look at?",
    nextStep: "If yes → book demo. Don't expand into tier details.",
    intel: { pilotInterest: "maybe" },
    endCall: false,
  }),
  "demo-details": () => ({
    situation: "What happens in the demo",
    reply:
      "Fifteen minutes on your own vehicles — we show what a buyer sees after hours and how a warm enquiry lands with your team. No generic slides. Would Tuesday or Wednesday work?",
    nextStep: "Book slot and capture attendees.",
    intel: { pilotInterest: "yes" },
    endCall: false,
  }),
  "book-demo": (lead) => ({
    situation: "They agree — book and capture intel",
    reply:
      "Great — best on your own stock, not a generic demo. Tuesday or Wednesday for fifteen minutes? And who else should join — owner, sales manager, or whoever owns online leads?",
    nextStep: `Confirm date, time, attendees, contact. Callback: ${lead.phoneNumber}. Log tools and weekly volume.`,
    intel: {
      pilotInterest: "yes",
      outcome: "demo_booked",
    },
    endCall: false,
  }),
  "callback-confirmed": (_lead, message) => ({
    situation: "Callback time agreed",
    reply:
      "Perfect — I've got that down. I'll call then. If anything changes, grayarx.com has our details. Speak soon.",
    nextStep: "Persist callback time in CRM. End call politely.",
    intel: {
      callbackTime: message.slice(0, 120),
      outcome: "callback_scheduled",
    },
    endCall: false,
  }),
  "already-customer": () => ({
    situation: "Already a GrayArx customer",
    reply:
      "Ah — my apologies for the duplicate outreach. I'll flag this so we don't call again. Is there anything your account team should follow up on, or are you all set?",
    nextStep: "Mark as existing customer. Escalate to account team if needed.",
    intel: { outcome: "ongoing", objections: ["already_customer"] },
    endCall: false,
  }),
  "wrong-dealership": () => ({
    situation: "Wrong dealership or number",
    reply:
      "Sorry to bother you — I'll update our records. Have a good day. Goodbye.",
    nextStep: "Fix CRM data. End call immediately.",
    endCall: true,
  }),
  hostile: () => ({
    situation: "Hostile or aggressive — exit with dignity",
    reply:
      "Understood — I'll leave you in peace. Sorry for the interruption. Goodbye.",
    nextStep: "Do not re-pitch. Consider suppression if appropriate.",
    intel: { outcome: "not_interested", objections: ["hostile"] },
    endCall: true,
  }),
  "not-interested": () => ({
    situation: "Clear not interested — exit cleanly",
    reply:
      "Fair enough — I appreciate your time. If anything changes, grayarx.com. Enjoy the rest of your day. Goodbye.",
    nextStep: "Full farewell, wait for audio, end. Do not re-pitch.",
    intel: { outcome: "not_interested", pilotInterest: "no" },
    endCall: true,
  }),
  "do-not-call": () => ({
    situation: "Do not contact — suppress immediately",
    reply:
      "Of course — I'll mark you as do not contact and we won't call again. Thank you for letting me know. Goodbye.",
    nextStep: "Persist suppression before disconnecting.",
    intel: { outcome: "do_not_contact" },
    endCall: true,
  }),
  unknown: () => ({
    situation: "Outside approved knowledge — human handoff",
    reply:
      "Good question — I don't want to make something up. Let me confirm with the team and come back. Best number or email?",
    nextStep: "Capture exact question and contact. Queue human follow-up.",
    intel: { productFeedback: "Unhandled question — needs human" },
    endCall: false,
  }),
};

const intentMatchers: Array<{ intent: CallIntent; pattern: RegExp }> = [
  {
    intent: "do-not-call",
    pattern:
      /\b(do not call|don't call|stop calling|remove me|take me off|never contact|unsolicited)\b/i,
  },
  {
    intent: "wrong-dealership",
    pattern:
      /\b(wrong (number|dealership|company|person)|not a dealership|don't sell cars|closed down|went out of business)\b/i,
  },
  {
    intent: "hostile",
    pattern:
      /\b(stop wasting|get lost|piss off|fuck off|leave me alone|harassment|report you|scam call)\b/i,
  },
  {
    intent: "already-customer",
    pattern:
      /\b(already (have|using|on|with) grayarx|we'?re (a |an )?(grayarx )?customer|already signed up (with|for) (you|grayarx)|already have grayarx|existing (grayarx )?client)\b/i,
  },
  {
    intent: "gatekeeper",
    pattern:
      /\b(reception|receptionist|switchboard|not the (right )?person|doesn'?t handle|wrong person|front desk)\b/i,
  },
  {
    intent: "not-interested",
    pattern:
      /\b(not interested|no thanks|no thank you|don'?t need it|not for us|we'?re good thanks)\b/i,
  },
  {
    intent: "busy",
    pattern:
      /\b(busy|bad time|in a meeting|with a customer|can'?t talk|not a good time|driving|rush)\b/i,
  },
  {
    intent: "callback-confirmed",
    pattern:
      /\b(call (me )?(back )?(at|on|tomorrow|today|monday|tuesday|wednesday|thursday|friday|\d)|(\d{1,2}\s*(am|pm|h)))\b/i,
  },
  {
    intent: "book-demo",
    pattern:
      /\b(show me|book (a )?(demo|meeting)|walk-?through|let'?s do it|yes,? (please|that works|let'?s)|i'?m (in|open to it)|schedule (a )?(call|demo)|sounds reasonable)\b/i,
  },
  {
    intent: "pricing-tiers",
    pattern:
      /\b(tier|tiers|package|packages|plan|plans|growth|starter|whatsapp plan|what'?s included|feature list)\b/i,
  },
  {
    intent: "pricing",
    pattern:
      /\b(price|pricing|cost|how much|monthly|per month|fee|what do you charge|rands|rand)\b/i,
  },
  {
    intent: "pilot-terms",
    pattern:
      /\b(what'?s (involved|included)|pilot (terms|work)|how does the pilot|commitment|contract length|lock-?in)\b/i,
  },
  {
    intent: "demo-details",
    pattern:
      /\b(what happens (in|at)|what (do|will) you show|demo (like|involve)|what should i expect)\b/i,
  },
  {
    intent: "privacy",
    pattern:
      /\b(POPIA|privacy|personal information|customer data|consent|secure|security|GDPR|data protection)\b/i,
  },
  {
    intent: "already-tried-ai",
    pattern:
      /\b(tried (a )?(chatbot|bot|ai)|bad experience|didn'?t work|useless bot|hate bots|never again)\b/i,
  },
  {
    intent: "ai-question",
    pattern:
      /\b(is (it|this) ai|artificial intelligence|robot|bot|automated|automation|real person)\b/i,
  },
  {
    intent: "objection-trust",
    pattern:
      /\b(scam|who are you|never heard of|don'?t trust|verify|legit|is this real|sketchy)\b/i,
  },
  {
    intent: "objection-contract",
    pattern:
      /\b(locked in|under contract|just signed|contract with|can'?t switch|tied to)\b/i,
  },
  {
    intent: "objection-no-budget",
    pattern:
      /\b(no budget|can'?t afford|too expensive|cash flow|tight month|cost cutting)\b/i,
  },
  {
    intent: "needs-owner",
    pattern:
      /\b(speak to (the )?owner|not my decision|need (to ask|approval)|boss decides|owner decides|financial director)\b/i,
  },
  {
    intent: "think-about-it",
    pattern:
      /\b(think about it|discuss internally|talk to (the )?team|run it past|need to check)\b/i,
  },
  {
    intent: "send-information",
    pattern:
      /\b(send (me )?(info|information|details|an email|a message|a brochure)|email me|whatsapp me)\b/i,
  },
  {
    intent: "competitor-named",
    pattern: competitorIntentPattern(),
  },
  {
    intent: "weekend-gap",
    pattern:
      /\b(weekend|saturday|sunday|after (five|5|6|hours)|evenings?|nights?|public holiday)\b/i,
  },
  {
    intent: "volume-high",
    pattern:
      /\b(\d{2,}\s*(a )?(week|month)|lots of|high volume|busy inbox|flood of|tons of)\b/i,
  },
  {
    intent: "volume-low",
    pattern:
      /\b(only a few|one or two|not many|low volume|quiet|handful)\b/i,
  },
  {
    intent: "discovery-gap",
    pattern:
      /\b(next (day|morning|week)|monday|after hours|after-?hours|nobody|no one|slow|wait until|miss(ed|ing)?|lose (leads|deals)|don'?t (reply|respond)|overnight|cold|ghost)\b/i,
  },
  {
    intent: "discovery-strong",
    pattern:
      /\b(under an hour|same day|quickly|fast|we (reply|respond|answer)|team handles|someone (always|usually)|pretty good|we'?re fine|works well|same evening)\b/i,
  },
  {
    intent: "hesitation",
    pattern:
      /\b(not sure|maybe|i guess|skeptical|doubt|uncertain|on the fence|need to see)\b/i,
  },
  {
    intent: "objection-no-need",
    pattern:
      /\b(don'?t need|no need|we'?re fine|sorted already|all good|happy with)\b/i,
  },
  {
    intent: "existing-tools",
    pattern:
      /\b(already (have|use)|current (provider|supplier|system)|service provider|someone already|our (website|DMS|CRM)|dealer management system)\b/i,
  },
  {
    intent: "current-process",
    pattern:
      /\b(we (already )?(reply|respond|handle|manage|follow up)|sales team handles|someone answers)\b/i,
  },
  {
    intent: "not-now",
    pattern:
      /\b(not (right )?now|not at the moment|maybe later|another time|not ready|later (this year|on)|next quarter|next month)\b/i,
  },
  {
    intent: "what-is-grayarx",
    pattern:
      /\b(what (is|does)|tell me (more|about)|what are you selling|reason for (the )?call|what'?s this about|never heard of grayarx)\b/i,
  },
  {
    intent: "permission-granted",
    pattern:
      /\b(sixty seconds|60 seconds|go ahead|you have a minute|quick question|that'?s fine|fire away|make it quick)\b/i,
  },
  {
    intent: "decision-maker",
    pattern:
      /^(yes|yes,? (that'?s|it is|this is) me|speaking|i am|that would be me|you are|correct)[\s.!]*$/i,
  },
];

function extractTools(message: string): string[] {
  const tools: string[] = [];
  const named = findCompetitor(message);
  if (named) tools.push(named.name);
  const patterns: Array<[RegExp, string]> = [
    [/\bAutoTrader\b/i, "AutoTrader"],
    [/\bCars\.co\.za\b/i, "Cars.co.za"],
    [/\bDMS\b/i, "DMS"],
    [/\bCRM\b/i, "CRM"],
    [/\bWhatsApp Business\b/i, "WhatsApp Business"],
    [/\bwebsite\b/i, "Website"],
    [/\bdealer management\b/i, "DMS"],
  ];
  for (const [pattern, label] of patterns) {
    if (pattern.test(message) && !tools.includes(label)) tools.push(label);
  }
  return tools;
}

function extractCompetitor(message: string): string | undefined {
  return findCompetitor(message)?.name;
}

function refineIntent(
  intent: CallIntent,
  message: string,
  stage: import("@nalaOs/call-stages").CallStage,
): CallIntent {
  if (intent === "busy" && /\bcall (me )?back\b/i.test(message)) {
    return "callback-confirmed";
  }

  if (stage === "opening" && intent === "decision-maker") {
    return "decision-maker";
  }

  if (stage === "opening" && intent === "discovery-gap") {
    return "what-is-grayarx";
  }

  if (
    stage === "qualifying" &&
    intent === "permission-granted" &&
    /^(yes|yeah|yep)/i.test(message.trim())
  ) {
    return "decision-maker";
  }

  if (intent === "not-interested" && /\bthink about\b/i.test(message)) {
    return "think-about-it";
  }

  if (
    (intent === "existing-tools" ||
      intent === "objection-no-need" ||
      intent === "already-customer") &&
    findCompetitor(message)
  ) {
    return "competitor-named";
  }

  return intent;
}

function enrichIntelFromMessage(
  intent: CallIntent,
  message: string,
  patch: Partial<CallIntel>,
): Partial<CallIntel> {
  const enriched = { ...patch };

  if (intent === "discovery-gap" || intent === "weekend-gap") {
    enriched.afterHoursProcess = message.slice(0, 160);
    if (!enriched.responseTime) enriched.responseTime = "slow / next-day";
  }

  if (intent === "discovery-strong") {
    enriched.responseTime = message.slice(0, 120);
  }

  if (intent === "not-now" || intent === "think-about-it") {
    enriched.reactivationTrigger = message.slice(0, 160);
  }

  if (intent === "already-tried-ai") {
    enriched.productFeedback = message.slice(0, 200);
  }

  if (intent === "volume-high") {
    enriched.weeklyEnquiryVolume = message.match(/\d+/)?.[0]
      ? `${message.match(/\d+/)?.[0]}/week approx`
      : "high";
  }

  if (intent === "volume-low") {
    enriched.weeklyEnquiryVolume = "low";
  }

  if (/\bwhatsapp\b/i.test(message)) {
    enriched.channels = mergeIntel(undefined, {
      channels: ["WhatsApp"],
    }).channels;
  }
  if (/\b(website|web form|online)\b/i.test(message)) {
    enriched.channels = [
      ...new Set([...(enriched.channels ?? []), "Web"]),
    ];
  }

  return enriched;
}

export function getSmartReply(
  dealershipMessage: string,
  lead: LeadContext,
  context: CallContext = {},
): SmartReplyResult {
  const normalizedMessage = dealershipMessage.trim();
  const stage = context.stage ?? defaultStage();
  const priorIntel = context.intel ?? {};

  const rawIntent =
    intentMatchers.find(({ pattern }) => pattern.test(normalizedMessage))
      ?.intent ?? "unknown";

  const intent = refineIntent(rawIntent, normalizedMessage, stage);
  const bundle = replies[intent](lead, normalizedMessage);
  const intelPatch = enrichIntelFromMessage(
    intent,
    normalizedMessage,
    bundle.intel ?? {},
  );
  const intel = mergeIntel(priorIntel, intelPatch);
  const resolvedStage = nextStage(stage, intent);
  const intelNote =
    formatIntelNote(intelPatch) ?? formatIntelNote(intel);

  return {
    intent,
    situation: bundle.situation,
    reply: bundle.reply,
    nextStep: bundle.nextStep,
    endCall: bundle.endCall,
    nextStage: resolvedStage,
    intel,
    intelNote,
  };
}

export const smartReplyExamples = [
  { label: "Gatekeeper", message: "I'm just the receptionist.", stage: "opening" as const },
  { label: "Permission", message: "You've got sixty seconds.", stage: "opening" as const },
  { label: "Decision-maker", message: "Yes, that's me.", stage: "qualifying" as const },
  { label: "Bad timing", message: "You caught me at a bad time.", stage: "opening" as const },
  { label: "What is GrayArx?", message: "What exactly does GrayArx do?", stage: "discovering" as const },
  { label: "Pain — next morning", message: "It usually waits until the next morning.", stage: "discovering" as const },
  { label: "Strong process", message: "We're pretty quick — someone always replies.", stage: "discovering" as const },
  { label: "Weekend gap", message: "Nobody checks WhatsApp over the weekend.", stage: "discovering" as const },
  { label: "High volume", message: "We get about 40 enquiries a week.", stage: "discovering" as const },
  { label: "Trust objection", message: "Never heard of you — is this a scam?", stage: "presenting" as const },
  { label: "Bad AI before", message: "We tried a chatbot before and it was useless.", stage: "presenting" as const },
  { label: "Has AutoTrader", message: "We already use AutoTrader and a DMS.", stage: "presenting" as const },
  { label: "Needs owner", message: "I'd need to run this past the owner.", stage: "presenting" as const },
  { label: "Pricing", message: "How much does it cost?", stage: "presenting" as const },
  { label: "Plans", message: "What plans do you offer?", stage: "presenting" as const },
  { label: "Pilot terms", message: "What's involved in the pilot?", stage: "presenting" as const },
  { label: "Hesitation", message: "I'm not sure — maybe.", stage: "presenting" as const },
  { label: "Book demo", message: "Sure, let's do a quick look.", stage: "presenting" as const },
  { label: "Not now", message: "Sounds good, but not right now.", stage: "presenting" as const },
  { label: "POPIA", message: "How do you handle customer data under POPIA?", stage: "presenting" as const },
  { label: "Do not call", message: "Don't call us again.", stage: "opening" as const },
] as const;

export const funnelPrinciples = [
  {
    title: "Diagnose before prescribing",
    detail: "Never mention product names, tiers, or features until they ask.",
  },
  {
    title: "One question per turn",
    detail: "Each reply ends with at most one question, then silence.",
  },
  {
    title: "Quantify cost of inaction",
    detail: "Buyers book with whoever answers first — tie pain to lost test drives.",
  },
  {
    title: "Log everything useful",
    detail: "Tools, volume, objections, and feedback improve GrayArx and CRM.",
  },
  {
    title: "Close on the pilot",
    detail: "Free, parallel, no card — lower risk than asking them to decide now.",
  },
  {
    title: "Exit with dignity",
    detail: "Not interested and do-not-call get a full goodbye, no re-pitch.",
  },
] as const;
