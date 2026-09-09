import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

const isDev = env.NODE_ENV === 'development' || env.NODE_ENV === 'test';

/**
 * General API rate limiter
 * - Development: 1000 requests / 15 min (loose for developer testing)
 * - Production: 200 requests / 15 min (strict)
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
});

/**
 * Dedicated Auth rate limiter (OAuth / login)
 * - Development: 1000 requests / 15 min (generous so OAuth testing is never blocked)
 * - Production: 50 requests / 15 min (strict against brute-force / abuse)
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDev ? 1000 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again after 15 minutes' },
});

/**
 * Webhook rate limiter (Telegram / WhatsApp)
 * - Protects public webhook URLs against flood / spam attacks
 */
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: isDev ? 500 : 120, // 120 requests per minute in production
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many webhook requests, please rate limit your calls' },
});
