import cron from 'node-cron';
import { User } from '../models/User.js';
import { Setting } from '../models/Setting.js';
import { SentReminder } from '../models/SentReminder.js';
import { ActivityLog } from '../models/ActivityLog.js';
import { calendarService } from '../services/calendar/calendarService.js';
import { tasksService } from '../services/tasks/tasksService.js';
import { telegramService } from '../services/telegram/telegramService.js';
import { logger } from '../utils/logger.js';

export class ReminderScheduler {
  private isRunning = false;

  /**
   * Initializes frequent cron job to check for upcoming calendar events & tasks
   * and dispatches proactive reminders.
   */
  start(): void {
    logger.info('Starting proactive reminder scheduler (every 1 minute)...');

    // Run every minute to check for events/tasks starting/due within the next 15 minutes
    cron.schedule('* * * * *', async () => {
      if (this.isRunning) return;
      this.isRunning = true;
      try {
        await this.checkAndDispatchReminders();
      } catch (err: any) {
        logger.error('Error in proactive reminder scheduler', { error: err.message });
      } finally {
        this.isRunning = false;
      }
    });
  }

  /**
   * Scans all registered user settings and checks for upcoming calendar events and tasks.
   */
  async checkAndDispatchReminders(): Promise<void> {
    const settings = await Setting.find({});

    for (const setting of settings) {
      const userId = setting.userId.toString();
      const user = await User.findById(userId);
      if (!user) continue;

      await this.checkCalendarReminders(userId, setting);
      await this.checkTaskReminders(userId, setting);
    }
  }

  /**
   * Checks calendar events starting within the next 15 minutes
   */
  private async checkCalendarReminders(userId: string, setting: any): Promise<void> {
    try {
      const now = new Date();
      // Look ahead up to 16 minutes from now, and include events starting right now
      const windowStart = new Date(now.getTime() - 60 * 1000);
      const windowEnd = new Date(now.getTime() + 16 * 60 * 1000);

      const events = await calendarService.listEvents(userId, windowStart, windowEnd);

      for (const ev of events) {
        if (!ev.id || !ev.start) continue;

        const eventStart = new Date(ev.start);
        const diffMs = eventStart.getTime() - now.getTime();
        const diffMinutes = Math.round(diffMs / (60 * 1000));

        // Event must be starting within the 0 to 15 minute window
        if (diffMinutes < -1 || diffMinutes > 15) continue;

        // Check if already reminded to prevent duplicate notifications
        const alreadySent = await SentReminder.findOne({
          userId,
          targetType: 'calendar_event',
          targetId: ev.id,
        });

        if (alreadySent) continue;

        const minsDisplay = diffMinutes <= 0 ? 'NOW' : `in ~${diffMinutes} min`;
        const timeStr = eventStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const messageText = `🔔 *Upcoming Meeting Alert!*\n\n` +
          `*Event:* ${ev.summary || 'Scheduled Meeting'}\n` +
          `*Time:* ${timeStr} (${minsDisplay})\n` +
          (ev.location ? `*Location:* ${ev.location}\n` : '') +
          `\n_Proactive notification from your Executive Assistant._`;

        let channelUsed: 'telegram' | 'dashboard' = 'dashboard';

        // Deliver to connected Telegram channel first
        if (setting.enabledChannels?.includes('telegram') && setting.telegramChatId) {
          try {
            await telegramService.sendMessage(setting.telegramChatId, messageText);
            channelUsed = 'telegram';
          } catch (tErr: any) {
            logger.warn('Failed to send Telegram proactive reminder, falling back to dashboard', { error: tErr.message });
          }
        }

        // Record in SentReminder (enforces at most 1 reminder per event)
        await SentReminder.create({
          userId,
          targetType: 'calendar_event',
          targetId: ev.id,
          targetTitle: ev.summary || 'Scheduled Meeting',
          targetTime: eventStart,
          channel: channelUsed,
          sentAt: new Date(),
        });

        // Log in ActivityLog for audit trail & dashboard presence
        await ActivityLog.create({
          userId,
          actor: 'agent',
          actionType: 'proactive_reminder_sent',
          channel: channelUsed,
          workspace: 'business',
          status: 'success',
          details: {
            targetType: 'calendar_event',
            eventId: ev.id,
            summary: ev.summary,
            startsInMinutes: diffMinutes,
            startTime: eventStart.toISOString(),
          },
        });

        logger.info('Dispatched proactive calendar reminder', {
          userId,
          eventId: ev.id,
          summary: ev.summary,
          channelUsed,
          diffMinutes,
        });
      }
    } catch (err: any) {
      // User might not have Google connected or token expired
      logger.debug('Skipping calendar reminder check for user', { userId, error: err.message });
    }
  }

