/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Battery, ChargeRecord, AppSettings, DeletionLog } from '../types';
import { getTodayISODate, toISODateString, calculateDaysBetween } from './dateUtils';

const BATTERIES_STORAGE_KEY = 'kurdish_battery_maintenance_data_v1';
const SETTINGS_STORAGE_KEY = 'kurdish_battery_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  enableAudioAlerts: true,
  enableBrowserNotifications: false,
  theme: 'light',
};

import { generate50SampleBatteries } from './sampleData';

import { syncAllToSQLite, loadSQLiteBatteries } from './sqliteDb';

/**
 * Load all batteries synchronously from local storage.
 */
export function loadBatteries(): Battery[] {
  try {
    const raw = localStorage.getItem(BATTERIES_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading batteries from localStorage:', error);
    return [];
  }
}

/**
 * Asynchronously loads saved batteries with fallback to SQLite database file.
 */
export async function loadBatteriesAsync(): Promise<Battery[]> {
  try {
    const raw = localStorage.getItem(BATTERIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    const sqBatteries = await loadSQLiteBatteries();
    if (sqBatteries && sqBatteries.length > 0) {
      localStorage.setItem(BATTERIES_STORAGE_KEY, JSON.stringify(sqBatteries));
      return sqBatteries;
    }
    return loadBatteries();
  } catch (error) {
    console.error('Error in loadBatteriesAsync:', error);
    return loadBatteries();
  }
}

/**
 * Seed 50 sample batteries into storage & SQLite
 */
export function seed50SampleBatteries(): Battery[] {
  const samples = generate50SampleBatteries();
  saveBatteries(samples);
  return samples;
}

/**
 * Save all batteries to local storage & sync to SQLite DB
 */
export function saveBatteries(batteries: Battery[]): void {
  try {
    localStorage.setItem(BATTERIES_STORAGE_KEY, JSON.stringify(batteries));
    syncAllToSQLite(batteries).catch(() => {});
  } catch (error) {
    console.error('Error saving batteries to localStorage:', error);
  }
}

/**
 * Update single battery's last charge date to given date (defaults to today).
 * Adds record to history.
 */
export function recordBatteryCharge(
  batteryId: string,
  chargeDate: string = getTodayISODate(),
  notes: string = 'ستۆرجکرا لەم بەروارەدا'
): Battery[] {
  const batteries = loadBatteries();
  const updated = batteries.map((bat) => {
    if (bat.id === batteryId) {
      const prevDate = bat.lastChargeDate;
      const daysSincePrevious = prevDate
        ? Math.max(0, calculateDaysBetween(prevDate, chargeDate))
        : undefined;
      const newHistoryItem: ChargeRecord = {
        id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        batteryId: bat.id,
        chargeDate,
        daysSincePrevious,
        percentage: bat.storagePercentage,
        notes,
      };
      return {
        ...bat,
        lastChargeDate: chargeDate,
        history: [newHistoryItem, ...(bat.history || [])],
      };
    }
    return bat;
  });

  saveBatteries(updated);
  return updated;
}

/**
 * Add a new battery
 */
export function addBattery(
  newBatteryData: Omit<Battery, 'id' | 'createdAt' | 'history'>
): Battery[] {
  const batteries = loadBatteries();
  const id = 'bat_' + Date.now();
  const today = getTodayISODate();

  const newBattery: Battery = {
    ...newBatteryData,
    id,
    createdAt: today,
    history: [
      {
        id: 'hist_init_' + Date.now(),
        batteryId: id,
        chargeDate: newBatteryData.lastChargeDate || today,
        notes: 'دروستکردنی ڕیکۆرد و یەکەم ستۆرج',
      },
    ],
  };

  const updated = [newBattery, ...batteries];
  saveBatteries(updated);
  return updated;
}

/**
 * Delete a battery
 */
export function deleteBattery(batteryId: string): Battery[] {
  const batteries = loadBatteries();
  const deleted = batteries.find((b) => b.id === batteryId);
  if (deleted) {
    recordDeletionLog({
      batteryCountCleared: 1,
      historyCountCleared: deleted.history ? deleted.history.length : 0,
      reason: `سڕینەوەی باتری: ${deleted.name}`,
      clearedBy: 'بەڕێوەبەری سیستەم',
      deletedBatteries: [deleted],
    });
  }
  const updated = batteries.filter((b) => b.id !== batteryId);
  saveBatteries(updated);
  return updated;
}

/**
 * Update an existing battery's properties and cell voltages
 */
export function updateBattery(
  batteryId: string,
  updatedFields: Partial<Battery>
): Battery[] {
  const batteries = loadBatteries();
  const updated = batteries.map((b) => {
    if (b.id === batteryId) {
      return { ...b, ...updatedFields };
    }
    return b;
  });
  saveBatteries(updated);
  return updated;
}

/**
 * Load app settings
 */
export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/**
 * Save app settings
 */
export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings:', e);
  }
}

import { loadCategories, saveCategories } from '../constants/categories';

/**
 * Export data to JSON string
 */
