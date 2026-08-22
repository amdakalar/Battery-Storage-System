/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import initSqlJs, { Database } from 'sql.js';
import { Battery, ChargeRecord } from '../types';
import { getTodayISODate, calculateDaysBetween } from './dateUtils';

const SQLITE_FILE_KEY = 'sqlite_battery_db_binary_v1';

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;

/**
 * Resolves the path to the sql-wasm.wasm file.
 * Compatible with Next.js, Vite, and Electron.
 */
function locateSqlWasm(file: string): string {
  return `/sql-wasm.wasm`;
}

/**
 * Initialize SQLite Database Engine (sql.js WASM — runs in renderer process)
 */
export async function getSQLiteDB(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!initPromise) {
    initPromise = (async () => {
      let SQL: any;
      try {
        SQL = await initSqlJs({ locateFile: locateSqlWasm });
      } catch (err) {
        console.warn('Primary WASM locate failed, attempting fallback to /sql-wasm.wasm:', err);
        SQL = await initSqlJs({ locateFile: () => '/sql-wasm.wasm' });
      }

      // Try loading stored SQLite binary from AppData via Electron IPC (or localStorage in web browser)
      let u8: Uint8Array | null = null;
      if (window.electronAPI) {
        try {
          u8 = await window.electronAPI.loadDatabase();
        } catch (e) {
          console.error('Failed to load database via Electron IPC:', e);
        }
      }

      if (!u8) {
        const savedBinary = localStorage.getItem(SQLITE_FILE_KEY);
        if (savedBinary) {
          try {
            u8 = new Uint8Array(JSON.parse(savedBinary));
          } catch (e) {
            console.error('Failed to parse saved SQLite DB binary from localStorage:', e);
          }
        }
      }

      if (u8) {
        try {
          dbInstance = new SQL.Database(u8);
        } catch (e) {
          console.error('Failed to parse saved SQLite DB binary, creating new:', e);
          dbInstance = new SQL.Database();
        }
      } else {
        dbInstance = new SQL.Database();
      }

      // Initialize SQLite Tables Schema
      dbInstance.run(`
        CREATE TABLE IF NOT EXISTS batteries (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          lastChargeDate TEXT NOT NULL,
          reminderIntervalDays INTEGER NOT NULL DEFAULT 40,
          voltage REAL,
          storagePercentage REAL,
          notes TEXT,
          cells_json TEXT,
          createdAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS charge_history (
          id TEXT PRIMARY KEY,
          batteryId TEXT NOT NULL,
          chargeDate TEXT NOT NULL,
          chargeTime TEXT,
          daysSincePrevious INTEGER,
          notes TEXT,
          percentage REAL,
          FOREIGN KEY (batteryId) REFERENCES batteries (id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_charge_history_batteryId
          ON charge_history (batteryId);

        CREATE INDEX IF NOT EXISTS idx_batteries_createdAt
          ON batteries (createdAt DESC);
      `);

      // Safe schema migration: Add storagePercentage column if missing from existing database
      try {
        dbInstance.run(`ALTER TABLE batteries ADD COLUMN storagePercentage REAL;`);
      } catch (e) {
        // Column already exists or table freshly created
      }

      persistSQLiteDB(dbInstance);
      return dbInstance;
    })();
  }

  return initPromise;
}

/**
 * Persist SQLite DB binary to AppData via Electron IPC or localStorage
 */
export async function persistSQLiteDB(db: Database = dbInstance!): Promise<void> {
  if (!db) return;
  try {
    const data = db.export();
    if (window.electronAPI) {
      await window.electronAPI.saveDatabase(data);
    } else {
      const arr = Array.from(data);
      localStorage.setItem(SQLITE_FILE_KEY, JSON.stringify(arr));
    }
  } catch (e) {
    console.error('Error persisting SQLite DB binary:', e);
  }
}

/**
 * Load all batteries from SQLite database
 */
