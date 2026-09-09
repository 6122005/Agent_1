import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import {
  Globe,
  Clock,
  Check,
  Send,
  MessageSquare,
  User,
  LogOut,
  ShieldCheck,
  Key,
  ExternalLink,
  Unlink,
  Copy,
  AlertCircle
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
    'America/Los_Angeles',
  ];

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">System Settings</h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Configure Google Workspace integrations, account security, notification schedules, and webhook channels.
        </p>
      </div>

      {/* User Account Profile Card */}
      {user && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-700 shadow-md shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-md shrink-0">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">{user.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider bg-sky-500/10 text-sky-400 border border-sky-500/20">
                    {user.role || 'Member'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1.5">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Multi-Tenant Isolated
                  </span>
                  <span className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-indigo-400" /> httpOnly Session
                  </span>
                </div>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="px-4 py-2 min-h-[40px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl font-semibold text-xs flex items-center gap-2 transition-colors self-start sm:self-center"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}

      {/* Google Integration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md">
              G
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Google Services (Gmail, Calendar, Tasks)</h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-lg leading-relaxed">
                OAuth2 offline refresh tokens are encrypted at rest with AES-256-GCM. Scoped per user identity.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    googleConnected
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      googleConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
                    }`}
                  />
                  {googleConnected ? 'Connected & Active' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          <a
            href="/api/auth/google"
            className="px-4 py-2 min-h-[44px] bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-center flex items-center justify-center"
          >
            {googleConnected ? 'Reconnect Google Account' : 'Connect Google Account'}
          </a>
        </div>
      </div>

      {/* Telegram Secure Linking Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center shrink-0">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Telegram Integration</h3>
              <p className="text-xs text-slate-400 mt-0.5 max-w-lg leading-relaxed">
                Telegram currently supports one linked Telegram account per user workspace. Connect via an authenticated one-time link so the bot knows your identity.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    telegramChatId
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      telegramChatId ? 'bg-emerald-400' : 'bg-slate-500'
                    }`}
                  />
                  {telegramChatId ? `Connected (Chat ID: ${telegramChatId})` : 'Not Linked'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {telegramChatId ? (
              <button
                onClick={handleDisconnectTelegram}
                className="px-4 py-2 min-h-[40px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl font-semibold text-xs flex items-center gap-2 transition-colors"
              >
                <Unlink className="w-3.5 h-3.5" />
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleGenerateTelegramLink}
                disabled={generatingLink}
                className="px-4 py-2 min-h-[44px] bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
                {generatingLink ? 'Generating Link...' : 'Connect Telegram'}
              </button>
            )}
          </div>
        </div>

        {/* Telegram One-Time Link Display */}
        {telegramLink && !telegramChatId && (
          <div className="p-4 rounded-xl bg-slate-950 border border-sky-500/30 space-y-3">
            <div className="flex items-start gap-2 text-xs text-sky-300">
              <AlertCircle className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
              <span>
                Open the link below in Telegram. The bot will automatically authenticate and link your Telegram account to this workspace. Valid for 10 minutes.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                readOnly
                value={telegramLink}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 select-all font-mono"
              />
              <button
                onClick={() => copyToClipboard(telegramLink)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {linkCopied ? 'Copied!' : 'Copy'}
              </button>
              <a
                href={telegramLink}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                Open in Telegram <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Preferences Form */}
      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-white mb-2">Automated Summaries & Timezone</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              Scheduler Timezone
            </label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Morning Summary Time (HH:mm)
            </label>
            <input
              type="time"
              value={morningTime}
              onChange={(e) => setMorningTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Evening Summary Time (HH:mm)
            </label>
            <input
              type="time"
              value={eveningTime}
              onChange={(e) => setEveningTime(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
            />
          </div>

          <div>
            <label className="text-slate-300 font-semibold mb-1.5 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
              WhatsApp Recipient Phone
            </label>
            <input
              type="text"
              value={whatsappPhone}
              onChange={(e) => setWhatsappPhone(e.target.value)}
              placeholder="e.g. +962791234567"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between">
          {saved ? (
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Settings saved successfully!
            </span>
          ) : (
            <span />
          )}

          <button
            type="submit"
            className="px-5 py-2.5 min-h-[44px] bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
