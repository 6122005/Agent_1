import axios from 'axios';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export interface TelegramSendResult {
  success: boolean;
  messageId?: number;
  error?: string;
}

export class TelegramService {
  private botToken = env.TELEGRAM_BOT_TOKEN;
  private isPolling = false;
  private lastUpdateId = 0;

  private get apiUrl(): string {
    return `https://api.telegram.org/bot${this.botToken}`;
  }

  async getMe(): Promise<any> {
    if (!this.botToken) return null;
    try {
      const res = await axios.get(`${this.apiUrl}/getMe`);
      return res.data.result;
    } catch (err: any) {
      logger.error('Failed to get Telegram bot info', { error: err.message });
      return null;
    }
  }

  async sendMessage(
    chatId: string,
    text: string,
    parseMode: 'Markdown' | 'HTML' = 'Markdown'
  ): Promise<TelegramSendResult> {
    if (!this.botToken) {
      logger.warn('TELEGRAM_BOT_TOKEN is not configured. Telegram message logged only.', { chatId, text });
      return { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
    }

    try {
      const res = await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      });
      if (res.data?.ok && res.data?.result?.message_id) {
        return { success: true, messageId: res.data.result.message_id };
      }
      return { success: false, error: 'Telegram API returned ok: false' };
    } catch (err: any) {
      const primaryError = err.response?.data?.description || err.message;
      logger.warn('Failed to send formatted Telegram message, attempting plain text fallback', {
        chatId,
        error: primaryError,
      });

      // Fallback without parse_mode if formatting had an unescaped markdown character
      try {
        const fallbackRes = await axios.post(`${this.apiUrl}/sendMessage`, {
          chat_id: chatId,
          text,
        });
        if (fallbackRes.data?.ok && fallbackRes.data?.result?.message_id) {
          return { success: true, messageId: fallbackRes.data.result.message_id };
        }
        return { success: false, error: 'Telegram API fallback returned ok: false' };
      } catch (fallbackErr: any) {
        const finalError = fallbackErr.response?.data?.description || fallbackErr.message;
        logger.error('Failed to send Telegram message on all attempts', {
          chatId,
          error: finalError,
        });
        return { success: false, error: finalError };
      }
    }
  }

  async setWebhook(webhookUrl: string, secretToken?: string): Promise<boolean> {
    if (!this.botToken) return false;

    try {
      const res = await axios.post(`${this.apiUrl}/setWebhook`, {
        url: webhookUrl,
        secret_token: secretToken || env.TELEGRAM_WEBHOOK_SECRET,
        allowed_updates: ['message', 'callback_query'],
      });
      logger.info('Telegram webhook configured successfully', { url: webhookUrl });
      return res.data.ok;
    } catch (err: any) {
      logger.error('Failed to set Telegram webhook', {
        error: err.response?.data || err.message,
      });
      return false;
    }
  }

  /**
   * Starts local polling for development so Telegram works immediately without an ngrok/public tunnel.
   */
  async startPolling(onMessage: (chatId: string, text: string) => Promise<string | void>): Promise<void> {
    if (!this.botToken || this.isPolling) return;
    this.isPolling = true;

    logger.info('🤖 Telegram bot development polling listener started');

    const poll = async () => {
      if (!this.isPolling) return;

      try {
        const res = await axios.get(`${this.apiUrl}/getUpdates`, {
          params: { offset: this.lastUpdateId + 1, timeout: 15 },
          timeout: 20000,
        });

        const updates = res.data.result || [];
        for (const update of updates) {
          this.lastUpdateId = update.update_id;
          const msg = update.message;
          if (msg && msg.text && msg.chat?.id) {
            const chatId = msg.chat.id.toString();
            try {
              const reply = await onMessage(chatId, msg.text);
              if (reply) {
                await this.sendMessage(chatId, reply);
              }
            } catch (handlerErr: any) {
              await this.sendMessage(chatId, `⚠️ Error: ${handlerErr.message}`);
            }
          }
        }
      } catch (err: any) {
        // Wait 3s before retrying
        await new Promise((r) => setTimeout(r, 3000));
      }

      if (this.isPolling) {
        setTimeout(poll, 500);
      }
    };

    poll();
  }

  stopPolling(): void {
    this.isPolling = false;
  }
}

export const telegramService = new TelegramService();
