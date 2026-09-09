import { Request, Response } from 'express';
import crypto from 'crypto';
import { Setting } from '../models/Setting.js';
import { User } from '../models/User.js';
import { TelegramLinkToken } from '../models/TelegramLinkToken.js';
import { telegramService } from '../services/telegram/telegramService.js';

export class SettingsController {
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      let setting = await Setting.findOne({ userId });
      if (!setting) {
        setting = await Setting.create({
          userId,
          timezone: 'Asia/Amman',
          morningSummaryTime: '08:00',
          eveningSummaryTime: '19:00',
          enabledChannels: ['telegram', 'dashboard'],
        });
      }
      res.json(setting);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async updateSettings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { timezone, morningSummaryTime, eveningSummaryTime, enabledChannels, telegramChatId, whatsappRecipientPhone } = req.body;

      const setting = await Setting.findOneAndUpdate(
        { userId },
        {
          $set: {
            ...(timezone ? { timezone } : {}),
            ...(morningSummaryTime ? { morningSummaryTime } : {}),
            ...(eveningSummaryTime ? { eveningSummaryTime } : {}),
            ...(enabledChannels ? { enabledChannels } : {}),
            ...(telegramChatId !== undefined ? { telegramChatId } : {}),
            ...(whatsappRecipientPhone !== undefined ? { whatsappRecipientPhone } : {}),
          },
        },
        { new: true, upsert: true }
      );

      if (timezone) {
        await User.findByIdAndUpdate(userId, { timezone });
      }

      res.json(setting);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Generates a secure, cryptographically random one-time linking token
   * valid for 10 minutes to link Telegram chatId via deep-link /start <code>
   */
  async generateTelegramLink(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const token = crypto.randomBytes(16).toString('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Clear any previous active tokens for this user
      await TelegramLinkToken.deleteMany({ userId });
      await TelegramLinkToken.create({ userId, token, expiresAt });

      const botInfo = await telegramService.getMe();
      const botUsername = botInfo?.username || 'jenish_ai_assistant_bot';
      const link = `https://t.me/${botUsername}?start=${token}`;

      res.json({
        link,
        token,
        botUsername,
        expiresInSeconds: 600,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  /**
   * Unlinks Telegram account from this user's workspace
   */
  async disconnectTelegram(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      await Setting.updateOne({ userId }, { $unset: { telegramChatId: 1 } });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const settingsController = new SettingsController();
