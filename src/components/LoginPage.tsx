'use client';

import React, { useState } from 'react';
import { User } from '../types';
import { loginUserAction } from '../actions/authActions';
import {
  LockClosedIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface LoginPageProps {
  onLoginSuccess: (user: User, rememberMe?: boolean) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await loginUserAction({ username, password });
      if (res.success && res.user) {
        onLoginSuccess(res.user, rememberMe);
      } else {
        setError(res.error || 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە');
      }
    } catch (err: any) {
      setError(err.message || 'پەیوەندی بە سێرڤەرەوە سەرکەوتوو نەبوو');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 flex items-center justify-center p-4 sm:p-6 font-sans select-none" dir="rtl">
      <div className="w-full max-w-md bg-white border border-slate-200/90 rounded-3xl p-8 sm:p-10 shadow-xl shadow-slate-200/50 relative animate-fade-in">
        
        {/* App Logo & Official Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 text-white rounded-2xl p-3 mb-4 shadow-md shadow-slate-900/10">
            <img
              src="/drone_battery_app_icon.png"
              alt="Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            سیستەمی بەڕێوەبردنی ستۆرج
          </h1>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            چوونەژوورەوەی فەرمی کارمەندان و بەڕێوەبەران
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-slide-up">
            <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              ناوی بەکارهێنەر (Username)
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ناوی بەکارهێنەر بنووسە..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all pl-10 text-left dir-ltr"
                dir="ltr"
              />
              <UserIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              وشەی نهێنی (Password)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white focus:ring-1 focus:ring-slate-900 transition-all pl-10 text-left dir-ltr"
                dir="ltr"
              />
              <LockClosedIcon className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Remember Me Option */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-slate-900 bg-slate-100 border-slate-300 focus:ring-0 cursor-pointer accent-slate-900"
              />
              <span className="text-xs text-slate-600 font-bold">لەبیرم بهێڵەوە (Remember Me)</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-3 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl text-xs font-black transition-all shadow-md shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
                <span>چوونەژوورەوە</span>
              </>
            )}
          </button>
        </form>

        {/* Security and Admin Notice */}
        <div className="mt-8 pt-6 border-t border-slate-100 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500">
            <ShieldCheckIcon className="w-4 h-4 text-emerald-600" />
            <span>دەستپێگەیشتنی پارێزراو بە دەسەڵاتەکانی بەڕێوەبەر</span>
          </div>
          <p className="text-[10.5px] text-slate-400 font-medium">
            تێبینی: هەژماری نوێ تەنها لەلایەن بەڕێوەبەری سەرەکی (ئادمین)ەوە زیاد دەکرێت.
          </p>
        </div>

      </div>
    </div>
  );
}
