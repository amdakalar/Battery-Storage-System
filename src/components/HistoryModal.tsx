/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Battery } from '../types';
import { formatGregorianKurdish } from '../utils/dateUtils';

interface HistoryModalProps {
  battery: Battery | null;
  isOpen: boolean;
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  battery,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !battery) return null;

  const historyList = battery.history || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 dir-rtl">
      <div
        className="bg-white rounded-xl w-full max-w-md shadow-xl border border-slate-200 flex flex-col"
        style={{ maxHeight: 'min(90vh, 560px)' }}
        role="dialog"
        aria-modal="true"
      >
        {/* ── Fixed Header ── */}
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
              <h3 className="text-[14px] font-bold text-slate-800 leading-tight">تۆماری مێژووی ستۆرجکردنەکان</h3>
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

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0 space-y-2.5">
          {historyList.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs font-medium">
              هیچ مێژوویەکی ستۆرجکردنی پێشوو تۆمار نەکراوە.
            </div>
          ) : (
            historyList.map((item, index) => (
              <div
                key={item.id || index}
                className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 hover:bg-slate-100/60 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  <div>
                    <div className="text-[13px] font-bold text-slate-900 font-mono leading-none">
                      {item.chargeDate}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-1">
                      {formatGregorianKurdish(item.chargeDate)}
                    </div>
                    {item.notes && (
                      <p className="text-[11px] text-slate-400 mt-1">{item.notes}</p>
                    )}
                  </div>
                </div>

                {index === 0 && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-800 text-white shrink-0">
                    دوایین ستۆرج
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* ── Fixed Footer ── */}
        <div className="flex items-center justify-end px-5 py-3.5 border-t border-slate-100 bg-white shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[12px] transition-all shadow-sm"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
};
