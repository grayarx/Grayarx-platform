/**
 * Every GrayArx process: easy for the dealer, complete under the hood.
 */

export type ProcessId =
  | "sales"
  | "parts"
  | "service"
  | "trade_in"
  | "finance"
  | "missed_call"
  | "monday"
  | "onboarding";

export type ProcessPlaybook = {
  id: ProcessId;
  name: string;
  moneyHook: string;
  dealerSteps: string[];
  underTheHood: string[];
  easyButton: string;
  involved: string[];
};

export const PROCESS_PLAYBOOKS: ProcessPlaybook[] = [
  {
    id: "onboarding",
    name: "Get live (day one)",
    moneyHook: "Pilot is free — setup should take minutes, not a project.",
    dealerSteps: [
      "Enter yard name",
      "Toggle desks (parts off if you don’t sell parts)",
      "Paste stock CSV (or use demo cars)",
      "Optional: paste parts CSV with YOUR prices",
      "Click “Poll demo leads” once — see Nala answer",
    ],
    underTheHood: [
      "Creates dealership settings + showroom slug",
      "Imports stock into live inventory Nala can sell",
      "Imports parts with retail/cost markup rules",
      "Wires CRM mock webhook so every event is logged",
    ],
    easyButton: "/dealer/onboard",
    involved: ["settings", "stock import", "parts import", "showroom"],
  },
  {
    id: "sales",
    name: "Sell a car (enquiry → viewing)",
    moneyHook: "After-hours AutoTrader leads that wait until Monday often buy elsewhere.",
    dealerSteps: [
      "Keep paying AutoTrader / Cars (we don’t replace them)",
      "When a lead arrives, do nothing — Nala replies",
      "Show up to the viewing Nala booked",
      "Close the deal like you always do",
    ],
    underTheHood: [
      "Marketplace webhook or poll → ingest lead",
      "Match live stock (sold cars excluded)",
      "WhatsApp reply under 60s (Meta or mock outbox)",
      "Book viewing → confirmation WhatsApp",
      "CRM event viewing.booked (MotorX/CarLeads/Adas)",
    ],
    easyButton: "/admin/conversion",
    involved: ["stock", "WhatsApp", "CRM", "bookings", "ROI"],
  },
  {
    id: "parts",
    name: "Parts counter on WhatsApp",
    moneyHook: "Parts buyers who get no reply buy at the chain store same day.",
    dealerSteps: [
      "Export parts from Excel/DMS once",
      "Paste CSV (sku + your retail price)",
      "When Nala holds a part, hand it over at the counter",
    ],
    underTheHood: [
      "Module gate (off = no parts quotes)",
      "Match SKU / OEM / fitment",
      "Quote dealer retail (or cost×markup)",
      "Hold reduces qty; CRM parts.quoted",
    ],
    easyButton: "/api/parts",
    involved: ["parts catalog", "pricing rules", "hold", "WhatsApp", "CRM"],
  },
  {
    id: "service",
    name: "Book workshop jobs",
    moneyHook: "Empty service bays = wages with no revenue. Instant booking fills the diary.",
    dealerSteps: [
      "Leave service module on",
      "Check the calendar each morning",
      "Do the job; mark done when ready",
    ],
    underTheHood: [
      "Intent detect service vs sales",
      "Book next available slot",
      "WhatsApp confirm + CRM service.booked",
      "Calendar API for 14-day view / reschedule",
    ],
    easyButton: "/api/service/calendar",
    involved: ["service bookings", "calendar", "WhatsApp"],
  },
  {
    id: "trade_in",
    name: "Trade-in intake",
    moneyHook: "Slow trade-in replies kill the whole deal (car + trade).",
    dealerSteps: [
      "Appraiser opens the trade-in queue",
      "Reviews band + photos",
      "Confirms offer to sales",
    ],
    underTheHood: [
      "Parse make/model/year/km/condition",
      "Indicative band (not a final valuation)",
      "Photo attach (front/rear/interior/odometer)",
      "CRM tradein.captured",
    ],
    easyButton: "/api/tradein",
    involved: ["trade-in", "photos", "appraiser handoff"],
  },
  {
    id: "finance",
    name: "Finance pre-qual",
    moneyHook: "Deals die in document chase. Instant checklist + partner link keeps momentum.",
    dealerSteps: [
      "Set your finance partner URL (optional)",
      "When buyer asks finance, Nala sends the link",
      "Finance desk sees checklist completion",
    ],
    underTheHood: [
      "Start application + partner deep link",
      "Checklist: ID, payslip, bank, proof of address",
      "WhatsApp with link; status → submitted when complete",
    ],
    easyButton: "/api/finance/prequal",
    involved: ["partner link", "checklist", "WhatsApp"],
  },
  {
    id: "missed_call",
    name: "Missed-call recovery",
    moneyHook: "Every unanswered ring is a buyer who already chose you — then gave up.",
    dealerSteps: [
      "Point Twilio missed/no-answer to GrayArx (or use Simulate)",
      "Answer the warm WhatsApp thread when you’re free",
    ],
    underTheHood: [
      "Missed call → lead source missed_call",
      "Nala WhatsApp apology + stock help",
      "CRM missed_call.recovered",
    ],
    easyButton: "/api/recovery/missed-call",
    involved: ["Twilio", "WhatsApp", "CRM"],
  },
  {
    id: "monday",
    name: "Monday proof (why they renew)",
    moneyHook: "Subscriptions die without proof. Monday email is the renewal conversation.",
    dealerSteps: [
      "Open the email / outbox Monday morning",
      "Compare to the value calculator with YOUR lead volumes",
      "Decide to keep Professional OS — or we failed the pilot",
    ],
    underTheHood: [
      "Aggregate leads, after-hours, viewings, parts, service, trade-ins",
      "Email via Resend or mock outbox",
      "Money-lost model: leakage × GP vs subscription",
    ],
    easyButton: "/dealer",
    involved: ["ROI", "email", "value calculator"],
  },
];
