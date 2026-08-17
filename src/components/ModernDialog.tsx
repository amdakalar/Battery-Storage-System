/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

export type DialogType = 'info' | 'success' | 'warning' | 'danger' | 'delete';

export interface DialogState {
  isOpen: boolean;
  type?: DialogType;
  title: string;
  message: string;
  details?: string;
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface ModernDialogProps {
  dialog: DialogState;
  onClose: () => void;
}

export const ModernDialog: React.FC<ModernDialogProps> = ({ dialog, onClose }) => {
  const {
    isOpen,
    type = 'info',
    title,
    message,
    details,
    confirmText,
    cancelText = 'پەشیمانبوونەوە',
    isConfirm = false,
    onConfirm,
    onCancel,
  } = dialog;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        if (onCancel) onCancel();
        onClose();
      } else if (e.key === 'Enter' && !isConfirm) {
        if (onConfirm) onConfirm();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isConfirm, onConfirm, onCancel, onClose]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  // Theme configuration based on dialog type
  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          icon: <CheckCircleIcon className="w-7 h-7 text-emerald-400" />,
          iconBg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
          confirmBtn:
            'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 focus:ring-emerald-500/40',
          accentBorder: 'border-emerald-500/20',
          defaultConfirmText: 'باشە',
        };
      case 'danger':
      case 'delete':
        return {
          icon: type === 'delete' ? <TrashIcon className="w-7 h-7 text-rose-400" /> : <XCircleIcon className="w-7 h-7 text-rose-400" />,
          iconBg: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
          confirmBtn:
            'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 focus:ring-rose-500/40',
          accentBorder: 'border-rose-500/25',
          defaultConfirmText: isConfirm ? 'سڕینەوە' : 'تێگەیشتم',
        };
      case 'warning':
        return {
          icon: <ExclamationTriangleIcon className="w-7 h-7 text-amber-400" />,
          iconBg: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
          confirmBtn:
            'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30 focus:ring-amber-500/40',
          accentBorder: 'border-amber-500/20',
          defaultConfirmText: isConfirm ? 'دڵنیام' : 'باشە',
        };
      case 'info':
      default:
        return {
          icon: <InformationCircleIcon className="w-7 h-7 text-sky-400" />,
          iconBg: 'bg-sky-500/10 border-sky-500/20 text-sky-400',
          confirmBtn:
            'bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-950/40 focus:ring-slate-500/40',
          accentBorder: 'border-slate-200/80',
          defaultConfirmText: 'تەواو',
        };
    }
  };

  const styleConfig = getTypeStyles();
  const activeConfirmText = confirmText || styleConfig.defaultConfirmText;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
      onClick={handleCancel}
    >
      <div
        className={`bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border ${styleConfig.accentBorder} relative space-y-4 animate-in zoom-in-95 duration-200 text-right`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 left-4 p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
          title="داخستن"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-start gap-4 pt-1">
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm ${styleConfig.iconBg}`}
          >
            {styleConfig.icon}
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <h3 className="text-base font-black text-slate-900 leading-snug">
              {title}
            </h3>
            <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed whitespace-pre-line">
              {message}
            </p>
          </div>
        </div>

        {/* Optional Details Box */}
        {details && (
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-[11.5px] text-slate-600 leading-relaxed">
            {details}
          </div>
        )}

        {/* Action Buttons */}
        <div className={`flex items-center gap-3 pt-3 border-t border-slate-100 ${isConfirm ? 'justify-end' : 'justify-center'}`}>
          {isConfirm && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors focus:outline-none cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={handleConfirm}
            autoFocus
            className={`${isConfirm ? 'flex-1 sm:flex-initial' : 'w-full'} px-5 py-2.5 rounded-xl font-bold text-xs transition-all focus:outline-none focus:ring-2 cursor-pointer ${styleConfig.confirmBtn}`}
          >
            {activeConfirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
