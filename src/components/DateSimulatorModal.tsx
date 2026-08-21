/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { XMarkIcon, AdjustmentsHorizontalIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
import { getTodayISODate, toISODateString, formatGregorianKurdish } from '../utils/dateUtils';

interface DateSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSimulatedDate?: string;
  onApplySimulatedDate: (simulatedDate: string | undefined) => void;
  lastChargeDateOfActiveBattery?: string;
}

export const DateSimulatorModal: React.FC<DateSimulatorModalProps> = ({
  isOpen,
  onClose,
  currentSimulatedDate,
  onApplySimulatedDate,
  lastChargeDateOfActiveBattery,
}) => {
  const today = getTodayISODate();
  const [selectedSimDate, setSelectedSimDate] = useState(currentSimulatedDate || today);

  if (!isOpen) return null;

  // Helper to get date N days after last charge
  const getDateDaysAfterLastCharge = (days: number): string => {
    if (!lastChargeDateOfActiveBattery) return today;
    const d = new Date(lastChargeDateOfActiveBattery);
    d.setDate(d.getDate() + days);
    return toISODateString(d);
  };

  const presets = [
    {
      label: 'ئەمڕۆ (ڕۆژی ڕاستەقینە)',
      date: today,
      desc: 'سیستەمی ڕاستەقینە',
    },
    {
      label: '١٥ ڕۆژ دوای ستۆرجکردن',
      date: getDateDaysAfterLastCharge(15),
      desc: 'لە کاتی خۆیدایە (کاری ئاسایی)',
    },
    {
      label: '٣٩ ڕۆژ دوای ستۆرجکردن',
      date: getDateDaysAfterLastCharge(39),
      desc: 'تەنها ١ ڕۆژ ماوە بۆ ٤٠ ڕۆژەکە',
    },
    {
      label: '٤٠ ڕۆژ دوای ستۆرجکردن (کاتی ستۆرج)',
      date: getDateDaysAfterLastCharge(40),
      desc: 'کاتی ستۆرج هاتووە (ئاگاداری دووگمەی ستۆرج)',
    },
    {
      label: '٤٥ ڕۆژ دوای ستۆرجکردن (دواکەوتوو)',
      date: getDateDaysAfterLastCharge(45),
      desc: 'دواکەوتوو (٥ ڕۆژ لە ٤٠ ڕۆژەکە تێپەڕیوە)',
    },
  ];

  const handleApply = (dateToApply: string | undefined) => {
    onApplySimulatedDate(dateToApply === today ? undefined : dateToApply);
    onClose();
  };

  const handleReset = () => {
    onApplySimulatedDate(undefined);
    setSelectedSimDate(today);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 dir-rtl">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200/80 relative space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AdjustmentsHorizontalIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">ئامرازی تاقیکردنەوەی کات</h3>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">تاقیکردنەوەی بارودۆخەکانی ستۆرجکردن</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            title="داخستن"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Info Box */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600 font-medium leading-relaxed">
          لەم بەشەدا دەتوانیت ڕۆژی کۆمپیوتەرەکەت بە شێوەی دەستکرد بەرەو پێش ببەیت بۆ تاقیکردنەوەی ئەوەی چۆن بیرخەرەوەکە دوای ٤٠ ڕۆژ چالاک دەبێت.
        </div>

        {/* Presets (Minimal Executive Selector) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">هەڵبژاردنی حاڵەتی ئامادەکراو:</label>
          {presets.map((preset, idx) => {
            const isSelected = selectedSimDate === preset.date;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedSimDate(preset.date)}
                className={`w-full text-right p-3 rounded-xl border transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold'
                    : 'bg-slate-50/70 text-slate-800 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300 font-medium'
                }`}
              >
                <div>
                  <div className={`text-xs ${isSelected ? 'font-extrabold text-white' : 'font-bold text-slate-900'}`}>
                    {preset.label}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {preset.desc}
                  </div>
                </div>
                <div className={`text-xs font-mono font-bold dir-ltr px-2 py-0.5 rounded-md ${
                  isSelected ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'bg-white text-slate-700 border border-slate-200'
                }`}>
                  {preset.date}
                </div>
              </button>
            );
          })}
        </div>

        {/* Manual Date Selector */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            یان دیاریکردنی مێژووی سەربەخۆ:
          </label>
          <input
            type="date"
            value={selectedSimDate}
            onChange={(e) => setSelectedSimDate(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-right font-medium dir-ltr"
          />
          <p className="text-[11px] text-slate-500 font-medium">
            مێژووی هەڵبژێردراو: <span className="font-bold text-slate-800">{formatGregorianKurdish(selectedSimDate)}</span>
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 flex items-center justify-between gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all"
          >
            <ArrowPathIcon className="w-4 h-4 text-slate-500" />
            <span>گەڕانەوە بۆ ئەمڕۆ</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all"
            >
              داخستن
            </button>
            <button
              type="button"
              onClick={() => handleApply(selectedSimDate)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
            >
              <CheckIcon className="w-4 h-4" />
              <span>جێبەجێکردن</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
