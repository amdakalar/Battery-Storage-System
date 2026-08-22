import { createClient, Client } from '@libsql/client';
import { Battery } from '../types';

let tursoClient: Client | null = null;

function isRemoteLibsqlUrl(url?: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();
  return (
    trimmed.startsWith('libsql://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('wss://') ||
    trimmed.startsWith('ws://')
  );
}

/**
 * Local Web fallback query processor when running offline in browser / Electron
 */
async function executeWebLocalQuery(stmt: any): Promise<{ rows: any[]; columns: string[] }> {
  const sql = (typeof stmt === 'string' ? stmt : stmt?.sql || '').trim();
  const args = (typeof stmt === 'object' && Array.isArray(stmt?.args) ? stmt.args : []);
  const lowerSql = sql.toLowerCase();

  // 1. Schema queries (CREATE, ALTER, INDEX) -> return empty success
  if (
    lowerSql.startsWith('create ') ||
    lowerSql.startsWith('alter ') ||
    lowerSql.startsWith('drop ') ||
    lowerSql.startsWith('pragma ')
  ) {
    return { rows: [], columns: [] };
  }

  // 2. Users Table Queries
  if (lowerSql.includes('users')) {
    const USERS_STORAGE_KEY = 'storage_local_users_v1';
    let users: any[] = [];
    try {
      const raw = localStorage.getItem(USERS_STORAGE_KEY);
      users = raw ? JSON.parse(raw) : [];
    } catch (e) {
      users = [];
    }

    if (users.length === 0) {
      // Default admin user
      users = [
        {
          id: 'usr_admin_default',
          username: 'admin',
          fullName: 'بەڕێوەبەری سەرەکی (Admin)',
          passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
          role: 'ADMIN',
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          approvedBy: 'SYSTEM',
          approvedAt: '2026-01-01T00:00:00.000Z',
          lastLoginAt: new Date().toISOString(),
        },
      ];
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      } catch (e) {}
    }

    if (lowerSql.startsWith('select count(*) as count from users where status = \'pending\'') || lowerSql.includes("status = 'pending'")) {
      const pending = users.filter((u) => u.status === 'PENDING').length;
      return { rows: [{ count: pending }], columns: ['count'] };
    }

    if (lowerSql.startsWith('select count(*)')) {
      return { rows: [{ count: users.length }], columns: ['count'] };
    }

    if (lowerSql.includes('where lower(username) = ?') || lowerSql.includes('where username = ?')) {
      const uname = String(args[0] || '').toLowerCase().trim();
      const match = users.filter((u) => u.username.toLowerCase() === uname);
      return { rows: match, columns: Object.keys(match[0] || {}) };
    }

    if (lowerSql.includes('where id = ?')) {
      const uId = String(args[0] || '');
      const match = users.filter((u) => u.id === uId);
      return { rows: match, columns: Object.keys(match[0] || {}) };
    }

    if (lowerSql.startsWith('select * from users')) {
      return { rows: users, columns: Object.keys(users[0] || {}) };
    }

    if (lowerSql.startsWith('insert into users') || lowerSql.startsWith('insert or replace into users')) {
      const newUser = {
        id: args[0],
        username: args[1],
        fullName: args[2],
        passwordHash: args[3],
        role: args[4] || 'USER',
        status: args[5] || 'PENDING',
        createdAt: args[6] || new Date().toISOString(),
        approvedBy: args[7] || null,
        approvedAt: args[8] || null,
        lastLoginAt: args[9] || null,
      };
      const existingIdx = users.findIndex((u) => u.id === newUser.id || u.username.toLowerCase() === newUser.username.toLowerCase());
      if (existingIdx >= 0) {
        users[existingIdx] = newUser;
      } else {
        users.push(newUser);
      }
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      } catch (e) {}
      return { rows: [], columns: [] };
    }

    if (lowerSql.startsWith('update users')) {
      if (lowerSql.includes('lastloginat = ? where id = ?')) {
        const [lastLoginAt, id] = args;
        users = users.map((u) => (u.id === id ? { ...u, lastLoginAt } : u));
      } else if (lowerSql.includes('status = ?')) {
        const [status, approvedBy, approvedAt, id] = args;
        users = users.map((u) => (u.id === id ? { ...u, status, approvedBy, approvedAt } : u));
      } else if (lowerSql.includes('role = ?') && lowerSql.includes('passwordhash = ?')) {
        const [fullName, username, role, passwordHash, id] = args;
        users = users.map((u) => (u.id === id ? { ...u, fullName, username, role, passwordHash } : u));
      } else if (lowerSql.includes('role = ?')) {
        const [fullName, username, role, id] = args;
        users = users.map((u) => (u.id === id ? { ...u, fullName, username, role } : u));
      }
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      } catch (e) {}
      return { rows: [], columns: [] };
    }

    if (lowerSql.startsWith('delete from users where id = ?')) {
      const uId = String(args[0] || '');
      users = users.filter((u) => u.id !== uId);
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      } catch (e) {}
      return { rows: [], columns: [] };
    }
  }

  // 3. Batteries Table Queries
  if (lowerSql.includes('batteries')) {
    const BATTERIES_KEY = 'drone_batteries_storage_v1';
    let batteries: Battery[] = [];
    try {
      const raw = localStorage.getItem(BATTERIES_KEY);
      batteries = raw ? JSON.parse(raw) : [];
    } catch (e) {
      batteries = [];
    }

    if (lowerSql.startsWith('select count(*)')) {
      return { rows: [{ count: batteries.length }], columns: ['count'] };
    }

    if (lowerSql.startsWith('select * from batteries')) {
      return { rows: batteries, columns: Object.keys(batteries[0] || {}) };
    }

    if (lowerSql.startsWith('delete from batteries')) {
      if (lowerSql.includes('where id = ?')) {
        const bId = String(args[0] || '');
        batteries = batteries.filter((b) => b.id !== bId);
      } else {
        batteries = [];
      }
      try {
        localStorage.setItem(BATTERIES_KEY, JSON.stringify(batteries));
      } catch (e) {}
      return { rows: [], columns: [] };
    }
  }

  // 4. Charge History Table Queries
  if (lowerSql.includes('charge_history')) {
    const BATTERIES_KEY = 'drone_batteries_storage_v1';
    let batteries: Battery[] = [];
    try {
      const raw = localStorage.getItem(BATTERIES_KEY);
      batteries = raw ? JSON.parse(raw) : [];
    } catch (e) {
      batteries = [];
    }

    const allHistory: any[] = [];
    for (const b of batteries) {
      if (b.history) {
        for (const h of b.history) {
          allHistory.push({ ...h, batteryId: b.id });
        }
      }
    }

    if (lowerSql.startsWith('select count(*)')) {
      return { rows: [{ count: allHistory.length }], columns: ['count'] };
    }

    if (lowerSql.startsWith('select * from charge_history')) {
      return { rows: allHistory, columns: Object.keys(allHistory[0] || {}) };
    }

    if (lowerSql.startsWith('delete from charge_history')) {
      return { rows: [], columns: [] };
    }
  }

  // 5. Deletion Logs Table Queries
  if (lowerSql.includes('deletion_logs')) {
    const DELETION_LOGS_KEY = 'kurdish_battery_deletion_logs_v1';
    let logs: any[] = [];
    try {
      const raw = localStorage.getItem(DELETION_LOGS_KEY);
      logs = raw ? JSON.parse(raw) : [];
    } catch (e) {
      logs = [];
    }

    if (lowerSql.startsWith('select * from deletion_logs where isrestored = 0')) {
      const unrestored = logs.filter((l) => !l.isRestored);
      return { rows: unrestored, columns: Object.keys(unrestored[0] || {}) };
    }

    if (lowerSql.startsWith('select * from deletion_logs where id = ?')) {
      const lId = String(args[0] || '');
      const match = logs.filter((l) => l.id === lId);
      return { rows: match, columns: Object.keys(match[0] || {}) };
    }

    if (lowerSql.startsWith('select * from deletion_logs')) {
      return { rows: logs, columns: Object.keys(logs[0] || {}) };
    }

    if (lowerSql.startsWith('insert into deletion_logs')) {
      const newLog = {
        id: args[0],
        timestamp: args[1],
        batteryCountCleared: args[2],
        historyCountCleared: args[3],
        reason: args[4],
        clearedBy: args[5],
        clearedById: args[6],
        deletedBatteries_json: args[7],
        isRestored: 0,
      };
      logs = [newLog, ...logs];
      try {
        localStorage.setItem(DELETION_LOGS_KEY, JSON.stringify(logs));
      } catch (e) {}
      return { rows: [], columns: [] };
    }

    if (lowerSql.startsWith('update deletion_logs set isrestored = 1')) {
      const [restoredAt, restoredBy, id] = args;
      logs = logs.map((l) => (l.id === id ? { ...l, isRestored: 1, restoredAt, restoredBy } : l));
      try {
        localStorage.setItem(DELETION_LOGS_KEY, JSON.stringify(logs));
      } catch (e) {}
      return { rows: [], columns: [] };
    }

    if (lowerSql.startsWith('delete from deletion_logs')) {
      try {
        localStorage.removeItem(DELETION_LOGS_KEY);
      } catch (e) {}
      return { rows: [], columns: [] };
    }
  }

  // 6. Audit logs
  if (lowerSql.includes('audit_logs')) {
    return { rows: [], columns: [] };
  }

  return { rows: [], columns: [] };
}

