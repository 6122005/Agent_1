import { google } from 'googleapis';
import { getAuthorizedGoogleClient } from '../google/googleAuth.js';
import { logger } from '../../utils/logger.js';

export interface TaskPayload {
  title: string;
  notes?: string;
  due?: Date | string;
}

export class TasksService {
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
        logger.warn(`Tasks API rate limit hit. Retrying in ${delayMs * Math.pow(2, attempt)}ms...`);
        await new Promise((res) => setTimeout(res, delayMs * Math.pow(2, attempt)));
      }
    }
    throw new Error('Tasks API call exceeded retry limit');
  }

  async listTasks(userId: string): Promise<any[]> {
    const auth = await getAuthorizedGoogleClient(userId);
    const tasks = google.tasks({ version: 'v1', auth });

    return this.executeWithBackoff(async () => {
      // Get primary tasklist
      const listRes = await tasks.tasklists.list({ maxResults: 1 });
      const tasklistId = listRes.data.items?.[0]?.id || '@default';

      const res = await tasks.tasks.list({
        tasklist: tasklistId,
        showCompleted: false,
        maxResults: 50,
      });

      return (res.data.items || []).map((t) => ({
        id: t.id,
        title: t.title,
        notes: t.notes,
        due: t.due,
        status: t.status,
      }));
    });
  }

  async createTask(userId: string, payload: TaskPayload): Promise<any> {
    const auth = await getAuthorizedGoogleClient(userId);
    const tasks = google.tasks({ version: 'v1', auth });

    return this.executeWithBackoff(async () => {
      const listRes = await tasks.tasklists.list({ maxResults: 1 });
      const tasklistId = listRes.data.items?.[0]?.id || '@default';

      const res = await tasks.tasks.insert({
        tasklist: tasklistId,
        requestBody: {
          title: payload.title,
          notes: payload.notes,
          due: payload.due ? new Date(payload.due).toISOString() : undefined,
        },
      });

      logger.info('Google Task created successfully', {
        userId,
        taskId: res.data.id,
        title: payload.title,
      });

      return res.data;
    });
  }

  async completeTask(userId: string, taskId: string): Promise<any> {
    const auth = await getAuthorizedGoogleClient(userId);
    const tasks = google.tasks({ version: 'v1', auth });

    return this.executeWithBackoff(async () => {
      const res = await tasks.tasks.patch({
        tasklist: '@default',
        task: taskId,
        requestBody: {
          status: 'completed',
        },
      });
      return res.data;
    });
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const auth = await getAuthorizedGoogleClient(userId);
    const tasks = google.tasks({ version: 'v1', auth });

    await this.executeWithBackoff(async () => {
      await tasks.tasks.delete({
        tasklist: '@default',
        task: taskId,
      });
    });
  }
}

export const tasksService = new TasksService();
