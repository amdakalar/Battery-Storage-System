/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, PencilSquareIcon, CheckIcon } from '@heroicons/react/24/outline';
import { DroneCategoryInfo } from '../constants/categories';
import { Battery } from '../types';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: DroneCategoryInfo[];
  batteries: Battery[];
  onAddCategory: (categoryData: { name: string; type?: string; typeLabel?: string; weight?: string }) => void;
  onUpdateCategory: (categoryId: string, categoryData: { name: string; type?: string; typeLabel?: string; weight?: string }) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  batteries,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [typeLabel, setTypeLabel] = useState('کامێرا');
  const [weight, setWeight] = useState('2kg');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const startEdit = (cat: DroneCategoryInfo) => {
    setEditingId(cat.id);
    setName(cat.name);
    setTypeLabel(cat.typeLabel || 'کامێرا');
    setWeight(cat.weight || '2kg');
    setErrorMsg('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
    setTypeLabel('کامێرا');
    setWeight('2kg');
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('تکایە ناوی هاوپۆلەکە بنووسە.');
      return;
    }

    // Check duplicate name
    const isDuplicate = categories.some(
      (c) =>
        c.id !== editingId &&
        (c.name.toLowerCase() === trimmedName.toLowerCase() || c.id.toLowerCase() === trimmedName.toLowerCase())
    );

    if (isDuplicate) {
      setErrorMsg('هاوپۆلێک بەم ناوە پێشتر هەیە.');
      return;
    }

    setErrorMsg('');
    const trimmedTypeLabel = typeLabel.trim() || 'تایبەت';
    const trimmedWeight = weight.trim() || 'تایبەت';

    let typeKey = 'CUSTOM';
    if (trimmedTypeLabel.includes('کامێرا')) typeKey = 'CAMERA';
    else if (trimmedTypeLabel.toLowerCase().includes('gps')) typeKey = 'GPS';
    else if (trimmedTypeLabel.toLowerCase().includes('fpv')) typeKey = 'FPV';
    else if (trimmedTypeLabel.includes('بار')) typeKey = 'CARGO';

    if (editingId) {
      onUpdateCategory(editingId, {
        name: trimmedName,
        type: typeKey,
        typeLabel: trimmedTypeLabel,
        weight: trimmedWeight,
      });
      cancelEdit();
    } else {
      onAddCategory({
        name: trimmedName,
        type: typeKey,
        typeLabel: trimmedTypeLabel,
        weight: trimmedWeight,
      });
      setName('');
      setWeight('2kg');
      setTypeLabel('کامێرا');
    }
  };

  const inputCls =
    'w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-400 transition-all';
  const labelCls = 'block text-[11.5px] font-bold text-slate-900 mb-1';

  const typePresets = ['کامێرا', 'GPS', 'FPV', 'بارهەڵگر', 'چاوەدێری', 'کشتوکاڵی', 'تایبەت'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 dir-rtl">
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        style={{ maxHeight: 'min(90vh, 660px)' }}
        role="dialog"
        aria-modal="true"
      >
        {/* ── Fixed Minimal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white border border-slate-200/80 rounded-xl flex items-center justify-center shadow-xs shrink-0">
              <img
                src="./drone_battery_app_icon.svg"
                alt="App Icon"
                className="w-5 h-5 object-contain"
              />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-slate-900 tracking-tight leading-tight">
                بەڕێوەبردنی هاوپۆلەکان (جۆرەکانی درۆن)
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                زیادکردن، دەستکاریکردن و ڕێکخستنی جۆرەکانی درۆن
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              cancelEdit();
              onClose();
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="داخستن"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0 space-y-5">
          {/* Section 1: Add / Edit Form */}
          <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-1.5">
                {editingId ? (
                  <PencilSquareIcon className="w-4 h-4 text-slate-700" />
                ) : (
                  <PlusIcon className="w-4 h-4 text-slate-700" />
                )}
                <h4 className="text-[12.5px] font-bold text-slate-900">
                  {editingId ? 'دەستکاریکردنی زانیارییەکانی هاوپۆل' : 'زیادکردنی هاوپۆلی نوێ'}
                </h4>
              </div>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  پەشیمانبوونەوە
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {errorMsg && (
                <div className="text-[11px] text-rose-600 font-semibold bg-rose-50 border border-rose-200 p-2 rounded-lg">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className={labelCls}>
                  ناوی هاوپۆل / درۆن <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder="نموونە: درۆن (FPV) 1kg یان درۆن کشتوکاڵی 20kg"
                  className={inputCls}
                  autoFocus={!!editingId}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>
                    جۆری کارکردن
                  </label>
                  <input
                    type="text"
                    value={typeLabel}
                    onChange={(e) => setTypeLabel(e.target.value)}
                    placeholder="نموونە: کامێرا، GPS، FPV..."
                    className={inputCls}
                  />
                  {/* Quick Preset Badges */}
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    {typePresets.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setTypeLabel(preset)}
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-md border transition-all ${
                          typeLabel === preset
                            ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>کێش / قەبارە</label>
                  <input
                    type="text"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="نموونە: 2kg یان 15kg"
                    className={inputCls}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 font-semibold text-xs transition-all"
                  >
                    پەشیمانبوونەوە
                  </button>
                )}
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
                >
                  {editingId ? (
                    <>
                      <CheckIcon className="w-3.5 h-3.5" />
                      <span>پاشەکەوتکردنی دەستکاری</span>
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-3.5 h-3.5" />
                      <span>زیادکردنی هاوپۆل</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Categories List */}
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <h4 className="text-[12.5px] font-bold text-slate-900">
                  هاوپۆلە تۆمارکراوەکان
                </h4>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                  {categories.length}
                </span>
              </div>
              <span className="text-[10.5px] text-slate-400 font-medium">
                کلیک لە دەستکاری بکە بۆ گۆڕینی زانیاری
              </span>
            </div>

            <div className="space-y-2">
              {categories.map((cat) => {
                const count = batteries.filter((b) => b.category === cat.id || b.category === cat.name).length;
                const isCustom = cat.isCustom ?? !['درۆن (کامێرا) 2kg', 'درۆن (کامێرا) 5kg', 'درۆن (کامێرا) 10kg', 'درۆن (GPS) 5kg', 'درۆن (GPS) 10kg'].includes(cat.id);
                const isCurrentlyEditing = editingId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                      isCurrentlyEditing
                        ? 'bg-slate-50 border-slate-400 ring-1 ring-slate-300'
                        : 'bg-white border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[12.5px] font-bold text-slate-900 truncate">
                            {cat.name}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                            {cat.typeLabel} • {cat.weight}
                          </span>
                          {isCustom && (
                            <span className="text-[9.5px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              تایبەت
                            </span>
                          )}
                        </div>
                        <p className="text-[10.5px] text-slate-400 font-medium mt-0.5">
                          ژمارەی پاترییەکان: <span className="font-bold text-slate-700">{count}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(cat)}
                        className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                        title="دەستکاریکردنی ئەم هاوپۆلە"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                      </button>

                      {isCustom && (
                        <button
                          onClick={() => {
                            if (count > 0) {
                              if (!window.confirm(`ئەم هاوپۆلە ${count} پاتری تێدایە. دڵنیایت لە سڕینەوەی؟`)) {
                                return;
                              }
                            }
                            onDeleteCategory(cat.id);
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="سڕینەوەی ئەم هاوپۆلە"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Fixed Minimal Footer ── */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-100 bg-white shrink-0">
          <button
            type="button"
            onClick={() => {
              cancelEdit();
              onClose();
            }}
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all shadow-xs"
          >
            داخستن
          </button>
        </div>
      </div>
    </div>
  );
};
