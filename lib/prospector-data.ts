import type { Prospect } from "@/lib/prospector-types";

export const MOCK_PROSPECTS: Prospect[] = [
  {
    id: "sandton-audi",
    name: "Sandton Audi Prestige",
    location: "Sandton, Gauteng",
    score: 88,
    status: "queued_for_call",
    researchNote:
      "Strong premium stock online — curious how after-hours enquiries are handled",
    callReason:
      "I noticed strong stock on your site — I'm curious what happens when a buyer enquires after your team has gone home.",
    contactName: "Sales manager",
    phone: "+27 11 555 0101",
  },
  {
    id: "pe-prestige",
    name: "PE Prestige Motorworks",
    location: "Port Elizabeth, Eastern Cape",
    score: 88,
    status: "scouted",
    researchNote:
      "Healthy used-car mix — one question about weekend enquiry coverage",
    callReason:
      "Your yard came up on our research — when a buyer messages on a Sunday, does someone get back to them that night?",
    phone: "+27 41 555 0202",
  },
  {
    id: "jubilee-motors",
    name: "Jubilee Motors",
    location: "Johannesburg, Gauteng",
    score: 87,
    status: "emailed",
    researchNote: "Good fit for after-hours test-drive recovery",
    callReason:
      "Quick question about how online enquiries get followed up when your team is off duty.",
    emailedAt: "2026-08-14",
    phone: "+27 11 555 0303",
  },
  {
    id: "tygervalley-prestige",
    name: "Tygervalley Prestige Motors",
    location: "Cape Town, Western Cape",
    score: 86,
    status: "queued_for_call",
    researchNote:
      "Named contact on research pool — strong fit for enquiry recovery",
    callReason:
      "Sipho flagged your yard as a strong fit — I'm curious what happens to enquiries that come in after hours.",
    contactName: "Imported contact",
    phone: "+27 21 555 0404",
  },
];
