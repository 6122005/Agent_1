import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import {
  Globe,
  Clock,
  Send,
  MessageSquare,
  User,
  LogOut,
  ShieldCheck,
  Key,
  ExternalLink,
  Unlink,
  Copy,
  AlertCircle,
  Save,
  CheckCircle2
} from 'lucide-react';
import { AuthUser } from '../components/Navbar.js';

interface SettingsPageProps {
  googleConnected: boolean;
  user?: AuthUser | null;
  onRefresh: () => void;
  onLogout?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  googleConnected,
  user,
  onRefresh,
  onLogout,
}) => {
  const [timezone, setTimezone] = useState('Asia/Amman');
  const [morningTime, setMorningTime] = useState('08:00');
  const [eveningTime, setEveningTime] = useState('19:00');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Telegram deep-link connection state
  const [telegramLink, setTelegramLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data) {
        setTimezone(res.data.timezone || 'Asia/Amman');
        setMorningTime(res.data.morningSummaryTime || '08:00');
        setEveningTime(res.data.eveningSummaryTime || '19:00');
        setTelegramChatId(res.data.telegramChatId || '');
        setWhatsappPhone(res.data.whatsappRecipientPhone || '');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/settings', {
        timezone,
        morningSummaryTime: morningTime,
        eveningSummaryTime: eveningTime,
        telegramChatId,
        whatsappRecipientPhone: whatsappPhone,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateTelegramLink = async () => {
    setGeneratingLink(true);
    try {
      const res = await api.post('/settings/telegram-link');
      if (res.data?.link) {
        setTelegramLink(res.data.link);
      }
    } catch (err: any) {
      alert(`Failed to generate Telegram link: ${err.message}`);
    } finally {
      setGeneratingLink(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    if (!confirm('Are you sure you want to disconnect your Telegram account from this workspace?')) return;
    try {
      await api.post('/settings/telegram-disconnect');
      setTelegramChatId('');
      setTelegramLink(null);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to disconnect Telegram: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const timezones = [
    'Asia/Amman',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Europe/London',
    'America/New_York',
    'America/Los_Los_Angeles',
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Page Header */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-1">
          CONFIGURATION & SECURITY PREFERENCES
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          System Settings
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Manage Google Workspace connections, Telegram channel linking, account security, and automated schedules.
        </p>
      </div>

      {/* 1. User Account Profile Card */}
      {user && (
        <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/95 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-white/[0.06]">
            EXECUTIVE PROFILE & SECURITY VAULT
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-13 h-13 rounded-xl object-cover border border-white/20 shadow-lg shrink-0"
                />
              ) : (
                <div className="w-13 h-13 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-lg shrink-0 border border-white/10">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-bold text-white tracking-tight">{user.name}</h3>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider bg-sky-500/10 text-sky-300 border border-sky-500/20">
                    {user.role || 'Member'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{user.email}</p>
                <div className="flex items-center gap-3 text-[11px] text-zinc-400 mt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-950 border border-white/[0.06]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Multi-Tenant Isolated</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-950 border border-white/[0.06]">
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    <span>httpOnly Session Active</span>
                  </span>
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 min-h-[44px] bg-zinc-950 hover:bg-rose-500/10 text-zinc-300 hover:text-rose-400 border border-white/10 hover:border-rose-500/30 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all duration-150 self-start sm:self-center shadow-sm"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 2. Google Workspace Connection Card */}
      <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/95 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400/90 pb-2 border-b border-white/[0.06]">
          GOOGLE WORKSPACE SERVICES
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-lg shadow-amber-500/20 border border-white/10">
              G
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Gmail, Calendar & Tasks Integration
              </h3>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                OAuth2 offline refresh tokens are encrypted at rest via AES-256-GCM. Scoped strictly per user identity with automatic token renewal.
              </p>
              <div className="pt-1.5 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${
                    googleConnected
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        googleConnected ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        googleConnected ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    />
                  </span>
                  {googleConnected ? 'Connected & Synced' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          <a
            href="/api/auth/google"
            className="px-4 py-2.5 min-h-[44px] bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-center flex items-center justify-center gap-2 flex-shrink-0 active:scale-95"
          >
            <span>{googleConnected ? 'Reconnect Google Account' : 'Connect Google Account'}</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-700" />
          </a>
        </div>
      </div>

      {/* 3. Telegram Integration Card */}
      <div className="bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/95 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400 pb-2 border-b border-white/[0.06]">
          TELEGRAM SECURE MESSAGING INTEGRATION
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/10">
              <Send className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Executive Telegram Bot
              </h3>
              <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
                Telegram links securely to this workspace through an authenticated one-time deep link. The bot executes tasks, sends briefings, and processes quick approvals.
              </p>
              <div className="pt-1.5 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full ${
                    telegramChatId
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                      : 'bg-zinc-800/80 text-zinc-400 border border-white/10'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      telegramChatId ? 'bg-emerald-400' : 'bg-zinc-500'
                    }`}
                  />
                  {telegramChatId ? `Connected (Chat ID: ${telegramChatId})` : 'Not Linked'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center flex-shrink-0">
            {telegramChatId ? (
              /* Destructive Action: Disconnect with distinct muted red/outline styling */
              <button
                onClick={handleDisconnectTelegram}
                className="px-4 py-2.5 min-h-[44px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 hover:text-rose-200 border border-rose-500/30 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all duration-150 active:scale-95"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Disconnect Channel</span>
              </button>
            ) : (
              <button
                onClick={handleGenerateTelegramLink}
                disabled={generatingLink}
                className="px-4 py-2.5 min-h-[44px] bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{generatingLink ? 'Generating Link...' : 'Connect Telegram'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Telegram One-Time Deep Link Display */}
        {telegramLink && !telegramChatId && (
          <div className="p-4 rounded-xl bg-zinc-950/90 border border-sky-500/30 space-y-3 shadow-inner">
            <div className="flex items-start gap-2.5 text-xs text-sky-300">
              <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                Open the link below in Telegram to link your account. The bot will automatically authenticate and bind to this workspace. Valid for 10 minutes.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={telegramLink}
                className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-zinc-300 select-all font-mono focus:outline-none"
              />
              <button
                onClick={() => copyToClipboard(telegramLink)}
                className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors min-h-[38px]"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{linkCopied ? 'Copied!' : 'Copy'}</span>
              </button>
              <a
                href={telegramLink}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all min-h-[38px]"
              >
                <span>Open in Telegram</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* 4. Automated Summaries & Schedule Form */}
      <form
        onSubmit={handleSave}
        className="bg-gradient-to-b from-zinc-900/90 via-zinc-900/80 to-zinc-950/95 border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-xl shadow-black/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)] space-y-5"
      >
        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/90 pb-2 border-b border-white/[0.06]">
          EXECUTIVE AUTOMATION & CADENCE
        </div>

        <div>
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
            Automated Summaries & Timezone
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure delivery times for morning briefings and end-of-day executive agendas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-zinc-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              <span>Scheduler Timezone</span>
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-zinc-950/80 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500/50 shadow-inner"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-zinc-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span>Morning Summary Time</span>
            </label>
            <input
              type="time"
              value={morningTime}
              onChange={(e) => setMorningTime(e.target.value)}
              className="w-full bg-zinc-950/80 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500/50 shadow-inner"
            />
          </div>

          <div>
            <label className="text-zinc-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Evening Summary Time</span>
            </label>
            <input
              type="time"
              value={eveningTime}
              onChange={(e) => setEveningTime(e.target.value)}
              className="w-full bg-zinc-950/80 border border-white/10 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500/50 shadow-inner"
            />
          </div>

          <div>
            <label className="text-zinc-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              <span>WhatsApp Recipient Phone</span>
            </label>
            <input
              type="text"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="e.g. +962791234567"
              className="w-full bg-zinc-950/80 border border-white/10 rounded-xl p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500/50 shadow-inner"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-white/[0.06]">
          {saved ? (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Preferences saved successfully!</span>
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 min-h-[44px] bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs rounded-xl shadow-md shadow-sky-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
