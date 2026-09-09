import { google } from 'googleapis';
import { env } from '../../config/env.js';
import { OAuthToken } from '../../models/OAuthToken.js';
import { logger } from '../../utils/logger.js';

const SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
];

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
}

export function generateAuthUrl(state?: string): string {
  const oauth2Client = getOAuth2Client();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline', // Offline mode yields refresh token
    prompt: 'consent',
    scope: SCOPES,
    state,
  });
}

export interface GoogleProfile {
  email: string;
  name?: string;
  sub?: string;
  picture?: string;
}

export async function handleOAuthCallback(code: string, targetUserId?: string): Promise<{
  tokens: any;
  profile: GoogleProfile;
  tokenDoc: any;
}> {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error('Google OAuth failed: No access token received');
  }

  oauth2Client.setCredentials(tokens);

  // Extract user info via oauth2 userinfo API
  let profile: GoogleProfile = { email: '' };
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userinfo = await oauth2.userinfo.get();
    profile = {
      email: userinfo.data.email || '',
      name: userinfo.data.name || undefined,
      sub: userinfo.data.id || undefined,
      picture: userinfo.data.picture || undefined,
    };
  } catch (err: any) {
    logger.warn('Could not fetch userinfo via oauth2 API, falling back to id_token decode', { error: err.message });
    if (tokens.id_token) {
      const ticket = await oauth2Client.verifyIdToken({
        idToken: tokens.id_token,
        audience: env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (payload?.email) {
        profile = {
          email: payload.email,
          name: payload.name,
          sub: payload.sub,
          picture: payload.picture,
        };
      }
    }
  }

  if (!profile.email) {
    throw new Error('Could not retrieve verified email from Google OAuth response');
  }

  // Import models dynamically to avoid circular dependency
  const { User } = await import('../../models/User.js');
  const { Setting } = await import('../../models/Setting.js');

  // Find user by explicit targetUserId, or find by email, or create new User
  let user = targetUserId ? await User.findById(targetUserId) : await User.findOne({ email: profile.email.toLowerCase() });

  if (!user) {
    user = await User.create({
      name: profile.name || profile.email.split('@')[0],
      email: profile.email.toLowerCase(),
      googleSub: profile.sub,
      avatarUrl: profile.picture,
      timezone: env.DEFAULT_TIMEZONE,
      role: 'user',
      tokenVersion: 0,
    });

    await Setting.create({
      userId: user._id,
      timezone: env.DEFAULT_TIMEZONE,
      morningSummaryTime: env.MORNING_SUMMARY_TIME,
      eveningSummaryTime: env.EVENING_SUMMARY_TIME,
      enabledChannels: ['telegram', 'dashboard'],
    });

    logger.info('Created new User account from Google OAuth', { userId: user._id, email: user.email });
  } else {
    // Update existing user with Google sub/avatar if missing
    if (profile.sub && !user.googleSub) user.googleSub = profile.sub;
    if (profile.picture && !user.avatarUrl) user.avatarUrl = profile.picture;
    await user.save();
  }

  let tokenDoc = await OAuthToken.findOne({ userId: user._id, provider: 'google' });
  if (!tokenDoc) {
    tokenDoc = new OAuthToken({
      userId: user._id,
      provider: 'google',
      scope: tokens.scope,
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    });
  }

  tokenDoc.setTokens(tokens.access_token, tokens.refresh_token || undefined);
  if (tokens.expiry_date) {
    tokenDoc.expiresAt = new Date(tokens.expiry_date);
  }
  await tokenDoc.save();

  logger.info('Google OAuth tokens encrypted and saved successfully', { userId: user._id, email: user.email });
  return { tokens, profile, tokenDoc };
}

export async function getAuthorizedGoogleClient(userId: string) {
  const tokenDoc = await OAuthToken.findOne({ userId, provider: 'google' });
  if (!tokenDoc) {
    throw new Error('Google account not connected for user. Please connect via /api/auth/google');
  }

  const oauth2Client = getOAuth2Client();
  const accessToken = tokenDoc.getDecryptedAccessToken();
  const refreshToken = tokenDoc.getDecryptedRefreshToken();

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: tokenDoc.expiresAt ? tokenDoc.expiresAt.getTime() : undefined,
  });

  // Listen for refresh events to re-encrypt and update DB
  oauth2Client.on('tokens', async (newTokens) => {
    if (newTokens.access_token) {
      tokenDoc.setTokens(newTokens.access_token, newTokens.refresh_token || undefined);
      if (newTokens.expiry_date) {
        tokenDoc.expiresAt = new Date(newTokens.expiry_date);
      }
      await tokenDoc.save();
      logger.info('Refreshed Google OAuth tokens re-encrypted and saved', { userId });
    }
  });

  return oauth2Client;
}
