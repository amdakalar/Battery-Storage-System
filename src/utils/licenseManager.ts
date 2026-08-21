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
 * Get current license state (Permanently Lifetime for all users)
 */
export function getLicenseState(): LicenseState {
  const todayISO = new Date().toISOString().split('T')[0];
  const hardwareId = generateHardwareId();

  const lifetimeState: LicenseState = {
    isActivated: true,
    licenseType: 'LIFETIME',
    firstLaunchDate: todayISO,
    expirationDate: null,
    hardwareId,
    daysRemaining: 99999,
    isExpired: false,
    activationCodeUsed: 'LIFETIME-PERMANENT',
    activatedAt: todayISO,
  };

  try {
    saveLicenseState(lifetimeState);
  } catch {
    // Ignore fallback errors
  }

  return lifetimeState;
}

/**
 * Validate and apply activation code (Always lifetime active)
 */
export function applyActivationCode(
  _rawCode?: string,
  _targetType?: LicenseType
): {
  success: boolean;
  message: string;
  updatedState?: LicenseState;
} {
  const lifetimeState = getLicenseState();
  return {
    success: true,
    message: 'سیستەمەکەت بە سەرکەوتوویی بۆ هەتاهەتایی (Lifetime) چالاککراوە!',
    updatedState: lifetimeState,
  };
}
