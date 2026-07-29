import { z } from 'zod';
import { storePopiaConsent, getLatestPopiaConsent, checkPopiaConsentExpired, reconfirmPopiaConsent } from '../db';

/**
 * Full POPIA Consent Form text (for audit trail storage)
 */
export const POPIA_FORM_TEXT_V1 = `
GrayArx POPIA Consent & Acknowledgment Form
Version 1.0 — Effective 10 July 2026
GrayArx (Pty) Ltd, Enterprise No. 2026/407647/07
Sjampanije Street, Roodepoort, Gauteng 1736, South Africa
Information Officer: privacy@grayarx.com | Legal: legal@grayarx.com

─────────────────────────────────────────────────────────────────────────────
ROLES UNDER POPIA (Act 4 of 2013)
─────────────────────────────────────────────────────────────────────────────
GrayArx (Pty) Ltd acts as an OPERATOR under POPIA. It processes personal
information on behalf of the dealership and only according to the dealership's
documented instructions.

The dealership is the RESPONSIBLE PARTY. The dealership determines the purpose
and means of processing customer personal information and bears primary
responsibility for lawful processing, consent, and data subject rights.

─────────────────────────────────────────────────────────────────────────────
DEALER ACKNOWLEDGMENTS AND COMMITMENTS
─────────────────────────────────────────────────────────────────────────────
By signing this form, the authorised dealership representative confirms that they:

1. Have read and understood their obligations as Responsible Party under POPIA.
2. Will obtain valid, informed consent from customers before capturing or
   processing their personal information via the GrayArx platform.
3. Will honour all data subject rights under POPIA including:
   - Right to access personal information
   - Right to correction of inaccurate information
   - Right to deletion / erasure upon request (contact privacy@grayarx.com)
   - Right to object to processing for direct marketing
   - Right to withdraw consent at any time
4. Will notify GrayArx within 24 hours of becoming aware of any personal
   information security compromise or data breach at the dealership level.
5. Will comply with applicable South African law including POPIA, the National Credit Act (NCA), Consumer Protection Act (CPA), and the Electronic Communications and Transactions Act (ECTA).
6. Acknowledge that customers interacting with GrayArx AI agents (WhatsApp,
   email) must be informed that they may be communicating with an AI assistant.
7. Accept full responsibility for POPIA compliance in their customer-facing use
   of the GrayArx platform.

─────────────────────────────────────────────────────────────────────────────
GRAYARX SECURITY AND DATA PROTECTION COMMITMENTS
─────────────────────────────────────────────────────────────────────────────
GrayArx commits to the following security measures on behalf of dealerships:

- All data encrypted at rest (AES-256) and in transit (TLS 1.3).
- Database: TiDB Cloud (SOC 2 compliant, geo-redundant, automated backups).
- File storage: Cloudflare R2 with private bucket policies.
- Authentication: JWT tokens / httpOnly cookies; bcrypt password hashing.
- Tenant isolation: each dealership's data is logically isolated by dealership
  ID — no cross-dealer data access is possible.
- Secrets (API keys, tokens) stored as Railway environment variables, never in
  source code.
- Regular automated backups via TiDB Cloud's native backup service.
- No dealer inventory, lead, or customer data is used to train third-party AI
  models or shared with competitors.
- WhatsApp messages processed via Meta's Cloud API under Meta's DPA.
- AI responses generated via OpenAI (template fallback when unavailable).
- Conversation logs stored encrypted, accessible only to the relevant dealership.

─────────────────────────────────────────────────────────────────────────────
DEALER DATA OWNERSHIP
─────────────────────────────────────────────────────────────────────────────
- The dealership owns 100% of the data it uploads or generates on GrayArx.
- Upon contract termination, the dealership may request a full data export
  within 30 days. After 30 days GrayArx may delete data subject to statutory
  retention obligations.
- GrayArx does not sell, share for commercial gain, or monetise customer
  personal information.

─────────────────────────────────────────────────────────────────────────────
DATA RESIDENCY
─────────────────────────────────────────────────────────────────────────────
Data is stored in South Africa or in compliant cross-border jurisdictions with
adequate protections as required by POPIA section 72.

For full details, visit: www.grayarx.com/legal/popia-consent-form
Information Regulator (South Africa): www.inforegulator.org.za
`;

export const signPopiaConsentSchema = z.object({
  userId: z.number().int().positive(),
  dealershipId: z.number().int().positive(),
  signedName: z.string().min(2).max(255), // e-signature (typed name)
  ipAddress: z.string(),
  userAgent: z.string(),
});

export type SignPopiaConsentInput = z.infer<typeof signPopiaConsentSchema>;

/**
 * Store POPIA consent signature
 */
export async function signPopiaConsent(input: SignPopiaConsentInput) {
  await storePopiaConsent({
    userId: input.userId,
    dealershipId: input.dealershipId,
    signedName: input.signedName,
    ipAddress: input.ipAddress,
    userAgent: input.userAgent,
    consentText: POPIA_FORM_TEXT_V1,
    formVersion: '1.0',
  });

  return {
    success: true,
    message: 'POPIA consent signed successfully',
  };
}

/**
 * Check if user needs to sign or re-confirm POPIA consent
 */
export async function checkPopiaConsentStatus(userId: number, dealershipId: number) {
  const latest = await getLatestPopiaConsent(userId, dealershipId);

  if (!latest) {
    return {
      status: 'not_signed',
      message: 'User has not signed POPIA consent',
      needsAction: true,
    };
  }

  const isExpired = await checkPopiaConsentExpired(userId, dealershipId);

  if (isExpired) {
    return {
      status: 'expired',
      message: 'POPIA consent has expired and needs to be re-confirmed',
      needsAction: true,
      consentId: latest.id,
      expiresAt: latest.expiresAt,
    };
  }

  return {
    status: 'active',
    message: 'POPIA consent is current',
    needsAction: false,
    consentId: latest.id,
    signedAt: latest.signedAt,
    expiresAt: latest.expiresAt,
    daysUntilExpiry: Math.ceil(
      (latest.expiresAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    ),
  };
}

/**
 * Re-confirm POPIA consent (for annual renewal)
 */
export async function reconfirmPopiaConsentAction(consentId: number) {
  await reconfirmPopiaConsent(consentId);

  return {
    success: true,
    message: 'POPIA consent re-confirmed for another year',
  };
}
