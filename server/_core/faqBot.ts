/**
 * FAQ Bot — Handles common dealership questions with pre-written responses.
 * Used by WhatsApp (Lerato), email (Mia), and web chat interfaces.
 */

import {
  buildEftPaymentInstructions,
  formatEftPaymentText,
} from "../../shared/bankDetails";
import { getGrayArxBankDetailsFromEnv } from "./grayArxBank";
import {
  formatDealerQaReply,
  matchDealerQa,
  type DealerQaEntry,
} from "../../shared/dealerQaPlaybook";

export interface FAQItem {
  id: string;
  category: "pricing" | "features" | "onboarding" | "billing" | "support" | "technical";
  question: string;
  keywords: string[]; // For fuzzy matching
  answer: string;
  followUp?: string; // Optional follow-up question or CTA
}

export const FAQ_DATABASE: FAQItem[] = [
  // ---- PRICING ----
  {
    id: "pricing_plans",
    category: "pricing",
    question: "What are your pricing plans?",
    keywords: ["price", "cost", "plans", "subscription", "how much"],
    answer: `GrayArx is **Nala Dealership OS** — WhatsApp sales from live stock, plus parts, service, trade-in, missed-call recovery, and this week's numbers.

**Plans (ZAR):**
- **Pilot** — R0 / 14 days, 150 WhatsApp conversations (hard cap)
- **Starter OS** — R7,990/mo, 1,000 WA
- **Professional OS** — R14,990/mo, 3,500 WA (usual close after they see this week's numbers)
- **Enterprise OS** — from R29,990/mo, 12,000 WA

Apply at grayarx.com/onboarding.`,
    followUp: "Would you like to start the 14-day Pilot?",
  },

  {
    id: "pricing_trial",
    category: "pricing",
    question: "Is there a free trial?",
    keywords: ["free", "trial", "no credit card", "test"],
    answer: `Yes — a **14-day Pilot at R0**, capped at 150 WhatsApp conversations, on your own stock.

✅ Nala on WhatsApp + web from live CSV
✅ Parts, service, trade-in desks on the OS
✅ Missed-call recovery + this week's numbers
✅ Template fallback if LLM credits run out
✅ No card. After they see this week's numbers, most yards close Professional OS at R14,990/mo

Apply at: www.grayarx.com/onboarding`,
    followUp: "Ready to get started?",
  },

  {
    id: "pricing_cancel",
    category: "pricing",
    question: "Can I cancel anytime?",
    keywords: ["cancel", "stop", "unsubscribe", "refund"],
    answer: `Yes, absolutely. You can cancel your subscription anytime with no penalties or hidden fees.

**To cancel:**
1. Log in to your GrayArx dashboard
2. Go to Settings → Billing
3. Click "Cancel Subscription"
4. Your access ends at the end of your current billing cycle

No questions asked. We're confident you'll love GrayArx.`,
  },

  // ---- FEATURES ----
  {
    id: "features_agents",
    category: "features",
    question: "What AI agents do you have?",
    keywords: ["agents", "features", "what can", "capabilities"],
    answer: `GrayArx includes a 24/7 AI team for your yard:

**Mia (Email Agent)** — Captures leads from your website and drafts follow-ups in 11 languages

**Nala (WhatsApp Agent)** — Answers buyers on WhatsApp and web chat from your live stock

**Lerato (Booking Agent)** — Pencils test drives via WhatsApp, email, and the web form; a human confirms

**Tumi (Trade-In Agent)** — Instant trade-in valuations using an eight-factor SA model

**Bongi (Fallback Agent)** — After-hours cover with a reference number until the floor is back

**Themba** is GrayArx’s own sales caller — he phones dealerships to invite them onto the platform. Your yard never gets him, and he never calls your buyers.

All customer-facing agents speak all 11 South African official languages.`,
  },

  {
    id: "features_languages",
    category: "features",
    question: "Do the agents speak multiple languages?",
    keywords: ["language", "zulu", "xhosa", "sotho", "afrikaans", "multilingual"],
    answer: `Yes! All GrayArx agents speak all 11 South African official languages:

✅ English
✅ Zulu
✅ Xhosa
✅ Sotho
✅ Tswana
✅ Venda
✅ Tsonga
✅ Swati
✅ Ndebele
✅ Afrikaans
✅ Sepedi

Customers can communicate in their preferred language, and the agents respond automatically.`,
  },

  {
    id: "features_compliance",
    category: "features",
    question: "Is GrayArx POPIA compliant?",
    keywords: ["popia", "compliance", "legal", "gdpr", "privacy"],
    answer: `Yes, GrayArx is fully POPIA (Protection of Personal Information Act) compliant.

**Our compliance measures:**
✅ Data encryption in transit and at rest
✅ Secure data storage in South Africa
✅ Consent management for all communications
✅ Right to access, correct, and delete personal data
✅ Regular security audits
✅ GDPR-aligned privacy policies

We take data privacy seriously. Your customers' information is protected.`,
  },

  {
    id: "features_integration",
    category: "features",
    question: "Does GrayArx integrate with my existing systems?",
    keywords: ["integrate", "crm", "system", "api", "connect"],
    answer: `GrayArx integrates with popular dealership management systems:

**Supported integrations:**
• DMS (Dealer Management Systems)
• CRM platforms
• Email services
• WhatsApp Business API
• Google Maps (for location services)
• Payment processors

If your system isn't listed, contact us at grayarx@gmail.com and we can build a custom integration.`,
  },

  // ---- ONBOARDING ----
  {
    id: "onboarding_setup",
    category: "onboarding",
    question: "How long does it take to set up?",
    keywords: ["setup", "onboarding", "how long", "installation", "time"],
    answer: `GrayArx is designed for quick setup:

**Day 1:** Sign up, complete onboarding form (5 minutes)
**Day 2:** Founder approval, dealership account created
**Day 3:** Upload your vehicle inventory (CSV import)
**Day 4:** Configure AI agents (email templates, phone numbers, etc.)
**Day 5:** Go live!

Most dealerships are live within 5 days. We provide step-by-step guidance throughout.`,
    followUp: "Ready to get started?",
  },

  {
    id: "onboarding_inventory",
    category: "onboarding",
    question: "How do I upload my vehicle inventory?",
    keywords: ["upload", "inventory", "vehicles", "csv", "import"],
    answer: `Uploading your inventory is easy:

**Option 1: CSV Import**
1. Download our CSV template from the dashboard
2. Fill in your vehicles (make, model, year, price, photos, etc.)
3. Upload the file in Settings → Inventory
4. We process it in minutes

**Option 2: Manual Entry**
1. Add vehicles one-by-one in the Showroom
2. Upload photos for each vehicle
3. Set pricing and availability

**Option 3: API Integration**
If you have a DMS system, we can sync your inventory automatically.

Need help? Email support@grayarx.com`,
  },

  {
    id: "onboarding_support",
    category: "onboarding",
    question: "Do you provide onboarding support?",
    keywords: ["support", "help", "onboarding", "training", "tutorial"],
    answer: `Yes! We provide comprehensive onboarding:

✅ **Video tutorials** — Step-by-step setup guides
✅ **Live onboarding call** — 30-minute kickoff with our team
✅ **Email support** — Dedicated support during trial
✅ **Knowledge base** — FAQ, troubleshooting, best practices
✅ **Slack community** — Connect with other dealerships

All included with your subscription. No extra charges.`,
  },

  // ---- BILLING ----
  {
    id: "billing_payment",
    category: "billing",
    question: "How do I pay for GrayArx?",
    keywords: ["payment", "pay", "billing", "invoice", "bank transfer"],
    answer: `We accept manual bank transfers:

**Payment Process:**
1. You sign up for a plan (Starter, Professional, or Enterprise)
2. We generate an invoice with our bank details
3. You transfer funds to our account
4. We confirm payment and activate your subscription

**Bank Details:**
Shown on every GrayArx subscription invoice (PDF + email). Ask for your latest invoice or check Admin → Invoices → Download / Print.

**Billing Cycle:**
Monthly, starting on your approval date. Auto-renews unless cancelled.

Questions? Contact hello@grayarx.com`,
  },

  {
    id: "billing_invoice",
    category: "billing",
    question: "Can I get an invoice?",
    keywords: ["invoice", "receipt", "billing", "documentation"],
    answer: `Yes! Invoices are automatically generated when you subscribe.

**To access your invoice:**
1. Log in to your GrayArx dashboard
2. Go to Settings → Billing
3. Download your invoice as PDF

Invoices include:
• Invoice number (GRAYARX-YYYYMM-XXXXX)
• Plan details and pricing
• Due date (Net 30)
• Our bank details for payment

All invoices are POPIA-compliant and suitable for tax purposes.`,
  },

  // ---- SUPPORT ----
  {
    id: "support_contact",
    category: "support",
    question: "How do I contact support?",
    keywords: ["support", "help", "contact", "email", "phone"],
    answer: `Multiple ways to reach us:

📧 **Email:** grayarx@gmail.com
📞 **Phone:** 079 491 5187
💬 **WhatsApp:** Message us at 079 491 5187
🌐 **Website:** www.grayarx.com

**Response times:**
• Starter plan: 24-48 hours
• Professional plan: 12-24 hours
• Enterprise plan: 4-8 hours

We're here to help!`,
  },

  {
    id: "support_issue",
    category: "support",
    question: "What if I have a problem or bug?",
    keywords: ["bug", "problem", "issue", "error", "not working"],
    answer: `We take bugs seriously. Here's what to do:

**Step 1:** Check our status page at www.grayarx.com/status

**Step 2:** Email support@grayarx.com with:
• Description of the issue
• Screenshots or error messages
• Steps to reproduce the problem
• Your dealership name

**Step 3:** We'll investigate and get back to you ASAP

**For urgent issues:** Call 079 491 5187

We aim to resolve most issues within 24 hours.`,
  },

  // ---- TECHNICAL ----
  {
    id: "technical_security",
    category: "technical",
    question: "How secure is my data?",
    keywords: ["security", "safe", "encryption", "data", "protection"],
    answer: `GrayArx uses enterprise-grade security:

🔒 **Encryption:** All data encrypted in transit (TLS) and at rest (AES-256)
🔐 **Authentication:** OAuth 2.0 with secure session management
🛡️ **Infrastructure:** Hosted on secure cloud servers with regular backups
📋 **Compliance:** POPIA-compliant, regular security audits
🚨 **Monitoring:** 24/7 security monitoring and threat detection

Your data is safe with us.`,
  },

  {
    id: "technical_uptime",
    category: "technical",
    question: "What's your uptime guarantee?",
    keywords: ["uptime", "downtime", "availability", "sla", "guarantee"],
    answer: `GrayArx maintains **99.5% uptime** with automatic failover and redundancy.

**Our infrastructure:**
✅ Multiple data centers for redundancy
✅ Automatic backups every 6 hours
✅ Real-time monitoring and alerts
✅ Disaster recovery plan in place

**Maintenance windows:**
Scheduled maintenance occurs on Sundays 2-4 AM SAST with advance notice.

Check our status page: www.grayarx.com/status`,
  },

  {
    id: "technical_api",
    category: "technical",
    question: "Do you have an API?",
    keywords: ["api", "developer", "integration", "webhook", "custom"],
    answer: `Yes! GrayArx provides a REST API for custom integrations:

**API features:**
• Lead management
• Inventory sync
• Booking management
• Analytics and reporting
• Webhook support for real-time updates

**Documentation:**
Full API docs available at: www.grayarx.com/api/docs

**For custom integrations:**
Contact our team at grayarx@gmail.com and we'll help you build what you need.`,
  },
];

