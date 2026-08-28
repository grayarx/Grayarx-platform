import type { CallIntel } from "@nalaOs/call-intel";
import type { CallStage } from "@nalaOs/call-stages";
import type { LeadContext } from "@nalaOs/sales-templates";

export type LiveCallSession = {
  id: string;
  prospectId: string;
  toPhone: string;
  lead: LeadContext;
  stage: CallStage;
  intel: Partial<CallIntel>;
  callSid?: string;
  emptyTurns: number;
  transcript: Array<{
    role: "agent" | "dealership";
    text: string;
    intent?: string;
  }>;
  createdAt: number;
  status: "pending" | "ringing" | "in-progress" | "completed" | "failed";
};

type SessionStore = Map<string, LiveCallSession>;

const globalStore = globalThis as typeof globalThis & {
  __grayarxCallSessions?: SessionStore;
};

function store(): SessionStore {
  if (!globalStore.__grayarxCallSessions) {
    globalStore.__grayarxCallSessions = new Map();
  }
  return globalStore.__grayarxCallSessions;
}

export function createLiveCallSession(input: {
  prospectId: string;
  toPhone: string;
  lead: LeadContext;
}): LiveCallSession {
  const session: LiveCallSession = {
    id: crypto.randomUUID(),
    prospectId: input.prospectId,
    toPhone: input.toPhone,
    lead: input.lead,
    stage: "opening",
    intel: {},
    emptyTurns: 0,
    transcript: [],
    createdAt: Date.now(),
    status: "pending",
  };
  store().set(session.id, session);
  return session;
}

export function getLiveCallSession(id: string): LiveCallSession | undefined {
  return store().get(id);
}

export function getLiveCallSessionByCallSid(
  callSid: string,
): LiveCallSession | undefined {
  for (const session of store().values()) {
    if (session.callSid === callSid) return session;
  }
  return undefined;
}

export function updateLiveCallSession(
  id: string,
  patch: Partial<LiveCallSession>,
): LiveCallSession | undefined {
  const current = store().get(id);
  if (!current) return undefined;
  const next = { ...current, ...patch };
  store().set(id, next);
  return next;
}

export function appendTranscript(
  id: string,
  turn: LiveCallSession["transcript"][number],
): void {
  const session = store().get(id);
  if (!session) return;
  session.transcript.push(turn);
  store().set(id, session);
}
