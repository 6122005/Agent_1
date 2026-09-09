import { describe, it, expect } from 'vitest';
import { GeminiProvider } from '../src/services/llm/geminiProvider.js';

describe('GeminiProvider & Intent Parsing', () => {
  const provider = new GeminiProvider();

  it('should immediately classify "YES SEND" as explicit approval command', async () => {
    const res1 = await provider.classifyIntent('YES SEND');
    expect(res1.intent).toBe('send_approval');
    expect(res1.confidence).toBe(1.0);

    const res2 = await provider.classifyIntent('yes send 64aef1');
    expect(res2.intent).toBe('send_approval');
    expect(res2.entities.actionId).toBe('64aef1');
  });

  it('should parse email and calendar intents correctly in fallback mode', async () => {
    const res1 = await provider.classifyIntent('summarize my unread emails please');
    expect(res1.intent).toBe('summarize_emails');

    const res2 = await provider.classifyIntent('schedule a meeting with real estate client');
    expect(res2.intent).toBe('create_event');
  });
});
