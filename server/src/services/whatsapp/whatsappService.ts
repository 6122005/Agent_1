import axios from 'axios';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export interface MessagingChannel {
  sendMessage(recipientId: string, text: string): Promise<boolean>;
}

export class WhatsAppService implements MessagingChannel {
  /**
   * Sends a message via Meta WhatsApp Business Cloud API or Twilio Sandbox fallback
   */
  async sendMessage(recipientId: string, text: string): Promise<boolean> {
    // 1. Meta Cloud API
    if (env.WHATSAPP_ACCESS_TOKEN && env.WHATSAPP_PHONE_NUMBER_ID) {
      try {
        const url = `https://graph.facebook.com/v19.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
        await axios.post(
          url,
          {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientId.replace(/\D/g, ''),
            type: 'text',
            text: { preview_url: false, body: text },
          },
          {
            headers: {
              Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
              'Content-Type': 'application/json',
            },
          }
        );
        logger.info('WhatsApp message sent via Meta Cloud API', { to: recipientId });
        return true;
      } catch (err: any) {
        logger.error('Failed to send WhatsApp message via Meta Cloud API', {
          error: err.response?.data || err.message,
        });
      }
    }

    // 2. Twilio WhatsApp Sandbox fallback
    if (env.TWILIO_ACCOUNT_SID && env.TWILIO_AUTH_TOKEN && env.TWILIO_WHATSAPP_NUMBER) {
      try {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
        const params = new URLSearchParams();
        params.append('From', env.TWILIO_WHATSAPP_NUMBER.startsWith('whatsapp:') ? env.TWILIO_WHATSAPP_NUMBER : `whatsapp:${env.TWILIO_WHATSAPP_NUMBER}`);
        params.append('To', recipientId.startsWith('whatsapp:') ? recipientId : `whatsapp:${recipientId}`);
        params.append('Body', text);

        const authHeader = Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`).toString('base64');
        await axios.post(url, params.toString(), {
          headers: {
            Authorization: `Basic ${authHeader}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });
        logger.info('WhatsApp message sent via Twilio Sandbox', { to: recipientId });
        return true;
      } catch (err: any) {
        logger.error('Failed to send WhatsApp message via Twilio', {
          error: err.response?.data || err.message,
        });
      }
    }

    logger.warn('WhatsApp not fully configured. Message logged only.', { recipientId, text });
    return false;
  }
}

export const whatsappService = new WhatsAppService();
