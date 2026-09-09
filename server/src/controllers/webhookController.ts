import { Request, Response } from 'express';
import { agentOrchestrator } from '../services/orchestrator/agentOrchestrator.js';
import { telegramService } from '../services/telegram/telegramService.js';
import { whatsappService } from '../services/whatsapp/whatsappService.js';
import { Setting } from '../models/Setting.js';
import { logger } from '../utils/logger.js';

export class WebhookController {
  /**
   * Telegram Webhook POST Handler
   */
  async handleTelegram(req: Request, res: Response): Promise<void> {
    // Acknowledge immediately to Telegram
    res.status(200).send('OK');

    const update = req.body;
    if (!update || !update.message) return;

    const message = update.message;
    const chatId = message.chat?.id?.toString();
    const text = message.text;

    if (!chatId || !text) return;

    try {
      const { User } = await import('../models/User.js');
      const { TelegramLinkToken } = await import('../models/TelegramLinkToken.js');
      const trimmed = text.trim();

      // 1. Handle deep-link linking (/start <token> or /connect <token>)
      if (trimmed.startsWith('/start ') || trimmed.startsWith('/connect ')) {
        const code = trimmed.split(/\s+/)[1]?.trim();
        if (code) {
          const linkDoc = await TelegramLinkToken.findOne({
            token: code,
            expiresAt: { $gt: new Date() },
          });

          if (linkDoc) {
            const targetUser = await User.findById(linkDoc.userId);
            if (targetUser) {
              await Setting.updateOne(
                { userId: targetUser._id },
                { $set: { telegramChatId: chatId } },
                { upsert: true }
              );
              await TelegramLinkToken.deleteOne({ _id: linkDoc._id });
              logger.info('Telegram account securely linked via webhook token', {
                userId: targetUser._id,
                email: targetUser.email,
                chatId,
              });
              await telegramService.sendMessage(
                chatId,
                `✅ *Account Linked Successfully!*\n\nWelcome, *${targetUser.name}*! Your Telegram account is now securely linked to your Assistant OS workspace (${targetUser.email}).`
              );
              return;
            }
          }

          await telegramService.sendMessage(
            chatId,
            '❌ *Connection Failed*\n\nThis linking code is invalid or has expired.\n\nPlease open the web dashboard (Settings > Telegram) and click "Connect Telegram" to generate a fresh link.'
          );
          return;
        }
      }

      // 2. Strict lookup: only match user who explicitly linked this chatId
      const setting = await Setting.findOne({ telegramChatId: chatId });
      const user = setting ? await User.findById(setting.userId) : null;

      // 3. ZERO ADMIN FALLBACK: Unlinked accounts are rejected
      if (!user) {
        logger.warn('Rejected Telegram webhook message from unlinked chatId', { chatId });
        await telegramService.sendMessage(
          chatId,
          `🔒 *Unauthorized Access*\n\nYour Telegram account is not linked to any Assistant OS workspace.\n\nTo link your account, log into the web dashboard and click *Connect Telegram* under Settings.`
        );
        return;
      }

      // 4. Authorized execution
      const reply = await agentOrchestrator.handleMessage(user._id.toString(), 'telegram', text);
      await telegramService.sendMessage(chatId, reply.text);
    } catch (err: any) {
      logger.error('Error processing Telegram webhook', { error: err.message });
      if (chatId) {
        await telegramService.sendMessage(chatId, `⚠️ An error occurred: ${err.message}`);
      }
    }
  }

  /**
   * WhatsApp Webhook POST Handler (Meta Cloud API / Twilio)
   */
  async handleWhatsApp(req: Request, res: Response): Promise<void> {
    res.status(200).send('EVENT_RECEIVED');

    try {
      const body = req.body;
      let fromPhone = '';
      let text = '';

      // 1. Meta Cloud API format
      if (body.object === 'whatsapp_business_account') {
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const message = changes?.value?.messages?.[0];

        if (message && message.type === 'text') {
          fromPhone = message.from;
          text = message.text?.body;
        }
      }
      // 2. Twilio WhatsApp webhook format
      else if (body.From && body.Body) {
        fromPhone = body.From;
        text = body.Body;
      }

      if (!fromPhone || !text) return;

      const { User } = await import('../models/User.js');
      const setting = await Setting.findOne({ whatsappRecipientPhone: fromPhone });
      const user = setting ? await User.findById(setting.userId) : null;

      // STRICT ZERO FALLBACK: Unlinked phone numbers are rejected
      if (!user) {
        logger.warn('Rejected WhatsApp message from unlinked phone number', { fromPhone });
        await whatsappService.sendMessage(
          fromPhone,
          '🔒 *Unauthorized*: Your phone number is not linked to any Assistant OS workspace. Please configure your recipient number in the web dashboard Settings.'
        );
        return;
      }

      const reply = await agentOrchestrator.handleMessage(user._id.toString(), 'whatsapp', text);
      await whatsappService.sendMessage(fromPhone, reply.text);
    } catch (err: any) {
      logger.error('Error processing WhatsApp webhook', { error: err.message });
    }
  }
}

export const webhookController = new WebhookController();
