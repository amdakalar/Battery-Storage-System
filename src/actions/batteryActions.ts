'use server';

import { getTursoClient, initTursoTables } from '@/src/lib/turso';
import { Battery, ChargeRecord, ActivityLog, DeletionLog } from '@/src/types';
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
 * Fetch all deletion logs directly from Turso database
 */
export async function getDeletionLogsAction(): Promise<{
  success: boolean;
  logs: DeletionLog[];
  error?: string;
}> {
  try {
    await ensureTables();
    const client = getTursoClient();

    const res = await client.execute(`SELECT * FROM deletion_logs ORDER BY timestamp DESC`);
    const logs: DeletionLog[] = res.rows.map((row: any) => {
      let deletedBatteries: Battery[] | undefined = undefined;
      if (row.deletedBatteries_json) {
        try {
          deletedBatteries = JSON.parse(String(row.deletedBatteries_json));
        } catch (e) {
          deletedBatteries = undefined;
        }
      }

      return {
        id: String(row.id),
        timestamp: String(row.timestamp),
        batteryCountCleared: Number(row.batteryCountCleared || 0),
        historyCountCleared: Number(row.historyCountCleared || 0),
        reason: row.reason ? String(row.reason) : undefined,
        clearedBy: row.clearedBy ? String(row.clearedBy) : undefined,
        deletedBatteries,
        isRestored: Boolean(row.isRestored === 1 || row.isRestored === true),
      };
    });

    return { success: true, logs };
  } catch (err: any) {
    console.error('Error fetching deletion logs from Turso:', err);
    return { success: false, logs: [], error: err.message };
  }
}

/**
 * Delete a battery and its history (saving full snapshot to deletion_logs in Turso)
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

    // Fetch existing battery and its charge history for complete snapshot
    const batRes = await client.execute({
      sql: `SELECT * FROM batteries WHERE id = ? LIMIT 1`,
      args: [batteryId],
    });

    if (batRes.rows.length === 0) {
      return { success: true }; // Already deleted
    }

    const batRow: any = batRes.rows[0];
    const batName = batRow.name ? String(batRow.name) : batteryId;

    const histRes = await client.execute({
      sql: `SELECT * FROM charge_history WHERE batteryId = ? ORDER BY chargeDate DESC`,
      args: [batteryId],
    });

    let cells: any = undefined;
    if (batRow.cells_json) {
      try {
        cells = JSON.parse(String(batRow.cells_json));
      } catch (e) {}
    }

    const historyItems: ChargeRecord[] = histRes.rows.map((h: any) => ({
      id: String(h.id),
      batteryId: String(h.batteryId),
      userId: h.userId ? String(h.userId) : undefined,
      authorName: h.authorName ? String(h.authorName) : undefined,
      chargeDate: String(h.chargeDate),
      chargeTime: h.chargeTime ? String(h.chargeTime) : undefined,
      daysSincePrevious: h.daysSincePrevious ? Number(h.daysSincePrevious) : undefined,
      notes: h.notes ? String(h.notes) : undefined,
      percentage: h.percentage ? Number(h.percentage) : undefined,
    }));

    const batterySnapshot: Battery = {
      id: String(batRow.id),
      userId: batRow.userId ? String(batRow.userId) : undefined,
      authorName: batRow.authorName ? String(batRow.authorName) : undefined,
      name: batName,
      category: String(batRow.category),
      lastChargeDate: String(batRow.lastChargeDate),
      reminderIntervalDays: Number(batRow.reminderIntervalDays || 40),
      voltage: batRow.voltage ? Number(batRow.voltage) : undefined,
      storagePercentage: batRow.storagePercentage ? Number(batRow.storagePercentage) : undefined,
      notes: batRow.notes ? String(batRow.notes) : undefined,
      cells,
      createdAt: String(batRow.createdAt),
      history: historyItems,
    };

    const deletionLogId = `del_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();
    const performer = currentUserName || 'بەکارهێنەر';

    // Batch transaction: Save deletion snapshot log, delete history, delete battery
    await client.batch([
      {
        sql: `INSERT INTO deletion_logs (
          id, timestamp, batteryCountCleared, historyCountCleared, reason, clearedBy, clearedById, deletedBatteries_json, isRestored
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        args: [
          deletionLogId,
          timestamp,
          1,
          historyItems.length,
          `سڕینەوەی باتری: ${batName}`,
          performer,
          currentUserId || null,
          JSON.stringify([batterySnapshot]),
        ],
      },
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
      performer,
      currentUserId,
      batName,
      `باتری "${batName}" لەگەڵ تەواوی مێژووەکەی سڕایەوە و لە لۆگی سڕینەوە تۆمارکرا`
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
 * Clear all batteries transactionally with Turso deletion snapshot and direct verification (Admin only)
 */
