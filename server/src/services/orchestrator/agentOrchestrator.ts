import mongoose from 'mongoose';
import { GeminiProvider } from '../llm/geminiProvider.js';
import { LLMProvider } from '../llm/base.js';
import { approvalService } from '../approval/approvalService.js';
import { gmailService } from '../gmail/gmailService.js';
import { calendarService } from '../calendar/calendarService.js';
import { tasksService } from '../tasks/tasksService.js';
import { ActivityLog } from '../../models/ActivityLog.js';
import { ChannelType, WorkspaceType } from '../../models/PendingAction.js';
import { logger } from '../../utils/logger.js';

export interface OrchestratorResponse {
  text: string;
  actionTaken?: string;
  pendingApprovalId?: string;
  data?: any;
}

export class AgentOrchestrator {
  private llm: LLMProvider;

  constructor(llmProvider?: LLMProvider) {
    this.llm = llmProvider || new GeminiProvider();
  }

  async handleMessage(
    userId: string,
    channel: ChannelType,
    messageText: string
  ): Promise<OrchestratorResponse> {
    const trimmed = messageText.trim();
    logger.info('Processing message in AgentOrchestrator', { userId, channel, length: trimmed.length });

    // =========================================================================
    // 1. FAST PATH: Check for explicit "YES SEND" approval trigger
    // =========================================================================
    if (/^yes\s+send/i.test(trimmed)) {
      const parts = trimmed.split(/\s+/);
      const specificId = parts.length > 2 ? parts.slice(2).join('') : undefined;

      const pending = await approvalService.findActionToApprove(userId, specificId);
      if (!pending) {
        return {
          text: '❌ No pending action found awaiting approval. If you want to send an email or schedule an event, please tell me what to draft first.',
        };
      }

      try {
        const result = await approvalService.approveAndExecute(pending._id, userId, channel);
        return {
          text: `✅ *APPROVED & SENT!*\n\n${result.message}\n` +
            `*Action:* ${pending.type.replace('_', ' ').toUpperCase()}\n` +
            `*Workspace:* ${pending.workspace.toUpperCase()}`,
          actionTaken: 'approved_and_executed',
          data: result.result,
        };
      } catch (err: any) {
        return {
          text: `❌ Approval execution failed: ${err.message}`,
          actionTaken: 'execution_error',
        };
      }
    }

    // =========================================================================
    // 2. Classify Intent via LLM
    // =========================================================================
    const intentResult = await this.llm.classifyIntent(trimmed);
    const workspace: WorkspaceType = intentResult.workspace || 'business';

    // =========================================================================
    // 3. Dispatch based on intent
    // =========================================================================
    switch (intentResult.intent) {
      case 'summarize_emails': {
        try {
          const emails = await gmailService.getUnreadEmails(userId, 5);
          if (emails.length === 0) {
            return { text: '📭 Your primary inbox is all caught up! No unread emails.' };
          }

          let summaryOutput = `📬 *Found ${emails.length} unread email(s):*\n\n`;
          const summaries = await this.llm.batchSummarizeEmails(emails);
          for (let i = 0; i < emails.length; i++) {
            const e = emails[i];
            const summary = summaries[i] || 'Important message received.';
            summaryOutput += `*${i + 1}. From:* ${e.from}\n*Subject:* ${e.subject}\n*Summary:* ${summary}\n\n`;
          }
          summaryOutput += `💡 _To reply to any email, say: "Draft reply to email 1 telling them..."_`;

          await ActivityLog.create({
            userId,
            actor: 'agent',
            actionType: 'summarized_emails',
            channel,
            workspace,
            status: 'success',
            details: { emailCount: emails.length },
          });

          return { text: summaryOutput, actionTaken: 'summarize_emails', data: emails };
        } catch (err: any) {
          return { text: `⚠️ Could not access Gmail: ${err.message}. Ensure your Google account is connected in Settings.` };
        }
      }

      case 'draft_reply': {
        try {
          const emails = await gmailService.getUnreadEmails(userId, 5);
          if (emails.length === 0) {
            return { text: '📭 No unread emails found to reply to. Please specify the recipient or email subject.' };
          }

          // 1. Check for range request like "draft 1 to 5", "draft 1-5", or "draft all"
          const rangeMatch = trimmed.match(/(?:draft|reply)\s*(?:emails?\s*)?(\d+)\s*(?:to|-)\s*(\d+)/i);
          const allMatch = /(?:draft|reply)\s*(?:to\s*)?all/i.test(trimmed);

          if (rangeMatch || allMatch) {
            let start = 0;
            let end = emails.length;
            if (rangeMatch) {
              start = Math.max(0, parseInt(rangeMatch[1], 10) - 1);
              end = Math.min(emails.length, parseInt(rangeMatch[2], 10));
            }

            const targetEmails = emails.slice(start, end);
            if (targetEmails.length === 0) {
              return { text: `⚠️ Invalid range. Please choose from emails 1 to ${emails.length}.` };
            }

            let responseText = `📬 *Drafted ${targetEmails.length} replies awaiting approval:*\n\n`;
            for (let i = 0; i < targetEmails.length; i++) {
              const currentEmail = targetEmails[i];
              const emailNum = start + i + 1;
              const draft = await this.llm.draftReply(currentEmail.body, trimmed);

              await approvalService.createPendingAction({
                userId,
                type: 'send_email',
                summary: `Reply to ${currentEmail.from} regarding ${currentEmail.subject}`,
                payload: {
                  to: currentEmail.from,
                  subject: draft.subject,
                  body: draft.body,
                  threadId: currentEmail.threadId,
                },
                channelOrigin: channel,
                workspace,
              });

              responseText += `*${emailNum}. To:* ${currentEmail.from}\n*Subject:* ${draft.subject}\n*Draft Preview:* ${draft.body.slice(0, 140).replace(/\n/g, ' ')}...\n\n`;
            }

            responseText += `👉 *Visit the Approvals page (or home queue) to Edit Draft or click 'YES SEND (Approve)' for each email!*`;
            return {
              text: responseText,
              actionTaken: 'batch_drafts_created',
            };
          }

          // 2. Single email selection (e.g. "draft 2", "draft email 3", "reply to 5")
          const singleMatch = trimmed.match(/(?:email|draft|reply|number|#)\s*#?\s*(\d+)/i) || trimmed.match(/\b([1-5])\b/);
          let targetIndex = 0;
          if (singleMatch) {
            const parsed = parseInt(singleMatch[1], 10) - 1;
            if (parsed >= 0 && parsed < emails.length) {
              targetIndex = parsed;
            }
          }

          const targetEmail = emails[targetIndex];
          const draft = await this.llm.draftReply(targetEmail.body, trimmed);

          // Store as PendingAction awaiting explicit YES SEND
          const pending = await approvalService.createPendingAction({
            userId,
            type: 'send_email',
            summary: `Reply to ${targetEmail.from} regarding ${targetEmail.subject}`,
            payload: {
              to: targetEmail.from,
              subject: draft.subject,
              body: draft.body,
              threadId: targetEmail.threadId,
            },
            channelOrigin: channel,
            workspace,
          });

          const promptText = approvalService.formatApprovalPrompt(pending);
          return {
            text: promptText,
            actionTaken: 'draft_created',
            pendingApprovalId: pending._id.toString(),
          };
        } catch (err: any) {
          return { text: `⚠️ Failed to draft reply: ${err.message}` };
        }
      }

      case 'create_event': {
        try {
          // Parse event title, timing, and reminder lead time
          let title = intentResult.entities?.title || trimmed;
          title = title.replace(/^(?:schedule\s+meeting:?|create\s+event:?|book\s+meeting:?|meeting:?)\s*/i, '').trim();

          // 1. Relative or specific start time (e.g. "in 10 minutes")
          let start = new Date(Date.now() + 2 * 60 * 60 * 1000); // default 2 hours
          const relMinMatch = trimmed.match(/(?:in|after)\s+(\d+)\s*(?:minutes?|mins?)\b/i);
          if (relMinMatch) {
            const mins = parseInt(relMinMatch[1], 10);
            start = new Date(Date.now() + mins * 60 * 1000);
            title = title.replace(relMinMatch[0], '').trim();
          } else {
            const relHrMatch = trimmed.match(/(?:in|after)\s+(\d+)\s*(?:hours?|hrs?)\b/i);
            if (relHrMatch) {
              const hrs = parseInt(relHrMatch[1], 10);
              start = new Date(Date.now() + hrs * 60 * 60 * 1000);
              title = title.replace(relHrMatch[0], '').trim();
            } else {
              const atTimeMatch = trimmed.match(/\bat\s+(\d{1,2}):(\d{2})(?:\s*(am|pm))?\b/i);
              if (atTimeMatch) {
                let hrs = parseInt(atTimeMatch[1], 10);
                const mins = parseInt(atTimeMatch[2], 10);
                const ampm = atTimeMatch[3]?.toLowerCase();
                if (ampm === 'pm' && hrs < 12) hrs += 12;
                if (ampm === 'am' && hrs === 12) hrs = 0;
                const target = new Date();
                target.setHours(hrs, mins, 0, 0);
                if (target.getTime() < Date.now()) target.setDate(target.getDate() + 1);
                start = target;
                title = title.replace(atTimeMatch[0], '').trim();
              }
            }
          }

          // 2. Reminder lead time override (default 30 mins)
          let reminderMinutes = 30;
          const remMatch = trimmed.match(/(?:(?:with|remind\s+(?:me\s+)?)\s*(\d+)\s*(?:minutes?|mins?)(?:\s*(?:reminder|before))?|(\d+)\s*(?:minutes?|mins?)\s*(?:reminder|before))/i);
          if (remMatch) {
            const val = remMatch[1] || remMatch[2];
            if (val) reminderMinutes = parseInt(val, 10);
            title = title.replace(remMatch[0], '').trim();
          } else {
            const hrRemMatch = trimmed.match(/(?:(?:with|remind\s+(?:me\s+)?)\s*(\d+)\s*(?:hours?|hrs?)(?:\s*(?:reminder|before))?|(\d+)\s*(?:hours?|hrs?)\s*(?:reminder|before))/i);
            if (hrRemMatch) {
              const val = hrRemMatch[1] || hrRemMatch[2];
              if (val) reminderMinutes = parseInt(val, 10) * 60;
              title = title.replace(hrRemMatch[0], '').trim();
            }
          }

          title = title.replace(/\b(?:reminder|before)\b/gi, '').replace(/\s+(?:on|at|for|with|due)\s*$/i, '').replace(/\s+/g, ' ').trim();
          if (!title) title = 'Executive Meeting';

          const end = new Date(start.getTime() + 30 * 60 * 1000);

          const conflicts = await calendarService.checkConflicts(userId, start, end);
          const result = await calendarService.createEvent(userId, {
            summary: title,
            start,
            end,
            reminderMinutes,
          });

          let response = `📅 *Event Scheduled!*\n\n*Event:* ${title}\n*Time:* ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n*Workspace:* ${workspace.toUpperCase()}\n🔔 *Google Reminder:* ${reminderMinutes} min before (native popup)`;
          if (conflicts.length > 0) {
            response += `\n\n⚠️ *Warning:* This overlaps with an existing event: "${conflicts[0].summary}".`;
          }

          await ActivityLog.create({
            userId,
            actor: 'agent',
            actionType: 'calendar_event_created',
            channel,
            workspace,
            status: 'success',
            details: { title, start, end, reminderMinutes, hasConflicts: conflicts.length > 0 },
          });

          return { text: response, actionTaken: 'create_event', data: result };
        } catch (err: any) {
          return { text: `⚠️ Calendar error: ${err.message}` };
        }
      }

      case 'list_events': {
        try {
          const events = await calendarService.listEvents(userId);
          if (events.length === 0) {
            return { text: '📅 No upcoming meetings found on your calendar for today.' };
          }
          let text = `📅 *Upcoming Events:*\n\n`;
          events.forEach((ev, idx) => {
            text += `*${idx + 1}. ${ev.summary}*\nTime: ${new Date(ev.start).toLocaleTimeString()}\n\n`;
          });
          return { text, actionTaken: 'list_events', data: events };
        } catch (err: any) {
          return { text: `⚠️ Calendar error: ${err.message}` };
        }
      }

      case 'create_task': {
        try {
          let rawTitle = intentResult.entities?.title || trimmed;
          rawTitle = rawTitle.replace(/^(?:add\s+task:?|create\s+task:?|todo:?|remind\s+me\s+to)\s*/i, '').trim();

          let due: Date | undefined;
          let notes: string | undefined;

          const relMinMatch = trimmed.match(/(?:due\s+in|in)\s+(\d+)\s*(?:min|mins|minute|minutes)\b/i);
          if (relMinMatch) {
            const mins = parseInt(relMinMatch[1], 10);
            due = new Date(Date.now() + mins * 60 * 1000);
            notes = `Due at ${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            rawTitle = rawTitle.replace(relMinMatch[0], '').trim();
          } else {
            const atTimeMatch = trimmed.match(/(?:due\s+at|at)\s+(\d{1,2}):(\d{2})(?:\s*(am|pm))?\b/i);
            if (atTimeMatch) {
              let hrs = parseInt(atTimeMatch[1], 10);
              const mins = parseInt(atTimeMatch[2], 10);
              const ampm = atTimeMatch[3]?.toLowerCase();
              if (ampm === 'pm' && hrs < 12) hrs += 12;
              if (ampm === 'am' && hrs === 12) hrs = 0;
              const target = new Date();
              target.setHours(hrs, mins, 0, 0);
              if (target.getTime() < Date.now()) target.setDate(target.getDate() + 1);
              due = target;
              notes = `Due at ${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
              rawTitle = rawTitle.replace(atTimeMatch[0], '').trim();
            }
          }

          rawTitle = rawTitle.replace(/\s+(?:on|at|for|due|in)\s*$/i, '').trim();
          const title = rawTitle || 'New Task';

          const task = await tasksService.createTask(userId, {
            title,
            due,
            notes,
          });

          await ActivityLog.create({
            userId,
            actor: 'agent',
            actionType: 'task_created',
            channel,
            workspace,
            status: 'success',
            details: { taskId: task.id, title, due, notes },
          });

          let responseText = `✅ *Task Added:* "${title}"\n*Workspace:* ${workspace.toUpperCase()}`;
          if (notes) {
            responseText += `\n⏰ *Scheduled:* ${notes} (Assistant proactive reminder enabled)`;
          }

          return {
            text: responseText,
            actionTaken: 'create_task',
            data: task,
          };
        } catch (err: any) {
          return { text: `⚠️ Tasks error: ${err.message}` };
        }
      }

      case 'list_tasks': {
        try {
          const tasks = await tasksService.listTasks(userId);
          if (tasks.length === 0) {
            return { text: '📝 No pending tasks found. You are all set!' };
          }
          let text = `📝 *Pending Tasks:*\n\n`;
          tasks.forEach((t, idx) => {
            text += `*${idx + 1}.* ${t.title}\n`;
          });
          return { text, actionTaken: 'list_tasks', data: tasks };
        } catch (err: any) {
          return { text: `⚠️ Tasks error: ${err.message}` };
        }
      }

      default: {
        return {
          text: `👋 I'm your AI Assistant. I can help you with:\n\n` +
            `• 📬 *Gmail:* "Summarize my unread emails" or "Draft a reply"\n` +
            `• 📅 *Calendar:* "Schedule a meeting with client" or "What's on my schedule?"\n` +
            `• 📝 *Tasks:* "Add task: Review lease contract" or "List my tasks"\n\n` +
            `_All email sending requires your explicit "YES SEND" approval first._`,
        };
      }
    }
  }
}

export const agentOrchestrator = new AgentOrchestrator();
