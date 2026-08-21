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
  const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  // ── Helpers ──────────────────────────────────────────────────────────────

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

  const formatCellVoltagesText = (b: Battery): string => {
    const entries = getActiveCells(b);
    if (entries.length > 0) return entries.map((e) => `${e.label}:${e.value}V`).join(' | ');
    return b.voltage ? `${b.voltage}V` : '—';
  };

  /** UI preview: pill badges for each cell */
  const renderCellPills = (b: Battery) => {
    const entries = getActiveCells(b);
    if (entries.length === 0) {
      return (
        <span className="text-slate-400 text-[10px] font-mono">
          {b.voltage ? `${b.voltage}V` : '—'}
        </span>
      );
    }
    return (
      <div className="flex flex-wrap items-center justify-center gap-0.5 dir-ltr max-w-[180px] mx-auto">
        {entries.map((entry) => (
          <span
            key={entry.label}
            className="inline-flex items-center gap-0.5 px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono font-bold text-slate-700"
          >
            <span className="text-slate-400">{entry.label}:</span>
            {entry.value}V
          </span>
        ))}
      </div>
    );
  };

  /** Print HTML: inline-styled pill badges */
  const getPrintCellVoltagesHtml = (b: Battery): string => {
    const entries = getActiveCells(b);
    if (entries.length === 0) {
      const txt = b.voltage ? `${b.voltage}V` : '—';
      return `<span style="color:#94a3b8;font-size:10px;font-family:monospace;">${txt}</span>`;
    }
    const pills = entries
      .map(
        (e) =>
          `<span style="display:inline-block;padding:1px 4px;margin:1px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:3px;font-size:9px;font-family:monospace;font-weight:700;color:#1e293b;"><span style="color:#94a3b8;font-size:8px;">${e.label}:</span>${e.value}V</span>`
      )
      .join('');
    return `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:2px;direction:ltr;">${pills}</div>`;
  };

  // ── Excel / CSV Export ───────────────────────────────────────────────────

  const handleExportExcel = () => {
    const headers = [
      '#',
      'ناوی باتری',
      'پۆلێنکاری',
      'ڕێژەی ستۆرج',
      'دوایین ستۆرج',
      'ماوەی دانراو (ڕۆژ)',
      'ڤۆڵتی سێڵەکان',
      'کاتی داهاتوو',
      'بارودۆخ',
    ];

    const rows = batteries.map((b, idx) => {
      const stats = calculateBatteryStats(b.lastChargeDate, b.reminderIntervalDays, today);
      
      // Safely escape strings
      const safeName = (b.name || 'بێ ناو').replace(/"/g, '""');
      const safeCategory = getNormalizedCategory(b.category);
      const safeStorage = b.storagePercentage !== undefined ? `${b.storagePercentage}%` : '—';
      const safeLastCharge = b.lastChargeDate || '—';
      const safeInterval = `${b.reminderIntervalDays} ڕۆژ`;
      const safeVoltages = formatCellVoltagesText(b).replace(/"/g, '""');
      const safeNextDate = formatGregorianKurdish(stats.nextDueDate);
      const safeStatus = stats.statusText;

      return [
        idx + 1,
        `"${safeName}"`,
        `"${safeCategory}"`,
        `"${safeStorage}"`,
        `"${safeLastCharge}"`,
        `"${safeInterval}"`,
        `"${safeVoltages}"`,
        `"${safeNextDate}"`,
        `"${safeStatus}"`,
      ];
    });

    // \uFEFF for UTF-8 BOM so Excel natively reads Unicode. 
    // We strictly use commas and double quotes.
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ڕاپۆرتی_ستۆرجی_باترییەکان_${today}.csv`;
    
    // Fallback for some environments
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  // ── Print / PDF ──────────────────────────────────────────────────────────

  const handlePrint = () => {
    const rowsHtml = batteries
      .map((b, idx) => {
        const stats = calculateBatteryStats(b.lastChargeDate, b.reminderIntervalDays, today);
        const cellsHtml = getPrintCellVoltagesHtml(b);
        const nextDueDateFormatted = formatGregorianKurdish(stats.nextDueDate);
        const storagePct = b.storagePercentage !== undefined ? `${b.storagePercentage}%` : '—';
        const intervalLabel = `${b.reminderIntervalDays} ڕۆژ`;

        const badge =
          stats.status === 'OVERDUE'
            ? { bg: '#fff1f2', color: '#9f1239', border: '#fecdd3' }
            : stats.status === 'TIME_TO_CHARGE'
            ? { bg: '#fff7ed', color: '#c2410c', border: '#fed7aa' }
            : stats.status === 'EARLY_WARNING'
            ? { bg: '#fffbeb', color: '#92400e', border: '#fde68a' }
            : { bg: '#f0fdf4', color: '#065f46', border: '#bbf7d0' };

        const rowBg = idx % 2 === 0 ? '#ffffff' : '#fafafa';

        return `
<tr style="background:${rowBg};page-break-inside:avoid;break-inside:avoid;">
  <td style="padding:7px 8px;text-align:center;font-weight:700;color:#94a3b8;border-bottom:1px solid #f1f5f9;font-size:10px;">${idx + 1}</td>
  <td style="padding:7px 10px;font-weight:800;color:#0f172a;border-bottom:1px solid #f1f5f9;font-size:11px;">${b.name}</td>
  <td style="padding:7px 10px;color:#475569;font-weight:600;border-bottom:1px solid #f1f5f9;font-size:10px;">${getNormalizedCategory(b.category)}</td>
  <td style="padding:7px 8px;text-align:center;font-weight:700;font-family:monospace;color:#047857;border-bottom:1px solid #f1f5f9;font-size:10px;">${storagePct}</td>
  <td style="padding:7px 10px;font-family:monospace;font-weight:600;color:#334155;border-bottom:1px solid #f1f5f9;font-size:10px;">${b.lastChargeDate}</td>
  <td style="padding:7px 8px;text-align:center;font-weight:700;color:#1e293b;border-bottom:1px solid #f1f5f9;font-size:10px;">${intervalLabel}</td>
  <td style="padding:7px 8px;text-align:center;border-bottom:1px solid #f1f5f9;">${cellsHtml}</td>
  <td style="padding:7px 10px;font-family:monospace;font-weight:700;color:#1d4ed8;border-bottom:1px solid #f1f5f9;font-size:10px;white-space:nowrap;">${nextDueDateFormatted}</td>
  <td style="padding:7px 8px;text-align:center;border-bottom:1px solid #f1f5f9;">
    <span style="padding:2px 7px;border-radius:4px;font-weight:700;font-size:9px;display:inline-block;background:${badge.bg};color:${badge.color};border:1px solid ${badge.border};white-space:nowrap;">
      ${stats.statusText}
    </span>
  </td>
</tr>`;
      })
      .join('');

    // Full project drone-battery SVG icon embedded as base64 for offline print
    const svgLogo = `<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="512" height="512" rx="108" fill="#FFFFFF"/>
      <g fill="#0B4F94" stroke="#0B4F94">
        <line x1="144" y1="144" x2="208" y2="208" stroke-width="18" stroke-linecap="round"/>
        <line x1="368" y1="144" x2="304" y2="208" stroke-width="18" stroke-linecap="round"/>
        <line x1="144" y1="368" x2="208" y2="304" stroke-width="18" stroke-linecap="round"/>
        <line x1="368" y1="368" x2="304" y2="304" stroke-width="18" stroke-linecap="round"/>
        <path d="M232 144 H280 V162 C280 165 277 168 274 168 H238 C235 168 232 165 232 162 Z" stroke="none"/>
        <rect x="196" y="164" width="120" height="184" rx="24" fill="none" stroke-width="18"/>
        <path d="M264 196 L230 258 H258 L246 320 L282 250 H254 L264 196 Z" stroke="none"/>
        <g transform="translate(144, 144)">
          <circle cx="0" cy="0" r="16" stroke="none"/>
          <path d="M 0 -5 L 35 -11 C 56 -14 70 -8 70 0 C 70 8 56 14 35 11 L 0 5 Z" transform="rotate(-45)" stroke="none"/>
          <path d="M 0 -5 L 35 -11 C 56 -14 70 -8 70 0 C 70 8 56 14 35 11 L 0 5 Z" transform="rotate(135)" stroke="none"/>
        </g>
        <g transform="translate(368, 144)">
          <circle cx="0" cy="0" r="16" stroke="none"/>
          <path d="M 0 -5 L 35 -11 C 56 -14 70 -8 70 0 C 70 8 56 14 35 11 L 0 5 Z" transform="rotate(-135)" stroke="none"/>
          <path d="M 0 -5 L 35 -11 C 56 -14 70 -8 70 0 C 70 8 56 14 35 11 L 0 5 Z" transform="rotate(45)" stroke="none"/>
        </g>
        <g transform="translate(144, 368)">
          <circle cx="0" cy="0" r="16" stroke="none"/>
          <path d="M 0 -5 L 35 -11 C 56 -14 70 -8 70 0 C 70 8 56 14 35 11 L 0 5 Z" transform="rotate(-135)" stroke="none"/>
          <path d="M 0 -5 L 35 -11 C 56 -14 70 -8 70 0 C 70 8 56 14 35 11 L 0 5 Z" transform="rotate(45)" stroke="none"/>
        </g>
        <g transform="translate(368, 368)">
          <circle cx="0" cy="0" r="16" stroke="none"/>
          <path d="M 0 -5 L 35 -11 C 56 -14 70 -8 70 0 C 70 8 56 14 35 11 L 0 5 Z" transform="rotate(-45)" stroke="none"/>
          <path d="M 0 -5 L 35 -11 C 56 -14 70 -8 70 0 C 70 8 56 14 35 11 L 0 5 Z" transform="rotate(135)" stroke="none"/>
        </g>
      </g>
    </svg>`;
    const svgB64 = btoa(unescape(encodeURIComponent(svgLogo)));

    const printDocHtml = `<!DOCTYPE html>
<html lang="ckb" dir="rtl">
<head>
  <meta charset="UTF-8"/>
  <title>ڕاپۆرتی ستۆرجی باترییەکان — ${today}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    @page { size: A4 landscape; margin: 10mm 14mm 12mm 14mm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Noto Kufi Arabic', 'Segoe UI', system-ui, sans-serif;
      color: #0f172a;
      direction: rtl;
      background: #fff;
      font-size: 11px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Page Header ── */
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 12px;
      margin-bottom: 14px;
      border-bottom: 2px solid #0f172a;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 52px;
      height: 52px;
      background: #fff;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
    }
    .brand-text h1 {
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.4px;
      line-height: 1.2;
    }
    .brand-text p {
      font-size: 10px;
      color: #64748b;
      font-weight: 600;
      margin-top: 2px;
    }
    .meta-block {
      text-align: left;
      font-size: 10px;
      color: #475569;
      font-weight: 600;
      line-height: 1.8;
    }




    /* ── Table ── */
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10.5px;
    }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; break-inside: avoid; }
    th {
      background: #0f172a;
      color: #ffffff;
      padding: 9px 10px;
      font-size: 10.5px;
      font-weight: 700;
      text-align: right;
      border: none;
      white-space: nowrap;
    }
    th.ctr { text-align: center; }
    tbody tr:last-child td { border-bottom: none; }

    /* ── Footer ── */
    .page-footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 6px 0;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: flex-start;
      direction: ltr;
      font-size: 10px;
      color: #94a3b8;
      font-family: monospace;
      font-weight: 600;
      background: #ffffff;
    }

  </style>
