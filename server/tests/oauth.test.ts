import { describe, it, expect } from 'vitest';
import { generateAuthUrl } from '../src/services/google/googleAuth.js';
import { env } from '../src/config/env.js';

describe('Google OAuth Integration', () => {
  it('should generate an authorization URL with exact client_id and redirect_uri', () => {
    const testUserId = 'test_user_123';
    const authUrl = generateAuthUrl(testUserId);

    expect(authUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
    expect(authUrl).toContain(`client_id=${encodeURIComponent(env.GOOGLE_CLIENT_ID)}`);
    expect(authUrl).toContain(`redirect_uri=${encodeURIComponent(env.GOOGLE_REDIRECT_URI)}`);
    expect(authUrl).toContain('access_type=offline');
    expect(authUrl).toContain('prompt=consent');
    expect(authUrl).toContain('response_type=code');
    expect(authUrl).toContain(`state=${testUserId}`);
  });

  it('should request the 4 approved scopes', () => {
    const authUrl = generateAuthUrl();
    const decodedUrl = decodeURIComponent(authUrl);

    expect(decodedUrl).toContain('https://www.googleapis.com/auth/gmail.readonly');
    expect(decodedUrl).toContain('https://www.googleapis.com/auth/gmail.send');
    expect(decodedUrl).toContain('https://www.googleapis.com/auth/calendar');
    expect(decodedUrl).toContain('https://www.googleapis.com/auth/tasks');
  });
});
