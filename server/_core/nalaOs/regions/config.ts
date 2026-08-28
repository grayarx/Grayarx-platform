/**
 * Multi-region packaging for GrayArx / Greyhawks.
 * SA stays ZAR hero; other regions quote in local currency with same margin logic.
 */

export type RegionId = "ZA" | "AU" | "GB" | "AE" | "US" | "NZ";

export type RegionConfig = {
  id: RegionId;
  name: string;
  currency: "ZAR" | "USD" | "AUD" | "GBP" | "AED" | "NZD";
  currencySymbol: string;
  locale: string;
  /** Approx FX used for list prices (review quarterly) */
  zarPerUnit: number;
  privacyLaw: string;
  primaryMarketplaces: string[];
  whatsappNotes: string;
  voiceNotes: string;
  complianceNotes: string[];
  /** Local list prices — set to clear ~45%+ margin after local COGS */
  packages: {
    pilot: { label: string; amount: number };
    starter: { label: string; amount: number; includedWa: number };
    professional: { label: string; amount: number; includedWa: number };
    enterprise: { label: string; amountFrom: number; includedWa: number };
  };
};

function roundNice(n: number): number {
  if (n >= 1000) return Math.round(n / 10) * 10;
  return Math.round(n);
}

/** Build non-ZA list from ZA anchors using FX + slight premium for support load */
function fromZar(
  zar: number,
  zarPerUnit: number,
  premium = 1.05,
): number {
  return roundNice((zar / zarPerUnit) * premium);
}

