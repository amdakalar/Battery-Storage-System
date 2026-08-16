/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, CalendarIcon, Square3Stack3DIcon, BoltIcon } from '@heroicons/react/24/outline';
import { getTodayISODate } from '../utils/dateUtils';
import { DRONE_CATEGORIES, DEFAULT_CATEGORY } from '../constants/categories';

interface AddBatteryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
  onAddBattery: (data: {
    name: string;
    category: string;
    lastChargeDate: string;
    reminderIntervalDays: number;
    notes?: string;
    voltage?: number;
    storagePercentage?: number;
    cells?: {
      cell1?: number;
      cell2?: number;
      cell3?: number;
      cell4?: number;
      cell5?: number;
      cell6?: number;
      cell7?: number;
      cell8?: number;
      cell9?: number;
      cell10?: number;
      cell11?: number;
      cell12?: number;
    };
  }) => void;
}

export const AddBatteryModal: React.FC<AddBatteryModalProps> = ({
  isOpen,
  onClose,
  defaultCategory,
  onAddBattery,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(defaultCategory || DEFAULT_CATEGORY);
  const [lastChargeDate, setLastChargeDate] = useState(getTodayISODate());
  const [reminderIntervalDays, setReminderIntervalDays] = useState(40);
  const [notes, setNotes] = useState('');
  const [voltage, setVoltage] = useState<number | ''>('');
  const [storagePercentage, setStoragePercentage] = useState<number | ''>(50);
  const [showCellsConfig, setShowCellsConfig] = useState(false);
  const [cells, setCells] = useState({
    cell1: '' as number | '',
    cell2: '' as number | '',
    cell3: '' as number | '',
    cell4: '' as number | '',
    cell5: '' as number | '',
    cell6: '' as number | '',
    cell7: '' as number | '',
    cell8: '' as number | '',
    cell9: '' as number | '',
    cell10: '' as number | '',
    cell11: '' as number | '',
    cell12: '' as number | '',
  });

  React.useEffect(() => {
    if (defaultCategory) {
      setCategory(defaultCategory);
    }
  }, [defaultCategory, isOpen]);

  if (!isOpen) return null;

  // Handle cell voltage changes & auto-calculate storage percentage and total voltage
  const handleCellChange = (cellKey: string, val: string) => {
    const numVal = val === '' ? '' : Number(val);
    const updatedCells = {
      ...cells,
      [cellKey]: numVal,
    };
    setCells(updatedCells);

    // Calculate active cell values
    const validCells = Object.values(updatedCells)
      .filter((v) => v !== '' && !isNaN(Number(v)))
      .map(Number);

    if (validCells.length > 0) {
      const sum = validCells.reduce((a, b) => a + b, 0);
      const avg = sum / validCells.length;
      setVoltage(Number(sum.toFixed(2)));

      // Estimate LiPo storage percentage based on cell voltage (standard 3.85V = 50%, 3.5V = 0%, 4.2V = 100%)
      const estPercent = Math.min(100, Math.max(0, Math.round(((avg - 3.5) / (4.2 - 3.5)) * 100)));
      setStoragePercentage(estPercent);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Convert cells from state to proper format
    const cellsData: any = {};
    Object.entries(cells).forEach(([key, value]) => {
      if (value !== '') {
        cellsData[key] = Number(value);
      }
    });

    onAddBattery({
      name: name.trim(),
      category: category || DEFAULT_CATEGORY,
      lastChargeDate: lastChargeDate || getTodayISODate(),
      reminderIntervalDays: Number(reminderIntervalDays) || 40,
      notes: notes.trim(),
      voltage: voltage !== '' ? Number(voltage) : undefined,
      storagePercentage: storagePercentage !== '' ? Number(storagePercentage) : undefined,
      cells: Object.keys(cellsData).length > 0 ? cellsData : undefined,
    });

    // Reset and close
    setName('');
    setCategory(defaultCategory || DEFAULT_CATEGORY);
    setNotes('');
    setVoltage('');
    setStoragePercentage(50);
    setShowCellsConfig(false);
    setCells({
      cell1: '',
      cell2: '',
      cell3: '',
      cell4: '',
      cell5: '',
      cell6: '',
      cell7: '',
      cell8: '',
      cell9: '',
      cell10: '',
      cell11: '',
      cell12: '',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 relative max-h-[90vh] overflow-y-auto">
        
        {/* Minimal Executive Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center p-1 shadow-xs shrink-0">
              <img
                src="./drone_battery_app_icon.svg"
                alt="Battery Icon"
                className="w-8 h-8 rounded-xl object-cover"
              />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">زیادکردنی باتری نوێ</h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">داخڵکردنی زانیارییەکان لە بەشی هەڵبژێردراو</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
            title="داخستن"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Minimal Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs">
          
          {/* Name & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ناوی باتری <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="نموونە: پاتری درۆن ۱"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                بەش (پۆلی باتری) <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              >
                {DRONE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Interval Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-600" />
                <span>دوایین ستۆرجکردن</span>
              </label>
              <input
                type="date"
                value={lastChargeDate}
                onChange={(e) => setLastChargeDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-right font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ماوەی ئاگادارکردنەوە (ڕۆژ)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={reminderIntervalDays}
                onChange={(e) => setReminderIntervalDays(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-semibold"
              />
            </div>
          </div>

          {/* Storage Percentage & Total Voltage Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ڕێژەی سەدی ستۆرج (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={storagePercentage}
                  onChange={(e) => setStoragePercentage(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="50"
                  className="w-full px-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                {[30, 50, 60, 80].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setStoragePercentage(pct)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all ${
                      storagePercentage === pct
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                کۆی ڤۆڵتی باتری (V)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={voltage}
                onChange={(e) => setVoltage(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="نموونە: 22.8V"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1.5 font-medium">
                خۆکار لەگەڵ سێڵەکان دادەنرێت
              </p>
            </div>
          </div>

          {/* Optional Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              تێبینی (ئارەزوومەندانە)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="تێبینی، شوێنی باتری یان ژمارەی جۆر..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* Cell Voltages Toggle Bar */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowCellsConfig(!showCellsConfig)}
              className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-all"
            >
              <div className="flex items-center gap-2">
                <Square3Stack3DIcon className="w-4 h-4 text-emerald-600" />
                <span>دایینانی ڤۆڵتی خانەکان (Cell 1 - Cell 12)</span>
              </div>
              <span className="text-emerald-700 text-xs">
                {showCellsConfig ? 'داخستن ▲' : 'دەستکاری ▼'}
              </span>
            </button>

            {showCellsConfig && (
              <div className="mt-3 p-3 bg-slate-50/60 rounded-xl border border-slate-200/80 animate-in fade-in duration-200 space-y-2">
                <div className="text-[11px] text-slate-500 font-semibold mb-1">
                  * بە نووسینی ڤۆڵتی هەر خانەیەک (وەک 3.85V)، ڕێژەی ستۆرج بە شێوەی زیرەک دادەنرێت.
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                    <div key={num} className="bg-white p-2 rounded-lg border border-slate-200">
                      <label className="block text-[10px] font-bold text-slate-500 mb-1 text-center">
                        Cell {num}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={cells[`cell${num}` as keyof typeof cells]}
                        onChange={(e) => handleCellChange(`cell${num}`, e.target.value)}
                        placeholder="3.85V"
                        className="w-full text-center py-1 border border-slate-200 rounded text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold transition-all text-xs"
            >
              پەشیمانبوونەوە
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
            >
              <PlusIcon className="w-4 h-4" />
              <span>پاشەکەوتکردن</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
