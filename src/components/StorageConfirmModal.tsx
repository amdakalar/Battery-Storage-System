/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BoltIcon, XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { Battery } from '../types';
import { DRONE_CATEGORIES, getNormalizedCategory } from '../constants/categories';

interface StorageConfirmModalProps {
  isOpen: boolean;
  battery: Battery | null;
  onClose: () => void;
  onConfirm: (batteryId: string) => void;
}

export const StorageConfirmModal: React.FC<StorageConfirmModalProps> = ({
  isOpen,
  battery,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !battery) return;
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, battery, onClose]);

  if (!isOpen || !battery) return null;

  const catId = getNormalizedCategory(battery.category);
  const catObj = DRONE_CATEGORIES.find((c) => c.id === catId);
  const badgeColor = catObj?.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200';

  const handleConfirmClick = () => {
    onConfirm(battery.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 dir-rtl">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 relative space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          title="داخستن"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Modal Header Icon & Content */}
        <div className="text-center pt-1">
          <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            <BoltIcon className="w-6 h-6 text-emerald-400" />
          </div>

          <h3 className="text-base font-extrabold text-slate-900 leading-tight">
            دڵنیابوونەوە لە ئەنجامدانی ستۆرج
          </h3>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
            تکایە پێش تۆمارکردنی ستۆرجکردن، دڵنیابەرەوە لە هەڵبژاردنەکەت
          </p>
        </div>

        {/* Battery Info Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-right space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-500">ناوی باتری:</span>
            <span className="font-black text-slate-900 text-sm">{battery.name}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-500">بەشی پاتری:</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${badgeColor}`}>
              {catObj?.name || catId}
            </span>
          </div>

          {battery.storagePercentage !== undefined && (
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
              <span className="font-bold text-slate-500">ڕێژەی سەدی ستۆرج:</span>
              <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300 font-mono">
                %{battery.storagePercentage}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
            <span className="font-bold text-slate-500">دوایین ستۆرج:</span>
            <span className="font-mono font-bold text-slate-700">{battery.lastChargeDate}</span>
          </div>
        </div>

        {/* Confirmation Question */}
        <div className="text-center py-1">
          <p className="text-sm font-extrabold text-slate-900">
            ئایا دڵنیایت لە ئەنجامدانی ستۆرج بۆ ئەم باترییە؟
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            * دوای پەسەندکردن، ڕێکەوتی ستۆرجی ئەم باترییە نوێ دەبێتەوە بۆ ئەمڕۆ.
          </p>
        </div>

        {/* Action Buttons: Yes / No */}
        <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <XMarkIcon className="w-4 h-4 text-slate-500" />
            <span>نەخێر</span>
          </button>

          <button
            type="button"
            onClick={handleConfirmClick}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-1.5"
            autoFocus
          >
            <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
            <span>بەڵێ، ستۆرج کرا</span>
          </button>
        </div>

      </div>
    </div>
  );
};