function createWebLocalClient(): Client {
  return {
    async execute(stmt: any): Promise<any> {
      return await executeWebLocalQuery(stmt);
    },
    async batch(stmts: any[]): Promise<any[]> {
      const results: any[] = [];
      for (const s of stmts) {
        results.push(await executeWebLocalQuery(s));
      }
      return results;
    },
    async transaction(): Promise<any> {
      return this;
    },
    close() {},
    closed: false,
    protocol: 'ws',
  } as any;
}

/**
 * Reset active Turso client instance (used when cloud credentials change)
 */
export function resetTursoClient(): void {
  tursoClient = null;
}

/**
 * Save custom Turso credentials to localStorage and reset client
 */
export function saveCloudTursoConfig(url: string, token: string): void {
  if (typeof localStorage !== 'undefined') {
    if (url.trim()) {
      localStorage.setItem('turso_cloud_database_url', url.trim());
    } else {
      localStorage.removeItem('turso_cloud_database_url');
    }

    if (token.trim()) {
      localStorage.setItem('turso_cloud_auth_token', token.trim());
    } else {
      localStorage.removeItem('turso_cloud_auth_token');
    }
  }
  resetTursoClient();
}

/**
 * Get current active Turso configuration
 */
export function getCloudTursoConfig(): {
  url: string;
  authToken: string;
  isConfigured: boolean;
  isRemote: boolean;
} {
  let customUrl = '';
  let customToken = '';
  if (typeof localStorage !== 'undefined') {
    try {
      customUrl = localStorage.getItem('turso_cloud_database_url') || '';
      customToken = localStorage.getItem('turso_cloud_auth_token') || '';
    } catch (e) {}
  }

  const url = customUrl ||
              (typeof process !== 'undefined' && process.env?.TURSO_DATABASE_URL) ||
              (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TURSO_DATABASE_URL) ||
              (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TURSO_DATABASE_URL) ||
              '';

  const authToken = customToken ||
                    (typeof process !== 'undefined' && process.env?.TURSO_AUTH_TOKEN) ||
                    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TURSO_AUTH_TOKEN) ||
                    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TURSO_AUTH_TOKEN) ||
                    '';

  const isRemote = isRemoteLibsqlUrl(url);

  return {
    url,
    authToken,
    isConfigured: Boolean(url.trim()),
    isRemote,
  };
}

