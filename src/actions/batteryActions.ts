'use server';

import { getTursoClient, initTursoTables } from '@/src/lib/turso';
import { Battery, ChargeRecord, ActivityLog } from '@/src/types';
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
 * Log activity in audit_logs table
 */
async function logActivity(
  action: ActivityLog['action'],
  actionTitle: string,
  performedBy: string,
  performedById?: string,
  targetName?: string,
  details?: string,
  meta?: any
) {
  try {
    const client = getTursoClient();
    const id = `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();
    await client.execute({
      sql: `INSERT INTO audit_logs (id, timestamp, action, actionTitle, performedBy, performedById, targetName, details, meta_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        timestamp,
        action,
        actionTitle,
        performedBy || 'سیستەم',
        performedById || null,
        targetName || null,
        details || null,
        meta ? JSON.stringify(meta) : null,
      ],
    });
  } catch (e) {
    console.error('Failed to log audit activity:', e);
  }
}

/**
 * Fetch batteries along with their charge history from Turso.
 * If filterUserId is specified, returns only that user's batteries.
 * Otherwise, returns all team batteries.
 */
export async function getBatteriesAction(
  filterUserId?: string
): Promise<Battery[]> {
  await ensureTables();
  const client = getTursoClient();

  let batteryRows: any;
  let historyRows: any;

  if (!filterUserId) {
    batteryRows = await client.execute(`SELECT * FROM batteries ORDER BY createdAt DESC`);
    historyRows = await client.execute(`SELECT * FROM charge_history ORDER BY chargeDate DESC, chargeTime DESC`);
  } else {
    batteryRows = await client.execute({
      sql: `SELECT * FROM batteries WHERE userId = ? ORDER BY createdAt DESC`,
      args: [filterUserId],
    });
    historyRows = await client.execute({
      sql: `SELECT * FROM charge_history WHERE userId = ? ORDER BY chargeDate DESC, chargeTime DESC`,
      args: [filterUserId],
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
      authorName: row.authorName ? String(row.authorName) : undefined,
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
      authorName: row.authorName ? String(row.authorName) : undefined,
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
 * Save (create or update) a battery in Turso with activity changelog
 */
export async function saveBatteryAction(
  battery: Battery,
  currentUserId?: string,
  currentUserName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    const cellsJson = battery.cells ? JSON.stringify(battery.cells) : null;
    const ownerUserId = battery.userId || currentUserId || null;
    const ownerName = battery.authorName || currentUserName || 'بەکارهێنەر';

    // Check if battery already exists to distinguish Add vs Update
    const existing = await client.execute({
      sql: `SELECT id, name FROM batteries WHERE id = ? LIMIT 1`,
      args: [battery.id],
    });
    const isUpdate = existing.rows.length > 0;

    await client.execute({
      sql: `INSERT INTO batteries (
        id, userId, authorName, name, category, lastChargeDate, reminderIntervalDays,
        voltage, storagePercentage, notes, cells_json, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        category = excluded.category,
        lastChargeDate = excluded.lastChargeDate,
        reminderIntervalDays = excluded.reminderIntervalDays,
        voltage = excluded.voltage,
        storagePercentage = excluded.storagePercentage,
        notes = excluded.notes,
        cells_json = excluded.cells_json,
        authorName = COALESCE(batteries.authorName, excluded.authorName),
        userId = COALESCE(batteries.userId, excluded.userId);`,
      args: [
        battery.id,
        ownerUserId,
        ownerName,
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

    // Log Activity Changelog
    if (isUpdate) {
      await logActivity(
        'BATTERY_UPDATE',
        'دەستکاریکردنی زانیاریی باتری',
        ownerName,
        ownerUserId || undefined,
        battery.name,
        `دەستکاری کرا بە ڤۆڵتیەی ${battery.voltage || '-'}V و ڕێژەی ${battery.storagePercentage || '-'}%`
      );
    } else {
      await logActivity(
        'BATTERY_ADD',
        'زیادکردنی باتریی نوێ',
        ownerName,
        ownerUserId || undefined,
        battery.name,
        `باتریی نوێ تۆمارکرا بە هاوپۆلی "${battery.category}" و خولی ${battery.reminderIntervalDays} ڕۆژ`
      );
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error saving battery to Turso:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a battery and its history (with Changelog logging)
 */
export async function deleteBatteryAction(
  batteryId: string,
  currentUserId?: string,
  currentUserName?: string,
  isAdmin: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    // Check battery info for changelog
    const existing = await client.execute({
      sql: `SELECT name, userId FROM batteries WHERE id = ? LIMIT 1`,
      args: [batteryId],
    });
    const batName = existing.rows[0]?.name ? String(existing.rows[0].name) : batteryId;

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

    await logActivity(
      'BATTERY_DELETE',
      'سڕینەوەی باتری لە سیستەم',
      currentUserName || 'بەکارهێنەر',
      currentUserId,
      batName,
      `باتری "${batName}" لەگەڵ تەواوی مێژووەکەی سڕایەوە`
    );

    return { success: true };
  } catch (err: any) {
    console.error('Error deleting battery from Turso:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Record a charge in Turso and update the battery's lastChargeDate (with Changelog)
 */
export async function recordChargeAction(
  record: ChargeRecord,
  currentUserId?: string,
  currentUserName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    const ownerUserId = record.userId || currentUserId || null;
    const ownerName = record.authorName || currentUserName || 'بەکارهێنەر';

    const batRes = await client.execute({
      sql: `SELECT name FROM batteries WHERE id = ? LIMIT 1`,
      args: [record.batteryId],
    });
    const batName = batRes.rows[0]?.name ? String(batRes.rows[0].name) : record.batteryId;

    await client.batch([
      {
        sql: `INSERT OR REPLACE INTO charge_history (
          id, batteryId, userId, authorName, chargeDate, chargeTime, daysSincePrevious, notes, percentage
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        args: [
          record.id,
          record.batteryId,
          ownerUserId,
          ownerName,
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

    await logActivity(
      'BATTERY_CHARGE',
      'ستۆرجکردن / بارگاویکردنەوەی باتری',
      ownerName,
      ownerUserId || undefined,
      batName,
      `ستۆرج کرا لە بەرواری ${record.chargeDate} - ${record.notes || ''}`
    );

    return { success: true };
  } catch (err: any) {
    console.error('Error recording charge in Turso:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get live activity changelog / audit logs
 */
export async function getActivityLogsAction(limit: number = 60): Promise<{
  success: boolean;
  logs?: ActivityLog[];
  error?: string;
}> {
  try {
    await ensureTables();
    const client = getTursoClient();

    const res = await client.execute({
      sql: `SELECT id, timestamp, action, actionTitle, performedBy, performedById, targetName, details, meta_json
            FROM audit_logs ORDER BY timestamp DESC LIMIT ?`,
      args: [limit],
    });

    const logs: ActivityLog[] = res.rows.map((row: any) => ({
      id: String(row.id),
      timestamp: String(row.timestamp),
      action: String(row.action) as ActivityLog['action'],
      actionTitle: row.actionTitle ? String(row.actionTitle) : String(row.action),
      performedBy: row.performedBy ? String(row.performedBy) : 'سیستەم',
      performedById: row.performedById ? String(row.performedById) : undefined,
      targetName: row.targetName ? String(row.targetName) : undefined,
      details: row.details ? String(row.details) : undefined,
      meta: row.meta_json ? JSON.parse(String(row.meta_json)) : undefined,
    }));

    return { success: true, logs };
  } catch (e: any) {
    console.error('Error fetching activity logs:', e);
    return { success: false, error: e.message };
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
 * Clear all batteries (Admin only)
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

    const countRes = await client.execute(`SELECT COUNT(*) as count FROM batteries`);
    const count = Number(countRes.rows[0]?.count || 0);

    await client.batch([
      `DELETE FROM charge_history;`,
      `DELETE FROM batteries;`,
    ]);

    await logActivity(
      'SYSTEM_RESET',
      'سڕینەوەی گشتیی باترییەکان',
      clearedBy || 'بەڕێوەبەر',
      currentUserId,
      'تەواوی داتای باترییەکان',
      `سڕینەوەی ${count} باتری. هۆکار: ${reason || 'سڕینەوەی دەستی'}`
    );

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
  currentUserId?: string,
  currentUserName?: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    const statements: any[] = [];
    const ownerName = currentUserName || 'بەکارهێنەر';

    for (const b of batteries) {
      const cellsJson = b.cells ? JSON.stringify(b.cells) : null;
      const ownerUserId = b.userId || currentUserId || null;

      statements.push({
        sql: `INSERT OR REPLACE INTO batteries (
          id, userId, authorName, name, category, lastChargeDate, reminderIntervalDays,
          voltage, storagePercentage, notes, cells_json, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          b.id,
          ownerUserId,
          b.authorName || ownerName,
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
              id, batteryId, userId, authorName, chargeDate, chargeTime, daysSincePrevious, notes, percentage
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              h.id,
              b.id,
              ownerUserId,
              h.authorName || ownerName,
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

    await logActivity(
      'BATTERY_ADD',
      'هاوردەکردنی دەستەیی باترییەکان (Bulk Import)',
      ownerName,
      currentUserId,
      `${batteries.length} باتری`,
      `هاوردەکردنی سەرکەوتووی ${batteries.length} باتری لە پەڕگەوە`
    );

    return { success: true, count: batteries.length };
  } catch (err: any) {
    console.error('Error importing batteries:', err);
    return { success: false, count: 0, error: err.message };
  }
}
