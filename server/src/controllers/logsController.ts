import { Request, Response } from 'express';
import { ActivityLog } from '../models/ActivityLog.js';

export class LogsController {
  async getLogs(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const workspace = req.query.workspace as string;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const query: any = { userId };
      if (workspace && workspace !== 'all') {
        query.workspace = workspace;
      }

      const logs = await ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('relatedApprovalId', 'type status summary');

      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}

export const logsController = new LogsController();
