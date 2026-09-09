import { Request, Response } from 'express';
import { PendingAction } from '../models/PendingAction.js';
import { approvalService } from '../services/approval/approvalService.js';

export class ApprovalController {
  async listPending(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const items = await PendingAction.find({
        userId,
        status: 'awaiting_approval',
        expiresAt: { $gt: new Date() },
      }).sort({ createdAt: -1 });

      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async listHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const items = await PendingAction.find({
        userId,
        status: { $ne: 'awaiting_approval' },
      })
        .sort({ updatedAt: -1 })
        .limit(50);

      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  async approve(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user!.userId;

    try {
      const action = await PendingAction.findById(id);
      if (!action) {
        res.status(404).json({ error: 'Action not found' });
        return;
      }

      // Hard data isolation check: Cannot approve actions belonging to another user
      if (action.userId.toString() !== userId) {
        res.status(403).json({ error: 'Forbidden: You do not have permission to approve this action' });
        return;
      }

      const result = await approvalService.approveAndExecute(id, userId, 'dashboard');
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { body, subject } = req.body;
    const userId = req.user!.userId;

    try {
      const action = await PendingAction.findById(id);
      if (!action) {
        res.status(404).json({ error: 'Action not found' });
        return;
      }

      // Hard data isolation check
      if (action.userId.toString() !== userId) {
        res.status(403).json({ error: 'Forbidden: You do not have permission to modify this action' });
        return;
      }

      if (body !== undefined) action.payload.body = body;
      if (subject !== undefined) action.payload.subject = subject;
      action.markModified('payload');
      await action.save();
      res.json(action);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }

  async reject(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user!.userId;

    try {
      const action = await PendingAction.findById(id);
      if (!action) {
        res.status(404).json({ error: 'Action not found' });
        return;
      }

      // Hard data isolation check
      if (action.userId.toString() !== userId) {
        res.status(403).json({ error: 'Forbidden: You do not have permission to reject this action' });
        return;
      }

      await approvalService.rejectAction(id, userId, reason, 'dashboard');
      res.json({ success: true, message: 'Action rejected' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  }
}

export const approvalController = new ApprovalController();