/**
 * Test Turso connection directly and query battery count
 */
export async function testTursoConnection(
  customUrl?: string,
  customToken?: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const config = getCloudTursoConfig();
    const targetUrl = (customUrl !== undefined ? customUrl : config.url).trim();
    const targetToken = (customToken !== undefined ? customToken : config.authToken).trim();

    if (!targetUrl) {
      return { success: false, error: 'تکایە ناونیشانی داتابەیسی کلاود (Database URL) بنووسە' };
    }

    if (!isRemoteLibsqlUrl(targetUrl)) {
      return { success: false, error: 'ناونیشانی داتابەیس دەبێت بە libsql:// یان https:// دەستپێبکات (وەک: libsql://your-db.turso.io)' };
    }

    const testClient = createClient({
      url: targetUrl,
      authToken: targetToken || undefined,
    });

    const res = await testClient.execute('SELECT COUNT(*) as count FROM batteries');
    const count = Number(res.rows[0]?.count || 0);

    return { success: true, count };
  } catch (err: any) {
    return { success: false, error: err.message || 'نەتوانرا پەیوەندی بە داتابەیسی کلاودەوە بکرێت' };
  }
}

/**
 * Get or initialize the LibSQL / Turso Cloud SQLite Client.
 */
export function getTursoClient(): Client {
  if (tursoClient) return tursoClient;

  let defaultLocal = 'file:local.db';
  if (typeof process !== 'undefined' && (process.env?.VERCEL || process.env?.TMPDIR || (process.platform === 'linux' && process.env?.NODE_ENV === 'production'))) {
    defaultLocal = 'file:/tmp/local.db';
  }

  let customUrl = '';
  let customToken = '';
  if (typeof localStorage !== 'undefined') {
    try {
      customUrl = localStorage.getItem('turso_cloud_database_url') || '';
      customToken = localStorage.getItem('turso_cloud_auth_token') || '';
    } catch (e) {}
  }

  const url = customUrl ||
              (typeof process !== 'undefined' && process.env?.TURSO_DATABASE_URL) ||
              (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TURSO_DATABASE_URL) ||
              (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TURSO_DATABASE_URL) ||
              defaultLocal;

  const authToken = customToken ||
                    (typeof process !== 'undefined' && process.env?.TURSO_AUTH_TOKEN) ||
                    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_TURSO_AUTH_TOKEN) ||
                    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_TURSO_AUTH_TOKEN) ||
                    undefined;

  if (isRemoteLibsqlUrl(url)) {
    try {
      tursoClient = createClient({
        url,
        authToken: authToken || undefined,
      });
      return tursoClient;
    } catch (err) {
      console.warn('Failed to connect to remote Turso database, falling back to local client:', err);
    }
  }

  // Node.js server environment (Server Actions) can use @libsql/client with file:
  if (typeof window === 'undefined') {
    try {
      tursoClient = createClient({
        url: url || defaultLocal,
        authToken: authToken || undefined,
      });
      return tursoClient;
    } catch (e) {
      // Fallback
    }
  }

  // In Browser / Electron renderer environment when no remote URL is present:
  tursoClient = createWebLocalClient();
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

    `CREATE TABLE IF NOT EXISTS deletion_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      batteryCountCleared INTEGER NOT NULL DEFAULT 0,
      historyCountCleared INTEGER NOT NULL DEFAULT 0,
      reason TEXT,
      clearedBy TEXT,
      clearedById TEXT,
      deletedBatteries_json TEXT,
      isRestored INTEGER NOT NULL DEFAULT 0,
      restoredAt TEXT,
      restoredBy TEXT
    );`,

    `CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);`,
    `CREATE INDEX IF NOT EXISTS idx_batteries_userId ON batteries (userId);`,
    `CREATE INDEX IF NOT EXISTS idx_charge_history_batteryId ON charge_history (batteryId);`,
    `CREATE INDEX IF NOT EXISTS idx_batteries_createdAt ON batteries (createdAt DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs (timestamp DESC);`,
    `CREATE INDEX IF NOT EXISTS idx_deletion_logs_timestamp ON deletion_logs (timestamp DESC);`,
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
