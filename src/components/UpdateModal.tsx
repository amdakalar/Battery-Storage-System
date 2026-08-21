import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { UpdateCheckResult } from '../types';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateData: UpdateCheckResult | null;
  onExportBackup?: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  updateData,
  onExportBackup,
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
    if (!updateData.downloadUrl) {
      setErrorMessage('لینکی داونلۆدکردنی ئاپدەیت نەدۆزرایەوە. تکایە دڵنیابەرەوە پەڕگەی Setup.exe دانراوە.');
      return;
    }

    setDownloading(true);
    setErrorMessage(null);

    try {
      if ((window as any).electronAPI?.downloadAndInstallUpdate) {
        const res = await (window as any).electronAPI.downloadAndInstallUpdate(
          updateData.downloadUrl,
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
        window.open(updateData.downloadUrl, '_blank');
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
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200/90 relative space-y-4 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-2xs shrink-0 border border-slate-800">
              {downloadComplete ? <CheckCircleIcon className="w-5 h-5 text-emerald-400" /> : <SparklesIcon className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">
                {downloadComplete ? 'ئامادەیە بۆ دامەزراندن' : 'وەشانی نوێی بەرنامە بەردەستە'}
              </h3>
              <p className="text-[11px] text-slate-400 font-bold mt-0.5">
                سیستەمی بەڕێوەبردنی ستۆرج • نوێکردنەوەی فەرمی
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={downloading}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
            title="داخستن"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {downloadComplete ? (
          /* ───── Formal In-App Download Complete State ───── */
          <div className="space-y-4 py-2 animate-in fade-in duration-200">
            <div className="p-4 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl flex items-start gap-3.5 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircleIcon className="w-6 h-6" />
              </div>
              <div className="space-y-1 min-w-0">
                <h4 className="text-xs font-extrabold text-emerald-950">
                  داونلۆدکردنی ئاپدەیت بە سەرکەوتوویی تەواوبوو!
                </h4>
                <p className="text-[11px] text-emerald-900/90 font-medium leading-relaxed">
                  فایلی تەنسیبی وەشانی نوێ (<span className="font-mono font-bold">v{updateData.latestVersion}</span>) ئامادەکرا و سیستەمی دامەزراندن دەستیپێکرد.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>دڵنیایی تەواوی پاراستنی داتاکان:</span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                سەرجەم باترییەکان و مێژووەکەت بە تەواوی پارێزراون. بۆ ئەوەی دامەزراندنی وەشانی نوێ تەواو ببێت، پێویستە بەرنامەکە دابخرێت.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all cursor-pointer"
              >
                دواخستن
              </button>
              <button
                type="button"
                onClick={handleQuitAndInstall}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <span>داخستنی سیستەم و تەواوکردنی ئینستۆڵ</span>
              </button>
            </div>
          </div>
        ) : (
          /* ───── Normal Update Details State ───── */
          <>
            {/* Version Comparison */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-400 font-bold block text-[10px]">وەشانی ئێستا</span>
                <span className="font-mono font-bold text-slate-700 text-xs">v{updateData.currentVersion || '1.0.0'}</span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-400 font-bold text-sm">
                <span>➜</span>
              </div>

              <div className="text-left">
                <span className="text-emerald-700 font-bold block text-[10px]">وەشانی نوێ</span>
                <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 text-xs">
                  v{updateData.latestVersion}
                </span>
              </div>
            </div>

            {/* Data Protection & Backup Reassurance */}
            <div className="p-4 bg-slate-50/60 border border-slate-200/90 rounded-xl text-xs text-slate-800 space-y-2.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-black text-slate-900">
                  <ShieldCheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>دڵنیایی پاراستنی تەواوی داتاکان (Data Safety)</span>
                </div>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  پارێزراوە
                </span>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                نوێکردنەوەی بەرنامە داتابەیس و زانیاریی سەرجەم باترییەکان و مێژووەکەت بە تەواوی دەپارێزێت و ناسڕێتەوە. سیستەم لە کاتی ئاپدەیتدا بە شێوەی ئۆتۆماتیکی پاشکەوت (Auto-Backup) دروست دەکات.
              </p>

              {onExportBackup && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={onExportBackup}
                    className="w-full py-2 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold text-[11px] rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    title="داگرتنی فایلێکی JSON لە سەرجەم باترییەکان بۆ دڵنیایی زیاتر"
                  >
                    <ArrowDownTrayIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>داگرتنی کۆپیی پشتیوانی داتا (Export Backup JSON) بۆ دڵنیایی تەواو</span>
                  </button>
                </div>
              )}
            </div>

            {/* File info */}
            {updateData.fileName && (
              <div className="text-[11px] text-slate-500 font-semibold flex items-center justify-between px-1 bg-slate-50/50 py-2 rounded-lg border border-slate-100">
                <span className="truncate">📦 {updateData.fileName}</span>
                {updateData.fileSize ? <span className="font-mono font-bold shrink-0">{formatBytes(updateData.fileSize)}</span> : null}
              </div>
            )}

            {/* Download Progress Bar */}
            {downloading && (
              <div className="space-y-2 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl animate-in fade-in duration-200">
                <div className="flex items-center justify-between text-xs font-extrabold text-emerald-950">
                  <span className="flex items-center gap-1.5">
                    <ArrowPathIcon className="w-4 h-4 text-emerald-700 animate-spin" />
                    <span>داونلۆدکردنی ئاپدەیتى نوێ...</span>
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
                  <div className="text-[10px] text-emerald-800 font-bold text-left" dir="ltr">
                    {formatBytes(progress.transferred)} / {formatBytes(progress.total)}
                  </div>
                )}
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
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={downloading}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                دواخستن
              </button>
              <button
                type="button"
                onClick={handleStartDownload}
                disabled={downloading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                <ArrowDownTrayIcon className="w-4 h-4 text-emerald-100" />
                <span>{downloading ? 'داونلۆد دەکرێت...' : 'داونلۆد و ئینستاڵکردنی ئەپدەیت'}</span>
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
