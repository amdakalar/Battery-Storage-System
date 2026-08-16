/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Battery } from '../types';
import { calculateBatteryStats } from '../utils/dateUtils';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface NotificationBannerProps {
  batteries: Battery[];
  onQuickCharge?: (batteryId: string) => void;
  onNavigateToNotifications?: () => void;
  referenceDate?: string;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  batteries,
  referenceDate,
}) => {
  const urgentBatteries = batteries
    .map((bat) => ({
      battery: bat,
      stats: calculateBatteryStats(bat.lastChargeDate, bat.reminderIntervalDays, referenceDate),
    }))
    .filter((item) => item.stats.status === 'EARLY_WARNING' || item.stats.status === 'TIME_TO_CHARGE' || item.stats.status === 'OVERDUE');

  if (urgentBatteries.length === 0) {
    return null;
  }

  const overdueCount = urgentBatteries.filter(i => i.stats.status === 'OVERDUE').length;
  const earlyCount = urgentBatteries.filter(i => i.stats.status === 'EARLY_WARNING').length;
  const dueCount = urgentBatteries.filter(i => i.stats.status === 'TIME_TO_CHARGE').length;

  return (
    <div className="dir-rtl">
      <div className="bg-white border border-slate-200/80 rounded-2xl px-4 py-3 shadow-2xs flex items-center justify-between gap-3">

        {/* Left: Icon + Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
            <ExclamationTriangleIcon className="w-4 h-4 text-rose-600" />
          </div>
          <span className="text-xs font-extrabold text-slate-800">ئاگاداری ستۆرجکردنی فەوری</span>
        </div>

        {/* Right: Stats badges */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {dueCount > 0 && (
            <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg">
              {dueCount} پێویست بە ستۆرج
            </span>
          )}
          {earlyCount > 0 && (
            <span className="text-[11px] font-bold bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-lg">
              {earlyCount} یادەوەری ٥ ڕۆژە
            </span>
          )}
          {overdueCount > 0 && (
            <span className="text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-lg">
              {overdueCount} دواکەوتوو
            </span>
          )}
        </div>

      </div>
    </div>
  );
};
