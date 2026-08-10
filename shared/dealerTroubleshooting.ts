/**
 * Dealer troubleshooting playbook — turns real problem statements into
 * step-by-step fixes, instead of a generic navigation link.
 *
 * Deterministic (no LLM needed): match a problem, return concrete steps + links.
 * Only PROBLEM phrasing should match here ("can't…", "not working", "says X",
 * "empty", "failed"), so plain how-to questions still fall through to the
 * navigation / product-Q&A handlers.
 */

import { PRIMARY_INBOX } from "./agents";

export type TroubleshootingLink = { label: string; href: string };

export type TroubleshootingEntry = {
  id: string;
  patterns: RegExp[];
  title: string;
  steps: string[];
  links: TroubleshootingLink[];
};

export const DEALER_TROUBLESHOOTING: TroubleshootingEntry[] = [
  {
    id: "access_required",
    patterns: [
      /dealer or admin access required/i,
      /\baccess required\b/i,
      /(can'?t|cannot|can not|unable to|won'?t let me).*(upload|import|add).*(access|dealer|admin|permission)/i,
      /(not|isn'?t) (a |set as )?(dealer|authoris?ed)/i,
    ],
    title: "“Dealer or admin access required” when uploading",
    steps: [
      "This means your login isn’t set as a **dealer** yet, so uploads are blocked.",
      "On **CSV Import** (or any dealer page), tap the gold **Set up my dealership** button.",
      "That creates your garage and turns your login into a dealer — then click **Preview** again.",
      "If the banner is gone but Preview still fails, log out and back in once.",
    ],
    links: [{ label: "CSV Import", href: "/dealer/inventory/import" }],
  },
  {
    id: "no_dealership",
    patterns: [
      /\bno dealership\b/i,
      /dealership.*(not )?(assigned|linked)/i,
      /not linked to a dealership/i,
      /account.*not.*dealership/i,
    ],
    title: "Account isn’t linked to a garage (dealership)",
    steps: [
      "Your login exists but isn’t attached to a dealership, so there’s nowhere to store cars.",
      "Tap **Set up my dealership** on the dealer console (gold banner) — one click creates and links your garage.",
      "After that, **Inventory** and **CSV Import** will work.",
    ],
    links: [
      { label: "CSV Import", href: "/dealer/inventory/import" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    id: "import_not_showing",
    patterns: [
      /(uploaded|imported|added).*(don'?t|can'?t|cannot|not|isn'?t|aren'?t).*(see|show|appear|there)/i,
      /(showroom|inventory).*(empty|blank|no (cars|vehicles|stock))/i,
      /(cars|vehicles|stock).*(not (showing|there|appearing)|missing|disappear)/i,
      /where (are|did) my (cars|vehicles|stock)/i,
    ],
    title: "Imported cars aren’t showing up",
    steps: [
      "Make sure you’re logged into the **same dealership** you imported to.",
      "Each car needs a **real price above R1** — R1/blank placeholders are hidden until fixed (they show amber in Inventory).",
      "Cars marked **sold** don’t appear on the public showroom.",
      "Open **Inventory** to confirm they imported; if they’re there but the public showroom looks empty, it may be excluding the demo garage.",
    ],
    links: [
      { label: "Inventory", href: "/dealer/inventory" },
      { label: "CSV Import", href: "/dealer/inventory/import" },
    ],
  },
  {
    id: "price_placeholder",
    patterns: [
      /(price|prices).*(r\s?1\b|invalid|wrong|zero|missing|blank)/i,
      /(shows?|showing|stuck at) r\s?1\b/i,
      /invalid price/i,
    ],
    title: "Prices show R1 or “invalid price”",
    steps: [
      "The **price** column must be a plain number greater than 1 (e.g. `289900`) — no `R`, spaces, or commas.",
      "Rows with a bad price still import, but show **amber in Inventory** — open one and set the real price.",
      "Or fix the price in your CSV and re-import: rows are matched by the **stock** number, so it updates in place.",
    ],
    links: [
      { label: "Inventory", href: "/dealer/inventory" },
      { label: "CSV Import", href: "/dealer/inventory/import" },
    ],
  },
  {
    id: "photos_missing",
    patterns: [
      /(photos?|images?|pictures?).*(not (showing|loading|appearing)|missing|broken|blank|don'?t (show|load))/i,
      /no (photos|images|pictures)/i,
      /(broken|missing) (photos?|images?)/i,
    ],
    title: "Photos aren’t showing",
    steps: [
      "Use **public https image links** in the `image` column — separate up to 8 with the pipe `|` for 8 angles.",
      "Turn on **“Save photos to GrayArx”** during import so images are stored and links never break.",
      "Open **Photos** to see photo health and add missing angles.",
    ],
    links: [
      { label: "Photos", href: "/dealer/csv-photo" },
      { label: "CSV Import", href: "/dealer/inventory/import" },
    ],
  },
  {
    id: "whatsapp_silent",
    patterns: [
      /(whatsapp|nala).*(not (working|replying|responding|sending)|silent|no reply|no response)/i,
      /(bot|ai).*(not (replying|responding)).*(whatsapp)?/i,
      /whatsapp.*(broken|dead|down)/i,
    ],
    title: "WhatsApp / Nala isn’t replying",
    steps: [
      "Nala needs your **Meta WhatsApp Business number verified** and the **webhook subscribed**.",
      "Check **Settings → WhatsApp** that your number and details are saved.",
      "Brand-new Meta numbers can take a little while to go live after verification.",
      "If it’s all set up and still silent, report a bug and we’ll investigate.",
    ],
    links: [{ label: "Settings", href: "/dealer/settings" }],
  },
  {
    id: "cant_login",
    patterns: [
      /(can'?t|cannot|can not|unable to).*(log ?in|sign ?in|get in)/i,
      /forgot.*(password|login)/i,
      /(locked out|reset my password)/i,
    ],
    title: "Can’t log in",
    steps: [
      "Use **Forgot password?** on the login page to get a reset link.",
      "Check your email (and spam) for the reset message.",
      "If you’re locked out after several tries, wait a few minutes and try again.",
      `Still stuck? Email **${PRIMARY_INBOX}** and we’ll help.`,
    ],
    links: [],
  },
  {
    id: "site_error",
    patterns: [
      /grayarx\.com.*(error|down|not (working|loading)|522)/i,
      /(site|website).*(down|error 522|not loading)/i,
      /\b522\b/,
    ],
    title: "grayarx.com shows an error",
    steps: [
      "Try **www.grayarx.com** — that’s the healthy address.",
      "The plain `grayarx.com` can error if the domain/Cloudflare routing isn’t pointed at the live site.",
      "Tell GrayArx and we’ll fix the domain routing.",
    ],
    links: [{ label: "Showroom", href: "/showroom" }],
  },
];

export function matchTroubleshooting(message: string): TroubleshootingEntry | null {
  const text = message.trim();
  if (!text) return null;
  for (const entry of DEALER_TROUBLESHOOTING) {
    if (entry.patterns.some((re) => re.test(text))) return entry;
  }
  return null;
}

export function formatTroubleshootingReply(entry: TroubleshootingEntry): string {
  const lines: string[] = [`**${entry.title}**`, ""];
  entry.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
  lines.push("");
  lines.push(`Still stuck? Say **“report a bug”** and describe it, or email **${PRIMARY_INBOX}**.`);
  return lines.join("\n");
}
