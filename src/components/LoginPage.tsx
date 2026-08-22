'use client';

import React, { useState } from 'react';
import { User } from '../types';
import { loginUserAction, registerUserAction } from '../actions/authActions';
import {
  LockClosedIcon,
  UserIcon,
  IdentificationIcon,
  ArrowRightOnRectangleIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface LoginPageProps {
  onLoginSuccess: (user: User, rememberMe?: boolean) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);
  const [registerSuccess, setRegisterSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setPendingNotice(null);
    setRegisterSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await loginUserAction({ username, password });
        if (res.success && res.user) {
          onLoginSuccess(res.user, rememberMe);
        } else if (res.isPending) {
          setPendingNotice(res.error || 'هەژمارەکەت چاوەڕوانی پەسەندکردنی بەڕێوەبەر (ئادمین) دەکات.');
        } else {
          setError(res.error || 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە');
        }
      } else {
        const res = await registerUserAction({ username, fullName, password });
        if (res.success && res.user) {
          if (res.isFirstAdmin) {
            setRegisterSuccess('پیرۆزە! هەژمارەکەت وەک یەکەم بەڕێوەبەری سەرەکی (Admin) تۆمارکرا و چالاکە.');
            setTimeout(() => onLoginSuccess(res.user!, rememberMe), 1000);
          } else {
            setPendingNotice('هەژمارەکەت بە سەرکەوتوویی دروستکرا! تکایە چاوەڕوانی بەڕێوەبەر بە تاوەکو هەژمارەکەت پەسەند و چالاک دەکات.');
            setMode('login');
            setPassword('');
          }
        } else {
          setError(res.error || 'هەڵەیەک لە تۆمارکردن ڕوویدا');
        }
      }
    } catch (err: any) {
      setError(err.message || 'پەیوەندی بە سێرڤەرەوە سەرکەوتوو نەبوو');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans select-none" dir="rtl">
      {/* Background ambient lighting effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-fade-in">
        {/* App Logo & Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-2 mb-3 shadow-lg shadow-emerald-950/40">
            <img
              src="/drone_battery_app_icon.png"
              alt="Logo"
              className="w-full h-full object-contain drop-shadow-md"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            سیستەمی بەڕێوەبردنی ستۆرج
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {mode === 'login' ? 'تکایە بچۆ ژوورەوە بۆ دەستپێگەیشتن بە سیستەمی کۆگا' : 'هەژمارێکی نوێ دروستبکە بۆ سیستەم'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-950/70 p-1 rounded-2xl border border-slate-800/80 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setPendingNotice(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'login'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            چوونەژوورەوە
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
              setPendingNotice(null);
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              mode === 'register'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlusIcon className="w-4 h-4" />
            تۆمارکردنی نوێ
          </button>
        </div>

        {/* Alerts & Notifications */}
        {error && (
          <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-slide-up">
            <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {pendingNotice && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-slide-up">
            <ClockIcon className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-black text-amber-200">چاوەڕوانی پەسەندکردن</p>
              <p className="font-normal text-[11px] leading-relaxed">{pendingNotice}</p>
            </div>
          </div>
        )}

        {registerSuccess && (
          <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-slide-up">
            <CheckCircleIcon className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
            <span>{registerSuccess}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                ناوی تەواو
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="بۆ نموونە: ئەحمەد محەمەد"
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all pl-10"
                />
                <IdentificationIcon className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              ناوی بەکارهێنەر (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ناوی بەکارهێنەر بە ئینگلیزی..."
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all pl-10 text-left dir-ltr"
                dir="ltr"
              />
              <UserIcon className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              وشەی نهێنی (Password)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all pl-10 text-left dir-ltr"
                dir="ltr"
              />
              <LockClosedIcon className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Remember Me Option */}
          {mode === 'login' && (
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800 focus:ring-0 cursor-pointer accent-emerald-500"
                />
                <span className="text-xs text-slate-300 font-medium">لەبیرم بهێڵەوە (Remember Me)</span>
              </label>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 py-3.5 rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <>
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                چوونەژوورەوە
              </>
            ) : (
              <>
                <UserPlusIcon className="w-4 h-4" />
                تۆمارکردن
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
            <span>پارێزراوە بە سێرڤەر ئەکشن و هاشکردنی پێشکەوتووی bcrypt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
