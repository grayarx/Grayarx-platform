/**
 * Shared GrayArx email branding — table-only, Gmail/Outlook safe.
 *
 * 1. Gmail inbox avatar — Google Account profile photo (not HTML).
 * 2. Email body — square GA icon + wordmark header, no CSS glow/animation.
 */

/** Animated logo — convert to GIF → upload as Google profile photo (Edward Sturm hack) */
export const GRAYARX_GMAIL_AVATAR_SOURCE_WEBP =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663686786306/b7neeuheFQMzyejb4JTfRC/grayarx-logo-email-DQpzBzJ8VxvYZZ47wcX6UB.webp";

export function grayArxAnimatedLogoUrl(): string {
  return `${grayArxAppUrl()}/grayarx-logo-animated.webp`;
}

export function grayArxAppUrl(): string {
  const raw =
    (typeof process !== "undefined" && process.env?.EMAIL_APP_URL) ||
    (typeof process !== "undefined" && process.env?.APP_URL) ||
    (typeof process !== "undefined" && process.env?.VITE_APP_URL) ||
    "https://www.grayarx.com";
  const url = raw.replace(/\/+$/, "");
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(url)) {
    return "https://www.grayarx.com";
  }
  return url;
}

/**
 * Circular GA crest only (not the full lockup with GRAYARX wordmark).
 * Full lockup at 44px looks “zoomed in” / unreadable next to the HTML wordmark.
 */
export function grayArxLogoIconUrl(): string {
  return `${grayArxAppUrl()}/logo-crest.png?v=10`;
}

export const GRAYARX_EMAIL_LOGO_CID = "grayarx-logo-icon";

/**
 * Logo src for email HTML — always HTTPS so browser previews work.
 * cid: is broken in iframes/srcDoc; only use it when EMAIL_LOGO_USE_CID=true
 * AND the caller is building a real send (opts.forPreview !== true).
 */
export function grayArxEmailLogoSrc(opts?: { forPreview?: boolean }): string {
  const envUrl =
    typeof process !== "undefined" ? process.env?.EMAIL_LOGO_ICON_URL?.trim() : undefined;
  // Only honour env override when it is a real http(s) URL — never cid: from env.
  if (envUrl && /^https?:\/\//i.test(envUrl)) {
    return envUrl;
  }
  const forceCid =
    typeof process !== "undefined" && process.env?.EMAIL_LOGO_USE_CID === "true";
  if (forceCid && opts?.forPreview !== true) {
    return `cid:${GRAYARX_EMAIL_LOGO_CID}`;
  }
  return grayArxLogoIconUrl();
}

/** Attach inline PNG only when EMAIL_LOGO_USE_CID=true (legacy). */
export function shouldAttachInlineEmailLogo(): boolean {
  return grayArxEmailLogoSrc().startsWith("cid:");
}

/** @deprecated Use grayArxLogoIconUrl */
export function grayArxLogoUrl(): string {
  return grayArxLogoIconUrl();
}

export function grayArxPilotFromEmail(): string {
  const custom = typeof process !== "undefined" ? process.env.PILOT_FROM_EMAIL : undefined;
  return custom || "pilot@grayarx.com";
}

const FONT = "Arial,Helvetica,sans-serif";
const SERIF = "Georgia,'Times New Roman',Times,serif";