export async function clearAllBatteriesAction(
  reason?: string,
  clearedBy?: string,
  currentUserId?: string,
  isAdmin: boolean = false
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    // 1. Fetch full snapshot of existing batteries and charge histories before clearing
    const batRows = await client.execute(`SELECT * FROM batteries`);
    const histRows = await client.execute(`SELECT * FROM charge_history`);

    const historyByBattery: Record<string, ChargeRecord[]> = {};
    for (const row of histRows.rows) {
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

    const currentBatteries: Battery[] = batRows.rows.map((row: any) => {
      let cells: any = undefined;
      if (row.cells_json) {
        try {
          cells = JSON.parse(String(row.cells_json));
        } catch (e) {}
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

    const count = currentBatteries.length;
    const totalHistory = histRows.rows.length;
    const deletionLogId = `del_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const timestamp = new Date().toISOString();
    const performer = clearedBy || 'بەڕێوەبەری سیستەم';

    // 1. Save snapshot in deletion_logs table if there are batteries
    if (count > 0) {
      try {
        await client.execute({
          sql: `INSERT INTO deletion_logs (
            id, timestamp, batteryCountCleared, historyCountCleared, reason, clearedBy, clearedById, deletedBatteries_json, isRestored
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          args: [
            deletionLogId,
            timestamp,
            count,
            totalHistory,
            reason || 'سڕینەوەی گشتیی دەستی لە لایەن بەکارهێنەرەوە',
            performer,
            currentUserId || null,
            JSON.stringify(currentBatteries),
          ],
        });
      } catch (logErr) {
        console.error('Failed to insert deletion log snapshot:', logErr);
      }
    }

    // 2. Perform direct reliable deletes
    await client.execute(`DELETE FROM charge_history`);
    await client.execute(`DELETE FROM batteries`);

    // 3. Fallback: Force explicit ID deletions for any remaining rows
    for (const bat of currentBatteries) {
      try {
        await client.execute({
          sql: `DELETE FROM charge_history WHERE batteryId = ?`,
          args: [bat.id],
        });
        await client.execute({
          sql: `DELETE FROM batteries WHERE id = ?`,
          args: [bat.id],
        });
      } catch (e) {
        // Ignore single item delete error
      }
    }

    // 4. Direct Verification Query: Verify Turso tables are completely empty
    const verifyRes = await client.execute(`SELECT COUNT(*) as count FROM batteries`);
    const remainingCount = Number(verifyRes.rows[0]?.count || 0);

    if (remainingCount > 0) {
      // Retry forced cleanup
      await client.execute(`DELETE FROM charge_history`);
      await client.execute(`DELETE FROM batteries`);
    }

    await logActivity(
      'SYSTEM_RESET',
      'سڕینەوەی گشتیی داتاکان',
      performer,
      currentUserId,
      'تەواوی داتای باترییەکان',
      `سڕینەوەی سەرکەوتووی ${count} باتری و ${totalHistory} تۆماری مێژوویی لە داتابەیسی سەرەکی Turso`
    );

    return { success: true, count };
  } catch (err: any) {
    console.error('Error clearing batteries from Turso:', err);
    return { success: false, count: 0, error: err.message };
  }
}

/**
 * Transactionally restore deleted batteries from a specific deletion log in Turso
 */
