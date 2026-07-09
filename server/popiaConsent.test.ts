import { describe, it, expect, beforeEach, vi } from 'vitest';
import { signPopiaConsent, checkPopiaConsentStatus, POPIA_FORM_TEXT_V1 } from './_core/popiaConsent';
import * as db from './db';

// Mock DB functions
vi.mock('./db', () => ({
  storePopiaConsent: vi.fn(),
  getLatestPopiaConsent: vi.fn(),
  checkPopiaConsentExpired: vi.fn(),
  reconfirmPopiaConsent: vi.fn(),
}));

describe('POPIA Consent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('signPopiaConsent', () => {
    it('should store consent with correct metadata', async () => {
      const input = {
        userId: 1,
        dealershipId: 1,
        signedName: 'John Doe',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      };

      await signPopiaConsent(input);

      expect(db.storePopiaConsent).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 1,
          dealershipId: 1,
          signedName: 'John Doe',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0...',
          consentText: POPIA_FORM_TEXT_V1,
          formVersion: '1.0',
        })
      );
    });

    it('should return success message', async () => {
      const input = {
        userId: 1,
        dealershipId: 1,
        signedName: 'John Doe',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      };

      const result = await signPopiaConsent(input);

      expect(result.success).toBe(true);
      expect(result.message).toContain('signed successfully');
    });
  });

  describe('checkPopiaConsentStatus', () => {
    it('should return not_signed when no consent exists', async () => {
      vi.mocked(db.getLatestPopiaConsent).mockResolvedValue(null);

      const result = await checkPopiaConsentStatus(1, 1);

      expect(result.status).toBe('not_signed');
      expect(result.needsAction).toBe(true);
    });

    it('should return expired when consent has expired', async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1); // Yesterday

      vi.mocked(db.getLatestPopiaConsent).mockResolvedValue({
        id: 1,
        userId: 1,
        dealershipId: 1,
        signedName: 'John Doe',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        formVersion: '1.0',
        consentText: POPIA_FORM_TEXT_V1,
        signedAt: new Date(),
        expiresAt: expiredDate,
        reconfirmedAt: null,
        status: 'active',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(db.checkPopiaConsentExpired).mockResolvedValue(true);

      const result = await checkPopiaConsentStatus(1, 1);

      expect(result.status).toBe('expired');
      expect(result.needsAction).toBe(true);
    });

    it('should return active when consent is valid', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // 30 days from now

      vi.mocked(db.getLatestPopiaConsent).mockResolvedValue({
        id: 1,
        userId: 1,
        dealershipId: 1,
        signedName: 'John Doe',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        formVersion: '1.0',
        consentText: POPIA_FORM_TEXT_V1,
        signedAt: new Date(),
        expiresAt: futureDate,
        reconfirmedAt: null,
        status: 'active',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(db.checkPopiaConsentExpired).mockResolvedValue(false);

      const result = await checkPopiaConsentStatus(1, 1);

      expect(result.status).toBe('active');
      expect(result.needsAction).toBe(false);
    });

    it('should calculate days until expiry correctly', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15); // 15 days from now

      vi.mocked(db.getLatestPopiaConsent).mockResolvedValue({
        id: 1,
        userId: 1,
        dealershipId: 1,
        signedName: 'John Doe',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        formVersion: '1.0',
        consentText: POPIA_FORM_TEXT_V1,
        signedAt: new Date(),
        expiresAt: futureDate,
        reconfirmedAt: null,
        status: 'active',
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);

      vi.mocked(db.checkPopiaConsentExpired).mockResolvedValue(false);

      const result = await checkPopiaConsentStatus(1, 1);

      expect(result.daysUntilExpiry).toBeGreaterThanOrEqual(14);
      expect(result.daysUntilExpiry).toBeLessThanOrEqual(15);
    });
  });

  describe('POPIA Form Text', () => {
    it('should contain all required sections', () => {
      expect(POPIA_FORM_TEXT_V1).toContain('Responsible Party');
      expect(POPIA_FORM_TEXT_V1).toContain('lawful consent');
      expect(POPIA_FORM_TEXT_V1).toContain('data subject rights');
      expect(POPIA_FORM_TEXT_V1).toContain('comply');
    });

    it('should mention all required acts', () => {
      expect(POPIA_FORM_TEXT_V1).toContain('POPIA');
      expect(POPIA_FORM_TEXT_V1).toContain('National Credit Act');
      expect(POPIA_FORM_TEXT_V1).toContain('Consumer Protection Act');
      expect(POPIA_FORM_TEXT_V1).toContain('ECTA');
    });
  });
});
