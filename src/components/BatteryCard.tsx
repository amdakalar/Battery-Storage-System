/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Battery } from '../types';
import { calculateBatteryStats } from '../utils/dateUtils';
import { StatusBadge } from './StatusBadge';
import {
  BoltIcon,
  CalendarIcon,
  ClockIcon,
  TrashIcon,
  CheckCircleIcon,
  SparklesIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

interface BatteryCardProps {
  battery: Battery;
  onChargeToday: (batteryId: string) => void;
  onOpenCustomDateModal: (battery: Battery) => void;
  onOpenHistoryModal: (battery: Battery) => void;
  onDeleteBattery: (batteryId: string) => void;
  referenceDate?: string;
  isSingleView?: boolean;
}

export const BatteryCard: React.FC<BatteryCardProps> = ({
  battery,
  onChargeToday,
  onOpenCustomDateModal,
  onOpenHistoryModal,
  onDeleteBattery,
  referenceDate,
  isSingleView = false,
}) => {
  const [showToast, setShowToast] = useState(false);

  const stats = calculateBatteryStats(
    battery.lastChargeDate,
    battery.reminderIntervalDays,
    referenceDate
  );

  const handleQuickChargeClick = () => {
    onChargeToday(battery.id);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3500);
  };

  // SVG circular progress calculation
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (stats.progressPercentage / 100) * circumference;

  return (
    <div
      className={`group bg-white/90 backdrop-blur-sm rounded-3xl border transition-all duration-300 relative overflow-hidden card-hover animate-fade-in ${
        stats.status === 'OVERDUE'
          ? 'border-rose-200 shadow-lg shadow-rose-100/50 ring-1 ring-rose-500/10'
          : stats.status === 'TIME_TO_CHARGE'
          ? 'border-amber-200 shadow-lg shadow-amber-100/50 ring-1 ring-amber-500/10'
          : 'border-slate-200 shadow-soft hover:shadow-medium hover:border-slate-300'
      }`}
    >
      {/* Toast Notification on Storage */}
      {showToast && (
        <div className="absolute inset-x-0 top-0 bg-emerald-600 text-white py-2.5 px-4 z-20 flex items-center justify-between text-xs sm:text-sm font-semibold animate-in slide-in-from-top duration-300 shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-emerald-200 shrink-0 animate-bounce" />
            <span>ستۆرجکردن تۆمارکرا! ژمارەگەڕی ٤٠ ڕۆژە سەرلەنوێ دەستیپێکردەوە.</span>
          </div>
          <SparklesIcon className="w-4 h-4 text-emerald-200" />
        </div>
      )}

      {/* Top Banner Accent */}
      <div className={`h-2.5 w-full ${stats.statusColorClass.bg}`} />

      <div className="p-5 sm:p-6">
        
        {/* Header Row: Battery Name, Category, Status */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center p-1 shadow-xs shrink-0 mt-0.5">
              <img
                src="./drone_battery_app_icon.svg"
                alt="Battery Icon"
                className="w-9 h-9 rounded-xl object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {battery.category === 'DRONE'
                    ? 'پاتری درۆن'
                    : battery.category === 'CAR'
                    ? 'ئۆتۆمبێل'
                    : battery.category === 'SOLAR'
                    ? 'سیستەمی خۆر'
                    : battery.category === 'UPS'
                    ? 'یو پی ئێس'
                    : 'باتری گشتی'}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  خولی بیرخەرەوە: {battery.reminderIntervalDays} ڕۆژ
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 flex items-center gap-2">
                {battery.name}
              </h2>
              {battery.notes && (
                <p className="text-xs text-slate-500 mt-1 line-clamp-1">{battery.notes}</p>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <StatusBadge status={stats.status} statusText={stats.statusText} size="lg" />
          </div>
        </div>

        {/* Center Grid: Progress Meter & Main Action Button */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-6 bg-gradient-to-r from-slate-50/80 to-slate-100/80 p-6 rounded-3xl border border-slate-100 backdrop-blur-sm">
          
          {/* Progress Circular Ring & Days Display */}
          <div className="md:col-span-5 flex items-center justify-center gap-6">
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                {/* Background Circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className="stroke-slate-200"
                  strokeWidth="8"
                  fill="transparent"
                />
                {/* Progress Circle */}
                <circle
                  cx="60"
                  cy="60"
                  r={radius}
                  className={`${stats.statusColorClass.ring} progress-ring`}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-1">
                <span className="text-3xl font-black text-slate-900 tracking-tight leading-none text-shadow">
                  {stats.daysElapsed}
                </span>
                <span className="text-xs font-semibold text-slate-500 mt-1">
                  ڕۆژ تێپەڕیوە
                </span>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="text-sm font-bold text-slate-600">نیشاندەری ٤٠ ڕۆژ</div>
              <div className="text-2xl font-black text-slate-900 text-shadow">
                {stats.progressPercentage}%
              </div>
              <div className="text-xs text-slate-500">خول تێپەڕیوە</div>
              <p className="text-xs text-slate-600 max-w-[180px] leading-relaxed mt-2">
                {stats.status === 'OVERDUE'
                  ? 'کاتەکە تێپەڕیوە! بەپەلە ستۆرجی بکەوە.'
                  : stats.status === 'TIME_TO_CHARGE'
                  ? 'ئەمڕۆ ٤٠ ڕۆژەکەیە، پێویستی بە ستۆرجکردنە.'
                  : `${stats.daysRemaining} ڕۆژت ماوە تا ستۆرجی داهاتوو.`}
              </p>
            </div>
          </div>

          {/* Primary Command Button: "ستۆرج کرا" */}
          <div className="md:col-span-7 flex flex-col justify-center items-stretch gap-2.5">
            <button
              onClick={handleQuickChargeClick}
              className={`w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg text-white flex items-center justify-center gap-3 shadow-lg transition-all duration-200 group btn-hover ${
                stats.status === 'OVERDUE'
                  ? 'gradient-rose hover:shadow-rose-600/30'
                  : stats.status === 'TIME_TO_CHARGE'
                  ? 'gradient-amber hover:shadow-amber-600/30'
                  : 'gradient-emerald hover:shadow-emerald-600/30'
              }`}
            >
              <BoltIcon className="w-6 h-6 fill-white/80 group-hover:scale-110 transition-transform animate-pulse" />
              <span>ستۆرج کرا</span>
              <span className="text-xs font-normal opacity-90 border-r border-white/30 pr-3 mr-1 hidden sm:inline">
                نوێکردنەوە بۆ ئەمڕۆ
              </span>
            </button>

            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span>* کلیک لەسەر ئەم دوگمەیە ژمارەگەڕی ٤٠ ڕۆژەکە سفر دەکاتەوە.</span>
            </div>
          </div>

        </div>

        {/* 4 Required Information Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 my-6">
          {/* 1. Last Storage Date */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-3xl border border-slate-200/80 backdrop-blur-sm card-hover">
            <div className="flex items-center gap-2 text-slate-600 text-xs font-bold mb-2">
              <CalendarIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ڕێکەوتی دوایین ستۆرج</span>
            </div>
            <div className="text-sm sm:text-base font-black text-slate-900 truncate mb-1" title={stats.lastChargeDateFormatted}>
              {battery.lastChargeDate}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {stats.lastChargeDateFormatted}
            </div>
          </div>

          {/* 2. Days Elapsed */}
          <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 p-4 rounded-3xl border border-teal-200/80 backdrop-blur-sm card-hover">
            <div className="flex items-center gap-2 text-teal-700 text-xs font-bold mb-2">
              <ClockIcon className="w-4 h-4 text-teal-600 shrink-0" />
              <span>ڕۆژەکانی تێپەڕیوە</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-teal-900 text-shadow">
              {stats.daysElapsed}
            </div>
            <div className="text-xs text-teal-600 font-medium">
              ڕۆژ لە دوایین ستۆرج
            </div>
          </div>

          {/* 3. Days Remaining */}
          <div className={`bg-gradient-to-br p-4 rounded-3xl border backdrop-blur-sm card-hover ${
            stats.daysRemaining < 0 
              ? 'from-rose-50 to-rose-100/50 border-rose-200/80' 
              : 'from-amber-50 to-amber-100/50 border-amber-200/80'
          }`}>
            <div className={`flex items-center gap-2 text-xs font-bold mb-2 ${
              stats.daysRemaining < 0 ? 'text-rose-700' : 'text-amber-700'
            }`}>
              <ClockIcon className={`w-4 h-4 shrink-0 ${
                stats.daysRemaining < 0 ? 'text-rose-600' : 'text-amber-600'
              }`} />
              <span>ڕۆژەکانی ماون</span>
            </div>
            <div className={`text-xl sm:text-2xl font-black text-shadow ${
              stats.daysRemaining < 0 ? 'text-rose-900' : 'text-amber-900'
            }`}>
              {stats.daysRemaining < 0 ? Math.abs(stats.daysRemaining) : stats.daysRemaining}
            </div>
            <div className={`text-xs font-medium ${
              stats.daysRemaining < 0 ? 'text-rose-600' : 'text-amber-600'
            }`}>
              {stats.daysRemaining < 0 ? 'ڕۆژ دواکەوتووە' : 'ڕۆژ ماوە'}
            </div>
          </div>

          {/* 4. Status Indicator */}
          <div className={`p-4 rounded-3xl border backdrop-blur-sm card-hover ${stats.statusColorClass.lightBg} ${stats.statusColorClass.border}`}>
            <div className="flex items-center gap-2 text-slate-800 text-xs font-bold mb-2">
              <SparklesIcon className="w-4 h-4 text-slate-700 shrink-0" />
              <span>بارودۆخی گشتی</span>
            </div>
            <div className={`text-lg sm:text-xl font-black ${stats.statusColorClass.text} text-shadow`}>
              {stats.status === 'OVERDUE' ? 'دواکەوتوو' : stats.status === 'TIME_TO_CHARGE' ? 'پێویست بە ستۆرج' : 'لە کاتی خۆی'}
            </div>
            <div className="text-xs text-slate-600 font-medium">
              {stats.status === 'OVERDUE'
                ? 'کاتی تێپەڕیوە'
                : stats.status === 'TIME_TO_CHARGE'
                ? 'پێویست بە ستۆرجە'
                : 'کات بەسەرنەچووە'}
            </div>
          </div>

        </div>

        {/* Voltage, Storage Percentage and Cells Information (if available) */}
        {(battery.voltage || battery.cells || battery.storagePercentage !== undefined) && (
          <div className="mb-6 p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border border-indigo-200">
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <BoltIcon className="w-4 h-4 text-indigo-600" />
              <span>زانیاری تەکنیکی و ستۆرجی باتری</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              {battery.storagePercentage !== undefined && (
                <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-emerald-800 mb-0.5">ڕێژەی سەدی ستۆرج</div>
                    <div className="text-xs text-slate-500 font-medium">ئاستی پاتری لە کاتی ستۆرج</div>
                  </div>
                  <div className="text-2xl font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                    %{battery.storagePercentage}
                  </div>
                </div>
              )}

              {battery.voltage && (
                <div className="p-3 bg-white/80 rounded-xl border border-indigo-200 shadow-2xs flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-indigo-900 mb-0.5">ڤۆڵتی باتری</div>
                    <div className="text-xs text-slate-500 font-medium">کۆی ڤۆڵتاژی خانەکان</div>
                  </div>
                  <div className="text-2xl font-black text-indigo-900 font-mono">
                    {battery.voltage} V
                  </div>
                </div>
              )}
            </div>

            {battery.cells && Object.keys(battery.cells).length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                  <span>خانەکانی باتری (Cell 1 - Cell 12)</span>
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100 px-2 py-0.5 rounded-full">
                    {Object.values(battery.cells).filter(v => v !== undefined && v !== null && (v as any) !== '').length} خانەی چالاک
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                  {Object.entries(battery.cells)
                    .filter(([_, value]) => value !== undefined && value !== null && (value as any) !== '')
                    .map(([key, value]) => {
                      const cellNum = key.replace('cell', '');
                      return (
                        <div key={key} className="bg-white/90 p-2 rounded-xl border border-indigo-100 text-center shadow-2xs">
                          <div className="text-[10px] font-bold text-slate-600">Cell {cellNum}</div>
                          <div className="text-sm font-black text-indigo-900">{value}V</div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-slate-200/50 text-sm">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenCustomDateModal(battery)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100/80 hover:bg-slate-200 text-slate-700 font-semibold transition-all btn-hover backdrop-blur-sm"
            >
              <CalendarDaysIcon className="w-4 h-4 text-slate-600" />
              <span>مێژووی دیاریکراو</span>
            </button>

            <button
              onClick={() => onOpenHistoryModal(battery)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100/80 hover:bg-slate-200 text-slate-700 font-semibold transition-all btn-hover backdrop-blur-sm"
            >
              <ClockIcon className="w-4 h-4 text-slate-600" />
              <span>مێژوو ({battery.history?.length || 0})</span>
            </button>
          </div>

          {!isSingleView && (
            <button
              onClick={() => onDeleteBattery(battery.id)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-2xl hover:bg-rose-50 text-slate-400 hover:text-rose-600 font-semibold transition-all"
              title="سڕینەوەی ئەم باترییە"
            >
              <TrashIcon className="w-4 h-4" />
              <span>سڕینەوە</span>
            </button>
          )}

        </div>

      </div>
    </div>
  );
};

