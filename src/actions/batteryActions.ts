'use server';

import { getTursoClient, initTursoTables } from '@/src/lib/turso';
import { Battery, ChargeRecord, AppSettings, DeletionLog } from '@/src/types';
import { getTodayISODate } from '@/src/utils/dateUtils';

// Auto-initialize schema on server runtime
let tablesInitialized = false;
async function ensureTables() {
  if (!tablesInitialized) {
    await initTursoTables();
    tablesInitialized = true;
  }
}

/**
 * Fetch batteries along with their charge history from Turso.
 * If user is ADMIN and no specific userId is given, returns all batteries in the system.
 * If regular user, filters by userId.
 */
export async function getBatteriesAction(
  userId?: string,
  isAdmin: boolean = false
): Promise<Battery[]> {
  await ensureTables();
  const client = getTursoClient();

  let batteryRows: any;
  let historyRows: any;

  if (isAdmin || !userId) {
    batteryRows = await client.execute(`SELECT * FROM batteries ORDER BY createdAt DESC`);
    historyRows = await client.execute(`SELECT * FROM charge_history ORDER BY chargeDate DESC, chargeTime DESC`);
  } else {
    batteryRows = await client.execute({
      sql: `SELECT * FROM batteries WHERE userId = ? OR userId IS NULL OR userId = '' ORDER BY createdAt DESC`,
      args: [userId],
    });
    historyRows = await client.execute({
      sql: `SELECT * FROM charge_history WHERE userId = ? OR userId IS NULL OR userId = '' ORDER BY chargeDate DESC, chargeTime DESC`,
      args: [userId],
    });
  }

  const historyByBattery: Record<string, ChargeRecord[]> = {};
  for (const row of historyRows.rows) {
    const bId = String(row.batteryId);
    if (!historyByBattery[bId]) historyByBattery[bId] = [];
    historyByBattery[bId].push({
      id: String(row.id),
      batteryId: bId,
      userId: row.userId ? String(row.userId) : undefined,
      chargeDate: String(row.chargeDate),
      chargeTime: row.chargeTime ? String(row.chargeTime) : undefined,
      daysSincePrevious: row.daysSincePrevious ? Number(row.daysSincePrevious) : undefined,
      notes: row.notes ? String(row.notes) : undefined,
      percentage: row.percentage ? Number(row.percentage) : undefined,
    });
  }

  const batteries: Battery[] = batteryRows.rows.map((row: any) => {
    let cells: any = undefined;
    if (row.cells_json) {
      try {
        cells = JSON.parse(String(row.cells_json));
      } catch (e) {
        cells = undefined;
      }
    }

    return {
      id: String(row.id),
      userId: row.userId ? String(row.userId) : undefined,
      name: String(row.name),
      category: String(row.category),
      lastChargeDate: String(row.lastChargeDate),
      reminderIntervalDays: Number(row.reminderIntervalDays || 40),
      voltage: row.voltage ? Number(row.voltage) : undefined,
      storagePercentage: row.storagePercentage ? Number(row.storagePercentage) : undefined,
      notes: row.notes ? String(row.notes) : undefined,
      createdAt: String(row.createdAt),
      cells,
      history: historyByBattery[String(row.id)] || [],
    };
  });

  return batteries;
}

/**
 * Save (create or update) a battery in Turso with user isolation
 */
