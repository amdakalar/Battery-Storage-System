/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, Square3Stack3DIcon, CheckIcon, PlusIcon } from '@heroicons/react/24/outline';
import { Battery } from '../types';
import { DroneCategoryInfo, loadCategories, getNormalizedCategory } from '../constants/categories';

interface EditBatteryModalProps {
  battery: Battery | null;
  isOpen: boolean;
  onClose: () => void;
  categories?: DroneCategoryInfo[];
  onOpenCategoryManager?: () => void;
  onUpdateBattery: (batteryId: string, updatedFields: Partial<Battery>) => void;
}

export const EditBatteryModal: React.FC<EditBatteryModalProps> = ({
  battery,
  isOpen,
  onClose,
  categories,
  onOpenCategoryManager,
  onUpdateBattery,
}) => {
  const activeCategories = categories && categories.length > 0 ? categories : loadCategories();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [reminderIntervalDays, setReminderIntervalDays] = useState(40);
  const [notes, setNotes] = useState('');
  const [voltage, setVoltage] = useState<number | ''>('');
  const [storagePercentage, setStoragePercentage] = useState<number | ''>(50);
  const [showCellsConfig, setShowCellsConfig] = useState(false);
  const [cells, setCells] = useState({
    cell1: '' as number | '', cell2: '' as number | '', cell3: '' as number | '',
    cell4: '' as number | '', cell5: '' as number | '', cell6: '' as number | '',
    cell7: '' as number | '', cell8: '' as number | '', cell9: '' as number | '',
    cell10: '' as number | '', cell11: '' as number | '', cell12: '' as number | '',
  });

  useEffect(() => {
    if (isOpen && battery) {
      setName(battery.name || '');
      setCategory(getNormalizedCategory(battery.category));
      setReminderIntervalDays(battery.reminderIntervalDays || 40);
      setNotes(battery.notes || '');
      setVoltage(battery.voltage !== undefined && battery.voltage !== null ? battery.voltage : '');
      setStoragePercentage(battery.storagePercentage !== undefined && battery.storagePercentage !== null ? battery.storagePercentage : 50);

      // Check if any cells have data to auto-open the accordion
      const hasCells = battery.cells && Object.values(battery.cells as any).some(
        (v: any) => v !== undefined && v !== null && v !== ''
      );
      setShowCellsConfig(!!hasCells);

      const newCells: any = {};
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((num) => {
        const key = `cell${num}`;
        const val = battery.cells ? (battery.cells as any)[key] : undefined;
        newCells[key] = val !== undefined && val !== null ? val : '';
      });
      setCells(newCells);
    }
  }, [isOpen, battery]);

  if (!isOpen || !battery) return null;

  const handleCellChange = (cellKey: string, val: string) => {
    const numVal = val === '' ? '' : Number(val);
    const updatedCells = { ...cells, [cellKey]: numVal };
    setCells(updatedCells);

    const validCells = Object.values(updatedCells)
      .filter((v) => v !== '' && !isNaN(Number(v)))
      .map(Number);

    if (validCells.length > 0) {
      const sum = validCells.reduce((a, b) => a + b, 0);
      const avg = sum / validCells.length;
      setVoltage(Number(sum.toFixed(2)));
      const estPercent = Math.min(100, Math.max(0, Math.round(((avg - 3.5) / (4.2 - 3.5)) * 100)));
      setStoragePercentage(estPercent);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const cellsData: any = {};
    Object.entries(cells).forEach(([key, value]) => {
      if (value !== '') cellsData[key] = Number(value);
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

  // Shared styles matching AddBatteryModal
  const inputCls = 'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-slate-400 focus:border-slate-400 transition-all placeholder-slate-400';
  const labelCls = 'block text-[11px] font-semibold text-slate-900 mb-1.5 uppercase tracking-wide';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 dir-rtl">
      <div
        className="bg-white rounded-xl w-full max-w-lg shadow-xl border border-slate-200 flex flex-col"
        style={{ maxHeight: 'min(90vh, 680px)' }}
        role="dialog"
        aria-modal="true"
      >

        {/* ── Fixed Header ── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white border border-slate-200 rounded-lg flex items-center justify-center shadow-sm shrink-0">
              <img
                src="./drone_battery_app_icon.svg"
                alt="Battery Icon"
                className="w-5 h-5 object-contain"
              />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-slate-800 leading-tight">دەستکاریکردنی باتری و بەشەکەی</h3>
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
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          <form id="edit-battery-form" onSubmit={handleSubmit} className="space-y-4">

            {/* Row 1: Name & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>
                  ناوی باتری <span className="text-rose-500 normal-case tracking-normal">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  autoFocus
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold text-slate-900 uppercase tracking-wide">
                    بەش (پۆلی باتری) <span className="text-rose-500 normal-case tracking-normal">*</span>
                  </label>
                  {onOpenCategoryManager && (
                    <button
                      type="button"
                      onClick={onOpenCategoryManager}
                      className="text-[10.5px] font-semibold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-0.5"
                    >
                      <PlusIcon className="w-3 h-3 text-slate-500" />
                      <span>هاوپۆلی نوێ</span>
                    </button>
                  )}
                </div>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={inputCls}
                >
                  {activeCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 2: Interval & Storage % */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>ماوەی ستۆرج (ڕۆژ)</label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={reminderIntervalDays}
                  onChange={(e) => setReminderIntervalDays(Number(e.target.value))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>ڕێژەی سەدی ستۆرج (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={storagePercentage}
                    onChange={(e) => setStoragePercentage(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="50"
                    className={`${inputCls} pr-3 pl-7`}
                  />
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Quick % picks */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-medium shrink-0">دیاریکردنی خێرا:</span>
              {[30, 50, 60, 80].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setStoragePercentage(pct)}
                  className={`flex-1 text-[10px] font-semibold py-1 rounded border transition-all ${
                    storagePercentage === pct
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {pct}%
                </button>
              ))}
            </div>

            {/* Notes */}
            <div>
              <label className={labelCls}>تێبینی</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="تێبینی زانیاری باتری..."
                className={inputCls}
              />
            </div>

            {/* Cell Voltages Accordion */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setShowCellsConfig(!showCellsConfig)}
                className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-[12px] font-semibold text-slate-600 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Square3Stack3DIcon className="w-4 h-4 text-slate-500" />
                  <span>دەستکاریکردنی ڤۆڵتی سێڵەکان (Cell 1 - Cell 12)</span>
                </div>
                <div className="flex items-center gap-2">
                  {voltage !== '' && (
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                      {voltage}V
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">{showCellsConfig ? '▲ داخستن' : '▼ کردنەوە'}</span>
                </div>
              </button>

              {showCellsConfig && (
                <div className="p-4 bg-white border-t border-slate-100 animate-in fade-in duration-150">
                  <p className="text-[10.5px] text-slate-400 mb-3">
                    * بە نووسینی ڤۆڵتی هەر خانەیەک (وەک 3.85V)، ڕێژەی ستۆرج بە شێوەی زیرەک دادەنرێت.
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                      <div key={num}>
                        <label className="block text-[10px] font-semibold text-slate-400 mb-1 text-center">
                          C{num}
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={cells[`cell${num}` as keyof typeof cells]}
                          onChange={(e) => handleCellChange(`cell${num}`, e.target.value)}
                          placeholder="3.85"
                          className="w-full text-center px-1 py-1.5 border border-slate-200 rounded-md text-[11px] font-medium text-slate-800 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-300 transition-all bg-white"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3">
                    تێبینی: گۆڕینی بەهای ڤۆڵت ڕاستەوخۆ دەستبەجێ لەسەر کارتی باتری لە داشبۆرد و ڕێژەی ستۆرج بەدیاردەکەوێت.
                  </p>
                </div>
              )}
            </div>

          </form>
        </div>

        {/* ── Fixed Footer ── */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-slate-100 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-[12px] transition-all"
          >
            پەشیمانبوونەوە
          </button>
          <button
            type="submit"
            form="edit-battery-form"
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[12px] flex items-center gap-1.5 shadow-sm transition-all"
          >
            <CheckIcon className="w-3.5 h-3.5" />
            <span>پاشەکەوتکردنی دەستکارییەکە</span>
          </button>
        </div>

      </div>
    </div>
  );
};
