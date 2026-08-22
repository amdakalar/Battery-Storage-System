import { createClient, Client } from '@libsql/client';

let tursoClient: Client | null = null;

/**
 * Get or initialize the LibSQL / Turso Cloud SQLite Client.
 * Uses environment variables:
 * - TURSO_DATABASE_URL (e.g. libsql://your-db-name.turso.io)
 * - TURSO_AUTH_TOKEN (Turso auth token)
 * 
 * Falls back to a local SQLite file (file:local.db) if no Turso URL is specified.
 */
export function getTursoClient(): Client {
  if (tursoClient) return tursoClient;

  const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
  const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

  tursoClient = createClient({
    url,
    authToken,
  });

  return tursoClient;
}

/**
 * Ensures all required SQLite tables and indexes exist in Turso / LibSQL.
 */
export async function initTursoTables(): Promise<void> {
  const client = getTursoClient();

  await client.batch([
    `CREATE TABLE IF NOT EXISTS batteries (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      lastChargeDate TEXT NOT NULL,
      reminderIntervalDays INTEGER NOT NULL DEFAULT 40,
      voltage REAL,
      storagePercentage REAL,
      notes TEXT,
      cells_json TEXT,
      image_url TEXT,
      createdAt TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS charge_history (
      id TEXT PRIMARY KEY,
      batteryId TEXT NOT NULL,
      chargeDate TEXT NOT NULL,
      chargeTime TEXT,
      daysSincePrevious INTEGER,
      notes TEXT,
      percentage REAL,
      FOREIGN KEY (batteryId) REFERENCES batteries (id) ON DELETE CASCADE
    );`,

    `CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );`,

    `CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      meta_json TEXT
    );`,

    `CREATE INDEX IF NOT EXISTS idx_charge_history_batteryId ON charge_history (batteryId);`,
    `CREATE INDEX IF NOT EXISTS idx_batteries_createdAt ON batteries (createdAt DESC);`,
  ]);
}
