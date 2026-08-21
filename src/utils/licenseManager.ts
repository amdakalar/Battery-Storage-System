/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LicenseState, LicenseType } from '../types';

const LICENSE_STORAGE_KEY = 'kurdish_battery_system_license_data_v2';
const IDB_DB_NAME = 'kurdish_battery_license_idb';
const IDB_STORE_NAME = 'license_store';

export const ADMIN_CODE = '3029059';

export const DEVELOPER_INFO = {
  name: 'Ahmed _M_Salih',
  phone: '07725197598',
  phoneDisplay: '7725197598',
  whatsappUrl: 'https://wa.me/9647725197598',
  telUrl: 'tel:07725197598',
};

// Sample Activation Keys showing 302... for security
export const SAMPLE_ACTIVATION_KEYS = {
  sixMonths: ['302... (شەش مانگ)'],
  oneYear: ['302... (یەک ساڵ)'],
  lifeTime: ['302... (لایف تایم)'],
};

/**
 * Generate unique Hardware ID / Computer Signature
 */
function generateHardwareId(): string {
  const nav = window.navigator as any;
  const rawStr = [
    nav.userAgent || '',
    nav.platform || '',
    nav.hardwareConcurrency || '4',
    screen.width + 'x' + screen.height,
  ].join('|');

  let hash = 0;
  for (let i = 0; i < rawStr.length; i++) {
    const char = rawStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  const posHash = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
  return `HW-AMS-${posHash.slice(0, 4)}-${posHash.slice(4, 8)}`;
}

/**
 * Helper to add days to a date ISO string
 */
function addDaysToDate(baseDateISO: string, days: number): string {
  const d = new Date(baseDateISO);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

/**
 * Calculate days remaining between today and target expiration date
 */
export function calculateDaysLeft(expirationDateISO: string | null): number {
  if (!expirationDateISO) return 99999; // Lifetime
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expirationDateISO);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Save license state to localStorage and IndexedDB for persistence
 */
function saveLicenseState(state: LicenseState): void {
  try {
    localStorage.setItem(LICENSE_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Error saving license to localStorage:', e);
  }

  try {
    const request = indexedDB.open(IDB_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
        db.createObjectStore(IDB_STORE_NAME);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      tx.objectStore(IDB_STORE_NAME).put(state, 'current_license');
    };
  } catch {
    // Ignore IndexedDB fallback errors
  }
}

/**
 * Get current license state (initializes 6-month trial on first launch)
 */
export function getLicenseState(): LicenseState {
  const todayISO = new Date().toISOString().split('T')[0];

  try {
    const raw = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (raw) {
      const state: LicenseState = JSON.parse(raw);
      
      // Clock Rollback Tamper Detection
      let isTampered = false;
      if (state.lastCheckDate && todayISO < state.lastCheckDate && state.licenseType !== 'LIFETIME') {
        isTampered = true;
      }

      const daysLeft = state.expirationDate ? calculateDaysLeft(state.expirationDate) : 99999;
      const isExpired = isTampered || (state.licenseType !== 'LIFETIME' && daysLeft <= 0);

      const updated: LicenseState = {
        ...state,
        daysRemaining: Math.max(0, daysLeft),
        isExpired,
        lastCheckDate: !isTampered && todayISO > (state.lastCheckDate || '') ? todayISO : state.lastCheckDate || todayISO,
      };

      saveLicenseState(updated);
      return updated;
    }
  } catch (e) {
    console.error('Error reading license state:', e);
  }

  // Initial First Launch Setup: 6 Months Free Trial (180 Days)
  const hardwareId = generateHardwareId();
  const expirationDate = addDaysToDate(todayISO, 180);

  const initialState: LicenseState = {
    isActivated: false,
    licenseType: 'TRIAL_6M',
    firstLaunchDate: todayISO,
    expirationDate,
    hardwareId,
    daysRemaining: 180,
    isExpired: false,
  };

  saveLicenseState(initialState);
  return initialState;
}

/**
 * Validate and apply activation code (Requires code 3029059 or matching patterns)
 */
export function applyActivationCode(
  rawCode: string,
  targetType?: LicenseType
): {
  success: boolean;
  message: string;
  updatedState?: LicenseState;
} {
  const code = rawCode.trim().toUpperCase().replace(/\s+/g, '');
  if (!code) {
    return { success: false, message: 'تکایە کۆدی ئەکتیڤکردن / ئادمین بنووسە.' };
  }

  const currentState = getLicenseState();
  const todayISO = new Date().toISOString().split('T')[0];

  // Verify Admin Code 3029059 or code starting with 302
  const isValidAdminCode = code === ADMIN_CODE || code.includes('3029059') || code.startsWith('302');

  if (!isValidAdminCode) {
    return {
      success: false,
      message: 'کۆدی ئەکتیڤکردن / ئادمین هەڵەیە. تکایە کۆدی ڕاست بگەڕێنەوە.',
    };
  }

  // Determine target license category (6 Months, 1 Year, or Lifetime)
  let selectedType: LicenseType = targetType || 'LIFETIME';

  if (!targetType) {
    if (code.includes('6M') || code.includes('6MONTH') || code.endsWith('-6')) {
      selectedType = 'CODE_6M';
    } else if (code.includes('1Y') || code.includes('1YEAR') || code.endsWith('-1')) {
      selectedType = 'CODE_1Y';
    } else if (code.includes('LIFE') || code.includes('PERM') || code === ADMIN_CODE) {
      selectedType = 'LIFETIME';
    }
  }

  let newExpirationDate: string | null = null;
  let successMsg = '';

  const baseDate = currentState.expirationDate && calculateDaysLeft(currentState.expirationDate) > 0
    ? currentState.expirationDate
    : todayISO;

  if (selectedType === 'LIFETIME') {
    newExpirationDate = null;
    successMsg = 'سیستەمەکەت بە سەرکەوتوویی بۆ هەتاهەتایی (Lifetime) چالاککرا!';
  } else if (selectedType === 'CODE_1Y') {
    newExpirationDate = addDaysToDate(baseDate, 365);
    successMsg = 'سیستەمەکەت بە سەرکەوتوویی بۆ ماوەی ١ ساڵ (٣٦٥ ڕۆژ) چالاککرا!';
  } else if (selectedType === 'CODE_6M') {
    newExpirationDate = addDaysToDate(baseDate, 180);
    successMsg = 'سیستەمەکەت بە سەرکەوتوویی بۆ ماوەی ٦ مانگ (١٨٠ ڕۆژ) چالاککرا!';
  }

  const updatedState: LicenseState = {
    ...currentState,
    isActivated: true,
    licenseType: selectedType,
    expirationDate: newExpirationDate,
    daysRemaining: newExpirationDate ? calculateDaysLeft(newExpirationDate) : 99999,
    isExpired: false,
    activationCodeUsed: code,
    activatedAt: new Date().toISOString(),
  };

  saveLicenseState(updatedState);

  return {
    success: true,
    message: successMsg,
    updatedState,
  };
}
