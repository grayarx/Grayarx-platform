import { z } from 'zod';
import { storePopiaConsent, getLatestPopiaConsent, checkPopiaConsentExpired, reconfirmPopiaConsent } from '../db';

/**
 * Full POPIA Consent Form text (for audit trail storage)
 */
export const POPIA_FORM_TEXT_V1 = `
GrayArx POPIA Consent & Acknowledgment Form

By signing this form, you confirm that you:
- Have read and understood the POPIA Consent & Acknowledgment Form
- Understand your obligations under POPIA
- Commit to complying with all POPIA requirements
- Accept full responsibility for POPIA compliance
- Authorize GrayArx to process personal information as described

You acknowledge that:
- You are the "Responsible Party" under POPIA
- GrayArx acts as a "Processor" on your behalf
- You have obtained lawful consent for all personal information processing
- You will honor all data subject rights (access, correction, deletion, objection)
- You will notify GrayArx of any data breaches within 24 hours
- You will comply with the National Credit Act (NCA), Consumer Protection Act (CPA), and Electronic Communications and Transactions Act (ECTA)

For full details, visit: www.grayarx.com/legal/popia-consent-form
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
