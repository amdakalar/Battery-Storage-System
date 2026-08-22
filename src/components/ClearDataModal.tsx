/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldExclamationIcon, ExclamationTriangleIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ClearDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: (reason: string) => void;
  batteryCount: number;
}

export const ClearDataModal: React.FC<ClearDataModalProps> = ({
  isOpen,
  onClose,
  onConfirmClear,
  batteryCount,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [reason, setReason] = useState('پاککردنەوەی گشتی داتاکانی سیستەم');

  if (!isOpen) return null;

  const isConfirmed = confirmText.trim() === 'سڕینەوە';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;
    onConfirmClear(reason.trim() || 'سڕینەوەی دەستی');
    setConfirmText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200 dir-rtl">
      <div className="bg-white dark:bg-[#15181E] rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-rose-200/90 dark:border-rose-900/40 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-rose-100 dark:border-rose-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800/40">
              <ShieldExclamationIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-rose-900 dark:text-rose-300">سڕینەوەی تەواوی داتاکانی سیستەم</h3>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">ئاگاداربە: ئەم کردارە داتاکانی سەرەکی دەسڕێتەوە</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-[#191D24] transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Content */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          
          <div className="bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/40 rounded-2xl p-3.5 sm:p-4 text-rose-900 dark:text-rose-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-rose-800 dark:text-rose-300">
              <ExclamationTriangleIcon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>ئەم زانیارییانەی خوارەوە بە تەواوەتی دەسڕدرێنەوە:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] font-medium text-rose-800 dark:text-rose-400 pr-2 leading-relaxed">
              <li>سەرجەم <strong>{batteryCount} باتری</strong> تۆمارکراوەکان لەگەڵ داتای سێڵەکان.</li>
              <li>سەرجەم مێژووی خولەکانی ستۆرجکردن و بەروارە ڕابردووەکان.</li>
              <li>هەڵگرتنی تۆماری فەرمی لە لۆگی سڕینەوەی Turso بۆ ئەگەری گەڕاندنەوە.</li>
            </ul>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              هۆکاری سڕینەوە (بۆ تۆمارکردن لە لۆگدا)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="نموونە: سەرلەنوێ ڕێکخستنەوەی سیستەم"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#191D24] border border-slate-200 dark:border-[#262B35] rounded-xl text-xs text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-[#15181E] focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
            />
          </div>

          {/* Type Confirmation */}
          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              بۆ پشڕاستکردنەوە، وشەی <span className="text-rose-600 dark:text-rose-400 font-extrabold select-all">سڕینەوە</span> بنووسە:
            </label>
            <input
              type="text"
              required
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="وشەی سڕینەوە بنووسە..."
              className="w-full px-3.5 py-2.5 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-900 dark:text-rose-300 font-bold focus:bg-white dark:focus:bg-[#15181E] focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all text-center"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-slate-100 dark:border-[#222730]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#262B35] hover:bg-slate-100 dark:hover:bg-[#191D24] text-slate-600 dark:text-slate-300 font-bold transition-all text-xs cursor-pointer order-2 sm:order-1"
            >
              پەشیمانبوونەوە
            </button>
            <button
              type="submit"
              disabled={!isConfirmed}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs order-1 sm:order-2 ${
                isConfirmed
                  ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white cursor-pointer active:scale-[0.98]'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              <TrashIcon className="w-4 h-4" />
              <span>پشڕاستکردنەوە و سڕینەوەی گشتی</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
