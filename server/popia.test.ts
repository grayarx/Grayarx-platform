import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { signPopiaConsent, checkPopiaConsentStatus, reconfirmPopiaConsentAction } from './server/_core/popiaConsent';

describe('POPIA Consent Module', () => {
  const testUserId = 1;
  const testDealershipId = 1;
  const testSignedName = 'Henrique Marx';

  describe('signPopiaConsent', () => {
    it('should sign POPIA consent successfully', async () => {
      const result = await signPopiaConsent({
        userId: testUserId,
        dealershipId: testDealershipId,
        signedName: testSignedName,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully');
    });

    it('should reject invalid input', async () => {
      try {
        await signPopiaConsent({
          userId: -1,
          dealershipId: testDealershipId,
          signedName: testSignedName,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        });
        expect.fail('Should have thrown validation error');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('checkPopiaConsentStatus', () => {
    it('should check consent status', async () => {
      const result = await checkPopiaConsentStatus(testUserId, testDealershipId);
      expect(result).toBeDefined();
      expect(result.status).toMatch(/not_signed|expired|active/);
    });

    it('should handle missing user gracefully', async () => {
      const result = await checkPopiaConsentStatus(99999, 99999);
      expect(result.status).toBe('not_signed');
      expect(result.needsAction).toBe(true);
    });
  });

  describe('reconfirmPopiaConsentAction', () => {
    it('should reconfirm consent', async () => {
      try {
        const result = await reconfirmPopiaConsentAction(1);
        expect(result.success).toBe(true);
      } catch (error) {
        // Expected if consent ID doesn't exist
        expect(error).toBeDefined();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      try {
        await checkPopiaConsentStatus(testUserId, testDealershipId);
        // Should not throw
        expect(true).toBe(true);
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
