import { newId, readJsonFile, writeJsonFile } from "@nalaOs/conversion/store";

export type CrmProvider = "motorx" | "carleads" | "adas" | "custom";

export type CrmSubscription = {
  id: string;
  provider: CrmProvider;
  url: string;
  dealershipId: string;
  active: boolean;
  createdAt: string;
};

export type CrmEventType =
  | "lead.answered"
  | "viewing.booked"
  | "parts.quoted"
  | "service.booked"
  | "tradein.captured"
  | "missed_call.recovered";

export type CrmDelivery = {
  id: string;
  subscriptionId: string;
  provider: CrmProvider;
  event: CrmEventType;
  payload: Record<string, unknown>;
  status: "delivered" | "failed" | "mock";
  createdAt: string;
  responseStatus?: number;
  error?: string;
};

type State = {
  subscriptions: CrmSubscription[];
  deliveries: CrmDelivery[];
};

const FILE = "crm-webhooks.json";

function load(): State {
  return readJsonFile(FILE, { subscriptions: [], deliveries: [] });
}

function save(state: State) {
  writeJsonFile(FILE, state);
}

export function listCrmSubscriptions(): CrmSubscription[] {
  return load().subscriptions;
}

export function listCrmDeliveries(): CrmDelivery[] {
  return load().deliveries;
}

export function registerCrmWebhook(input: {
  provider: CrmProvider;
  url: string;
  dealershipId?: string;
}): CrmSubscription {
  const sub: CrmSubscription = {
    id: newId("crm"),
    provider: input.provider,
    url: input.url.trim(),
    dealershipId: input.dealershipId ?? "demo-yard",
    active: true,
    createdAt: new Date().toISOString(),
  };
  const state = load();
  state.subscriptions.unshift(sub);
  save(state);
  return sub;
}

/**
 * Fan-out CRM events. Mock URLs (mock:// or empty) always succeed into outbox.
 * Real http(s) URLs are POSTed; failures still recorded.
 */
export async function emitCrmEvent(input: {
  event: CrmEventType;
  dealershipId?: string;
  payload: Record<string, unknown>;
}): Promise<CrmDelivery[]> {
  const state = load();
  const dealershipId = input.dealershipId ?? "demo-yard";
  const subs = state.subscriptions.filter(
    (s) => s.active && s.dealershipId === dealershipId,
  );

  // Ensure at least a mock MotorX sink so demos always produce deliveries
  const targets =
    subs.length > 0
      ? subs
      : [
          {
            id: "crm_default_mock",
            provider: "motorx" as const,
            url: "mock://motorx/leads",
            dealershipId,
            active: true,
            createdAt: new Date().toISOString(),
          },
        ];

  const deliveries: CrmDelivery[] = [];

  for (const sub of targets) {
    const delivery: CrmDelivery = {
      id: newId("crmd"),
      subscriptionId: sub.id,
      provider: sub.provider,
      event: input.event,
      payload: {
        ...input.payload,
        dealershipId,
        emittedAt: new Date().toISOString(),
      },
      status: "mock",
      createdAt: new Date().toISOString(),
    };

    if (sub.url.startsWith("mock://") || sub.url === "mock") {
      delivery.status = "mock";
    } else if (sub.url.startsWith("http://") || sub.url.startsWith("https://")) {
      try {
        const res = await fetch(sub.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-GrayArx-Event": input.event,
            "X-GrayArx-Provider": sub.provider,
          },
          body: JSON.stringify(delivery.payload),
        });
        delivery.responseStatus = res.status;
        delivery.status = res.ok ? "delivered" : "failed";
        if (!res.ok) delivery.error = await res.text();
      } catch (err) {
        delivery.status = "failed";
        delivery.error =
          err instanceof Error ? err.message : "Webhook delivery failed";
      }
    } else {
      delivery.status = "mock";
    }

    deliveries.push(delivery);
    state.deliveries.unshift(delivery);
  }

  // Persist default mock sub if we invented it
  if (subs.length === 0 && !state.subscriptions.some((s) => s.id === "crm_default_mock")) {
    state.subscriptions.unshift(targets[0]!);
  }

  save(state);
  return deliveries;
}
