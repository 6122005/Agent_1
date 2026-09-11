export interface IntentResult {
  intent:
    | 'summarize_emails'
    | 'draft_reply'
    | 'send_approval'
    | 'create_event'
    | 'list_events'
    | 'create_task'
    | 'list_tasks'
    | 'general_chat'
    | 'unknown';
  workspace: 'business' | 'personal';
  entities: Record<string, any>;
  confidence: number;
}

export interface DraftReplyResult {
  subject: string;
  body: string;
}

export interface LLMProvider {
  summarizeEmail(emailBody: string): Promise<string>;
  batchSummarizeEmails(emails: Array<{ from: string; subject: string; body: string }>): Promise<string[]>;
  draftReply(threadContext: string, userInstruction?: string): Promise<DraftReplyResult>;
  classifyIntent(userMessage: string): Promise<IntentResult>;
  generateDigest(data: {
    events: any[];
    emails: any[];
    tasks: any[];
    isEvening: boolean;
  }): Promise<string>;
}
