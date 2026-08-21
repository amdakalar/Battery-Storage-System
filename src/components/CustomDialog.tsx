/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

export type DialogType = 'info' | 'success' | 'warning' | 'danger' | 'error';

export interface DialogConfig {
  isOpen: boolean;
  type?: DialogType;
  title: string;
  message: string | React.ReactNode;
  subMessage?: string;
  confirmText?: string;
  cancelText?: string;
  isConfirm?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface CustomDialogProps {
  config: DialogConfig | null;
  onClose: () => void;
}

export const CustomDialog: React.FC<CustomDialogProps> = ({ config, onClose }) => {
  useEffect(() => {
    if (!config?.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (config.onCancel) {
          config.onCancel();
        } else {
          onClose();
        }
      } else if (e.key === 'Enter' && !config.isConfirm) {
        if (config.onConfirm) {
          config.onConfirm();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, onClose]);

  if (!config || !config.isOpen) return null;

  const type = config.type || 'info';

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          confirmBtn: 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-500/30',
        };
      case 'warning':
        return {
          confirmBtn: 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-500/30',
        };
      case 'danger':
        return {
          confirmBtn: 'bg-rose-700 hover:bg-rose-800 text-white focus:ring-rose-500/30',
        };
      case 'error':
        return {
          confirmBtn: 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-500/30',
        };
      case 'info':
      default:
        return {
          confirmBtn: 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-500/30',
        };
    }
  };

  const style = getTypeStyles();

  const handleConfirm = () => {
    if (config.onConfirm) {
      config.onConfirm();
    }
    onClose();
  };

  const handleCancel = () => {
    if (config.onCancel) {
      config.onCancel();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 dir-rtl">
      <div
        className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl border border-slate-200 relative overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        {/* Header - Minimal and Formal */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <img
              src="./drone_battery_app_icon.svg"
              alt="App Icon"
              className="w-7 h-7 object-contain"
            />
            <h3 id="dialog-title" className="text-base font-bold text-slate-800 leading-tight">
              {config.title}
            </h3>
          </div>
          <button
            onClick={handleCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="داخستن"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Message Content - Clean text */}
        <div className="py-5 space-y-2">
          <div className="text-sm font-medium text-slate-700 leading-relaxed">
            {typeof config.message === 'string' ? (
              <p className="whitespace-pre-line">{config.message}</p>
            ) : (
              config.message
            )}
          </div>

          {config.subMessage && (
            <p className="text-xs text-slate-500 font-normal">
              {config.subMessage}
            </p>
          )}
        </div>

        {/* Actions Row - Formal buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          {config.isConfirm && (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-all"
            >
              {config.cancelText || 'پاشگەزبوونەوە'}
            </button>
          )}

          <button
            type="button"
            autoFocus
            onClick={handleConfirm}
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all focus:outline-none focus:ring-2 shadow-sm ${style.confirmBtn}`}
          >
            {config.confirmText || (config.isConfirm ? 'پشتڕاستکردنەوە' : 'باشە')}
          </button>
        </div>
      </div>
    </div>
  );
};
