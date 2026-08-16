/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PrinterIcon, TableCellsIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Battery } from '../types';
import { calculateBatteryStats, formatGregorianKurdish, getTodayISODate } from '../utils/dateUtils';
import { getNormalizedCategory } from '../constants/categories';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  batteries: Battery[];
  simulatedReferenceDate?: string;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  batteries,
  simulatedReferenceDate,
}) => {
  if (!isOpen) return null;

  const today = simulatedReferenceDate || getTodayISODate();
  const formattedToday = formatGregorianKurdish(today);

  // Helper to extract active cells (Cell 1 to Cell 12)
  const getActiveCells = (b: Battery) => {
    const cells = b.cells || {};
    const entries: { label: string; value: number }[] = [];
    for (let i = 1; i <= 12; i++) {
      const val = (cells as any)[`cell${i}`];
      if (val !== undefined && val !== null && val !== '') {
        entries.push({ label: `C${i}`, value: Number(val) });
      }
    }
    return entries;
  };

  // Cell voltage text for Excel CSV Export
  const formatCellVoltagesText = (b: Battery): string => {
    const entries = getActiveCells(b);
    if (entries.length > 0) {
      return entries.map((e) => `${e.label}:${e.value}V`).join(' | ');
    }
    return b.voltage ? `${b.voltage}V` : 'نادیار';
  };

  // React Cell Voltage Pill Renderer for UI Table Preview
  const renderCellPills = (b: Battery) => {
    const entries = getActiveCells(b);

    if (entries.length === 0) {
      return <span className="text-slate-400 font-sans text-xs">{b.voltage ? `${b.voltage}V` : 'نادیار'}</span>;
    }

    return (
      <div className="flex flex-wrap items-center justify-center gap-1 dir-ltr max-w-xs mx-auto">
        {entries.map((entry) => (
          <span
            key={entry.label}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-slate-100 border border-slate-200/80 rounded-md text-[10px] font-mono font-bold text-slate-800 shrink-0"
          >
            <span className="text-slate-400 font-sans text-[9px]">{entry.label}:</span>
            <span>{entry.value}V</span>
          </span>
        ))}
      </div>
    );
  };

  // HTML Cell Voltage Pill Generator for Print Document
  const getPrintCellVoltagesHtml = (b: Battery): string => {
    const entries = getActiveCells(b);

    if (entries.length === 0) {
      return `<span style="color: #64748b; font-size: 11px;">${b.voltage ? `${b.voltage}V` : 'نادیار'}</span>`;
    }

    const pillsHtml = entries
      .map(
        (e) =>
          `<span style="display: inline-block; padding: 2px 5px; margin: 1px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 10px; font-family: monospace; font-weight: bold; color: #0f172a;"><span style="color: #64748b; font-size: 9px;">${e.label}:</span> ${e.value}V</span>`
      )
      .join('');

    return `<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 2px; direction: ltr;">${pillsHtml}</div>`;
  };

  // Handle Excel CSV Export
  const handleExportExcel = () => {
    const headers = [
      '#',
      'ناوی باتری',
      'پۆلێنکاری',
      'ڕێژەی ستۆرج',
      'دوایین ستۆرج',
      'ڤۆڵتی سێڵەکان (Cell 1 - Cell 12)',
      'کاتی داهاتوو',
      'بارودۆخ'
    ];

    const rows = batteries.map((b, idx) => {
      const stats = calculateBatteryStats(b.lastChargeDate, b.reminderIntervalDays, today);
      const cellText = formatCellVoltagesText(b);
      const storagePctText = b.storagePercentage !== undefined ? `${b.storagePercentage}%` : 'نادیار';

      return [
        idx + 1,
        `"${b.name.replace(/"/g, '""')}"`,
        `"${getNormalizedCategory(b.category)}"`,
        `"${storagePctText}"`,
        `"${b.lastChargeDate}"`,
        `"${cellText}"`,
        `"${stats.nextDueDate}"`,
        `"${stats.statusText}"`
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ڕاپۆرتی_ستۆرجی_باترییەکان_${today}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Handle Reliable A4 Print & PDF Generation
  const handlePrint = () => {
    const rowsHtml = batteries
      .map((b, idx) => {
        const stats = calculateBatteryStats(b.lastChargeDate, b.reminderIntervalDays, today);
        const cellsHtml = getPrintCellVoltagesHtml(b);

        let statusBg = '#ecfdf5';
        let statusColor = '#065f46';
        let statusBorder = '#a7f3d0';

        if (stats.status === 'OVERDUE') {
          statusBg = '#fff1f2';
          statusColor = '#9f1239';
          statusBorder = '#fecdd3';
        } else if (stats.status === 'TIME_TO_CHARGE') {
          statusBg = '#fff7ed';
          statusColor = '#9a3412';
          statusBorder = '#fed7aa';
        } else if (stats.status === 'EARLY_WARNING') {
          statusBg = '#fffbeb';
          statusColor = '#92400e';
          statusBorder = '#fef3c7';
        }

        return `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; page-break-inside: avoid; break-inside: avoid;">
          <td style="padding: 7px 8px; text-align: center; font-weight: bold; border: 1px solid #e2e8f0; vertical-align: middle; color: #475569;">${idx + 1}</td>
          <td style="padding: 7px 10px; font-weight: bold; border: 1px solid #e2e8f0; color: #0f172a; vertical-align: middle;">${b.name}</td>
          <td style="padding: 7px 10px; border: 1px solid #e2e8f0; vertical-align: middle; font-weight: bold; color: #334155;">${getNormalizedCategory(b.category)}</td>
          <td style="padding: 7px 8px; text-align: center; font-weight: bold; font-family: monospace; border: 1px solid #e2e8f0; vertical-align: middle; color: #065f46;">${b.storagePercentage !== undefined ? `${b.storagePercentage}%` : '-'}</td>
          <td style="padding: 7px 10px; font-family: monospace; border: 1px solid #e2e8f0; vertical-align: middle; font-weight: bold; color: #0f172a;">${b.lastChargeDate}</td>
          <td style="padding: 7px 8px; text-align: center; border: 1px solid #e2e8f0; vertical-align: middle;">${cellsHtml}</td>
          <td style="padding: 7px 10px; font-family: monospace; border: 1px solid #e2e8f0; vertical-align: middle; font-weight: bold; color: #334155;">${stats.nextDueDate}</td>
          <td style="padding: 7px 8px; text-align: center; border: 1px solid #e2e8f0; vertical-align: middle;">
            <span style="padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 10px; display: inline-block; background-color: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; whitespace: nowrap;">
              ${stats.statusText}
            </span>
          </td>
        </tr>
      `;
      })
      .join('');

    const printDocHtml = `
      <!DOCTYPE html>
      <html lang="ckb" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>ڕاپۆرتی بەڕێوەبردنی ستۆرج - ${formattedToday}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 12mm 12mm;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            color: #0f172a;
            direction: rtl;
            background: #ffffff;
            font-size: 11px;
            line-height: 1.4;
          }
          .header-box {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 10px;
            margin-bottom: 12px;
          }
          .brand-title {
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
            margin: 0;
          }
          .brand-sub {
            font-size: 11px;
            color: #64748b;
            margin: 3px 0 0 0;
            font-weight: 600;
          }
          .report-meta {
            text-align: left;
            font-size: 11px;
            font-weight: bold;
            color: #334155;
          }
          .summary-bar {
            display: flex;
            gap: 15px;
            margin-bottom: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 8px 12px;
            font-size: 11px;
            font-weight: bold;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-top: 5px;
          }
          thead {
            display: table-header-group;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            padding: 8px;
            font-size: 11px;
            font-weight: bold;
            text-align: right;
            border: 1px solid #0f172a;
          }
          th.center { text-align: center; }
          .footer {
            margin-top: 15px;
            padding-top: 8px;
            border-top: 1px solid #cbd5e1;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #64748b;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div>
            <h1 class="brand-title">سیستەمی بەڕێوەبردنی ستۆرجی باتری</h1>
            <p class="brand-sub">ڕاپۆرتی فەرمی خشتەی چاودێری و ڤۆڵتی سێڵەکان</p>
          </div>
          <div class="report-meta">
            <div>بەرواری چاپ: ${formattedToday}</div>
            <div style="font-size: 10px; color: #64748b; margin-top: 2px;">کۆی باترییەکان: ${batteries.length} باتری</div>
          </div>
        </div>

        <div class="summary-bar">
          <span>کۆی گشتی: <strong>${batteries.length}</strong></span>
          <span>بەرواری سیستەم: <strong>${today}</strong></span>
          <span>دۆخی ڕاپۆرت: <strong>چاپکراوی فەرمی A4</strong></span>
        </div>

        <table>
          <thead>
            <tr>
              <th class="center" style="width: 35px;">#</th>
              <th>ناوی باتری</th>
              <th>پۆلێنکاری</th>
              <th style="width: 90px;">دوایین ستۆرج</th>
              <th class="center">ڤۆڵتی سێڵەکان (Cell 1 - 12)</th>
              <th style="width: 90px;">کاتی داهاتوو</th>
              <th class="center" style="width: 100px;">بارودۆخ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <span>لاپەڕەی چاپکراو - سیستەمی بەڕێوەبردنی ستۆرجی باترییەکان</span>
        </div>
      </body>
      </html>
    `;

    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    document.body.appendChild(printFrame);
    
    printFrame.contentWindow?.document.open();
    printFrame.contentWindow?.document.write(printDocHtml);
    printFrame.contentWindow?.document.close();
    
    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        try {
          document.body.removeChild(printFrame);
        } catch (e) {}
      }, 1000);
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 dir-rtl">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-7 shadow-2xl border border-slate-200/80 relative max-h-[90vh] flex flex-col">
        
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <PrinterIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                پێشاندانی ڕاپۆرت پێش چاپکردن (A4)
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                بینینی خشتەی مینیماڵی ڕێکخراو بۆ چاپکردن یان داگرتنی Excel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
              title="داگرتنی خشتە بە فۆرماتی Excel"
            >
              <TableCellsIcon className="w-4 h-4 text-emerald-600" />
              <span>داگرتنی Excel</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs"
            >
              <PrinterIcon className="w-4 h-4 text-emerald-400" />
              <span>چاپکردن / PDF (A4)</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Preview Body */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-4 text-slate-900">
          
          {/* Header Title & Date Stamp */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <img
                src="./drone_battery_app_icon.svg"
                alt="App Icon"
                className="w-8 h-8 rounded-xl border border-slate-200 object-cover shrink-0"
              />
              <div>
                <h1 className="text-base font-extrabold text-slate-900 leading-tight">
                  سیستەمی بەڕێوەبردنی ستۆرجی باتری
                </h1>
                <p className="text-[11px] text-slate-500 font-semibold">خشتەی فەرمی پاترییەکان و ڤۆڵتی سێڵەکان</p>
              </div>
            </div>
            <div className="text-xs font-mono text-slate-700 font-bold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              بەرواری ڕاپۆرت: {formattedToday}
            </div>
          </div>

          {/* Clean 7-Column Minimal Table Preview */}
          <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold border-b border-slate-900">
                  <th className="p-2.5 text-center w-10">#</th>
                  <th className="p-2.5">ناوی باتری</th>
                  <th className="p-2.5">پۆلێنکاری</th>
                  <th className="p-2.5 text-center">ڕێژەی ستۆرج</th>
                  <th className="p-2.5">دوایین ستۆرج</th>
                  <th className="p-2.5 text-center">ڤۆڵتی سێڵەکان (Cell 1 - Cell 12)</th>
                  <th className="p-2.5">کاتی داهاتوو</th>
                  <th className="p-2.5 text-center">بارودۆخ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 font-medium text-slate-800">
                {batteries.map((b, index) => {
                  const stats = calculateBatteryStats(b.lastChargeDate, b.reminderIntervalDays, today);

                  return (
                    <tr key={b.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                      <td className="p-2.5 text-center font-bold text-slate-500 align-middle">{index + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900 align-middle">{b.name}</td>
                      <td className="p-2.5 align-middle font-bold text-slate-700">{getNormalizedCategory(b.category)}</td>
                      <td className="p-2.5 text-center font-bold text-emerald-700 font-mono align-middle">
                        {b.storagePercentage !== undefined ? `%${b.storagePercentage}` : '-'}
                      </td>
                      <td className="p-2.5 font-mono align-middle font-bold">{b.lastChargeDate}</td>
                      <td className="p-2.5 text-center align-middle">
                        {renderCellPills(b)}
                      </td>
                      <td className="p-2.5 font-mono text-slate-700 align-middle font-bold">{stats.nextDueDate}</td>
                      <td className="p-2.5 text-center align-middle">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] inline-block ${
                          stats.status === 'ON_TIME'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : stats.status === 'EARLY_WARNING'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : stats.status === 'TIME_TO_CHARGE'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-rose-50 text-rose-800 border border-rose-200'
                        }`}>
                          {stats.statusText}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
};