/**
 * Find FAQ answer by question or keywords.
 * Prefers the dealer Q&A playbook (current product truths) over the legacy FAQ DB.
 */
export function findFAQAnswer(userQuery: string): FAQItem | null {
  const playbookHit = matchDealerQa(userQuery);
  if (playbookHit) {
    return enrichBillingFaq(dealerQaToFaqItem(playbookHit));
  }

  const query = userQuery.toLowerCase();

  // Exact match first
  const exactMatch = FAQ_DATABASE.find((item) =>
    item.question.toLowerCase().includes(query) || query.includes(item.question.toLowerCase())
  );

  if (exactMatch) return enrichBillingFaq(exactMatch);

  // Keyword match
  const keywordMatch = FAQ_DATABASE.find((item) =>
    item.keywords.some((keyword) => query.includes(keyword))
  );

  if (keywordMatch) return enrichBillingFaq(keywordMatch);

  return null;
}

function dealerQaToFaqItem(entry: DealerQaEntry): FAQItem {
  const categoryMap: Record<string, FAQItem["category"]> = {
    price_billing: "pricing",
    whatsapp_meta: "features",
    ai_nala: "features",
    inventory_vin: "technical",
    multi_branch: "features",
    popia_trust: "support",
    support_contract: "support",
    website_integrations: "technical",
    objections: "features",
    elevator: "features",
    product_truths: "features",
  };
  return {
    id: `playbook_${entry.id}`,
    category: categoryMap[entry.theme] ?? "features",
    question: entry.question,
    keywords: entry.keywords,
    answer: formatDealerQaReply(entry),
  };
}