export async function loadSQLiteBatteries(): Promise<Battery[]> {
  const db = await getSQLiteDB();
  const stmt = db.prepare(`SELECT * FROM batteries ORDER BY createdAt DESC`);

  const batteries: Battery[] = [];

  while (stmt.step()) {
    const row = stmt.getAsObject() as any;

    // Fetch charge history for this battery
    const histStmt = db.prepare(
      `SELECT * FROM charge_history WHERE batteryId = ? ORDER BY chargeDate DESC`
    );
    histStmt.bind([row.id]);
    const history: ChargeRecord[] = [];
    while (histStmt.step()) {
      const hRow = histStmt.getAsObject() as any;
      history.push({
        id: hRow.id,
        batteryId: hRow.batteryId,
        chargeDate: hRow.chargeDate,
        chargeTime: hRow.chargeTime || undefined,
        daysSincePrevious: hRow.daysSincePrevious !== null ? Number(hRow.daysSincePrevious) : undefined,
        notes: hRow.notes || '',
        percentage: hRow.percentage !== null ? Number(hRow.percentage) : undefined,
      });
    }
    histStmt.free();

    batteries.push({
      id: row.id,
      name: row.name,
      category: row.category,
      lastChargeDate: row.lastChargeDate,
      reminderIntervalDays: Number(row.reminderIntervalDays) || 40,
      createdAt: row.createdAt,
      voltage: row.voltage !== null ? Number(row.voltage) : undefined,
      storagePercentage: row.storagePercentage !== null && row.storagePercentage !== undefined ? Number(row.storagePercentage) : undefined,
      notes: row.notes || '',
      cells: row.cells_json ? JSON.parse(row.cells_json) : undefined,
      history,
    });
  }

  stmt.free();
  return batteries;
}

/**
 * Save / Insert battery into SQLite DB
 */
