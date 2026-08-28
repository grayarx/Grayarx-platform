/** Structured CRM + product intel captured during a call. */
export type CallIntel = {
  decisionMakerName?: string;
  decisionMakerRole?: string;
  responseTime?: string;
  afterHoursProcess?: string;
  weeklyEnquiryVolume?: string;
  weekendCoverage?: "yes" | "no" | "unknown";
  channels?: string[];
  currentTools?: string[];
  mainPain?:
    | "after_hours"
    | "slow_response"
    | "lost_leads"
    | "admin_load"
    | "low_volume"
    | "unknown";
  objections?: string[];
  reactivationTrigger?: string;
  competitorMentioned?: string;
  demoAttendees?: string;
  callbackTime?: string;
  productFeedback?: string;
  popiaConcern?: string;
  pilotInterest?: "yes" | "maybe" | "no";
  outcome?:
    | "demo_booked"
    | "callback_scheduled"
    | "info_sent"
    | "not_now"
    | "not_interested"
    | "do_not_contact"
    | "ongoing";
};

export function mergeIntel(
  existing: Partial<CallIntel> | undefined,
  patch: Partial<CallIntel>,
): Partial<CallIntel> {
  const base: Partial<CallIntel> = { ...existing };
  for (const [key, value] of Object.entries(patch) as Array<
    [keyof CallIntel, CallIntel[keyof CallIntel]]
  >) {
    if (value === undefined) continue;
    if (key === "channels" || key === "currentTools" || key === "objections") {
      const listKey = key as "channels" | "currentTools" | "objections";
      const prev = base[listKey] ?? [];
      const next = Array.isArray(value) ? value : [String(value)];
      base[listKey] = [...new Set([...prev, ...next])];
      continue;
    }
    (base as Record<string, unknown>)[key] = value;
  }
  return base;
}

export function formatIntelNote(intel: Partial<CallIntel>): string | undefined {
  const parts: string[] = [];

  if (intel.decisionMakerName || intel.decisionMakerRole) {
    parts.push(
      `Contact: ${[intel.decisionMakerName, intel.decisionMakerRole].filter(Boolean).join(", ")}`,
    );
  }
  if (intel.afterHoursProcess || intel.responseTime) {
    parts.push(
      `Process: ${[intel.afterHoursProcess, intel.responseTime].filter(Boolean).join(" · ")}`,
    );
  }
  if (intel.weeklyEnquiryVolume) {
    parts.push(`Volume: ${intel.weeklyEnquiryVolume}/week`);
  }
  if (intel.weekendCoverage && intel.weekendCoverage !== "unknown") {
    parts.push(`Weekend coverage: ${intel.weekendCoverage}`);
  }
  if (intel.channels?.length) {
    parts.push(`Channels: ${intel.channels.join(", ")}`);
  }
  if (intel.currentTools?.length) {
    parts.push(`Tools: ${intel.currentTools.join(", ")}`);
  }
  if (intel.mainPain && intel.mainPain !== "unknown") {
    parts.push(`Pain: ${intel.mainPain.replaceAll("_", " ")}`);
  }
  if (intel.competitorMentioned) {
    parts.push(`Competitor: ${intel.competitorMentioned}`);
  }
  if (intel.objections?.length) {
    parts.push(`Objections: ${intel.objections.join("; ")}`);
  }
  if (intel.productFeedback) {
    parts.push(`Product feedback: ${intel.productFeedback}`);
  }
  if (intel.reactivationTrigger) {
    parts.push(`Revisit when: ${intel.reactivationTrigger}`);
  }
  if (intel.demoAttendees) {
    parts.push(`Demo attendees: ${intel.demoAttendees}`);
  }
  if (intel.callbackTime) {
    parts.push(`Callback: ${intel.callbackTime}`);
  }
  if (intel.popiaConcern) {
    parts.push(`POPIA: ${intel.popiaConcern}`);
  }
  if (intel.pilotInterest) {
    parts.push(`Pilot interest: ${intel.pilotInterest}`);
  }
  if (intel.outcome) {
    parts.push(`Outcome: ${intel.outcome.replaceAll("_", " ")}`);
  }

  return parts.length ? parts.join(" | ") : undefined;
}
