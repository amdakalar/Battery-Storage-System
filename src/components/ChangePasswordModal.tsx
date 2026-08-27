'use client';

import React, { useState } from 'react';
import { User } from '../types';
import { changeUserPasswordAction } from '../actions/authActions';
import {
  XMarkIcon,
  KeyIcon,
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
}

export function ChangePasswordModal({
  isOpen,
  onClose,
  currentUser,
}: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!currentPassword) {
      setError('تکایە وشەی نهێنی ئێستات بنووسە');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('وشەی نهێنی نوێ و دووبارەکردنەوەکەی وەک یەک نین');
      return;
    }

    if (newPassword.length < 6) {
      setError('وشەی نهێنی دەبێت کەمترین ٦ پیت یان ژمارە بێت');
      return;
    }

    setLoading(true);

    try {
      const res = await changeUserPasswordAction({
        userId: currentUser.id,
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      if (res.success) {
        setSuccess(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(res.error || 'نەتوانرا وشەی نهێنی بگۆڕدرێت');
      }
    } catch (err: any) {
      setError(err.message || 'پەیوەندی سەرکەوتوو نەبوو');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans select-none" dir="rtl">
      <div className="bg-white border border-slate-200/90 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <KeyIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">
                گۆڕینی وشەی نهێنی
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                هەژماری: {currentUser.fullName} (@{currentUser.username})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Feedback message */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-2xl text-xs font-bold flex items-start gap-2 animate-slide-up">
              <ExclamationTriangleIcon className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-2xl text-xs font-bold flex items-center gap-2 animate-slide-up">
              <CheckCircleIcon className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>وشەی نهێنی بە سەرکەوتوویی گۆڕدرا!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              وشەی نهێنی ئێستا (Current Password)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="وشەی نهێنی ئێستات بنووسە..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all pl-9 text-left dir-ltr"
                dir="ltr"
              />
              <LockClosedIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              وشەی نهێنی نوێ (New Password)
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="وشەی نهێنی نوێ..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all pl-9 text-left dir-ltr"
                dir="ltr"
              />
              <KeyIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              دووبارەکردنەوەی وشەی نهێنی نوێ
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="دووبارە بنووسەوە..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white transition-all pl-9 text-left dir-ltr"
                dir="ltr"
              />
              <LockClosedIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              پاشگەزبوونەوە
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>تۆمارکردنی گۆڕانکاری</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