export async function saveSQLiteBattery(
  batteryData: Omit<Battery, 'id' | 'createdAt' | 'history'>
): Promise<Battery[]> {
  const db = await getSQLiteDB();
  const id = 'bat_' + Date.now();
  const today = getTodayISODate();
  const cellsJson = batteryData.cells ? JSON.stringify(batteryData.cells) : null;

  db.run(
    `INSERT INTO batteries (id, name, category, lastChargeDate, reminderIntervalDays, voltage, storagePercentage, notes, cells_json, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      batteryData.name,
      batteryData.category || 'DRONE',
      batteryData.lastChargeDate || today,
      batteryData.reminderIntervalDays || 40,
      batteryData.voltage || null,
      batteryData.storagePercentage || null,
      batteryData.notes || '',
      cellsJson,
      today,
    ]
  );

  // Initial history log
  const histId = 'hist_init_' + Date.now();
  db.run(
    `INSERT INTO charge_history (id, batteryId, chargeDate, daysSincePrevious, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [histId, id, batteryData.lastChargeDate || today, 0, 'دروستکردنی ڕیکۆرد لە داتابەیسی SQLite']
  );

  persistSQLiteDB(db);
  return loadSQLiteBatteries();
}

/**
 * Update existing battery & cells in SQLite DB
 */
export async function updateSQLiteBattery(
  batteryId: string,
  updatedFields: Partial<Battery>
): Promise<Battery[]> {
  const db = await getSQLiteDB();

  if (updatedFields.name !== undefined) {
    db.run(`UPDATE batteries SET name = ? WHERE id = ?`, [updatedFields.name, batteryId]);
  }
  if (updatedFields.reminderIntervalDays !== undefined) {
    db.run(`UPDATE batteries SET reminderIntervalDays = ? WHERE id = ?`, [
      updatedFields.reminderIntervalDays,
      batteryId,
    ]);
  }
  if (updatedFields.notes !== undefined) {
    db.run(`UPDATE batteries SET notes = ? WHERE id = ?`, [updatedFields.notes, batteryId]);
  }
  if (updatedFields.storagePercentage !== undefined) {
    db.run(`UPDATE batteries SET storagePercentage = ? WHERE id = ?`, [
      updatedFields.storagePercentage !== null ? updatedFields.storagePercentage : null,
      batteryId,
    ]);
  }
  if (updatedFields.cells !== undefined) {
    const cellsJson = updatedFields.cells ? JSON.stringify(updatedFields.cells) : null;
    db.run(`UPDATE batteries SET cells_json = ? WHERE id = ?`, [cellsJson, batteryId]);
  }

  persistSQLiteDB(db);
  return loadSQLiteBatteries();
}

/**
 * Delete battery from SQLite DB
 */
export async function deleteSQLiteBattery(batteryId: string): Promise<Battery[]> {
  const db = await getSQLiteDB();
  db.run(`DELETE FROM charge_history WHERE batteryId = ?`, [batteryId]);
  db.run(`DELETE FROM batteries WHERE id = ?`, [batteryId]);
  persistSQLiteDB(db);
  return loadSQLiteBatteries();
}

/**
 * Record charge event in SQLite DB
 */
export async function recordSQLiteCharge(
  batteryId: string,
  chargeDate: string = getTodayISODate(),
  notes: string = 'ستۆرجکرا لەم بەروارەدا'
): Promise<Battery[]> {
  const db = await getSQLiteDB();

  // Find previous charge date
  const stmt = db.prepare(`SELECT lastChargeDate FROM batteries WHERE id = ?`);
  stmt.bind([batteryId]);
  let prevDate = '';
  if (stmt.step()) {
    prevDate = (stmt.getAsObject() as any).lastChargeDate || '';
  }
  stmt.free();

  const daysSincePrevious = prevDate
    ? Math.max(0, calculateDaysBetween(prevDate, chargeDate))
    : 0;

  // Update battery's last charge date
  db.run(`UPDATE batteries SET lastChargeDate = ? WHERE id = ?`, [chargeDate, batteryId]);

  // Insert into charge_history
  const histId = 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  db.run(
    `INSERT INTO charge_history (id, batteryId, chargeDate, daysSincePrevious, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [histId, batteryId, chargeDate, daysSincePrevious, notes]
  );

  persistSQLiteDB(db);
  return loadSQLiteBatteries();
}

/**
 * Sync all batteries to SQLite DB in bulk
 */
export async function syncAllToSQLite(batteries: Battery[]): Promise<void> {
  try {
    const db = await getSQLiteDB();
    db.run(`DELETE FROM charge_history`);
    db.run(`DELETE FROM batteries`);

    batteries.forEach((bat) => {
      const cellsJson = bat.cells ? JSON.stringify(bat.cells) : null;
      db.run(
        `INSERT OR REPLACE INTO batteries (id, name, category, lastChargeDate, reminderIntervalDays, voltage, storagePercentage, notes, cells_json, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bat.id,
          bat.name,
          bat.category || 'DRONE',
          bat.lastChargeDate,
          bat.reminderIntervalDays || 40,
          bat.voltage || null,
          bat.storagePercentage || null,
          bat.notes || '',
          cellsJson,
          bat.createdAt || bat.lastChargeDate,
        ]
      );

      if (bat.history && Array.isArray(bat.history)) {
        bat.history.forEach((h, idx) => {
          const hId = h.id || `h_${bat.id}_${idx}_${Date.now()}`;
          db.run(
            `INSERT OR REPLACE INTO charge_history (id, batteryId, chargeDate, daysSincePrevious, notes)
             VALUES (?, ?, ?, ?, ?)`,
            [hId, bat.id, h.chargeDate, h.daysSincePrevious ?? null, h.notes || '']
          );
        });
      }
    });

    persistSQLiteDB(db);
  } catch (e) {
    console.error('Error syncing to SQLite DB:', e);
  }
}
