'use client';

import React, { useState, useEffect } from 'react';
import {
  CloudIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  KeyIcon,
  ServerIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  getCloudTursoConfig,
  saveCloudTursoConfig,
  testTursoConnection,
} from '../lib/turso';
import { getBatteriesAction } from '../actions/batteryActions';
import { Battery } from '../types';
import { saveBatteries } from '../utils/storage';

interface CloudDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncSuccess: (batteries: Battery[]) => void;
  showAlert: (config: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) => void;
}

export function CloudDatabaseModal({
  isOpen,
  onClose,
  onSyncSuccess,
  showAlert,
}: CloudDatabaseModalProps) {
  const [dbUrl, setDbUrl] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getCloudTursoConfig();
      setDbUrl(config.url);
      setAuthToken(config.authToken);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    if (!dbUrl.trim()) {
      setTestResult({
        success: false,
        error: 'تکایە ناونیشانی داتابەیسی کلاود بنووسە (وەک: libsql://your-db.turso.io)',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await testTursoConnection(dbUrl.trim(), authToken.trim());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        error: err.message || 'هەڵەیەک لە تاقیکردنەوەی پەیوەندی ڕوویدا',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAndSync = async () => {
    if (dbUrl.trim() && !dbUrl.trim().startsWith('libsql://') && !dbUrl.trim().startsWith('https://')) {
      showAlert({
        type: 'error',
        title: 'فۆرماتی ناونیشان هەڵەیە',
        message: 'ناونیشانی داتابەیس دەبێت بە libsql:// یان https:// دەستپێبکات.',
      });
      return;
    }

    setSaving(true);
    try {
      saveCloudTursoConfig(dbUrl.trim(), authToken.trim());

      // If configured, fetch live batteries from cloud
      if (dbUrl.trim()) {
        const cloudBatteries = await getBatteriesAction();
        if (Array.isArray(cloudBatteries)) {
          saveBatteries(cloudBatteries);
          onSyncSuccess(cloudBatteries);
        }
      }

      showAlert({
        type: 'success',
        title: 'بەستنەوەی سەرکەوتوو',
        message: dbUrl.trim()
          ? 'داتابەیسی کلاودی Turso بە سەرکەوتوویی بەسترا و داتاکان هاوکاتکران.'
          : 'پەیوەندی کلاود بە سەرکەوتوویی ناچالاک کرا و سیستەم لەسەر داتابەیسی ناوخۆیی کاردەکات.',
      });

      onClose();
    } catch (err: any) {
      showAlert({
        type: 'error',
        title: 'هەڵە لە هاوکاتکردن',
        message: err.message || 'نەتوانرا داتاکان لە کلاود بهێنرێن',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClearConfig = () => {
    setDbUrl('');
    setAuthToken('');
    setTestResult(null);
    saveCloudTursoConfig('', '');
    showAlert({
      type: 'info',
      title: 'پاککردنەوەی ڕێکخستنەکان',
      message: 'زانیارییەکانی داتابەیسی کلاود پاککرانەوە. سیستەم لەسەر شێوازی لۆکاڵ کاردەکات.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 dir-rtl">
      <div className="bg-white dark:bg-[#15181E] border border-slate-200 dark:border-[#222730] rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-[#191D24] dark:via-[#15181E] dark:to-[#191D24] text-white flex items-center justify-between border-b border-slate-700/50 dark:border-[#222730]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 dark:bg-emerald-500/10 border border-white/15 dark:border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <CloudIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white tracking-wide">بەستنەوە بە داتابەیسی کلاود</h3>
              <p className="text-[11px] text-slate-300 dark:text-slate-400 mt-0.5 font-medium">Turso Cloud Database Connection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Explanation Alert */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#191D24] border border-slate-200 dark:border-[#222730] rounded-2xl text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ServerIcon className="w-4 h-4 text-emerald-500" />
              <span>هاوکاتکردنی داتاکان لەگەڵ وێب و کلاود</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              ناونیشانی داتابەیس و تۆکنی Turso لێرە دابنێ بۆ ئەوەی دیسکتۆپ ئەپەکە ڕاستەوخۆ هەموو داتاکان لە کلاود بخوێنێتەوە و هاوکاتیان بکات.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>ناونیشانی داتابەیسی کلاود (Database URL)</span>
                <span className="text-[10px] text-slate-400 font-mono">libsql://...</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  dir="ltr"
                  value={dbUrl}
                  onChange={(e) => {
                    setDbUrl(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="libsql://your-database-name.turso.io"
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-[#191D24] border border-slate-300 dark:border-[#262B35] rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-[#15181E] transition-all"
                />
                <ServerIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>تۆکنی داتابەیس (Turso Auth Token)</span>
                <span className="text-[10px] text-slate-400 font-mono">Token</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  dir="ltr"
                  value={authToken}
                  onChange={(e) => {
                    setAuthToken(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-[#191D24] border border-slate-300 dark:border-[#262B35] rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-[#15181E] transition-all"
                />
                <KeyIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Test Connection Status Banner */}
          {testResult && (
            <div
              className={`p-3.5 rounded-2xl text-xs font-bold flex items-start gap-2.5 animate-in fade-in duration-200 ${
                testResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              {testResult.success ? (
                <CheckCircleIcon className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              )}
              <div className="min-w-0">
                <div className="font-extrabold">
                  {testResult.success ? 'پەیوەندی سەرکەوتووانە بەسترا!' : 'هەڵە لە پەیوەستبوون'}
                </div>
                <div className="text-[11px] font-medium mt-0.5 opacity-90">
                  {testResult.success
                    ? `کۆی ${testResult.count} باتری لەسەر داتابەیسی کلاودی Turso دۆزرایەوە.`
                    : testResult.error}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-[#191D24] border-t border-slate-200 dark:border-[#222730] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleClearConfig}
            className="px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
            title="پاککردنەوەی ڕێکخستنەکان"
          >
            <TrashIcon className="w-3.5 h-3.5" />
            <span>سڕینەوەی ڕێکخستن</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={testing || saving}
              onClick={handleTestConnection}
              className="px-4 py-2.5 bg-white dark:bg-[#15181E] border border-slate-300 dark:border-[#262B35] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#191D24] text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ArrowPathIcon className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'پشکنین...' : 'تاقیکردنەوە'}</span>
            </button>

            <button
              type="button"
              disabled={testing || saving}
              onClick={handleSaveAndSync}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheckIcon className="w-4 h-4" />
              <span>{saving ? 'پاشەکەوتکردن...' : 'پاشەکەوت و هاوکاتکردن'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
