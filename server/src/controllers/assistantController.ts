import { Request, Response } from 'express';
import { agentOrchestrator } from '../services/orchestrator/agentOrchestrator.js';
import { calendarService } from '../services/calendar/calendarService.js';
import { tasksService } from '../services/tasks/tasksService.js';
import { hubspotProvider } from '../services/crm/hubspotProvider.js';

export class AssistantController {
  async chat(req: Request, res: Response): Promise<void> {
    const { message } = req.body;
    if (!message) {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    try {
      const userId = req.user!.userId;
      const response = await agentOrchestrator.handleMessage(userId, 'dashboard', message);
      res.json(response);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getCalendarEvents(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const events = await calendarService.listEvents(userId);
      res.json(events);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const tasks = await tasksService.listTasks(userId);
      res.json(tasks);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async getCRMLeads(req: Request, res: Response): Promise<void> {
    try {
      const leads = await hubspotProvider.listStaleLeads(7);
      res.json(leads);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const assistantController = new AssistantController();
