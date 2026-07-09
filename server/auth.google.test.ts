import { describe, it, expect, beforeAll } from 'vitest';

describe('Google OAuth Integration', () => {
  let googleClientId: string;
  let googleClientSecret: string;
  let googleRedirectUri: string;

  beforeAll(() => {
    googleClientId = process.env.GOOGLE_CLIENT_ID || '';
    googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || '';
  });

  it('should have Google Client ID configured', () => {
    expect(googleClientId).toBeTruthy();
    expect(googleClientId).toContain('.apps.googleusercontent.com');
  });

  it('should have Google Client Secret configured', () => {
    expect(googleClientSecret).toBeTruthy();
    expect(googleClientSecret).toContain('GOCSPX-');
  });

  it('should have Google Redirect URI configured', () => {
    expect(googleRedirectUri).toBeTruthy();
    expect(googleRedirectUri).toContain('grayarx.com');
    expect(googleRedirectUri).toContain('/auth/google/callback');
  });

  it('should validate Google OAuth credentials format', () => {
    // Client ID format validation
    const clientIdRegex = /^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/;
    expect(googleClientId).toMatch(clientIdRegex);

    // Client Secret format validation
    const secretRegex = /^GOCSPX-[A-Za-z0-9_-]+$/;
    expect(googleClientSecret).toMatch(secretRegex);

    // Redirect URI format validation
    expect(googleRedirectUri).toMatch(/^https:\/\/.+\/auth\/google\/callback$/);
  });

  it('should have all required OAuth environment variables', () => {
    expect(googleClientId).toBeDefined();
    expect(googleClientSecret).toBeDefined();
    expect(googleRedirectUri).toBeDefined();
    
    expect(googleClientId.length).toBeGreaterThan(20);
    expect(googleClientSecret.length).toBeGreaterThan(10);
    expect(googleRedirectUri.length).toBeGreaterThan(20);
  });

  it('should validate OAuth credentials are not empty strings', () => {
    expect(googleClientId.trim().length).toBeGreaterThan(0);
    expect(googleClientSecret.trim().length).toBeGreaterThan(0);
    expect(googleRedirectUri.trim().length).toBeGreaterThan(0);
  });
});
