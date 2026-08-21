/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Battery } from '../types';
import { getTodayISODate, formatGregorianKurdish } from '../utils/dateUtils';

interface CustomDateModalProps {
  battery: Battery | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveCustomChargeDate: (batteryId: string, customDate: string, notes: string) => void;
}

export const CustomDateModal: React.FC<CustomDateModalProps> = ({
  battery,
  isOpen,
  onClose,
  onSaveCustomChargeDate,
}) => {
  const [selectedDate, setSelectedDate] = useState(getTodayISODate());
  const [notes, setNotes] = useState('ستۆرجکردنی تۆمارکراو بە مێژووی دەستکرد');

  useEffect(() => {
    if (battery) {
      setSelectedDate(getTodayISODate());
    }
  }, [battery]);

  if (!isOpen || !battery) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    onSaveCustomChargeDate(battery.id, selectedDate, notes.trim());
    onClose();
  };

  const inputCls = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all placeholder-slate-400';
  const labelCls = 'block text-[11px] font-semibold text-slate-900 mb-1.5 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 dir-rtl">
      <div
        className="bg-white rounded-xl max-w-md w-full shadow-xl border border-slate-200 flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <img
                src="./drone_battery_app_icon.svg"
                alt="App Icon"
                className="w-5 h-5 object-contain"
              />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-slate-800 leading-tight">تۆمارکردن بە مێژووی دیاریکراو</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">{battery.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
            title="داخستن"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* ── Body Form ── */}
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <p className="text-[11.5px] text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed font-medium">
            ئەگەر لە ڕۆژانی ڕابردوودا باترییەکەت ستۆرج کردووە و لە کاتی خۆیدا تۆمارت نەکردووە، لێرەدا دەتوانیت مێژووەکەی دیاری بکەیت.
          </p>

          {/* Date Selector */}
          <div>
            <label className={labelCls}>
              ڕێکەوتی ستۆرجکردن (زایینی) <span className="text-rose-500 normal-case tracking-normal">*</span>
            </label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`${inputCls} text-left font-mono`}
            />
            {selectedDate && (
              <p className="text-[11px] text-slate-500 font-medium mt-1.5">
                کوردی: {formatGregorianKurdish(selectedDate)}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={labelCls}>تێبینی تۆمار</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="تێبینی کورت..."
              className={inputCls}
            />
          </div>

          {/* ── Footer Buttons ── */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-[12px] transition-all"
            >
              پەشیمانبوونەوە
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[12px] flex items-center gap-1.5 shadow-sm transition-all"
            >
              <CheckIcon className="w-3.5 h-3.5" />
              <span>پاشەکەوتکردن</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
