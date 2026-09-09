import { google } from 'googleapis';
import { getAuthorizedGoogleClient } from '../google/googleAuth.js';
import { logger } from '../../utils/logger.js';

export interface EmailSummaryItem {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  body: string;
}

export class GmailService {
  /**
   * Exponential backoff wrapper for Google API calls
   */
  private async executeWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 1000): Promise<T> {
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        return await fn();
      } catch (err: any) {
        attempt++;
        const isRateLimit = err.code === 429 || (err.message && err.message.includes('rate limit'));
        if (attempt >= maxRetries || !isRateLimit) {
          throw err;
        }
        logger.warn(`Gmail API rate limit encountered. Retrying in ${delayMs * Math.pow(2, attempt)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt)));
      }
    }
    throw new Error('Gmail API request exceeded retry limit');
  }

  /**
   * Fetches unread messages from INBOX
   */
  async getUnreadEmails(userId: string, maxResults = 10): Promise<EmailSummaryItem[]> {
    const auth = await getAuthorizedGoogleClient(userId);
    const gmail = google.gmail({ version: 'v1', auth });

    return this.executeWithBackoff(async () => {
      const listRes = await gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread category:primary',
        maxResults,
      });

      const messages = listRes.data.messages || [];
      const emailItems: EmailSummaryItem[] = [];

      for (const msg of messages) {
        if (!msg.id) continue;
        const detailRes = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id,
          format: 'full',
        });

        const headers = detailRes.data.payload?.headers || [];
        const subject = headers.find((h) => h.name?.toLowerCase() === 'subject')?.value || '(No Subject)';
        const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || 'Unknown Sender';
        const date = headers.find((h) => h.name?.toLowerCase() === 'date')?.value || '';
        const snippet = detailRes.data.snippet || '';

        // Extract body
        let body = snippet;
        const parts = detailRes.data.payload?.parts;
        if (parts && parts.length > 0) {
          const textPart = parts.find((p) => p.mimeType === 'text/plain');
          if (textPart && textPart.body?.data) {
            body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
          }
        }

        emailItems.push({
          id: msg.id,
          threadId: detailRes.data.threadId || msg.id,
          from,
          subject,
          snippet,
          date,
          body,
        });
      }

      return emailItems;
    });
  }

  /**
   * Fetches full thread context for an email
   */
  async getEmailThread(userId: string, threadId: string): Promise<string> {
    const auth = await getAuthorizedGoogleClient(userId);
    const gmail = google.gmail({ version: 'v1', auth });

    return this.executeWithBackoff(async () => {
      const res = await gmail.users.threads.get({
        userId: 'me',
        id: threadId,
      });

      const messages = res.data.messages || [];
      let threadText = '';

      for (const msg of messages) {
        const headers = msg.payload?.headers || [];
        const from = headers.find((h) => h.name?.toLowerCase() === 'from')?.value || 'Unknown';
        const date = headers.find((h) => h.name?.toLowerCase() === 'date')?.value || '';
        const snippet = msg.snippet || '';
        threadText += `[From: ${from} | Date: ${date}]\n${snippet}\n\n`;
      }

      return threadText;
    });
  }

  /**
   * Sends an email via Gmail API.
   * NOTE: This is an internal method and MUST only be called after explicit approval
   * verification in ApprovalService.
   */
  async sendEmail(
    userId: string,
    params: {
      to: string;
      subject: string;
      body: string;
      threadId?: string;
    }
  ): Promise<{ messageId: string }> {
    const auth = await getAuthorizedGoogleClient(userId);
    const gmail = google.gmail({ version: 'v1', auth });

    // Format RFC 2822 email message
    const utf8Subject = `=?utf-8?B?${Buffer.from(params.subject).toString('base64')}?=`;
    const messageParts = [
      `To: ${params.to}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      params.body,
    ];

    if (params.threadId) {
      messageParts.splice(3, 0, `In-Reply-To: <${params.threadId}>`, `References: <${params.threadId}>`);
    }

    const message = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    return this.executeWithBackoff(async () => {
      const res = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
          threadId: params.threadId,
        },
      });

      logger.info('Email sent successfully via Gmail API', {
        userId,
        messageId: res.data.id,
        to: params.to,
      });

      return { messageId: res.data.id || 'sent' };
    });
  }
}

export const gmailService = new GmailService();