  /**
   * Checks Google Tasks due within the next 15 minutes or due today
   */
  private async checkTaskReminders(userId: string, setting: any): Promise<void> {
    try {
      const now = new Date();
      const tasks = await tasksService.listTasks(userId);

      for (const task of tasks) {
        if (!task.id || task.status === 'completed') continue;

        let isDueSoon = false;
        let dueTime = now;

        // Check if task has a due date/time
        if (task.due) {
          const taskDue = new Date(task.due);
          const diffMs = taskDue.getTime() - now.getTime();
          const diffMinutes = Math.round(diffMs / (60 * 1000));

          // If due has exact time within next 15 mins, or is due today
          const isToday = taskDue.toDateString() === now.toDateString();
          if ((diffMinutes >= -5 && diffMinutes <= 15) || isToday) {
            isDueSoon = true;
            dueTime = taskDue;
          }
        }

        // Check if task notes has an explicit time (e.g. "Due at 17:15" or "in 10 min")
        if (!isDueSoon && task.notes) {
          const timeMatch = task.notes.match(/due(?:\s+at|\s+in)?\s*(\d{1,2}):(\d{2})/i);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const noteDue = new Date();
            noteDue.setHours(hours, minutes, 0, 0);
            const diffMinutes = Math.round((noteDue.getTime() - now.getTime()) / (60 * 1000));
            if (diffMinutes >= -2 && diffMinutes <= 15) {
              isDueSoon = true;
              dueTime = noteDue;
            }
          }
        }

        if (!isDueSoon) continue;

        // Check if already reminded
        const alreadySent = await SentReminder.findOne({
          userId,
          targetType: 'task',
          targetId: task.id,
        });

        if (alreadySent) continue;

        const messageText = `📋 *Task Due Alert!*\n\n` +
          `*Task:* ${task.title}\n` +
          (task.notes ? `*Details:* ${task.notes}\n` : '') +
          `\n_Proactive reminder from your Executive Assistant._`;

        let channelUsed: 'telegram' | 'dashboard' = 'dashboard';

        if (setting.enabledChannels?.includes('telegram') && setting.telegramChatId) {
          try {
            await telegramService.sendMessage(setting.telegramChatId, messageText);
            channelUsed = 'telegram';
          } catch (tErr: any) {
            logger.warn('Failed to send Telegram task reminder, falling back to dashboard', { error: tErr.message });
          }
        }

        await SentReminder.create({
          userId,
          targetType: 'task',
          targetId: task.id,
          targetTitle: task.title,
          targetTime: dueTime,
          channel: channelUsed,
          sentAt: new Date(),
        });

        await ActivityLog.create({
          userId,
          actor: 'agent',
          actionType: 'proactive_reminder_sent',
          channel: channelUsed,
          workspace: 'business',
          status: 'success',
          details: {
            targetType: 'task',
            taskId: task.id,
            title: task.title,
          },
        });

        logger.info('Dispatched proactive task reminder', {
          userId,
          taskId: task.id,
          title: task.title,
          channelUsed,
        });
      }
    } catch (err: any) {
      logger.debug('Skipping task reminder check for user', { userId, error: err.message });
    }
  }
}

export const reminderScheduler = new ReminderScheduler();
