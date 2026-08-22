import { createClient, Client } from '@libsql/client';

let tursoClient: Client | null = null;

/**
 * Get or initialize the LibSQL / Turso Cloud SQLite Client.
 * Uses environment variables:
 * - TURSO_DATABASE_URL (e.g. libsql://your-db-name.turso.io)
 * - TURSO_AUTH_TOKEN (Turso auth token)
 * 
 * Falls back to a local SQLite file in /tmp or local.db if no Turso URL is specified.
 */
export function getTursoClient(): Client {
  if (tursoClient) return tursoClient;

  // On Vercel serverless functions, the root filesystem is read-only, so SQLite fallback must be in /tmp
  let defaultLocal = 'file:local.db';
  if (process.env.VERCEL || process.env.TMPDIR || (process.platform === 'linux' && process.env.NODE_ENV === 'production')) {
    defaultLocal = 'file:/tmp/local.db';
  }

  const url = process.env.TURSO_DATABASE_URL || defaultLocal;
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
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      fullName TEXT NOT NULL,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'USER',
      status TEXT NOT NULL DEFAULT 'PENDING',
      createdAt TEXT NOT NULL,
      approvedBy TEXT,
      approvedAt TEXT,
      lastLoginAt TEXT
    );`,

    `CREATE TABLE IF NOT EXISTS batteries (
      id TEXT PRIMARY KEY,
      userId TEXT,
      authorName TEXT,
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
      userId TEXT,
      authorName TEXT,
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
      actionTitle TEXT,
      performedBy TEXT,
      performedById TEXT,
      targetName TEXT,
      details TEXT,
      meta_json TEXT
    );`,

    `CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);`,
    `CREATE INDEX IF NOT EXISTS idx_batteries_userId ON batteries (userId);`,
    `CREATE INDEX IF NOT EXISTS idx_charge_history_batteryId ON charge_history (batteryId);`,
    `CREATE INDEX IF NOT EXISTS idx_batteries_createdAt ON batteries (createdAt DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);`,
  ]);

  // Safe incremental migrations for existing tables
  const migrations = [
    `ALTER TABLE batteries ADD COLUMN userId TEXT;`,
    `ALTER TABLE batteries ADD COLUMN authorName TEXT;`,
    `ALTER TABLE charge_history ADD COLUMN userId TEXT;`,
    `ALTER TABLE charge_history ADD COLUMN authorName TEXT;`,
    `ALTER TABLE audit_logs ADD COLUMN actionTitle TEXT;`,
    `ALTER TABLE audit_logs ADD COLUMN performedBy TEXT;`,
    `ALTER TABLE audit_logs ADD COLUMN performedById TEXT;`,
    `ALTER TABLE audit_logs ADD COLUMN targetName TEXT;`,
  ];

  for (const query of migrations) {
    try {
      await client.execute(query);
    } catch (e) {
      // Column already exists
    }
  }
}
