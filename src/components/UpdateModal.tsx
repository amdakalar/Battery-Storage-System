/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon, ArrowPathIcon, CheckCircleIcon, ExclamationTriangleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { UpdateCheckResult } from '../types';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateData: UpdateCheckResult | null;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  updateData,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState<{ percent: number; transferred: number; total: number }>({
    percent: 0,
    transferred: 0,
    total: 0,
  });
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setDownloading(false);
      setProgress({ percent: 0, transferred: 0, total: 0 });
      setDownloadComplete(false);
      setErrorMessage(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.onUpdateProgress) {
      const unsubscribe = (window as any).electronAPI.onUpdateProgress((prog: any) => {
        setProgress(prog);
      });
      return () => unsubscribe();
    }
  }, []);

  if (!isOpen || !updateData) return null;

  const handleStartDownload = async () => {
    const downloadTarget = updateData.downloadUrl;
    if (!downloadTarget) {
      if (updateData.htmlUrl) {
        window.open(updateData.htmlUrl, '_blank');
      } else {
        setErrorMessage('لینکی داونلۆدکردن لە ریلیزی گیتهاپ نەدۆزرایەوە.');
      }
      return;
    }

    setDownloading(true);
    setErrorMessage(null);

    try {
      if ((window as any).electronAPI?.downloadAndInstallUpdate) {
        const res = await (window as any).electronAPI.downloadAndInstallUpdate(
          downloadTarget,
          updateData.fileName || 'BatterySystemSetup.exe'
        );

        if (res.success) {
          setDownloadComplete(true);
          setDownloading(false);
        } else {
          setErrorMessage(res.error || 'کێشە لە داونلۆدکردنی ئەپدەیت ڕوویدا');
          setDownloading(false);
        }
      } else {
        // Fallback in web browser mode: open download URL directly in new tab
        window.open(downloadTarget, '_blank');
        setDownloading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'کێشە لە پەیوەندیکردن ڕوویدا');
      setDownloading(false);
    }
  };

  const handleQuitAndInstall = async () => {
    if ((window as any).electronAPI?.quitApp) {
      await (window as any).electronAPI.quitApp();
    } else {
      onClose();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 dir-rtl">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/80 relative space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
              <SparklesIcon className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                {updateData.hasUpdate ? 'وەشانی نوێی بەرنامە بەردەستە!' : 'نوێکردنەوەی بەرنامە'}
              </h3>
              <p className="text-[11px] text-slate-500 font-bold mt-0.5">
                {updateData.releaseName || `وەشانی v${updateData.latestVersion}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={downloading}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50"
            title="داخستن"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Version Badges */}
        <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
          <div>
            <span className="text-slate-500 font-semibold block text-[10px]">وەشانی پێشوو</span>
            <span className="font-mono font-bold text-slate-700">v{updateData.currentVersion || '1.0.0'}</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-600 font-extrabold">
            <span>➜</span>
          </div>

          <div className="text-left">
            <span className="text-emerald-700 font-semibold block text-[10px]">وەشانی نوێ</span>
            <span className="font-mono font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-300">
              v{updateData.latestVersion}
            </span>
          </div>
        </div>

        {/* Release Notes */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            تێبینییەکانی ئەم وەشانە (Release Notes):
          </label>
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 font-medium max-h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap font-sans">
            {updateData.releaseNotes || 'هیچ تێبینییەک دیاری نەکراوە.'}
          </div>
        </div>

        {/* File info */}
        {updateData.fileName && (
          <div className="text-[11px] text-slate-500 font-bold flex items-center justify-between px-1">
            <span>📦 پەڕگەی دامەزراندن: {updateData.fileName}</span>
            {updateData.fileSize ? <span>{formatBytes(updateData.fileSize)}</span> : null}
          </div>
        )}

        {/* Download Progress Bar */}
        {downloading && (
          <div className="space-y-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs font-extrabold text-emerald-950">
              <span className="flex items-center gap-1.5">
                <ArrowPathIcon className="w-4 h-4 text-emerald-700 animate-spin" />
                <span>داونلۆدکردنی ئەپدەیت لە گیتهاپ...</span>
              </span>
              <span className="font-mono">{progress.percent}%</span>
            </div>

            <div className="w-full h-2.5 bg-emerald-200/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                style={{ width: `${progress.percent}%` }}
              ></div>
            </div>

            {progress.total > 0 && (
              <div className="text-[10px] text-emerald-800 font-bold text-left dir-ltr">
                {formatBytes(progress.transferred)} / {formatBytes(progress.total)}
              </div>
            )}
          </div>
        )}

        {/* Download Complete Success Notice */}
        {downloadComplete && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold space-y-1.5 flex items-start gap-2">
            <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p>داونلۆدکردنی پەڕگەکە بە سەرکەوتوویی تەواوبوو!</p>
              <p className="text-[11px] font-medium text-emerald-800">
                سیستەمی تەنسیبەکە لەسەر کۆمپیوتەرەکەت دەستپێکرا. دەتوانیت بەرنامەکە داخەیت تاوەکو دامەزراندنەکە تەواو ببێت.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-bold flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          {!downloadComplete ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={downloading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all disabled:opacity-50"
              >
                دواخستن
              </button>
              <button
                type="button"
                onClick={handleStartDownload}
                disabled={downloading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>{downloading ? 'داونلۆد دەکرێت...' : 'داونلۆد و ئینستاڵکردنی ئەپدەیت'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleQuitAndInstall}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
            >
              <span>داخستنی بەرنامەکە بۆ تەواوبوونی ئینستۆڵ</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
