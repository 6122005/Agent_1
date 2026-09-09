import mongoose from 'mongoose';
import { PendingAction, IPendingAction, ActionType, ChannelType, WorkspaceType } from '../../models/PendingAction.js';
import { ActivityLog } from '../../models/ActivityLog.js';
import { gmailService } from '../gmail/gmailService.js';
import { calendarService } from '../calendar/calendarService.js';
import { tasksService } from '../tasks/tasksService.js';
import { logger } from '../../utils/logger.js';

export class ApprovalService {
  /**
   * Creates a pending action awaiting approval with a 24-hour expiration.
   */
  async createPendingAction(params: {
    userId: string | mongoose.Types.ObjectId;
    type: ActionType;
    summary: string;
    payload: Record<string, any>;
    channelOrigin: ChannelType;
    workspace?: WorkspaceType;
    timeoutHours?: number;
  }): Promise<IPendingAction> {
    const hours = params.timeoutHours || 24;
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

    const pending = new PendingAction({
      userId: params.userId,
      type: params.type,
      status: 'awaiting_approval',
      summary: params.summary,
      payload: params.payload,
      channelOrigin: params.channelOrigin,
      workspace: params.workspace || 'business',
      expiresAt,
    });

    await pending.save();

    // Log action creation in ActivityLog
    await ActivityLog.create({
      userId: params.userId,
      actor: 'agent',
      actionType: `draft_${params.type}`,
      channel: params.channelOrigin,
      workspace: params.workspace || 'business',
      status: 'pending',
      details: {
        summary: params.summary,
        payload: params.payload,
        expiresAt,
      },
      relatedApprovalId: pending._id,
    });

    logger.info('Pending action created awaiting approval', {
      actionId: pending._id,
      type: params.type,
      workspace: params.workspace,
    });

    return pending;
  }

  /**
   * Formats the draft approval message for notification across channels
   */
  formatApprovalPrompt(action: IPendingAction): string {
    const idSnippet = action._id.toString();
    if (action.type === 'send_email') {
      return (
        `📬 *EMAIL DRAFT AWAITING YOUR APPROVAL*\n\n` +
        `*To:* ${action.payload.to}\n` +
        `*Subject:* ${action.payload.subject}\n` +
        `*Workspace:* ${action.workspace.toUpperCase()}\n\n` +
        `*Body:*\n${action.payload.body}\n\n` +
        `⚠️ *Reply "YES SEND" or "YES SEND ${idSnippet.slice(-6)}" to approve and send this email.*\n` +
        `Any other reply will be treated as an edit instruction or rejection.`
      );
    }

    return (
      `🔔 *ACTION AWAITING YOUR APPROVAL*\n\n` +
      `*Action:* ${action.type.replace('_', ' ').toUpperCase()}\n` +
      `*Summary:* ${action.summary}\n` +
      `*Workspace:* ${action.workspace.toUpperCase()}\n\n` +
      `⚠️ *Reply "YES SEND" to approve, or reply with your changes.*`
    );
  }

  /**
   * Finds the latest pending action for a user or matches by action ID.
   */
  async findActionToApprove(userId: string, specificId?: string): Promise<IPendingAction | null> {
    const query: any = {
      userId,
      status: 'awaiting_approval',
      expiresAt: { $gt: new Date() },
    };

    if (specificId) {
      if (mongoose.Types.ObjectId.isValid(specificId)) {
        query._id = specificId;
      } else if (specificId.length >= 4) {
        // Allow suffix matching, e.g. "YES SEND 123456"
        const recent = await PendingAction.find(query).sort({ createdAt: -1 });
        return recent.find((a) => a._id.toString().endsWith(specificId)) || null;
      }
    }

    // Default to the most recent pending action
    return PendingAction.findOne(query).sort({ createdAt: -1 });
  }

  /**
   * Approves and strictly executes the action.
   * HARD INVARIANT: Action MUST be approved here before execution can proceed.
   */
  async approveAndExecute(
    actionId: string | mongoose.Types.ObjectId,
    approverUserId: string,
    channel: ChannelType = 'dashboard'
  ): Promise<{ success: boolean; message: string; result?: any }> {
    const action = await PendingAction.findById(actionId);

    if (!action) {
      throw new Error(`Approval action ${actionId} not found`);
    }

    if (action.status !== 'awaiting_approval') {
      return {
        success: false,
        message: `Action is already ${action.status}`,
      };
    }

    if (action.expiresAt < new Date()) {
      action.status = 'expired';
      await action.save();
      return {
        success: false,
        message: 'Action has expired. Please create a new request.',
      };
    }

    // 1. Flip status to 'approved'
    action.status = 'approved';
    action.approvedAt = new Date();
    await action.save();

    let executionResult: any = null;

    try {
      // 2. Strict Execution Path: Only permitted after status is 'approved'
      if (action.type === 'send_email') {
        executionResult = await gmailService.sendEmail(action.userId.toString(), {
          to: action.payload.to,
          subject: action.payload.subject,
          body: action.payload.body,
          threadId: action.payload.threadId,
        });
      } else if (action.type === 'schedule_meeting') {
        executionResult = await calendarService.createEvent(action.userId.toString(), action.payload as any);
      } else if (action.type === 'create_task') {
        executionResult = await tasksService.createTask(action.userId.toString(), action.payload as any);
      }

      action.status = 'executed';
      action.executedAt = new Date();
      await action.save();

      // Log success in ActivityLog
      await ActivityLog.create({
        userId: action.userId,
        actor: 'user',
        actionType: `executed_${action.type}`,
        channel,
        workspace: action.workspace,
        status: 'success',
        details: {
          actionId: action._id,
          payload: action.payload,
          result: executionResult,
        },
        relatedApprovalId: action._id,
      });

      logger.info('Pending action approved and executed successfully', {
        actionId: action._id,
        type: action.type,
      });

      return {
        success: true,
        message: `Action ${action.type.replace('_', ' ')} executed successfully!`,
        result: executionResult,
      };
    } catch (err: any) {
      action.status = 'failed';
      action.resolutionNote = err.message;
      await action.save();

      await ActivityLog.create({
        userId: action.userId,
        actor: 'system',
        actionType: `failed_${action.type}`,
        channel,
        workspace: action.workspace,
        status: 'failed',
        details: { actionId: action._id, error: err.message },
        relatedApprovalId: action._id,
      });

      logger.error('Failed to execute approved action', {
        actionId: action._id,
        error: err.message,
      });

      throw new Error(`Execution failed: ${err.message}`);
    }
  }

  /**
   * Rejects a pending action with a note
   */
  async rejectAction(
    actionId: string | mongoose.Types.ObjectId,
    userId: string,
    reason = 'Rejected by user',
    channel: ChannelType = 'dashboard'
  ): Promise<void> {
    const action = await PendingAction.findById(actionId);
    if (!action) throw new Error('Action not found');

    action.status = 'rejected';
    action.resolutionNote = reason;
    await action.save();

    await ActivityLog.create({
      userId,
      actor: 'user',
      actionType: `rejected_${action.type}`,
      channel,
      workspace: action.workspace,
      status: 'success',
      details: { actionId: action._id, reason },
      relatedApprovalId: action._id,
    });

    logger.info('Pending action rejected', { actionId: action._id, reason });
  }
}

export const approvalService = new ApprovalService();
