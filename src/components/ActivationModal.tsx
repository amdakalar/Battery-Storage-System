/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  KeyIcon,
  ShieldExclamationIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  ClockIcon,
  SparklesIcon,
  CheckCircleIcon,
  XMarkIcon,
  ClipboardDocumentIcon,
  CalendarIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { LicenseState, LicenseType } from '../types';
import {
  DEVELOPER_INFO,
  ADMIN_CODE,
  applyActivationCode
} from '../utils/licenseManager';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  licenseState: LicenseState;
  onLicenseUpdated: (newState: LicenseState) => void;
  isForcedLockout?: boolean;
}

export const ActivationModal: React.FC<ActivationModalProps> = ({
  isOpen,
  onClose,
  licenseState,
  onLicenseUpdated,
  isForcedLockout = false,
}) => {
  const [selectedType, setSelectedType] = useState<LicenseType>('LIFETIME');
  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const res = applyActivationCode(code, selectedType);
    if (res.success && res.updatedState) {
      setSuccessMsg(res.message);
      onLicenseUpdated(res.updatedState);
      setCode('');
      if (!isForcedLockout) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } else {
      setErrorMsg(res.message);
    }
  };

  const handleCopyHardwareId = () => {
    navigator.clipboard.writeText(licenseState.hardwareId);
  };

  const getLicenseBadge = () => {
    switch (licenseState.licenseType) {
      case 'LIFETIME':
        return { label: 'مۆڵەتی هەتاهەتایی (Lifetime)', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'CODE_1Y':
        return { label: 'مۆڵەتی ١ ساڵە', bg: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'CODE_6M':
        return { label: 'مۆڵەتی ٦ مانگە', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
      case 'TRIAL_6M':
        return { label: 'ئەزموونی ٦ مانگە', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { label: 'بەسەرچوو', bg: 'bg-rose-50 text-rose-800 border-rose-200' };
    }
  };

  const badge = getLicenseBadge();

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
      isForcedLockout ? 'bg-slate-950/90 backdrop-blur-md' : 'bg-slate-900/60 backdrop-blur-xs'
    } animate-in fade-in duration-200`}>
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 relative overflow-hidden dir-rtl">
        
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
              isForcedLockout ? 'bg-rose-100 text-rose-700' : 'bg-slate-900 text-white'
            }`}>
              {isForcedLockout ? <LockClosedIcon className="w-5 h-5" /> : <KeyIcon className="w-5 h-5 text-emerald-400" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isForcedLockout ? 'سیستەمەکە پێویستی بە ئەکتیڤکردنە' : 'دۆخی مۆڵەت و ئەکتیڤکردن'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isForcedLockout ? 'ماوەی ئەزموونی ٦ مانگەکە تێپەڕیوە' : 'بەکاربردنی کۆدی چالاککردنی سیستەم'}
              </p>
            </div>
          </div>

          {!isForcedLockout && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Status & Hardware Info Card */}
        <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${badge.bg}`}>
              {badge.label}
            </span>

            {licenseState.licenseType === 'LIFETIME' ? (
              <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                <SparklesIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>هەتاهەتایی</span>
              </span>
            ) : (
              <span className={`text-xs font-bold flex items-center gap-1 ${
                licenseState.isExpired ? 'text-rose-600' : 'text-slate-600'
              }`}>
                <ClockIcon className="w-3.5 h-3.5" />
                <span>{licenseState.isExpired ? 'بەسەرچوو' : `${licenseState.daysRemaining} ڕۆژ ماوە`}</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200/60 font-mono text-slate-600">
            <span className="text-[11px] font-sans text-slate-500 font-bold">HWID:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-800 select-all truncate dir-ltr">{licenseState.hardwareId}</span>
              <button
                type="button"
                onClick={handleCopyHardwareId}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded transition-colors"
                title="کۆپیکردنی HWID"
              >
                <ClipboardDocumentIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* 3 License Options Chooser (6 Months, 1 Year, Lifetime) */}
        <div className="mt-4 space-y-2">
          <label className="block text-xs font-bold text-slate-800">
            هەڵبژاردنی جۆری مۆڵەت:
          </label>
          <div className="grid grid-cols-3 gap-2">
            
            {/* 6 Months */}
            <button
              type="button"
              onClick={() => setSelectedType('CODE_6M')}
              className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                selectedType === 'CODE_6M'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <CalendarIcon className={`w-3.5 h-3.5 ${selectedType === 'CODE_6M' ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="text-xs font-bold">شەش مانگ</span>
              <span className="text-[10px] opacity-70">١٨٠ ڕۆژ</span>
            </button>

            {/* 1 Year */}
            <button
              type="button"
              onClick={() => setSelectedType('CODE_1Y')}
              className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                selectedType === 'CODE_1Y'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <BoltIcon className={`w-3.5 h-3.5 ${selectedType === 'CODE_1Y' ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="text-xs font-bold">کۆدی یەک ساڵ</span>
              <span className="text-[10px] opacity-70">٣٦٥ ڕۆژ</span>
            </button>

            {/* Lifetime */}
            <button
              type="button"
              onClick={() => setSelectedType('LIFETIME')}
              className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5 ${
                selectedType === 'LIFETIME'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <ShieldCheckIcon className={`w-3.5 h-3.5 ${selectedType === 'LIFETIME' ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="text-xs font-bold">لایف تایم</span>
              <span className="text-[10px] opacity-70">هەتاهەتایی</span>
            </button>

          </div>
        </div>

        {/* Developer Contact Box with WhatsApp and Tel Link */}
        <div className="mt-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-slate-800 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">گەشەپێدەر:</span>
            <a
              href={DEVELOPER_INFO.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-slate-900 hover:text-emerald-600 underline transition-colors"
            >
              {DEVELOPER_INFO.name}
            </a>
          </div>
          <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-200/60 font-medium">
            <span className="text-slate-500 font-semibold">پەیوەندی / واتساپ:</span>
            <div className="flex items-center gap-2">
              <a
                href={DEVELOPER_INFO.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-bold text-emerald-700 hover:bg-emerald-100 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors dir-ltr flex items-center gap-1"
                title="کردنەوەی واتساپ"
              >
                <span>💬 WhatsApp</span>
              </a>
              <a
                href={DEVELOPER_INFO.telUrl}
                className="font-mono font-bold text-slate-800 hover:bg-slate-200 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200 transition-colors dir-ltr flex items-center gap-1"
                title="تەلەفۆن کردن"
              >
                <span>📞 {DEVELOPER_INFO.phone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Activation Code Form */}
        <form onSubmit={handleActivate} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              کۆدی ئەکتیڤکردن / ئادمین:
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="•••••••"
                className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all font-mono"
              />
              <KeyIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <ShieldExclamationIcon className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircleIcon className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            {!isForcedLockout && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all"
              >
                داخستن
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <ShieldCheckIcon className="w-4 h-4 text-emerald-400" />
              <span>چالاککردن</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
