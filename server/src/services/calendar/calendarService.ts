import { google } from 'googleapis';
import { getAuthorizedGoogleClient } from '../google/googleAuth.js';
import { logger } from '../../utils/logger.js';

export interface CalendarEventPayload {
  summary: string;
  description?: string;
  location?: string;
  start: Date | string;
  end: Date | string;
  attendees?: string[];
  reminderMinutes?: number;
}

export class CalendarService {
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
        logger.warn(`Calendar API rate limit hit. Retrying in ${delayMs * Math.pow(2, attempt)}ms...`);
        await new Promise((res) => setTimeout(res, delayMs * Math.pow(2, attempt)));
      }
    }
    throw new Error('Calendar API call exceeded retry limit');
  }

  async listEvents(userId: string, timeMin?: Date, timeMax?: Date): Promise<any[]> {
    const auth = await getAuthorizedGoogleClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const min = timeMin ? timeMin.toISOString() : new Date().toISOString();
    const max = timeMax ? timeMax.toISOString() : undefined;

    return this.executeWithBackoff(async () => {
      const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: min,
        timeMax: max,
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 25,
      });

      return (res.data.items || []).map((item) => ({
        id: item.id,
        summary: item.summary,
        description: item.description,
        location: item.location,
        start: item.start?.dateTime || item.start?.date,
        end: item.end?.dateTime || item.end?.date,
        attendees: item.attendees?.map((a) => a.email),
        reminders: item.reminders,
      }));
    });
  }

  /**
   * Checks for overlapping events in the given time window
   */
  async checkConflicts(userId: string, start: Date, end: Date): Promise<any[]> {
    const events = await this.listEvents(userId);
    const conflicts = events.filter((ev) => {
      const evStart = new Date(ev.start).getTime();
      const evEnd = new Date(ev.end).getTime();
      const reqStart = start.getTime();
      const reqEnd = end.getTime();
      return reqStart < evEnd && reqEnd > evStart;
    });
    return conflicts;
  }

  async createEvent(userId: string, payload: CalendarEventPayload): Promise<any> {
    const auth = await getAuthorizedGoogleClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const startDate = new Date(payload.start);
    const endDate = new Date(payload.end);
    const reminderMinutes = typeof payload.reminderMinutes === 'number' ? payload.reminderMinutes : 30;

    const conflicts = await this.checkConflicts(userId, startDate, endDate);

    return this.executeWithBackoff(async () => {
      const requestBody: any = {
        summary: payload.summary,
        description: payload.description,
        location: payload.location,
        start: { dateTime: startDate.toISOString() },
        end: { dateTime: endDate.toISOString() },
        attendees: payload.attendees?.map((email) => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: reminderMinutes },
          ],
        },
      };

      const res = await calendar.events.insert({
        calendarId: 'primary',
        requestBody,
      });

      logger.info('Calendar event created successfully with Google reminder override', {
        userId,
        eventId: res.data.id,
        summary: payload.summary,
        reminderMinutes,
        hasConflicts: conflicts.length > 0,
      });

      return {
        event: res.data,
        conflictsWarning: conflicts.length > 0 ? conflicts : undefined,
        requestBodySent: requestBody,
      };
    });
  }

  async updateEvent(userId: string, eventId: string, updates: Partial<CalendarEventPayload>): Promise<any> {
    const auth = await getAuthorizedGoogleClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    return this.executeWithBackoff(async () => {
      const current = await calendar.events.get({ calendarId: 'primary', eventId });
      const requestBody: any = { ...current.data };

      if (updates.summary) requestBody.summary = updates.summary;
      if (updates.description) requestBody.description = updates.description;
      if (updates.start) requestBody.start = { dateTime: new Date(updates.start).toISOString() };
      if (updates.end) requestBody.end = { dateTime: new Date(updates.end).toISOString() };

      const res = await calendar.events.patch({
        calendarId: 'primary',
        eventId,
        requestBody,
      });

      return res.data;
    });
  }

  async deleteEvent(userId: string, eventId: string): Promise<void> {
    const auth = await getAuthorizedGoogleClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    await this.executeWithBackoff(async () => {
      await calendar.events.delete({ calendarId: 'primary', eventId });
    });
  }
}

export const calendarService = new CalendarService();