/** Append live EFT details from env when answering payment FAQs. */
function enrichBillingFaq(item: FAQItem): FAQItem {
  if (item.id !== "billing_payment" && item.id !== "billing_invoice") {
    return item;
  }
  try {
    const bank = getGrayArxBankDetailsFromEnv();
    const eft = buildEftPaymentInstructions(bank, "GRAYARX-INVOICE");
    if (!eft) return item;
    return {
      ...item,
      answer: `${item.answer}\n\n${formatEftPaymentText(eft)}`,
    };
  } catch {
    return item;
  }
}

/**
 * Get all FAQs by category
 */
export function getFAQsByCategory(
  category: "pricing" | "features" | "onboarding" | "billing" | "support" | "technical"
): FAQItem[] {
  return FAQ_DATABASE.filter((item) => item.category === category);
}

/**
 * Get random FAQ (for suggestions)
 */
export function getRandomFAQ(): FAQItem {
  return FAQ_DATABASE[Math.floor(Math.random() * FAQ_DATABASE.length)];
}

/**
 * Format FAQ for WhatsApp/SMS (shorter format)
 */
export function formatFAQForWhatsApp(faq: FAQItem): string {
  let message = `*${faq.question}*\n\n${faq.answer}`;

  if (faq.followUp) {
    message += `\n\n_${faq.followUp}_`;
  }

  return message;
}

/**
 * Format FAQ for email (full format with styling)
 */
export function formatFAQForEmail(faq: FAQItem): string {
  let html = `
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="color: #d4af37; margin-top: 0;">${faq.question}</h3>
      <p style="line-height: 1.6; white-space: pre-wrap;">${faq.answer}</p>
  `;

  if (faq.followUp) {
    html += `<p style="margin-top: 15px; font-style: italic; color: #666;">${faq.followUp}</p>`;
  }

  html += `</div>`;

  return html;
}
