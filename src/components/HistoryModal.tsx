/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { XMarkIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 relative max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <ClockIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">تۆماری مێژووی ستۆرجکردنەکان</h3>
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

        {/* Content list */}
        <div className="mt-4 overflow-y-auto space-y-3 pr-1 flex-1">
          {historyList.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              هیچ مێژوویەکی ستۆرجکردنی پێشوو تۆمار نەکراوە.
            </div>
          ) : (
            historyList.map((item, index) => (
              <div
                key={item.id || index}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl mt-0.5 shrink-0">
                    <CheckCircleIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dir-ltr text-right">
                      {item.chargeDate}
                    </div>
                    <div className="text-xs text-slate-600 font-medium">
                      {formatGregorianKurdish(item.chargeDate)}
                    </div>
                    {item.notes && (
                      <p className="text-xs text-slate-500 mt-1">{item.notes}</p>
                    )}
                  </div>
                </div>

                {index === 0 && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-600 text-white shrink-0">
                    دوایین ستۆرج
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
          >
            داخستن
          </button>
        </div>

      </div>
    </div>
  );
};
