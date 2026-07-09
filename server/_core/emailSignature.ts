// Email signature + envelope template for every outbound agent reply.
//
// We embed the *static* high-res gold-glow logo (1680x720) hosted on
// CloudFront so it renders identically in Gmail, Apple Mail, Yahoo,
// AOL and — crucially — Outlook on Windows (which strips animated GIFs).
//
// Every signature also carries a POPIA-compliant AI disclosure line so
// recipients are explicitly told they're conversing with an AI agent.

import { AGENTS, type AgentId } from "../../shared/agents";

import { grayArxEmailHeader } from "../../shared/emailBranding";

const OWNER_PHONE = "+27 79 491 5187";
const OWNER_WHATSAPP = "https://wa.me/27794915187";
const WEBSITE = "https://grayarx.com";

export type SignatureContext = {
  agentId: AgentId;
  language?: string;
};

// Compact plain-text version used when an email client can't render HTML.
export function buildPlainTextSignature(ctx: SignatureContext): string {
  const agent = AGENTS[ctx.agentId];
  return [
    "",
    "—",
    `${agent.displayName} · AI Agent at GrayArx`,
    `Acting on behalf of GrayArx (Pty) Ltd · This message was drafted by AI.`,
    `${agent.role}`,
    `${agent.email}`,
    `Phone (human owner): ${OWNER_PHONE}`,
    `WhatsApp: ${OWNER_WHATSAPP}`,
    `Web: ${WEBSITE}`,
    "",
    "AI disclosure: this message was drafted by an autonomous AI agent on behalf of",
    "GrayArx (Pty) Ltd. A human team member is available on the phone number above.",
    "Reply STOP to opt out of further automated replies (POPIA s.69(3)(a)).",
  ].join("\n");
}

// HTML version. Tables + inline styles for maximum email-client compatibility.
export function buildHtmlSignature(ctx: SignatureContext): string {
  const agent = AGENTS[ctx.agentId];
  return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;color:#1f2937;border-collapse:collapse;margin-top:24px">
  <tr>
    <td style="padding:0 0 6px 0">
      <span style="font-size:15px;font-weight:600;color:#0a0a0a">${escapeHtml(agent.displayName)}</span>
      <span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:9999px;background:#fff7d6;color:#7a5a00;font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase">AI Agent</span>
    </td>
  </tr>
  <tr>
    <td style="padding:0 0 4px 0;font-size:12px;color:#6b7280;font-style:italic">Acting on behalf of GrayArx (Pty) Ltd · This message was drafted by AI.</td>
  </tr>
  <tr>
    <td style="padding:0 0 10px 0;font-size:13px;color:#4b5563">${escapeHtml(agent.role)} · ${escapeHtml(agent.email)}</td>
  </tr>
  <tr>
    <td style="padding:0 0 4px 0;font-size:13px;color:#374151">
      Human owner phone: <a href="tel:+27794915187" style="color:#7a5a00;text-decoration:none">${OWNER_PHONE}</a> ·
      <a href="${OWNER_WHATSAPP}" style="color:#7a5a00;text-decoration:none">WhatsApp</a> ·
      <a href="${WEBSITE}" style="color:#7a5a00;text-decoration:none">grayarx.com</a>
    </td>
  </tr>
  <tr>
    <td style="padding:14px 0 0 0;border-top:1px solid #e5e7eb;font-size:11px;line-height:1.55;color:#6b7280;max-width:540px">
      <strong style="color:#374151">AI disclosure.</strong>
      This message was drafted by an autonomous AI agent (${escapeHtml(agent.displayName)})
      on behalf of GrayArx (Pty) Ltd. A human team member is available on
      ${OWNER_PHONE}. Reply <strong>STOP</strong> to opt out of further automated
      messages. We process your data in line with POPIA — see
      <a href="${WEBSITE}/privacy" style="color:#6b7280">our Privacy Policy</a>.
    </td>
  </tr>
</table>
`.trim();
}

// Wrap a generated agent body in a styled GrayArx HTML email envelope.
// Bodies arrive as plain text (one paragraph per blank-line break), so
// we split them safely here. The signature is always appended.
export function buildHtmlEmail(opts: {
  agentId: AgentId;
  bodyPlainText: string;
  language?: string;
  subject?: string;
}): string {
  const paragraphs = opts.bodyPlainText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px 0;font-size:15px;line-height:1.6;color:#1f2937">${escapeHtml(p).replace(/\n/g, "<br />")}</p>`)
    .join("");

  const sig = buildHtmlSignature({ agentId: opts.agentId, language: opts.language });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(opts.subject ?? "GrayArx")}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">
      A note from ${escapeHtml(AGENTS[opts.agentId].displayName)} at GrayArx — your dealership AI assistant.
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:32px 0">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 6px 24px rgba(0,0,0,0.06)">
            <tr>
              <td style="background:#0a0a0a;padding:0">
                ${grayArxEmailHeader()}
              </td>
            </tr>
            <tr>
              <td style="padding:28px">
                ${paragraphs}
                ${sig}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
