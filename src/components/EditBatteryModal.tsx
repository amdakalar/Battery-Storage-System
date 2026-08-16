/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, PencilSquareIcon, Square3Stack3DIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Battery } from '../types';
import { DRONE_CATEGORIES, getNormalizedCategory } from '../constants/categories';

interface EditBatteryModalProps {
  battery: Battery | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBattery: (batteryId: string, updatedFields: Partial<Battery>) => void;
}

export const EditBatteryModal: React.FC<EditBatteryModalProps> = ({
  battery,
  isOpen,
  onClose,
  onUpdateBattery,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [reminderIntervalDays, setReminderIntervalDays] = useState(40);
  const [notes, setNotes] = useState('');
  const [voltage, setVoltage] = useState<number | ''>('');
  const [storagePercentage, setStoragePercentage] = useState<number | ''>(50);
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

  useEffect(() => {
    if (battery) {
      setName(battery.name || '');
      setCategory(getNormalizedCategory(battery.category));
      setReminderIntervalDays(battery.reminderIntervalDays || 40);
      setNotes(battery.notes || '');
      setVoltage(battery.voltage !== undefined && battery.voltage !== null ? battery.voltage : '');
      setStoragePercentage(battery.storagePercentage !== undefined && battery.storagePercentage !== null ? battery.storagePercentage : 50);

      const newCells: any = {};
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((num) => {
        const key = `cell${num}`;
        const val = battery.cells ? (battery.cells as any)[key] : undefined;
        newCells[key] = val !== undefined && val !== null ? val : '';
      });
      setCells(newCells);
    }
  }, [battery]);

  if (!isOpen || !battery) return null;

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

    const cellsData: any = {};
    Object.entries(cells).forEach(([key, value]) => {
      if (value !== '') {
        cellsData[key] = Number(value);
      }
    });

    onUpdateBattery(battery.id, {
      name: name.trim(),
      category: category,
      reminderIntervalDays: Number(reminderIntervalDays) || 40,
      notes: notes.trim(),
      voltage: voltage !== '' ? Number(voltage) : undefined,
      storagePercentage: storagePercentage !== '' ? Number(storagePercentage) : undefined,
      cells: Object.keys(cellsData).length > 0 ? cellsData : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center shrink-0">
              <PencilSquareIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">دەستکاریکردنی باتری و بەشەکەی</h3>
              <p className="text-[11px] text-slate-500 font-medium">{battery.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="داخستن"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Edit Form */}
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
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                بەش (پۆلی باتری) <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
              >
                {DRONE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Interval & Storage Percentage Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ماوەی ستۆرج (ڕۆژ)
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={reminderIntervalDays}
                onChange={(e) => setReminderIntervalDays(Number(e.target.value))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-semibold"
              />
            </div>

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
                  className="w-full px-3 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
              </div>
            </div>
          </div>

          {/* Quick Percentage Presets */}
          <div className="flex items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-500 font-bold">دیاریکردنی خێرا:</span>
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

          {/* Notes */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              تێبینی
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="تێبینی زانیاری باتری..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>

          {/* Cell Voltages Grid */}
          <div className="pt-2">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Square3Stack3DIcon className="w-4 h-4 text-indigo-600" />
                <label className="font-bold text-slate-800 text-xs">
                  دەستکاریکردنی ڤۆڵتی سێڵەکان (Cell 1 - Cell 12)
                </label>
              </div>
              {voltage !== '' && (
                <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  کۆی ڤۆڵت: {voltage}V
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
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
                    className="w-full text-center py-1 border border-slate-200 rounded text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
              تێبینی: گۆڕینی بەهای ڤۆڵت ڕاستەوخۆ دەستبەجێ لەسەر کارتی باتری لە داشبۆرد و ڕێژەی ستۆرج بەدیاردەکەوێت.
            </p>
          </div>

          {/* Buttons */}
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
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all"
            >
              <CheckIcon className="w-4 h-4" />
              <span>پاشەکەوتکردنی دەستکارییەکە</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
