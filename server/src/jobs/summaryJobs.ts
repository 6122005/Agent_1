import cron from 'node-cron';
import { User } from '../models/User.js';
import { Setting } from '../models/Setting.js';
import { gmailService } from '../services/gmail/gmailService.js';
import { calendarService } from '../services/calendar/calendarService.js';
import { tasksService } from '../services/tasks/tasksService.js';
import { telegramService } from '../services/telegram/telegramService.js';
import { whatsappService } from '../services/whatsapp/whatsappService.js';
import { GeminiProvider } from '../services/llm/geminiProvider.js';
import { logger } from '../utils/logger.js';

const llm = new GeminiProvider();

export class SummaryScheduler {
  /**
   * Initializes cron jobs for active users
   */
  start(): void {
    logger.info('Starting summary scheduler jobs...');

    // Runs every minute to check if any user's scheduled morning or evening summary matches current time
    cron.schedule('* * * * *', async () => {
      try {
        await this.checkAndRunSummaries();
      } catch (err: any) {
        logger.error('Error during scheduled summary execution', { error: err.message });
      }
    });
  }

  async checkAndRunSummaries(): Promise<void> {
    const settings = await Setting.find({});

    for (const setting of settings) {
      const user = await User.findById(setting.userId);
      if (!user) continue;

      const tz = setting.timezone || user.timezone || 'Asia/Amman';

      // Get user's current local time in HH:mm
      let userTimeStr = '';
      try {
        const now = new Date();
        userTimeStr = new Intl.DateTimeFormat('en-GB', {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(now);
      } catch (e) {
        userTimeStr = '08:00';
      }

      if (userTimeStr === setting.morningSummaryTime) {
        await this.sendDigest(user._id.toString(), setting, false);
      } else if (userTimeStr === setting.eveningSummaryTime) {
        await this.sendDigest(user._id.toString(), setting, true);
      }
    }
  }

  async sendDigest(userId: string, setting: any, isEvening: boolean): Promise<void> {
    logger.info(`Sending ${isEvening ? 'evening' : 'morning'} digest to user`, { userId });

    let events: any[] = [];
    let emails: any[] = [];
    let tasks: any[] = [];
    let staleLeads: any[] = [];

    try {
      events = await calendarService.listEvents(userId);
    } catch {}

    try {
      emails = await gmailService.getUnreadEmails(userId, 5);
    } catch {}

    try {
      tasks = await tasksService.listTasks(userId);
    } catch {}

    const digestText = await llm.generateDigest({
      events,
      emails,
      tasks,
      isEvening,
    });

    // Deliver to enabled channels
    if (setting.enabledChannels.includes('telegram') && setting.telegramChatId) {
      await telegramService.sendMessage(setting.telegramChatId, digestText);
    }

    if (setting.enabledChannels.includes('whatsapp') && setting.whatsappRecipientPhone) {
      await whatsappService.sendMessage(setting.whatsappRecipientPhone, digestText);
    }
  }
}

export const summaryScheduler = new SummaryScheduler();
