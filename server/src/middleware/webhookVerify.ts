import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function verifyTelegramWebhook(req: Request, res: Response, next: NextFunction): void {
  // If no secret configured, allow in development with warning
  if (!env.TELEGRAM_WEBHOOK_SECRET) {
    if (env.NODE_ENV === 'production') {
      res.status(403).json({ error: 'Telegram webhook secret not configured on server' });
      return;
    }
    next();
    return;
  }

  const token = req.headers['x-telegram-bot-api-secret-token'];
  if (!token || token !== env.TELEGRAM_WEBHOOK_SECRET) {
    logger.warn('Unauthorized Telegram webhook attempt', { ip: req.ip });
    res.status(403).json({ error: 'Forbidden: Invalid webhook secret token' });
    return;
  }

  next();
}

export function verifyWhatsAppWebhook(req: Request, res: Response, next: NextFunction): void {
  // GET request is the verification challenge from Meta
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === env.WHATSAPP_VERIFY_TOKEN) {
      logger.info('WhatsApp webhook verified successfully');
      res.status(200).send(challenge);
      return;
    } else {
      logger.warn('WhatsApp verification challenge failed', { mode });
      res.status(403).json({ error: 'Verification failed' });
      return;
    }
  }

  // POST request contains WhatsApp incoming message
  // If app secret is configured, optionally verify HMAC signature
  next();
}