</head>
<body>

  <!-- ── Page Header ── -->
  <div class="page-header">
    <div class="brand">
      <div class="brand-logo">
        <img src="data:image/svg+xml;base64,${svgB64}" width="52" height="52" alt="logo" style="display:block;"/>
      </div>
      <div class="brand-text">
        <h1>سیستەمی بەڕێوەبردنی ستۆرجی باتری</h1>
        <p>ڕاپۆرتی فەرمی چاودێری و تۆمارکردنی باترییەکان</p>
      </div>
    </div>
    <div class="meta-block">
      <div>بەرواری چاپ: <strong>${today} | ${nowTime}</strong></div>
      <div style="margin-top:3px;">کۆی باترییەکان: <strong>${batteries.length}</strong></div>
    </div>
  </div>


  <!-- ── Main Table ── -->
  <table>
    <thead>
      <tr>
        <th class="ctr" style="width:32px;">#</th>
        <th style="min-width:85px;">ناوی باتری</th>
        <th style="min-width:75px;">پۆلێنکاری</th>
        <th class="ctr" style="width:55px;">ستۆرج%</th>
        <th style="width:88px;">دوایین ستۆرج</th>
        <th class="ctr" style="width:70px;">ماوەی دانراو</th>
        <th class="ctr" style="min-width:115px;">ڤۆڵتی سێڵەکان</th>
        <th style="width:105px;">کاتی داهاتوو</th>
        <th class="ctr" style="width:95px;">بارودۆخ</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <!-- ── Page Footer ── -->
  <div class="page-footer">
    <span>1</span>
  </div>

