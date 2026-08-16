/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, CalendarIcon, CheckIcon, BoltIcon } from '@heroicons/react/24/outline';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">تۆمارکردن بە مێژووی دیاریکراو</h3>
              <p className="text-xs text-slate-500">{battery.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          
          <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
            ئەگەر لە ڕۆژانی ڕابردوودا باترییەکەت ستۆرج کردووە و لە کاتی خۆیدا لە سیستەمەکە تۆمارت نەکردووە، لێرەدا دەتوانیت مێژووی دروستی ستۆرجکردنەکە دیاری بکەیت.
          </p>

          {/* Date Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ڕێکەوتی ستۆرجکردن (زایینی)
            </label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900 dir-ltr text-right font-medium"
            />
            {selectedDate && (
              <p className="text-xs text-emerald-700 font-semibold mt-1.5">
                شێوازی کوردی: {formatGregorianKurdish(selectedDate)}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تێبینی تۆمار
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="تێبینی کورت..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-slate-900"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium transition-colors"
            >
              پەشیمانبوونەوە
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <BoltIcon className="w-4 h-4 text-white" />
              <span>پاشەکەوتکردن</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