/** Dark header bar — icon + GrayArx / subtitle (matches site nav) */
export function grayArxEmailHeader(
  subtitle = "AI Platform",
  opts?: { forPreview?: boolean },
): string {
  const icon = grayArxEmailLogoSrc({ forPreview: opts?.forPreview });
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background-color:#0a0a0c;">
  <tr>
    <td align="center" style="padding:24px 32px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
        <tr>
          <td valign="middle" style="padding-right:14px;">
            <img src="${icon}" alt="GrayArx" width="44" height="44" style="display:block;border:0;outline:none;text-decoration:none;width:44px;height:44px;border-radius:10px;" />
          </td>
          <td valign="middle" style="font-family:${SERIF};text-align:left;">
            <span style="display:block;color:#f5f5f5;font-size:22px;font-weight:700;line-height:1.1;letter-spacing:-0.02em;">GrayArx</span>
            <span style="display:block;margin-top:5px;font-family:${FONT};color:#9ca3af;font-size:10px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;line-height:1;">${subtitle}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="height:1px;background-color:#d4af37;font-size:0;line-height:0;">&nbsp;</td>
  </tr>
</table>`;
}

export function grayArxEmailFooter(opts?: { marketingUnsubscribe?: boolean }): string {
  const url = grayArxAppUrl();
  const host = url.replace(/^https?:\/\//, "");
  const unsubscribe = opts?.marketingUnsubscribe
    ? `<span style="display:block;font-size:11px;color:#9ca3af;line-height:1.5;margin-top:12px;max-width:520px;margin-left:auto;margin-right:auto;">
        You received this because your dealership contact email is listed publicly for business enquiries.
        Reply <strong>unsubscribe</strong> or email
        <a href="mailto:hello@grayarx.com?subject=Unsubscribe%20pilot%20outreach" style="color:#d4af37;text-decoration:none;">hello@grayarx.com</a>
        to opt out of further pilot outreach (POPIA s.69).
      </span>`
    : "";
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background-color:#0a0a0c;">
  <tr>
    <td style="height:1px;background-color:#d4af3733;font-size:0;line-height:0;">&nbsp;</td>
  </tr>
  <tr>
    <td align="center" style="padding:24px 32px;font-family:${FONT};">
      <span style="display:block;font-size:12px;color:#6b7280;line-height:1.5;margin-bottom:8px;">© ${new Date().getFullYear()} GrayArx (Pty) Ltd · POPIA compliant · AI-assisted communications disclosed</span>
      <span style="display:block;font-size:12px;line-height:1.5;">
        <a href="${url}/privacy-policy" style="color:#d4af37;text-decoration:none;">Privacy</a>
        <span style="color:#4b5563;">&nbsp;·&nbsp;</span>
        <a href="${url}/terms" style="color:#d4af37;text-decoration:none;">Terms</a>
        <span style="color:#4b5563;">&nbsp;·&nbsp;</span>
        <a href="${url}" style="color:#d4af37;text-decoration:none;">${host}</a>
        <span style="color:#4b5563;">&nbsp;·&nbsp;</span>
        <a href="${url}/help" style="color:#d4af37;text-decoration:none;">Help</a>
        <span style="color:#4b5563;">&nbsp;·&nbsp;</span>
        <a href="tel:+27794915187" style="color:#d4af37;text-decoration:none;">079 491 5187</a>
      </span>
      ${unsubscribe}
    </td>
  </tr>
</table>`;
}

/** Gold CTA button — table-based for Outlook */
export function grayArxEmailButton(label: string, href: string): string {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;margin:0 auto;">
  <tr>
    <td align="center" bgcolor="#d4af37" style="border-radius:6px;background-color:#d4af37;">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 36px;font-family:${FONT};font-size:15px;font-weight:700;color:#0a0a0c;text-decoration:none;border-radius:6px;line-height:1;">${label}</a>
    </td>
  </tr>
</table>`;
}

/** Bullet row — works in Gmail & Outlook (no absolute positioning) */
export function grayArxEmailBullet(text: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin-bottom:10px;">
  <tr>
    <td valign="top" width="24" style="font-family:${FONT};font-size:15px;line-height:1.5;color:#d4af37;font-weight:700;padding-top:1px;">✓</td>
    <td valign="top" style="font-family:${FONT};font-size:15px;line-height:1.55;color:#374151;padding-left:4px;">${text}</td>
  </tr>
</table>`;
}

/** Full-width email shell — pass inner body rows as HTML string */
export function grayArxEmailLayout(
  bodyHtml: string,
  headerSubtitle = "AI Platform",
  opts?: { marketingUnsubscribe?: boolean; forPreview?: boolean },
): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>GrayArx</title>
</head>
<body style="margin:0;padding:0;background-color:#ececec;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background-color:#ececec;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;max-width:600px;width:100%;background-color:#ffffff;">
          <tr>
            <td style="padding:0;">${grayArxEmailHeader(headerSubtitle, { forPreview: opts?.forPreview })}</td>
          </tr>
          <tr>
            <td style="padding:36px 32px 32px;font-family:${FONT};">${bodyHtml}</td>
          </tr>
          <tr>
            <td style="padding:0;">${grayArxEmailFooter(opts)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const GRAYARX_GMAIL_AVATAR_ADDRESSES = [
  "pilot@grayarx.com",
  "hello@grayarx.com",
  "noreply@grayarx.com",
  "mia@grayarx.com",
] as const;
