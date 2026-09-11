import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Mail, Calendar, CheckSquare } from 'lucide-react';
import { api } from '../lib/api.js';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

interface ChatWidgetProps {
  onApprovalCreated?: () => void;
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({ onApprovalCreated }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'assistant',
      text: 'Hello! I am your AI Executive Assistant. Ask me to summarize your emails, prepare a draft, schedule a meeting, or manage your tasks.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/assistant/chat', { message: text });
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: res.data.text || 'Action completed.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);

      if (res.data.pendingApprovalId || res.data.actionTaken === 'approved_and_executed') {
        onApprovalCreated?.();
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: `⚠️ Request error: ${err.response?.data?.error || err.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const capabilities = [
    { label: 'Summarize unread emails', icon: Mail, prompt: 'Summarize my unread emails' },
    { label: "Today's calendar schedule", icon: Calendar, prompt: 'What meetings do I have today?' },
    { label: 'Quick add property task', icon: CheckSquare, prompt: 'Add task: Review property valuation' },
    { label: 'Draft email reply', icon: Send, prompt: 'Draft a reply to my latest email' },
  ];

  return (
    <div className="bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 border border-zinc-800 rounded-xl flex flex-col h-[520px] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-zinc-100 tracking-tight">Executive AI Assistant</h3>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">Natural language execution & drafting</p>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700/80 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-xl whitespace-pre-wrap leading-relaxed shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-sky-600 text-white rounded-br-xs font-normal'
                  : 'bg-zinc-800/90 border border-zinc-700/70 text-zinc-100 rounded-bl-xs font-normal'
              }`}
            >
              <div className="text-xs leading-relaxed">{msg.text}</div>
              <div
                className={`text-[10px] mt-1.5 text-right font-mono ${
                  msg.sender === 'user' ? 'text-sky-200/90' : 'text-zinc-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>
            {msg.sender === 'user' && (
              <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700/80 text-zinc-300 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                <User className="w-3.5 h-3.5 text-zinc-300" />
              </div>
            )}
          </div>
        ))}

        {/* Quick Capabilities Card shown when messages count is low */}
        {messages.length === 1 && !loading && (
          <div className="mt-4 p-3.5 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
              Suggested Executions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {capabilities.map((cap, idx) => {
                const Icon = cap.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(cap.prompt)}
                    className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800/90 text-left transition-colors group"
                  >
                    <Icon className="w-3.5 h-3.5 text-sky-400 group-hover:text-sky-300 shrink-0" />
                    <span className="text-[11px] text-zinc-300 group-hover:text-white truncate">
                      {cap.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center gap-2 text-zinc-400 text-xs py-1">
            <div className="w-6 h-6 rounded-md bg-zinc-800 border border-zinc-700/80 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-sky-400 animate-spin" />
            </div>
            <span className="text-zinc-300 text-xs font-medium">Orchestrating request...</span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/80 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Message assistant or type 'YES SEND'..."
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500/40 transition-all min-h-[40px]"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          title="Send message"
          className="min-h-[40px] min-w-[40px] px-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-30 disabled:hover:bg-sky-600 text-white rounded-lg transition-all flex items-center justify-center shadow-md shadow-sky-600/20 active:scale-95 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