export async function saveBatteryAction(
  battery: Battery,
  currentUserId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    const cellsJson = battery.cells ? JSON.stringify(battery.cells) : null;
    const ownerUserId = battery.userId || currentUserId || null;

    await client.execute({
      sql: `INSERT INTO batteries (
        id, userId, name, category, lastChargeDate, reminderIntervalDays,
        voltage, storagePercentage, notes, cells_json, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        lastChargeDate = excluded.lastChargeDate,
        reminderIntervalDays = excluded.reminderIntervalDays,
        voltage = excluded.voltage,
        storagePercentage = excluded.storagePercentage,
        notes = excluded.notes,
        cells_json = excluded.cells_json,
        userId = COALESCE(batteries.userId, excluded.userId);`,
      args: [
        battery.id,
        ownerUserId,
        battery.name,
        battery.category,
        battery.lastChargeDate,
        battery.reminderIntervalDays,
        battery.voltage ?? null,
        battery.storagePercentage ?? null,
        battery.notes ?? null,
        cellsJson,
        battery.createdAt || getTodayISODate(),
      ],
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error saving battery to Turso:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a battery and its history (with owner/admin permission check)
 */
export async function deleteBatteryAction(
  batteryId: string,
  currentUserId?: string,
  isAdmin: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    // Check ownership if not admin
    if (!isAdmin && currentUserId) {
      const check = await client.execute({
        sql: `SELECT userId FROM batteries WHERE id = ? LIMIT 1`,
        args: [batteryId],
      });
      if (check.rows.length > 0 && check.rows[0].userId && check.rows[0].userId !== currentUserId) {
        return { success: false, error: 'دەسەڵاتت نییە بۆ سڕینەوەی ئەم باترییە' };
      }
    }

    await client.batch([
      {
        sql: `DELETE FROM charge_history WHERE batteryId = ?`,
        args: [batteryId],
      },
      {
        sql: `DELETE FROM batteries WHERE id = ?`,
        args: [batteryId],
      },
    ]);

    return { success: true };
  } catch (err: any) {
    console.error('Error deleting battery from Turso:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Record a charge in Turso and update the battery's lastChargeDate
 */
export async function recordChargeAction(
  record: ChargeRecord,
  currentUserId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    const ownerUserId = record.userId || currentUserId || null;

    await client.batch([
      {
        sql: `INSERT OR REPLACE INTO charge_history (
          id, batteryId, userId, chargeDate, chargeTime, daysSincePrevious, notes, percentage
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          record.id,
          record.batteryId,
          ownerUserId,
          record.chargeDate,
          record.chargeTime ?? null,
          record.daysSincePrevious ?? null,
          record.notes ?? null,
          record.percentage ?? null,
        ],
      },
      {
        sql: `UPDATE batteries SET lastChargeDate = ? WHERE id = ?`,
        args: [record.chargeDate, record.batteryId],
      },
    ]);

    return { success: true };
  } catch (err: any) {
    console.error('Error recording charge in Turso:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a single charge record
 */
export async function deleteChargeRecordAction(
  recordId: string,
  batteryId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    await client.execute({
      sql: `DELETE FROM charge_history WHERE id = ?`,
      args: [recordId],
    });

    // Recompute latest charge date
    const latest = await client.execute({
      sql: `SELECT chargeDate FROM charge_history WHERE batteryId = ? ORDER BY chargeDate DESC LIMIT 1`,
      args: [batteryId],
    });

    if (latest.rows.length > 0) {
      await client.execute({
        sql: `UPDATE batteries SET lastChargeDate = ? WHERE id = ?`,
        args: [String(latest.rows[0].chargeDate), batteryId],
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error deleting charge record:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Clear all batteries and history for current user (or whole system if admin)
 */
export async function clearAllBatteriesAction(
  reason?: string,
  clearedBy?: string,
  currentUserId?: string,
  isAdmin: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    if (isAdmin && !currentUserId) {
      const countRes = await client.execute(`SELECT COUNT(*) as count FROM batteries`);
      const count = Number(countRes.rows[0]?.count || 0);

      await client.batch([
        {
          sql: `INSERT INTO audit_logs (id, timestamp, action, details, meta_json) VALUES (?, ?, ?, ?, ?)`,
          args: [
            `del_${Date.now()}`,
            new Date().toISOString(),
            'CLEAR_ALL',
            `Cleared ${count} batteries across whole system. Reason: ${reason || 'Admin initiated'}`,
            JSON.stringify({ count, reason, clearedBy }),
          ],
        },
        `DELETE FROM charge_history;`,
        `DELETE FROM batteries;`,
      ]);
    } else if (currentUserId) {
      await client.batch([
        {
          sql: `DELETE FROM charge_history WHERE userId = ?`,
          args: [currentUserId],
        },
        {
          sql: `DELETE FROM batteries WHERE userId = ?`,
          args: [currentUserId],
        },
      ]);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error clearing batteries:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Bulk import batteries
 */
export async function importBatteriesAction(
  batteries: Battery[],
  currentUserId?: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    const statements: any[] = [];

    for (const b of batteries) {
      const cellsJson = b.cells ? JSON.stringify(b.cells) : null;
      const ownerUserId = b.userId || currentUserId || null;

      statements.push({
        sql: `INSERT OR REPLACE INTO batteries (
          id, userId, name, category, lastChargeDate, reminderIntervalDays,
          voltage, storagePercentage, notes, cells_json, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          b.id,
          ownerUserId,
          b.name,
          b.category,
          b.lastChargeDate,
          b.reminderIntervalDays || 40,
          b.voltage ?? null,
          b.storagePercentage ?? null,
          b.notes ?? null,
          cellsJson,
          b.createdAt || getTodayISODate(),
        ],
      });

      if (b.history && b.history.length > 0) {
        for (const h of b.history) {
          statements.push({
            sql: `INSERT OR REPLACE INTO charge_history (
              id, batteryId, userId, chargeDate, chargeTime, daysSincePrevious, notes, percentage
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              h.id,
              b.id,
              ownerUserId,
              h.chargeDate,
              h.chargeTime ?? null,
              h.daysSincePrevious ?? null,
              h.notes ?? null,
              h.percentage ?? null,
            ],
          });
        }
      }
    }

    // Execute in batches of 100
    for (let i = 0; i < statements.length; i += 100) {
      const chunk = statements.slice(i, i + 100);
      await client.batch(chunk);
    }

    return { success: true, count: batteries.length };
  } catch (err: any) {
    console.error('Error importing batteries:', err);
    return { success: false, count: 0, error: err.message };
  }
}
