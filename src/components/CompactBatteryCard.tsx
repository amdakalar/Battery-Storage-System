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
  CalendarIcon,
  ClockIcon,
  TrashIcon,
  EllipsisVerticalIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PencilSquareIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

interface CompactBatteryCardProps {
  battery: Battery;
  onChargeToday: (batteryId: string) => void;
  onOpenCustomDateModal: (battery: Battery) => void;
  onOpenHistoryModal: (battery: Battery) => void;
  onOpenEditModal?: (battery: Battery) => void;
  onDeleteBattery: (batteryId: string) => void;
  referenceDate?: string;
}

export const CompactBatteryCard: React.FC<CompactBatteryCardProps> = ({
  battery,
  onChargeToday,
  onOpenCustomDateModal,
  onOpenHistoryModal,
  onOpenEditModal,
  onDeleteBattery,
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

  const getStatusConfig = () => {
    switch (stats.status) {
      case 'OVERDUE':
        return {
          dot: 'bg-rose-500',
          text: 'text-rose-600',
          bar: 'bg-rose-400',
          label: 'دواکەوتوو',
          icon: ExclamationTriangleIcon,
        };
      case 'TIME_TO_CHARGE':
        return {
          dot: 'bg-amber-500',
          text: 'text-amber-600',
          bar: 'bg-amber-400',
          label: 'پێویست بە ستۆرج',
          icon: ExclamationTriangleIcon,
        };
      case 'EARLY_WARNING':
        return {
          dot: 'bg-amber-400',
          text: 'text-amber-500',
          bar: 'bg-amber-300',
          label: 'نزیکی کاتەکە',
          icon: ClockIcon,
        };
      default:
        return {
          dot: 'bg-emerald-500',
          text: 'text-emerald-600',
          bar: 'bg-emerald-400',
          label: 'لە کاتی خۆیدا',
          icon: CheckCircleIcon,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const progressPercent = Math.min(100, Math.round((stats.daysElapsed / battery.reminderIntervalDays) * 100));

  return (
    <div className="bg-white rounded-xl p-4 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3 relative dir-rtl">

      {/* ── Header: Name + Menu ── */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3
            className="font-semibold text-slate-900 text-[13px] truncate leading-snug"
            title={battery.name}
          >
            {battery.name}
          </h3>
          <span className="inline-block text-[10px] font-medium text-slate-500 mt-0.5">
            {catObj?.name || catId}
          </span>
        </div>

        {/* Options Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            title="بژاردەکان"
          >
            <EllipsisVerticalIcon className="w-4 h-4" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute left-0 top-7 w-44 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1 text-xs animate-in fade-in duration-150">
                {onOpenEditModal && (
                  <button
                    onClick={() => { setShowMenu(false); onOpenEditModal(battery); }}
                    className="w-full text-right px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>دەستکاری باتری</span>
                  </button>
                )}
                <button
                  onClick={() => { setShowMenu(false); onOpenCustomDateModal(battery); }}
                  className="w-full text-right px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>دیاریکردنی بەرواری تایبەت</span>
                </button>
                <button
                  onClick={() => { setShowMenu(false); onOpenHistoryModal(battery); }}
                  className="w-full text-right px-3 py-2 text-slate-700 hover:bg-slate-50 font-medium flex items-center gap-2"
                >
                  <DocumentTextIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>مێژووی ستۆرج</span>
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => { setShowMenu(false); onDeleteBattery(battery.id); }}
                  className="w-full text-right px-3 py-2 text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-2"
                >
                  <TrashIcon className="w-3.5 h-3.5 text-rose-400" />
                  <span>سڕینەوەی باتری</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Specs Row: Storage % + Voltage ── */}
      {(battery.storagePercentage !== undefined || battery.voltage) && (
        <div className="flex items-center gap-2">
          {battery.storagePercentage !== undefined && (
            <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
              %{battery.storagePercentage}
            </span>
          )}
          {battery.voltage && (
            <span className="text-[11px] font-mono font-medium text-slate-500">
              {battery.voltage}V
            </span>
          )}
        </div>
      )}

      {/* ── Status + Progress ── */}
      <div className="space-y-2">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusConfig.dot}`} />
            <span className={`text-[11px] font-medium ${statusConfig.text}`}>
              {statusConfig.label}
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {stats.daysElapsed} / {battery.reminderIntervalDays} ڕۆژ
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-1 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${statusConfig.bar}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── Footer: Last charge + Action ── */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="text-[10.5px] text-slate-400 font-medium">
          دوایین ستۆرج: <span className="text-slate-600 font-semibold">{battery.lastChargeDate}</span>
        </div>

        <button
          onClick={() => onChargeToday(battery.id)}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[11px] rounded-lg transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          <BoltIcon className="w-3 h-3 text-emerald-400" />
          <span>ستۆرج کرا</span>
        </button>
      </div>

    </div>
  );
};