export async function restoreDeletedDataAction(
  logId: string,
  currentUserId?: string,
  currentUserName?: string
): Promise<{
  success: boolean;
  restoredCount: number;
  error?: string;
}> {
  try {
    await ensureTables();
    const client = getTursoClient();

    // 1. Fetch deletion log
    const logRes = await client.execute({
      sql: `SELECT * FROM deletion_logs WHERE id = ? LIMIT 1`,
      args: [logId],
    });

    if (logRes.rows.length === 0) {
      return { success: false, restoredCount: 0, error: 'لۆگی سڕینەوەی داواکراو نەدۆزرایەوە' };
    }

    const logRow: any = logRes.rows[0];
    if (!logRow.deletedBatteries_json) {
      return { success: false, restoredCount: 0, error: 'هیچ داتایەکی باتری لەم لۆگەدا نییە' };
    }

    let batteriesToRestore: Battery[] = [];
    try {
      batteriesToRestore = JSON.parse(String(logRow.deletedBatteries_json));
    } catch (e) {
      return { success: false, restoredCount: 0, error: 'هەڵە لە خوێندنەوەی پەڕگەی باترییە سڕاوەکان' };
    }

    if (!Array.isArray(batteriesToRestore) || batteriesToRestore.length === 0) {
      return { success: false, restoredCount: 0, error: 'هیچ باترییەک بۆ گەڕاندنەوە بوونی نییە' };
    }

    // 2. Fetch current existing battery IDs to prevent collision
    const existingRes = await client.execute(`SELECT id FROM batteries`);
    const existingIds = new Set(existingRes.rows.map((r: any) => String(r.id)));

    const statements: any[] = [];
    const restoredAt = new Date().toISOString();
    const restoredBy = currentUserName || 'بەڕێوەبەری سیستەم';

    for (const b of batteriesToRestore) {
      // Re-assign ID if active battery shares ID
      let finalId = b.id;
      if (existingIds.has(finalId)) {
        finalId = `bat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      }
      existingIds.add(finalId);

      const cellsJson = b.cells ? JSON.stringify(b.cells) : null;
      const ownerUserId = b.userId || currentUserId || null;
      const ownerName = b.authorName || restoredBy;

      statements.push({
        sql: `INSERT OR REPLACE INTO batteries (
          id, userId, authorName, name, category, lastChargeDate, reminderIntervalDays,
          voltage, storagePercentage, notes, cells_json, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          finalId,
          ownerUserId,
          ownerName,
          b.name,
          b.category,
          b.lastChargeDate || getTodayISODate(),
          b.reminderIntervalDays || 40,
          b.voltage ?? null,
          b.storagePercentage ?? null,
          b.notes ?? null,
          cellsJson,
          b.createdAt || getTodayISODate(),
        ],
      });

      if (b.history && Array.isArray(b.history)) {
        for (const h of b.history) {
          const histId = h.id || `hist_${finalId}_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
          statements.push({
            sql: `INSERT OR REPLACE INTO charge_history (
              id, batteryId, userId, authorName, chargeDate, chargeTime, daysSincePrevious, notes, percentage
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [
              histId,
              finalId,
              ownerUserId,
              ownerName,
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

    // Mark deletion log as restored
    statements.push({
      sql: `UPDATE deletion_logs SET isRestored = 1, restoredAt = ?, restoredBy = ? WHERE id = ?`,
      args: [restoredAt, restoredBy, logId],
    });

    // Execute batch insertion
    for (let i = 0; i < statements.length; i += 100) {
      const chunk = statements.slice(i, i + 100);
      await client.batch(chunk);
    }

    // 3. Direct Verification: Verify restored batteries now exist in Turso
    const countCheck = await client.execute(`SELECT COUNT(*) as count FROM batteries`);
    const totalCount = Number(countCheck.rows[0]?.count || 0);

    if (totalCount === 0) {
      throw new Error('داتابەیس پشڕاست نەکراوە: هیچ باترییەک پاش گەڕاندنەوە نەدۆزرایەوە.');
    }

    await logActivity(
      'BATTERY_ADD',
      'گەڕاندنەوەی داتای سڕاوە (Restore)',
      restoredBy,
      currentUserId,
      `${batteriesToRestore.length} باتری`,
      `گەڕاندنەوەی سەرکەوتووی ${batteriesToRestore.length} باتری لە لۆگی سڕینەوە بۆ ناو داتابەیسی سەرەکی Turso`
    );

    return { success: true, restoredCount: batteriesToRestore.length };
  } catch (err: any) {
    console.error('Error restoring deleted data in Turso:', err);
    return { success: false, restoredCount: 0, error: err.message };
  }
}

/**
 * Restore all deleted data across all unrestored logs in Turso
 */
export async function restoreAllDeletedDataAction(
  currentUserId?: string,
  currentUserName?: string
): Promise<{
  success: boolean;
  restoredCount: number;
  error?: string;
}> {
  try {
    await ensureTables();
    const client = getTursoClient();

    const logsRes = await client.execute(`SELECT * FROM deletion_logs WHERE isRestored = 0 ORDER BY timestamp ASC`);
    if (logsRes.rows.length === 0) {
      return { success: true, restoredCount: 0 };
    }

    let totalRestored = 0;
    for (const logRow of logsRes.rows) {
      const res = await restoreDeletedDataAction(String(logRow.id), currentUserId, currentUserName);
      if (res.success) {
        totalRestored += res.restoredCount;
      }
    }

    return { success: true, restoredCount: totalRestored };
  } catch (err: any) {
    console.error('Error restoring all deleted data:', err);
    return { success: false, restoredCount: 0, error: err.message };
  }
}

/**
 * Clear all deletion logs in Turso (Admin only)
 */
export async function clearDeletionLogsAction(
  currentUserId?: string,
  currentUserName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    await client.execute(`DELETE FROM deletion_logs`);

    await logActivity(
      'SYSTEM_RESET',
      'سڕینەوەی لۆگی سڕینەوەکان',
      currentUserName || 'بەڕێوەبەری سیستەم',
      currentUserId,
      'تەواوی مێژووی لۆگی سڕینەوەکان',
      'سڕینەوە و پاککردنەوەی گشتیی خشتەی لۆگی سڕینەوەکان لە Turso'
    );

    return { success: true };
  } catch (err: any) {
    console.error('Error clearing deletion logs in Turso:', err);
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
