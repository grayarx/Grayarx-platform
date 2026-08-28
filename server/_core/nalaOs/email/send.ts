import { newId, readJsonFile, writeJsonFile } from "@nalaOs/conversion/store";
import { buildMondayRoiReport, type RoiReport } from "@nalaOs/conversion/roi";
import { listPartsEnquiries } from "@nalaOs/os/parts";
import { listServiceBookings } from "@nalaOs/os/service";
import { listTradeIns } from "@nalaOs/os/tradein";

export type EmailMessage = {
  id: string;
  to: string;
  subject: string;
  body: string;
  kind: "monday_roi" | "generic";
  channel: "mock" | "resend";
  status: "sent" | "failed";
  createdAt: string;
  error?: string;
};

type Outbox = { messages: EmailMessage[] };

const FILE = "email-outbox.json";

function load(): Outbox {
  return readJsonFile(FILE, { messages: [] });
}

function save(outbox: Outbox) {
  writeJsonFile(FILE, outbox);
}

export function buildMondayEmailBody(
  report: RoiReport,
  partsCount = 0,
): string {
  const parts = partsCount;
  const services = listServiceBookings().length;
  const trades = listTradeIns().length;
  return [
    report.headline,
    "",
    ...report.proofLines.map((l) => `• ${l}`),
    `• ${parts} parts quotes`,
    `• ${services} service bookings`,
    `• ${trades} trade-in intakes`,
    "",
    `Generated ${report.generatedAt}`,
    "— GrayArx Dealership OS",
  ].join("\n");
}

/**
 * Sends Monday ROI email. Uses Resend when RESEND_API_KEY set; otherwise mock outbox.
 */
export async function sendMondayRoiEmail(input: {
  to: string;
  dealershipName?: string;
}): Promise<{ email: EmailMessage; report: RoiReport }> {
  const report = buildMondayRoiReport();
  const subject = `Monday ROI — ${input.dealershipName ?? "Your yard"}`;
  const body = buildMondayEmailBody(report, (await listPartsEnquiries()).length);
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.RESEND_FROM_EMAIL?.trim() || "GrayArx <reports@grayarx.com>";

  const email: EmailMessage = {
    id: newId("em"),
    to: input.to.trim(),
    subject,
    body,
    kind: "monday_roi",
    channel: apiKey ? "resend" : "mock",
    status: "sent",
    createdAt: new Date().toISOString(),
  };

  if (apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [email.to],
          subject: email.subject,
          text: email.body,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        email.status = "failed";
        email.error = text;
        email.channel = "mock";
        email.status = "sent";
        email.error = `Resend failed; saved to mock outbox (${text.slice(0, 120)})`;
      }
    } catch (err) {
      email.channel = "mock";
      email.status = "sent";
      email.error =
        err instanceof Error
          ? `Resend error; mock outbox (${err.message})`
          : "Resend error; mock outbox";
    }
  }

  const outbox = load();
  outbox.messages.unshift(email);
  save(outbox);
  return { email, report };
}

export function listEmailOutbox(): EmailMessage[] {
  return load().messages;
}
