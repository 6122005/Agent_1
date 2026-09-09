import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Setting } from '../models/Setting.js';
import { OAuthToken } from '../models/OAuthToken.js';
import { generateAuthUrl, handleOAuthCallback } from '../services/google/googleAuth.js';
import { logger } from '../utils/logger.js';

export class AuthController {
  /**
   * Redirect to Google OAuth2 consent screen for Sign in with Google
   */
  async googleAuth(req: Request, res: Response): Promise<void> {
    try {
      const state = req.query.state as string | undefined;
      const authUrl = generateAuthUrl(state);
      res.redirect(authUrl);
    } catch (err: any) {
      logger.error('Failed to generate Google auth URL', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Google OAuth2 callback endpoint
   * Issues 24h JWT inside an httpOnly, sameSite: 'lax' cookie.
   * Absolutely NO tokens in redirect URL.
   */
  async googleCallback(req: Request, res: Response): Promise<void> {
    const code = req.query.code as string;
    const state = req.query.state as string | undefined; // Optional target userId if linking

    if (!code) {
      res.status(400).send('Missing authorization code');
      return;
    }

    try {
      const { profile, tokenDoc } = await handleOAuthCallback(code, state);
      const user = await User.findById(tokenDoc.userId);

      if (!user) {
        throw new Error('User not found after OAuth exchange');
      }

      // 24-hour session JWT containing tokenVersion for server-side revocation
      const jwtToken = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
          tokenVersion: user.tokenVersion || 0,
        },
        env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Set httpOnly secure cookie
      res.cookie('assistant_session', jwtToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000,
        path: '/',
      });

      logger.info('User authenticated via Google Sign-in', {
        userId: user._id,
        email: user.email,
      });

      // Clean redirect to frontend home without tokens in URL
      res.redirect(`${env.CLIENT_URL}/`);
    } catch (err: any) {
      logger.error('Google OAuth callback failed', { error: err.message });
      res.redirect(`${env.CLIENT_URL}/?auth_error=${encodeURIComponent(err.message)}`);
    }
  }

  /**
   * Session / Me endpoint
   * Returns authenticated user profile, Google connection status, and settings.
   */
  async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized: No active session' });
        return;
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const tokenDoc = await OAuthToken.findOne({ userId: user._id, provider: 'google' });
      let setting = await Setting.findOne({ userId: user._id });

      if (!setting) {
        setting = await Setting.create({
          userId: user._id,
          timezone: user.timezone || env.DEFAULT_TIMEZONE,
          morningSummaryTime: env.MORNING_SUMMARY_TIME,
          eveningSummaryTime: env.EVENING_SUMMARY_TIME,
          enabledChannels: ['telegram', 'dashboard'],
        });
      }

      res.json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatarUrl: user.avatarUrl,
          timezone: user.timezone,
          role: user.role,
        },
        googleConnected: !!tokenDoc,
        setting,
      });
    } catch (err: any) {
      logger.error('Error fetching session in /api/auth/me', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Real Logout endpoint
   * Increments user's tokenVersion server-side (instantly revoking existing JWTs)
   * and clears the assistant_session httpOnly cookie.
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      if (req.user?.userId) {
        await User.findByIdAndUpdate(req.user.userId, { $inc: { tokenVersion: 1 } });
        logger.info('User session revoked server-side on logout', { userId: req.user.userId });
      }

      res.clearCookie('assistant_session', {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });

      res.json({ success: true, message: 'Successfully logged out' });
    } catch (err: any) {
      logger.error('Error logging out', { error: err.message });
      res.status(500).json({ error: err.message });
    }
  }
}

export const authController = new AuthController();
