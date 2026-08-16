/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  CalendarIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { formatGregorianKurdish, getTodayISODate } from '../utils/dateUtils';
import { AppSettings } from '../types';

interface HeaderProps {
  settings: AppSettings;
  onToggleAudio: () => void;
  onOpenAddModal: () => void;
  onOpenSimulatorModal: () => void;
  onExportData: () => void;
  onImportData: () => void;
  simulatedReferenceDate?: string;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  onToggleAudio,
  onOpenAddModal,
  onOpenSimulatorModal,
  onExportData,
  onImportData,
  simulatedReferenceDate,
}) => {
  const currentDateToDisplay = simulatedReferenceDate || getTodayISODate();
  const formattedToday = formatGregorianKurdish(currentDateToDisplay);

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Title and Badge */}
          <div className="flex items-center gap-3">
            <img 
              src="./drone_battery_app_icon.svg" 
              alt="Storage Battery Drone Icon" 
              className="w-12 h-12 rounded-2xl shadow-md shadow-slate-900/10 shrink-0 object-cover" 
            />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                سیستەمی بەڕێوەبردنی ستۆرج
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                تۆمارکردنی زیرەک و ئاگادارکردنەوەی ڕۆژانە دوای تێپەڕبوونی ٤٠ ڕۆژ
              </p>
            </div>
          </div>

          {/* Controls and Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Today Date Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 transition-colors">
              <CalendarIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>ئەمڕۆ: {formattedToday}</span>
              {simulatedReferenceDate && (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded-md font-bold">
                  تاقیکاری
                </span>
              )}
            </div>

            {/* Audio Alert Toggle */}
            <button
              onClick={onToggleAudio}
              title={settings.enableAudioAlerts ? 'دەنگی ئاگادارکردنەوە چالاکە' : 'دەنگی ئاگادارکردنەوە ناچالاکە'}
              className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
                settings.enableAudioAlerts
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
              }`}
            >
              {settings.enableAudioAlerts ? <SpeakerWaveIcon className="w-4 h-4" /> : <SpeakerXMarkIcon className="w-4 h-4" />}
            </button>

            {/* Date Simulator / Test Button */}
            <button
              onClick={onOpenSimulatorModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-amber-50 text-slate-800 hover:text-amber-800 rounded-xl text-xs sm:text-sm font-medium border border-slate-200 hover:border-amber-300 transition-colors"
              title="تاقیکردنەوەی بارودۆخەکان بۆ ڕۆژانی جیاواز"
            >
              <AdjustmentsHorizontalIcon className="w-4 h-4 text-amber-600 shrink-0" />
              <span className="hidden sm:inline">تاقیکردنەوەی کات</span>
            </button>

            {/* Backup Export/Import */}
            <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 p-0.5">
              <button
                onClick={onExportData}
                title="دەرهێنانی پشتیوان (Export)"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
              </button>
              <button
                onClick={onImportData}
                title="هێنانی پشتیوان (Import)"
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg transition-colors"
              >
                <ArrowUpTrayIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Add New Battery */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition-all shrink-0"
            >
              <PlusIcon className="w-4 h-4" />
              <span>باتری نوێ</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
