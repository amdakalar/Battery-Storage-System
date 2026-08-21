/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StatusType, BatteryStats } from '../types';

/**
 * Gregorian Kurdish Month Names
 */
export const KURDISH_GREGORIAN_MONTHS = [
  'کانونی دووەم',
  'شبات',
  'ئازار',
  'نیسان',
  'ئایار',
  'حوزەیران',
  'تەممووز',
  'ئاب',
  'ئەیلوول',
  'تشرینی یەکەم',
  'تشرینی دووەم',
  'کانونی یەکەم',
];

/**
 * Converts standard numbers to Kurdish digits if needed, or formats cleanly
 */
export function toKurdishDigits(num: number | string): string {
  const kurdishDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num
    .toString()
    .replace(/[0-9]/g, (w) => kurdishDigits[parseInt(w, 10)]);
}

/**
 * Normalizes date string to YYYY-MM-DD format using local time
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes date string to YYYY-MM-DD format using UTC time (prevents timezone drift)
 */
export function toISOUTCDateString(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns today's date in YYYY-MM-DD
 */
export function getTodayISODate(): string {
  return toISODateString(new Date());
}

/**
 * Calculates calendar day difference between two YYYY-MM-DD dates
 */
export function calculateDaysBetween(startDateStr: string, endDateStr: string): number {
  if (!startDateStr || !endDateStr) return 0;
  const cleanStart = startDateStr.split('T')[0];
  const cleanEnd = endDateStr.split('T')[0];
  const [y1, m1, d1] = cleanStart.split('-').map(Number);
  const [y2, m2, d2] = cleanEnd.split('-').map(Number);
  
  if (isNaN(y1) || isNaN(m1) || isNaN(d1) || isNaN(y2) || isNaN(m2) || isNaN(d2)) {
    return 0;
  }
  
  const utc1 = Date.UTC(y1, m1 - 1, d1);
  const utc2 = Date.UTC(y2, m2 - 1, d2);
  
  return Math.round((utc2 - utc1) / (1000 * 60 * 60 * 24));
}

/**
 * Format a YYYY-MM-DD Gregorian date to readable Kurdish format
 * e.g. "2026/07/25 (25ی تەممووز)"
 */
export function formatGregorianKurdish(dateStr: string): string {
  if (!dateStr) return 'تۆمار نەکراوە';
  
  const cleanDateStr = dateStr.split('T')[0];
  const parts = cleanDateStr.split('-');
  if (parts.length !== 3) return dateStr;
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  
  if (isNaN(year) || isNaN(month) || isNaN(day)) return dateStr;
  
  const monthName = (month >= 1 && month <= 12) ? KURDISH_GREGORIAN_MONTHS[month - 1] : `${month}`;
  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')} (${day}ی ${monthName})`;
}

/**
 * Calculates date offset by adding specified days to a YYYY-MM-DD string
 */
export function addDaysToISO(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const cleanDateStr = dateStr.split('T')[0];
  const [y, m, d] = cleanDateStr.split('-').map(Number);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return dateStr;
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return toISOUTCDateString(date);
}

/**
 * Calculates battery stats based on last charge date and reminder interval (default 40 days)
 */
export function calculateBatteryStats(
  lastChargeDateStr: string,
  reminderIntervalDays: number = 40,
  referenceDateStr?: string
): BatteryStats {
  const safeInterval = Math.max(1, Number(reminderIntervalDays) || 40);
  const todayStr = referenceDateStr || getTodayISODate();
  const daysElapsed = Math.max(0, calculateDaysBetween(lastChargeDateStr, todayStr));
  const daysRemaining = safeInterval - daysElapsed;
  const nextDueDate = addDaysToISO(lastChargeDateStr, safeInterval);
  
  // Calculate status:
  // - Days 0 to 34: ON_TIME ("لە کاتی خۆیدایە")
  // - Days 35-39: EARLY_WARNING ("نزیک لە کاتی ستۆرجکردن")  -- NEW 5-day early warning
  // - Day 40: TIME_TO_CHARGE ("کاتی ستۆرج هاتووە")
  // - Day 41+: OVERDUE ("دواکەوتوو")
  let status: StatusType = 'ON_TIME';
  let statusText = 'لە کاتی خۆیدایە';
  
  if (daysElapsed > safeInterval) {
    status = 'OVERDUE';
    statusText = 'دواکەوتوو';
  } else if (daysElapsed === safeInterval) {
    status = 'TIME_TO_CHARGE';
    statusText = 'کاتی ستۆرج هاتووە';
  } else if (daysElapsed >= safeInterval - 5) {
    // 35-39 days: Early warning (5 days before due)
    status = 'EARLY_WARNING';
    statusText = `نزیك لە کاتی ستۆرج (${daysRemaining} ڕۆژ ماوە)`;
  } else {
    status = 'ON_TIME';
    statusText = 'لە کاتی خۆیدا';
  }
  
  // Status styling colors
  let statusColorClass = {
    bg: 'bg-emerald-500',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    ring: 'stroke-emerald-500',
    lightBg: 'bg-emerald-50/60',
  };
  
  if (status === 'EARLY_WARNING') {
    statusColorClass = {
      bg: 'bg-orange-500',
      text: 'text-orange-700',
      border: 'border-orange-300',
      badge: 'bg-orange-100 text-orange-900 border-orange-300',
      ring: 'stroke-orange-500',
      lightBg: 'bg-orange-50/60',
    };
  } else if (status === 'TIME_TO_CHARGE') {
    statusColorClass = {
      bg: 'bg-amber-500',
      text: 'text-amber-700',
      border: 'border-amber-300',
      badge: 'bg-amber-100 text-amber-900 border-amber-300',
      ring: 'stroke-amber-500',
      lightBg: 'bg-amber-50/60',
    };
  } else if (status === 'OVERDUE') {
    statusColorClass = {
      bg: 'bg-rose-600',
      text: 'text-rose-700',
      border: 'border-rose-300',
      badge: 'bg-rose-100 text-rose-900 border-rose-300',
      ring: 'stroke-rose-600',
      lightBg: 'bg-rose-50/60',
    };
  }
  
  // Progress percentage (0% at day 0, 100% at 40 days)
  const progressPercentage = Math.min(100, Math.max(0, Math.round((daysElapsed / safeInterval) * 100)));
  
  return {
    lastChargeDateFormatted: formatGregorianKurdish(lastChargeDateStr),
    nextDueDate,
    daysElapsed,
    daysRemaining,
    status,
    statusText,
    statusColorClass,
    progressPercentage,
  };
}
