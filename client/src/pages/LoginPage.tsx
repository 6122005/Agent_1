import React from 'react';
import { CheckCircle2, Lock, AlertCircle, Sparkles, Layers } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const handleGoogleSignIn = () => {
    const baseUrl = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
    window.location.href = `${baseUrl}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 mb-2 shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Assistant OS</h1>
          <p className="text-xs text-slate-400 font-medium">Enterprise AI Executive Assistant</p>
        </div>

        {/* Main Sign-In Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-1.5">
            <h2 className="text-lg font-semibold text-white">Sign in to your workspace</h2>
            <p className="text-xs text-slate-400">
              Orchestrate emails, schedule meetings, manage tasks, and draft messages with strict human approvals.
            </p>
          </div>

          {/* Testing Mode Banner */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block text-amber-200">Testing Mode Active</span>
              <p className="text-[11px] text-amber-300/90 leading-relaxed">
                Only Google accounts pre-approved in Google Cloud Console's Test Users list can sign in during this phase. Contact the administrator to authorize your email.
              </p>
            </div>
          </div>

          {/* Sign In with Google Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full min-h-[48px] px-4 py-3 bg-white hover:bg-slate-100 text-slate-900 font-semibold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-3 active:scale-[0.99]"
          >
            {/* Google SVG Logo */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          {/* Privacy and Security Notice */}
          <div className="pt-4 border-t border-slate-800/80 space-y-2.5">
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>AES-256-GCM encrypted OAuth token vault at rest</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Strict human approval required before sending any email</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Isolated multi-tenant per-user data boundaries</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-500">
          Executive Real Estate AI Platform • v1.0.0
        </p>
      </div>
    </div>
  );
};
