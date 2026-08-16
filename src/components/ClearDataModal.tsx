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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-rose-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldExclamationIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-900">سڕینەوەی تەواوی داتاکانی سیستەم</h3>
              <p className="text-[11px] text-rose-600 font-semibold">ئاگاداربە: ئەم کردارە ناگەڕێتەوە!</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Warning Content */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          
          <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3.5 text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-xs text-rose-800">
              <ExclamationTriangleIcon className="w-4 h-4 text-rose-600 shrink-0" />
              <span>ئەم زانیارییانەی خوارەوە بە تەواوەتی دەسڕدرێنەوە:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] font-medium text-rose-800 pr-2">
              <li>سەرجەم <strong>{batteryCount} باتری</strong> تۆمارکراوەکان لەگەڵ داتای سێڵەکان.</li>
              <li>سەرجەم مێژووی خولەکانی ستۆرجکردن و بەروارە ڕابردووەکان.</li>
              <li>هەڵگرتنی تۆماری فەرمی سڕینەوە لە بەشی لۆگەکندا.</li>
            </ul>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              هۆکاری سڕینەوە (بۆ تۆمارکردن لە لۆگدا)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="نموونە: سەرلەنوێ ڕێکخستنەوەی سیستەم"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
          </div>

          {/* Type Confirmation */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              بۆ پشتراباستنەوە، وشەی <span className="text-rose-600 font-extrabold select-all">سڕینەوە</span> بنووسە:
            </label>
            <input
              type="text"
              required
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="وشەی سڕینەوە بنووسە..."
              className="w-full px-3 py-2.5 bg-rose-50/50 border border-rose-200 rounded-xl text-xs text-rose-900 font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all text-center"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold transition-all text-xs"
            >
              پەشیمانبوونەوە
            </button>
            <button
              type="submit"
              disabled={!isConfirmed}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
                isConfirmed
                  ? 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
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
