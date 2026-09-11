import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { LLMProvider, IntentResult, DraftReplyResult } from './base.js';

export class GeminiProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI | null = null;
  private readonly fallbackModels = ['gemini-flash-latest', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];

  constructor() {
    if (env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    } else {
      logger.warn('GEMINI_API_KEY is not set. GeminiProvider will operate in mock/fallback mode for development.');
    }
  }

  /**
   * Executes an LLM operation with model fallbacks and retry logic.
   * If a specific model hits quota (429) or rate limits, it automatically
   * fails over to alternate high-throughput Flash models.
   */
  private async executeWithModelFallback<T>(fn: (modelName: string) => Promise<T>): Promise<T> {
    let lastError: any = null;

    for (const modelName of this.fallbackModels) {
      let attempts = 0;
      const maxRetries = 2;

      while (attempts < maxRetries) {
        try {
          return await fn(modelName);
        } catch (err: any) {
          attempts++;
          lastError = err;
          const isQuota =
            err.status === 429 ||
            (err.message &&
              (err.message.includes('429') ||
                err.message.includes('Quota exceeded') ||
                err.message.includes('Too Many Requests') ||
                err.message.includes('ResourceExhausted')));

          if (isQuota) {
            logger.warn(`Gemini model "${modelName}" hit quota/rate limit. Trying next fallback model...`);
            break; // Break retry loop on this model, switch to next model immediately
          }

          if (attempts >= maxRetries) {
            break;
          }
          await new Promise((res) => setTimeout(res, 800 * attempts));
        }
      }
    }

    throw lastError || new Error('All Gemini models exhausted');
  }

  async summarizeEmail(emailBody: string): Promise<string> {
    if (!this.genAI) {
      return `Summary: ${emailBody.slice(0, 150).replace(/\s+/g, ' ')}...`;
    }

    try {
      return await this.executeWithModelFallback(async (modelName) => {
        const model = this.genAI!.getGenerativeModel({ model: modelName });
        const prompt = `You are a concise executive assistant for a real estate business.
Summarize the following email in 2 bullet points. Include key sender ask and recommended action.

Email:
${emailBody.slice(0, 2000)}`;

        const response = await model.generateContent(prompt);
        return response.response.text().trim();
      });
    } catch (err: any) {
      logger.warn('Gemini summarizeEmail fallback triggered:', err.message);
      return `Summary: ${emailBody.slice(0, 140).replace(/\s+/g, ' ')}...`;
    }
  }

  /**
   * Batch summarizes multiple emails in a single LLM prompt to drastically
   * conserve API requests and prevent rate-limit / quota exhaustion.
   */
  async batchSummarizeEmails(emails: Array<{ from: string; subject: string; body: string }>): Promise<string[]> {
    if (emails.length === 0) return [];

    if (!this.genAI) {
      return emails.map((e) => `Summary: ${e.subject} - ${e.body.slice(0, 100).replace(/\s+/g, ' ')}...`);
    }

    try {
      return await this.executeWithModelFallback(async (modelName) => {
        const model = this.genAI!.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        });

        const formatted = emails
          .map((e, idx) => `Email #${idx + 1}:\nFrom: ${e.from}\nSubject: ${e.subject}\nBody:\n${e.body.slice(0, 800)}`)
          .join('\n\n---\n\n');

        const prompt = `You are a concise executive assistant for a real estate business.
Summarize each of the following ${emails.length} emails in 1-2 sentences highlighting sender ask, urgency, and recommended action.
Output strictly valid JSON with an array of strings, exactly corresponding in index order to Email #1 through #${emails.length}:
[
  "summary 1...",
  "summary 2..."
]

Emails:
${formatted}`;

        const response = await model.generateContent(prompt);
        const text = response.response.text().trim();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item));
        }
        return emails.map(() => text);
      });
    } catch (err: any) {
      logger.warn('Gemini batchSummarizeEmails fallback triggered:', err.message);
      return emails.map((e) => `Summary: ${e.subject} — ${e.body.slice(0, 120).replace(/\s+/g, ' ')}...`);
    }
  }

  async draftReply(threadContext: string, userInstruction?: string): Promise<DraftReplyResult> {
    if (!this.genAI) {
      return {
        subject: 'Re: Follow up',
        body: `Hi,\n\nThank you for reaching out. ${userInstruction || 'We have received your message and will review it promptly.'}\n\nBest regards,`,
      };
    }

    try {
      return await this.executeWithModelFallback(async (modelName) => {
        const model = this.genAI!.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        });

        const prompt = `You are an executive assistant for a real estate firm.
Draft a professional, courteous reply to the email thread below.
${userInstruction ? `User specific instructions: "${userInstruction}"` : ''}

Output strictly valid JSON in this structure:
{
  "subject": "Re: ...",
  "body": "Hi ...,\\n\\n..."
}

Email Thread:
${threadContext.slice(0, 2500)}`;

        const response = await model.generateContent(prompt);
        const text = response.response.text().trim();
        try {
          return JSON.parse(text) as DraftReplyResult;
        } catch {
          return {
            subject: 'Re: Inquiry',
            body: text,
          };
        }
      });
    } catch (err: any) {
      logger.warn('Gemini draftReply fallback triggered:', err.message);
      return {
        subject: 'Re: Follow up',
        body: `Hi,\n\nThank you for your email. ${userInstruction || 'We have received your note and are reviewing it now.'}\n\nBest regards,`,
      };
    }
  }

  /**
   * Fast, reliable rule-based parser used for direct commands or when
   * external LLM quota is momentarily unavailable.
   */
  private ruleBasedClassify(trimmed: string): IntentResult {
    const lower = trimmed.toLowerCase();

    // Fast-path for explicit approval
    if (/^yes\s+send(\s+[a-f0-9]+)?$/i.test(trimmed)) {
      const parts = trimmed.split(/\s+/);
      return {
        intent: 'send_approval',
        workspace: 'business',
        entities: { actionId: parts[2] || undefined, rawText: trimmed },
        confidence: 1.0,
      };
    }

    // Direct task creation commands
    const taskMatch = trimmed.match(/^(?:add\s+task:?|create\s+task:?|remind\s+me\s+to|todo:?)\s*(.+)$/i);
    if (taskMatch) {
      const rawTitle = taskMatch[1].trim();
      const isPersonal = /(gym|doctor|grocer|home|workout|family|buy|call mom|medicine|dentist)/i.test(rawTitle);
      return {
        intent: 'create_task',
        workspace: isPersonal ? 'personal' : 'business',
        entities: { title: rawTitle },
        confidence: 0.95,
      };
    }

    // List tasks
    if (/^(?:list\s+tasks|show\s+tasks|pending\s+tasks|my\s+tasks|view\s+tasks)$/i.test(trimmed) || (lower.includes('task') && lower.includes('list'))) {
      return { intent: 'list_tasks', workspace: 'business', entities: {}, confidence: 0.9 };
    }

    // Direct meeting creation
    const eventMatch = trimmed.match(/^(?:schedule\s+meeting:?|create\s+event:?|book\s+meeting:?)\s*(.+)$/i);
    if (eventMatch) {
      const title = eventMatch[1].trim();
      const isPersonal = /(dinner|gym|doctor|family|party)/i.test(title);
      return {
        intent: 'create_event',
        workspace: isPersonal ? 'personal' : 'business',
        entities: { title },
        confidence: 0.9,
      };
    }

    // List events / calendar
    if (/^(?:list\s+events|show\s+calendar|my\s+calendar|today's\s+schedule|upcoming\s+meetings)$/i.test(trimmed) || (lower.includes('schedule') && lower.includes('today'))) {
      return { intent: 'list_events', workspace: 'business', entities: {}, confidence: 0.9 };
    }

    // Draft reply commands (checked before general email check)
    if (lower.includes('draft') || lower.includes('reply')) {
      return { intent: 'draft_reply', workspace: 'business', entities: { text: trimmed }, confidence: 0.95 };
    }

    // Email summarization
    if (lower.includes('email') || lower.includes('inbox') || lower.includes('unread')) {
      return { intent: 'summarize_emails', workspace: 'business', entities: {}, confidence: 0.9 };
    }

    // Fallback general chat
    return { intent: 'general_chat', workspace: 'business', entities: { text: trimmed }, confidence: 0.7 };
  }

  async classifyIntent(userMessage: string): Promise<IntentResult> {
    const trimmed = userMessage.trim();

    // 1. Fast path for direct command patterns (saves quota completely)
    if (/^(?:yes\s+send|draft\s+reply|reply\s+to|add\s+task:|create\s+task:|todo:|remind\s+me\s+to|schedule\s+meeting:|create\s+event:|list\s+tasks|my\s+tasks|summarize\s+my\s+unread\s+emails)/i.test(trimmed)) {
      return this.ruleBasedClassify(trimmed);
    }

    // 2. If no GenAI key is present, use rule-based parser
    if (!this.genAI) {
      return this.ruleBasedClassify(trimmed);
    }

    // 3. Natural language query: use Gemini with multi-model fallback & quota guard
    try {
      return await this.executeWithModelFallback(async (modelName) => {
        const model = this.genAI!.getGenerativeModel({
          model: modelName,
          generationConfig: { responseMimeType: 'application/json' },
        });

        const prompt = `You are the intent parser for an executive AI personal assistant.
Analyze the user message and extract intent, workspace (business vs personal), and relevant entities.
Possible intents:
- 'summarize_emails': check/read/summarize inbox
- 'draft_reply': draft an email response
- 'send_approval': user explicitly asking to approve/send a drafted item
- 'create_event': schedule a calendar meeting or appointment
- 'list_events': view schedule / meetings
- 'create_task': create a to-do item or reminder
- 'list_tasks': view to-dos / tasks
- 'general_chat': conversational or other request

Workspace rule:
- Business: client meetings, property inquiries, contracts, professional emails.
- Personal: gym, personal doctor appointments, family reminders, personal errands.

Return strictly valid JSON:
{
  "intent": "summarize_emails" | "draft_reply" | "send_approval" | "create_event" | "list_events" | "create_task" | "list_tasks" | "general_chat",
  "workspace": "business" | "personal",
  "entities": {
     "title": string or null,
     "date": string or null,
     "time": string or null,
     "attendee": string or null,
     "actionId": string or null
  },
  "confidence": number between 0 and 1
}

User Message:
"${userMessage}"`;

        const response = await model.generateContent(prompt);
        const text = response.response.text().trim();
        return JSON.parse(text) as IntentResult;
      });
    } catch (err: any) {
      logger.warn('Gemini intent classification hit quota/error. Falling back gracefully to rule-based classification:', err.message);
      return this.ruleBasedClassify(trimmed);
    }
  }

  async generateDigest(data: {
    events: any[];
    emails: any[];
    tasks: any[];
    isEvening: boolean;
  }): Promise<string> {
    const timeOfDay = data.isEvening ? 'Evening' : 'Morning';
    if (!this.genAI) {
      return `🌅 ${timeOfDay} Summary:\n- Meetings: ${data.events.length} scheduled\n- Unread Important Emails: ${data.emails.length}\n- Pending Tasks: ${data.tasks.length}`;
    }

    try {
      return await this.executeWithModelFallback(async (modelName) => {
        const model = this.genAI!.getGenerativeModel({ model: modelName });
        const prompt = `Generate a concise, motivating ${timeOfDay} summary for a busy real-estate executive.
Format clearly with emoji bullet points. Group by priorities.

Data:
- Events: ${JSON.stringify(data.events.slice(0, 5))}
- Unread Important Emails: ${JSON.stringify(data.emails.slice(0, 5))}
- Pending Tasks: ${JSON.stringify(data.tasks.slice(0, 5))}

Keep the summary under 200 words.`;

        const response = await model.generateContent(prompt);
        return response.response.text().trim();
      });
    } catch (err: any) {
      logger.warn('Gemini generateDigest fallback triggered:', err.message);
      return `🌅 ${timeOfDay} Summary:\n- Meetings: ${data.events.length} scheduled\n- Unread Important Emails: ${data.emails.length}\n- Pending Tasks: ${data.tasks.length}`;
    }
  }
}