export function exportDataJSON(): string {
  const batteries = loadBatteries();
  const settings = loadSettings();
  const categories = loadCategories();
  return JSON.stringify(
    { batteries, settings, categories, exportDate: new Date().toISOString() },
    null,
    2
  );
}

/**
 * Import data from JSON string
 */
export function importDataJSON(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data && Array.isArray(data.batteries)) {
      saveBatteries(data.batteries);
      if (data.settings) saveSettings(data.settings);
      if (data.categories && Array.isArray(data.categories)) saveCategories(data.categories);
      return true;
    }
    return false;
  } catch (e) {
    console.error('Failed to parse import JSON:', e);
    return false;
  }
}

const DELETION_LOGS_KEY = 'kurdish_battery_deletion_logs_v1';

/**
 * Load all system deletion logs
 */
export function loadDeletionLogs(): DeletionLog[] {
  try {
    const raw = localStorage.getItem(DELETION_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save deletion log entry
 */
export function recordDeletionLog(
  log: Omit<DeletionLog, 'id' | 'timestamp'>
): DeletionLog[] {
  const logs = loadDeletionLogs();
  const newLog: DeletionLog = {
    ...log,
    id: 'del_' + Date.now(),
    timestamp: new Date().toISOString(),
  };
  const updated = [newLog, ...logs];
  try {
    localStorage.setItem(DELETION_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error saving deletion log:', e);
  }
  return updated;
}

/**
 * Clear all system data and record deletion log
 */
export function clearAllSystemData(
  reason: string = 'سڕینەوەی دەستی لە لایەن بەکارهێنەرەوە'
): { batteries: Battery[]; logs: DeletionLog[] } {
  const currentBatteries = loadBatteries();
  let totalHistory = 0;
  currentBatteries.forEach((b) => {
    if (b.history) totalHistory += b.history.length;
  });

  const newLogs = recordDeletionLog({
    batteryCountCleared: currentBatteries.length,
    historyCountCleared: totalHistory,
    reason,
    clearedBy: 'بەڕێوەبەری سیستەم',
    deletedBatteries: currentBatteries,
  });

  saveBatteries([]);

  return { batteries: [], logs: newLogs };
}

/**
 * Restore deleted batteries from a specific deletion log
 */
export function restoreDeletedData(logId: string): {
  restoredCount: number;
  updatedBatteries: Battery[];
  updatedLogs: DeletionLog[];
} {
  const logs = loadDeletionLogs();
  const targetLog = logs.find((l) => l.id === logId);
  if (!targetLog || !targetLog.deletedBatteries || targetLog.deletedBatteries.length === 0) {
    return { restoredCount: 0, updatedBatteries: loadBatteries(), updatedLogs: logs };
  }

  const currentBatteries = loadBatteries();
  const currentIds = new Set(currentBatteries.map((b) => b.id));

  // Re-add batteries, assigning a new id if an active battery already shares the id
  const toRestore = targetLog.deletedBatteries.map((b) => {
    if (currentIds.has(b.id)) {
      return { ...b, id: 'bat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4) };
    }
    return b;
  });

  const updatedBatteries = [...currentBatteries, ...toRestore];
  saveBatteries(updatedBatteries);

  // Mark log as restored
  const updatedLogs = logs.map((l) => (l.id === logId ? { ...l, isRestored: true } : l));
  try {
    localStorage.setItem(DELETION_LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (e) {
    console.error('Error saving restored log:', e);
  }

  return {
    restoredCount: toRestore.length,
    updatedBatteries,
    updatedLogs,
  };
}

/**
 * Restore all deleted data across all deletion logs
 */
export function restoreAllDeletedData(): {
  restoredCount: number;
  updatedBatteries: Battery[];
  updatedLogs: DeletionLog[];
} {
  const logs = loadDeletionLogs();
  const currentBatteries = loadBatteries();
  const currentIds = new Set(currentBatteries.map((b) => b.id));
  const restoredBatteries: Battery[] = [];

  logs.forEach((log) => {
    if (log.deletedBatteries && log.deletedBatteries.length > 0 && !log.isRestored) {
      log.deletedBatteries.forEach((b) => {
        if (currentIds.has(b.id)) {
          const freshBat = { ...b, id: 'bat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4) };
          restoredBatteries.push(freshBat);
          currentIds.add(freshBat.id);
        } else {
          restoredBatteries.push(b);
          currentIds.add(b.id);
        }
      });
    }
  });

  const updatedBatteries = [...currentBatteries, ...restoredBatteries];
  saveBatteries(updatedBatteries);

  const updatedLogs = logs.map((l) => ({ ...l, isRestored: true }));
  try {
    localStorage.setItem(DELETION_LOGS_KEY, JSON.stringify(updatedLogs));
  } catch (e) {
    console.error('Error saving deletion logs:', e);
  }

  return {
    restoredCount: restoredBatteries.length,
    updatedBatteries,
    updatedLogs,
  };
}

/**
 * Clear all recorded deletion logs
 */
export function clearDeletionLogs(): DeletionLog[] {
  try {
    localStorage.removeItem(DELETION_LOGS_KEY);
  } catch (e) {
    console.error('Error clearing deletion logs:', e);
  }
  return [];
}
