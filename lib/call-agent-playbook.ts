import type { LeadContext } from "@/lib/sales-templates";

export type CallIntent =
  | "decision-maker"
  | "gatekeeper"
  | "busy"
  | "what-is-grayarx"
  | "send-information"
  | "pricing"
  | "existing-tools"
  | "current-process"
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
  endCall: boolean;
};

type ReplyBuilder = (lead: LeadContext) => Omit<SmartReply, "intent">;

const replies: Record<CallIntent, ReplyBuilder> = {
  "decision-maker": (lead) => ({
    situation: "You have the right person",
    reply: `Perfect, I'll keep it brief. ${lead.callReason} Quick question: what normally happens when a WhatsApp enquiry comes in after hours?`,
    nextStep: "Stop speaking and listen to their current process.",
    endCall: false,
  }),
  gatekeeper: () => ({
    situation: "Receptionist or gatekeeper",
    reply:
      "Thanks for letting me know. Who would be the best person to speak to about online enquiries and test-drive bookings? If they're available, would you mind putting me through?",
    nextStep:
      "Ask for the contact's name and best time to call if they cannot transfer you.",
    endCall: false,
  }),
  busy: () => ({
    situation: "They are busy",
    reply:
      "Of course — I caught you at a bad time. Would later today or tomorrow morning be easier for a two-minute call?",
    nextStep: "Confirm one exact callback time and end the call promptly.",
    endCall: false,
  }),
  "what-is-grayarx": () => ({
    situation: "They ask what GrayArx does",
    reply:
      "GrayArx helps dealerships turn after-hours enquiries into booked test drives. We showcase your live vehicles in a branded showroom, respond while your team is unavailable, qualify the buyer and send the opportunity straight to your sales team. How are you handling those enquiries at the moment?",
    nextStep: "Listen for a gap in response time, follow-up, or booking.",
    endCall: false,
  }),
  "send-information": () => ({
    situation: "They ask you to send information",
    reply:
      "Absolutely. I don't want to send you a generic brochure that gets buried, though. What's the best WhatsApp number or email, and which matters more to you right now — after-hours enquiries or getting more test drives booked?",
    nextStep:
      "Confirm the contact detail, personalize the follow-up, and agree when to call back.",
    endCall: false,
  }),
  pricing: () => ({
    situation: "They ask about price",
    reply:
      "Fair question. We start with a free pilot on your own stock, with no credit card required, so you can see the value before discussing a paid plan. Pricing depends on the setup you need. Would you like to first see what the pilot would look like for your yard?",
    nextStep: "Book the walkthrough; do not invent or negotiate pricing.",
    endCall: false,
  }),
  "existing-tools": () => ({
    situation: "They already use a website, AutoTrader, or DMS",
    reply:
      "That's good — and we wouldn't ask you to replace any of it. GrayArx sits alongside your current setup and focuses on the gap between a buyer enquiring and your team getting a qualified, booked opportunity. What happens to an enquiry when the team is tied up or the dealership is closed?",
    nextStep: "Position GrayArx as complementary, then listen.",
    endCall: false,
  }),
  "current-process": () => ({
    situation: "They say their team already handles enquiries",
    reply:
      "That's a good sign — you already take lead response seriously. We're not trying to replace your team; we help them respond consistently when they're busy or off duty. Do you know roughly how quickly an after-hours enquiry gets its first response?",
    nextStep: "Use their answer to identify whether there is a response-time gap.",
    endCall: false,
  }),
  "ai-question": () => ({
    situation: "They directly ask whether it uses AI",
    reply:
      "Yes, automation helps handle the first after-hours response, but it works from your live stock and follows your dealership's process. The point isn't to replace your salespeople — it's to make sure they receive a warm, qualified opportunity instead of a cold message the next morning. Would you like me to show you exactly what the buyer experiences?",
    nextStep: "Be transparent; demonstrate the buyer journey if they agree.",
    endCall: false,
  }),
  privacy: () => ({
    situation: "They ask about POPIA, consent, or customer data",
    reply:
      "Important question. We complete the dealer agreement and POPIA consent process before anything goes live. I don't want to guess on a legal or technical detail, so I can bring the right person into the walkthrough to answer it properly. Is there a specific data concern you'd like us to cover?",
    nextStep: "Record the exact concern and escalate it to the appropriate person.",
    endCall: false,
  }),
  "book-demo": (lead) => ({
    situation: "They want to see it",
    reply:
      "Great — the best way is to show it using your own vehicles, not a generic presentation. Would Tuesday or Wednesday suit you better for a 15-minute walkthrough?",
    nextStep: `Confirm the date, time, attendee name, and contact details. Callback: ${lead.phoneNumber}.`,
    endCall: false,
  }),
  "not-interested": () => ({
    situation: "They are not interested",
    reply:
      "No problem at all — I appreciate your time. If it ever becomes relevant, you can find us at grayarx.com. Enjoy the rest of your day. Goodbye.",
    nextStep:
      "Speak the full farewell, wait for the audio to finish, and only then end the call. Do not restart the pitch.",
    endCall: true,
  }),
  "do-not-call": () => ({
    situation: "They ask not to be contacted",
    reply:
      "Of course. I'll mark your dealership as do not contact, and we won't call again. Thank you for letting me know. Goodbye.",
    nextStep:
      "Record the suppression, speak the full farewell, wait for the audio to finish, and only then end the call.",
    endCall: true,
  }),
  unknown: () => ({
    situation: "Question is unclear or outside approved facts",
    reply:
      "That's a good question, and I don't want to give you a made-up answer. Let me confirm it with the team and come back to you. What's the best number or email to use?",
    nextStep:
      "Capture the exact question and contact detail; hand it to a human.",
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
      /\b(busy|in a meeting|with a customer|call (me )?back|bad time|can'?t talk)\b/i,
  },
  {
    intent: "book-demo",
    pattern:
      /\b(show me|book (a )?(demo|meeting)|walk-?through|sounds good|interested|let'?s do it)\b/i,
  },
  {
    intent: "send-information",
    pattern:
      /\b(send (me )?(info|information|details|an email|a message)|email me|whatsapp me)\b/i,
  },
  {
    intent: "pricing",
    pattern: /\b(price|pricing|cost|how much|monthly|per month|fee)\b/i,
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
    intent: "existing-tools",
    pattern:
      /\b(already (have|use)|our (website|DMS|CRM)|AutoTrader|dealer management system)\b/i,
  },
  {
    intent: "current-process",
    pattern:
      /\b(we (already )?(reply|respond|handle|manage|follow up)|sales team handles|someone answers)\b/i,
  },
  {
    intent: "what-is-grayarx",
    pattern:
      /\b(what (is|does)|tell me (more|about)|what are you selling|reason for (the )?call|what'?s this about)\b/i,
  },
  {
    intent: "decision-maker",
    pattern:
      /^(yes|yes,? (that'?s|it is|this is) me|speaking|i am|that would be me|you are)[\s.!]*$/i,
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
  "Yes, that's me.",
  "I'm busy with a customer.",
  "What exactly does GrayArx do?",
  "Just send me some information.",
  "How much does it cost?",
  "We already use AutoTrader and a DMS.",
  "Our sales team already handles that.",
  "Is this AI?",
  "How do you handle customer data?",
  "Show me how it works.",
  "I'm not interested.",
  "Don't call us again.",
] as const;