</body>
</html>`;

    const printFrame = document.createElement('iframe');
    printFrame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:none;';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) return;
    doc.open();
    doc.write(printDocHtml);
    doc.close();

    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        try { document.body.removeChild(printFrame); } catch (_) {}
      }, 1500);
    }, 500);
  };

  // ── UI Preview ───────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 dir-rtl">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-100 relative max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
              <PrinterIcon className="w-[18px] h-[18px] text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 leading-tight">
                پێشاندانی ڕاپۆرت پێش چاپکردن
              </h3>
              <p className="text-[10.5px] text-slate-400 mt-0.5 font-medium">
                خشتەی مینیماڵ بۆ چاپکردن (A4) یان داگرتنی Excel
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <TableCellsIcon className="w-4 h-4 text-emerald-600" />
              <span>Excel</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5"
            >
              <PrinterIcon className="w-4 h-4 text-emerald-400" />
              <span>چاپکردن / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Report Preview Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col justify-between min-h-[420px]">

          <div className="space-y-4">
            {/* Report identity header */}
            <div className="flex items-center justify-between pb-3 border-b-2 border-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
                  <img
                    src="./drone_battery_app_icon.svg"
                    alt="App Icon"
                    className="w-5 h-5 object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-[13px] font-black text-slate-900 leading-tight tracking-tight">
                    سیستەمی بەڕێوەبردنی ستۆرجی باتری
                  </h1>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                    ڕاپۆرتی فەرمی چاودێری و تۆمارکردنی باترییەکان
                  </p>
                </div>
              </div>
              <div className="text-[10.5px] font-mono text-slate-700 font-bold bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-2">
                <span>{today}</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">{nowTime}</span>
              </div>
            </div>

            {/* Main Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-right text-[10.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-2.5 py-3 text-center w-8 font-bold text-[10px]">#</th>
                    <th className="px-3 py-3 font-bold">ناوی باتری</th>
                    <th className="px-3 py-3 font-bold">پۆلێنکاری</th>
                    <th className="px-2.5 py-3 text-center font-bold w-14">ستۆرج%</th>
                    <th className="px-3 py-3 font-bold w-24">دوایین ستۆرج</th>
                    <th className="px-2.5 py-3 text-center font-bold w-20">ماوەی دانراو</th>
                    <th className="px-2.5 py-3 text-center font-bold">ڤۆڵتی سێڵەکان</th>
                    <th className="px-3 py-3 font-bold w-28">کاتی داهاتوو</th>
                    <th className="px-2.5 py-3 text-center font-bold w-22">بارودۆخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batteries.map((b, index) => {
                    const stats = calculateBatteryStats(b.lastChargeDate, b.reminderIntervalDays, today);
                    const nextDueDateFormatted = formatGregorianKurdish(stats.nextDueDate);

                    return (
                      <tr key={b.id} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}>
                        <td className="px-2.5 py-2 text-center font-bold text-slate-400 text-[10px]">{index + 1}</td>
                        <td className="px-3 py-2 font-black text-slate-900">{b.name}</td>
                        <td className="px-3 py-2 text-slate-500 font-semibold text-[10px]">{getNormalizedCategory(b.category)}</td>
                        <td className="px-2.5 py-2 text-center font-bold text-emerald-700 font-mono">
                          {b.storagePercentage !== undefined ? `${b.storagePercentage}%` : '—'}
                        </td>
                        <td className="px-3 py-2 font-mono font-semibold text-slate-600 text-[10px]">{b.lastChargeDate}</td>
                        <td className="px-2.5 py-2 text-center">
                          <span className="inline-block bg-slate-100 border border-slate-200 text-slate-700 font-bold font-mono text-[10px] px-2 py-0.5 rounded">
                            {b.reminderIntervalDays} ڕۆژ
                          </span>
                        </td>
                        <td className="px-2.5 py-2 text-center">{renderCellPills(b)}</td>
                        <td className="px-3 py-2 font-mono font-bold text-blue-700 text-[10px]">{nextDueDateFormatted}</td>
                        <td className="px-2.5 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9.5px] inline-block ${
                            stats.status === 'ON_TIME'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : stats.status === 'EARLY_WARNING'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : stats.status === 'TIME_TO_CHARGE'
                              ? 'bg-orange-50 text-orange-800 border border-orange-200'
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

          {/* Footer note pinned to the bottom */}
          <div className="flex items-center justify-start dir-ltr pt-3 border-t border-slate-200 text-[10.5px] font-mono font-semibold text-slate-400 mt-auto">
            <span>1</span>
          </div>

        </div>
      </div>
    </div>
  );
};
