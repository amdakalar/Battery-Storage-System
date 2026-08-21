/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Battery } from '../types';
import { calculateBatteryStats } from '../utils/dateUtils';
import { DRONE_CATEGORIES, getNormalizedCategory } from '../constants/categories';
import {
  BoltIcon,
  PencilSquareIcon,
  DocumentTextIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface DashboardUrgentCardProps {
  battery: Battery;
  onChargeToday: (batteryId: string) => void;
  onOpenHistoryModal: (battery: Battery) => void;
  onOpenEditModal?: (battery: Battery) => void;
  referenceDate?: string;
}

export const DashboardUrgentCard: React.FC<DashboardUrgentCardProps> = ({
  battery,
  onChargeToday,
  onOpenHistoryModal,
  onOpenEditModal,
  referenceDate,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const stats = calculateBatteryStats(
    battery.lastChargeDate,
    battery.reminderIntervalDays,
    referenceDate
  );

  const catId = getNormalizedCategory(battery.category);
  const catObj = DRONE_CATEGORIES.find((c) => c.id === catId);
  const badgeColor = catObj?.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200';

  const isOverdue = stats.status === 'OVERDUE';

  return (
    <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3 relative dir-rtl">
      
      {/* Top Row: Name, Category Badge & Menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3 className="font-extrabold text-slate-900 text-xs truncate" title={battery.name}>
              {battery.name}
            </h3>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${badgeColor}`}>
              {catId}
            </span>
            {battery.storagePercentage !== undefined && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                %{battery.storagePercentage} ستۆرج
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-bold">
            <ExclamationTriangleIcon className={`w-3.5 h-3.5 shrink-0 ${isOverdue ? 'text-rose-600' : 'text-amber-600'}`} />
            <span className={isOverdue ? 'text-rose-700 font-extrabold' : 'text-amber-800 font-extrabold'}>
              {stats.statusText}
            </span>
            <span className="text-[10px] text-slate-400 font-medium font-mono">
              ({stats.daysElapsed} ڕۆژ)
            </span>
          </div>
        </div>

        {/* Options Menu Toggle */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="بژاردەکان"
          >
            <EllipsisVerticalIcon className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
              <div className="absolute left-0 top-6 w-36 bg-white rounded-xl shadow-lg border border-slate-200 z-20 py-1 text-xs">
                {onOpenEditModal && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onOpenEditModal(battery);
                    }}
                    className="w-full text-right px-3 py-2 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>دەستکاری باتری</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onOpenHistoryModal(battery);
                  }}
                  className="w-full text-right px-3 py-2 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2"
                >
                  <DocumentTextIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>مێژووی ستۆرج</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Row: Minimal Action Button */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="text-[10px] text-slate-400 font-medium">
          <span className="text-slate-500 font-semibold">تێپەڕبوو:</span> {stats.daysElapsed} ڕۆژ
        </div>

        <button
          onClick={() => onChargeToday(battery.id)}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
        >
          <BoltIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>ستۆرج کرا</span>
        </button>
      </div>

    </div>
  );
};