export const REGIONS: Record<RegionId, RegionConfig> = {
  ZA: {
    id: "ZA",
    name: "South Africa",
    currency: "ZAR",
    currencySymbol: "R",
    locale: "en-ZA",
    zarPerUnit: 1,
    privacyLaw: "POPIA",
    primaryMarketplaces: ["AutoTrader", "Cars.co.za"],
    whatsappNotes: "Meta Cloud WA — dominant B2C channel for yards",
    voiceNotes: "Twilio SA Gray Ox number required for local CLI",
    complianceNotes: [
      "POPIA: lawful basis + opt-out on first message",
      "Do-not-contact list must suppress Themba + Nala",
      "Record retention for leads/viewings documented",
    ],
    packages: {
      pilot: { label: "R0 / 14 days", amount: 0 },
      starter: { label: "R7,990/mo", amount: 7990, includedWa: 1000 },
      professional: { label: "R14,990/mo", amount: 14990, includedWa: 3500 },
      enterprise: {
        label: "From R29,990/mo",
        amountFrom: 29990,
        includedWa: 12000,
      },
    },
  },
  AU: {
    id: "AU",
    name: "Australia",
    currency: "AUD",
    currencySymbol: "A$",
    locale: "en-AU",
    zarPerUnit: 12.2,
    privacyLaw: "Australian Privacy Act / APPs",
    primaryMarketplaces: ["Carsales", "Facebook Marketplace"],
    whatsappNotes: "WA growing; SMS + WA hybrid common",
    voiceNotes: "Twilio AU local number — no Gray Ox wait",
    complianceNotes: [
      "Spam Act for commercial electronic messages — consent + unsubscribe",
      "Don't cold-call numbers on Do Not Call register",
    ],
    packages: {
      pilot: { label: "A$0 / 14 days", amount: 0 },
      starter: {
        label: `A$${fromZar(7990, 12.2)}/mo`,
        amount: fromZar(7990, 12.2),
        includedWa: 1000,
      },
      professional: {
        label: `A$${fromZar(14990, 12.2)}/mo`,
        amount: fromZar(14990, 12.2),
        includedWa: 3500,
      },
      enterprise: {
        label: `From A$${fromZar(29990, 12.2)}/mo`,
        amountFrom: fromZar(29990, 12.2),
        includedWa: 12000,
      },
    },
  },
  GB: {
    id: "GB",
    name: "United Kingdom",
    currency: "GBP",
    currencySymbol: "£",
    locale: "en-GB",
    zarPerUnit: 23.5,
    privacyLaw: "UK GDPR + PECR",
    primaryMarketplaces: ["AutoTrader UK", "Motors.co.uk"],
    whatsappNotes: "WA strong with independents; email still common",
    voiceNotes: "Twilio UK local / mobile — Ofcom rules",
    complianceNotes: [
      "UK GDPR lawful basis; soft opt-in rules for existing customers",
      "PECR for marketing calls/SMS — TPS/CTPS screening",
    ],
    packages: {
      pilot: { label: "£0 / 14 days", amount: 0 },
      starter: {
        label: `£${fromZar(7990, 23.5)}/mo`,
        amount: fromZar(7990, 23.5),
        includedWa: 1000,
      },
      professional: {
        label: `£${fromZar(14990, 23.5)}/mo`,
        amount: fromZar(14990, 23.5),
        includedWa: 3500,
      },
      enterprise: {
        label: `From £${fromZar(29990, 23.5)}/mo`,
        amountFrom: fromZar(29990, 23.5),
        includedWa: 12000,
      },
    },
  },
  AE: {
    id: "AE",
    name: "United Arab Emirates",
    currency: "AED",
    currencySymbol: "AED ",
    locale: "en-AE",
    zarPerUnit: 5.0,
    privacyLaw: "UAE PDPL",
    primaryMarketplaces: ["dubizzle", "YallaMotor"],
    whatsappNotes: "WhatsApp is the default sales channel",
    voiceNotes: "Twilio UAE or international CLI",
    complianceNotes: [
      "PDPL consent for marketing; bilingual EN/AR later",
      "Finance partners differ — keep partner-link model",
    ],
    packages: {
      pilot: { label: "AED 0 / 14 days", amount: 0 },
      starter: {
        label: `AED ${fromZar(7990, 5.0)}/mo`,
        amount: fromZar(7990, 5.0),
        includedWa: 1000,
      },
      professional: {
        label: `AED ${fromZar(14990, 5.0)}/mo`,
        amount: fromZar(14990, 5.0),
        includedWa: 3500,
      },
      enterprise: {
        label: `From AED ${fromZar(29990, 5.0)}/mo`,
        amountFrom: fromZar(29990, 5.0),
        includedWa: 12000,
      },
    },
  },
  US: {
    id: "US",
    name: "United States",
    currency: "USD",
    currencySymbol: "$",
    locale: "en-US",
    zarPerUnit: 18.5,
    privacyLaw: "State privacy (CCPA/CPRA) + TCPA for calls/SMS",
    primaryMarketplaces: ["Cars.com", "Autotrader.com", "CarGurus"],
    whatsappNotes: "SMS/RCS primary; WA secondary for import/export yards",
    voiceNotes: "Twilio US numbers; TCPA consent critical for outbound",
    complianceNotes: [
      "TCPA: prior express written consent for autodial/SMS marketing",
      "DNC registry scrub before Themba campaigns",
      "State dealer licensing — we don't replace DMS/accounting",
    ],
    packages: {
      pilot: { label: "$0 / 14 days", amount: 0 },
      starter: {
        label: `$${fromZar(7990, 18.5)}/mo`,
        amount: fromZar(7990, 18.5),
        includedWa: 1000,
      },
      professional: {
        label: `$${fromZar(14990, 18.5)}/mo`,
        amount: fromZar(14990, 18.5),
        includedWa: 3500,
      },
      enterprise: {
        label: `From $${fromZar(29990, 18.5)}/mo`,
        amountFrom: fromZar(29990, 18.5),
        includedWa: 12000,
      },
    },
  },
  NZ: {
    id: "NZ",
    name: "New Zealand",
    currency: "NZD",
    currencySymbol: "NZ$",
    locale: "en-NZ",
    zarPerUnit: 11.0,
    privacyLaw: "NZ Privacy Act 2020",
    primaryMarketplaces: ["Trade Me Motors", "Facebook Marketplace"],
    whatsappNotes: "WA + SMS; smaller yards still WhatsApp-heavy",
    voiceNotes: "Twilio NZ local",
    complianceNotes: [
      "Privacy Act collection notices on first contact",
      "Unsolicited electronic messages — consent rules",
    ],
    packages: {
      pilot: { label: "NZ$0 / 14 days", amount: 0 },
      starter: {
        label: `NZ$${fromZar(7990, 11.0)}/mo`,
        amount: fromZar(7990, 11.0),
        includedWa: 1000,
      },
      professional: {
        label: `NZ$${fromZar(14990, 11.0)}/mo`,
        amount: fromZar(14990, 11.0),
        includedWa: 3500,
      },
      enterprise: {
        label: `From NZ$${fromZar(29990, 11.0)}/mo`,
        amountFrom: fromZar(29990, 11.0),
        includedWa: 12000,
      },
    },
  },
};

export function listRegions(): RegionConfig[] {
  return Object.values(REGIONS);
}

export function regionById(id: string): RegionConfig {
  return REGIONS[(id as RegionId) || "ZA"] ?? REGIONS.ZA;
}
