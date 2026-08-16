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
  VideoCameraIcon,
  SignalIcon,
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
  const badgeColor = catObj?.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200/80';

  const getStatusConfig = () => {
    switch (stats.status) {
      case 'OVERDUE':
        return {
          badgeBg: 'bg-rose-50 border-rose-200/80 text-rose-800',
          text: 'text-rose-700',
          progressBg: 'bg-rose-500',
          icon: ExclamationTriangleIcon,
          label: 'دواکەوتوو',
        };
      case 'TIME_TO_CHARGE':
        return {
          badgeBg: 'bg-amber-50 border-amber-200/80 text-amber-900',
          text: 'text-amber-800',
          progressBg: 'bg-amber-500',
          icon: ExclamationTriangleIcon,
          label: 'پێویست بە ستۆرج',
        };
      case 'EARLY_WARNING':
        return {
          badgeBg: 'bg-amber-50/60 border-amber-200/60 text-amber-800',
          text: 'text-amber-700',
          progressBg: 'bg-amber-400',
          icon: ClockIcon,
          label: 'یادەوەری ٥ ڕۆژە',
        };
      default:
        return {
          badgeBg: 'bg-emerald-50 border-emerald-200/80 text-emerald-800',
          text: 'text-emerald-700',
          progressBg: 'bg-emerald-500',
          icon: CheckCircleIcon,
          label: 'لە کاتی خۆیدا',
        };
    }
  };

  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;

  const progressPercent = Math.min(100, Math.round((stats.daysElapsed / battery.reminderIntervalDays) * 100));

  return (
    <div className="bg-white hover:bg-slate-50/40 rounded-2xl p-4 border border-slate-200/70 hover:border-slate-300/90 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between space-y-3 relative dir-rtl">
      
      {/* Top Header Row: Category Icon, Name & Options Menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
            {catObj?.type === 'CAMERA' ? (
              <VideoCameraIcon className="w-4 h-4 text-indigo-600" />
            ) : (
              <SignalIcon className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-extrabold text-slate-900 text-xs truncate leading-snug" title={battery.name}>
              {battery.name}
            </h3>
            <span className={`inline-block text-[10px] font-bold px-2 py-0.2 rounded-md border mt-0.5 ${badgeColor}`}>
              {catId}
            </span>
          </div>
        </div>

        {/* Options Dropdown Menu */}
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
              <div className="absolute left-0 top-6 w-40 bg-white rounded-xl shadow-md border border-slate-200/90 z-20 py-1 text-xs animate-in fade-in duration-150">
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
                    onOpenCustomDateModal(battery);
                  }}
                  className="w-full text-right px-3 py-2 text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>دیاریکردنی بەرواری تایبەت</span>
                </button>
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
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDeleteBattery(battery.id);
                  }}
                  className="w-full text-right px-3 py-2 text-rose-600 hover:bg-rose-50 font-semibold flex items-center gap-2"
                >
                  <TrashIcon className="w-3.5 h-3.5 text-rose-500" />
                  <span>سڕینەوەی باتری</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Battery Specs Row: Storage Percentage, Voltage & Capacity (If Available) */}
      {(battery.voltage || battery.capacity || battery.storagePercentage !== undefined) && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 flex-wrap">
          {battery.storagePercentage !== undefined && (
            <span className="bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-md font-extrabold text-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>%{battery.storagePercentage} ستۆرج</span>
            </span>
          )}
          {battery.voltage && (
            <span className="bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-md font-mono text-slate-800">
              ⚡ {battery.voltage}V
            </span>
          )}
          {battery.capacity && (
            <span className="bg-slate-50 border border-slate-200/70 px-2 py-0.5 rounded-md text-slate-800">
              🔋 {battery.capacity}
            </span>
          )}
        </div>
      )}

      {/* Status Box: clean badge + progress counter + bar */}
      <div className="bg-slate-50/60 border border-slate-200/50 rounded-xl p-2.5 space-y-1.5">
        {/* Row 1: Status badge + day counter */}
        <div className="flex items-center justify-between gap-1">
          <span className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-md border ${statusConfig.badgeBg}`}>
            <StatusIcon className="w-3 h-3 shrink-0" />
            <span className="whitespace-nowrap">{statusConfig.label}</span>
          </span>
          <span className="text-[11px] font-extrabold text-slate-600 font-mono whitespace-nowrap">
            {stats.daysElapsed} / 40 ڕۆژ
          </span>
        </div>

        {/* Row 2: Progress bar */}
        <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${statusConfig.progressBg}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Row 3: Days remaining note for EARLY_WARNING only */}
        {stats.status === 'EARLY_WARNING' && (
          <p className="text-[10px] font-semibold text-amber-700">
            {stats.daysRemaining} ڕۆژ ماوە بۆ کاتی ستۆرج
          </p>
        )}
      </div>

      {/* Bottom Action Row: Quick Storage Button */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
        <div className="text-[10px] text-slate-500 font-semibold">
          دوایین ستۆرج: <span className="font-bold text-slate-800">{battery.lastChargeDate}</span>
        </div>

        <button
          onClick={() => onChargeToday(battery.id)}
          className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 shrink-0"
        >
          <BoltIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>ستۆرج کرا</span>
        </button>
      </div>

    </div>
  );
};
