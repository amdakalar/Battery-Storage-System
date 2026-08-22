'use server';

import crypto from 'crypto';
import { getTursoClient, initTursoTables } from '@/src/lib/turso';
import { User, UserRole, UserStatus } from '@/src/types';

// Auto-initialize tables
let tablesInitialized = false;
async function ensureTables() {
  if (!tablesInitialized) {
    await initTursoTables();
    tablesInitialized = true;
  }
}

/**
 * Hash password with SHA-256 and constant salt
 */
function hashPassword(password: string, salt: string = 'storage_salt_v1'): string {
  return crypto.createHash('sha256').update(`${password}:${salt}`).digest('hex');
}

/**
 * Register a new user.
 * The very first user created in the database becomes an ACTIVE ADMIN.
 * All subsequent users are created as PENDING USERs awaiting Admin approval.
 */
export async function registerUserAction(data: {
  username: string;
  fullName: string;
  password: string;
}): Promise<{
  success: boolean;
  isFirstAdmin?: boolean;
  isPending?: boolean;
  user?: User;
  error?: string;
}> {
  try {
    await ensureTables();
    const client = getTursoClient();

    const username = data.username.trim().toLowerCase();
    const fullName = data.fullName.trim();
    const password = data.password;

    if (!username || username.length < 3) {
      return { success: false, error: 'ناوی بەکارهێنەر دەبێت کەمترین ۳ پیت بێت' };
    }
    if (!fullName || fullName.length < 2) {
      return { success: false, error: 'تکایە ناوی تەواو بنووسە' };
    }
    if (!password || password.length < 4) {
      return { success: false, error: 'وشەی نهێنی دەبێت کەمترین ٤ پیت/ژمارە بێت' };
    }

    // Check if username already exists
    const existing = await client.execute({
      sql: `SELECT id FROM users WHERE LOWER(username) = ? LIMIT 1`,
      args: [username],
    });

    if (existing.rows.length > 0) {
      return { success: false, error: 'ئەم ناوی بەکارهێنەرە پێشتر تۆمارکراوە' };
    }

    // Check total user count to see if this is the first user (Initial Admin)
    const countRes = await client.execute(`SELECT COUNT(*) as count FROM users`);
    const isFirstUser = Number(countRes.rows[0]?.count || 0) === 0;

    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const role: UserRole = isFirstUser ? 'ADMIN' : 'USER';
    const status: UserStatus = isFirstUser ? 'ACTIVE' : 'PENDING';
    const createdAt = new Date().toISOString();
    const passwordHash = hashPassword(password);

    await client.execute({
      sql: `INSERT INTO users (
        id, username, fullName, passwordHash, role, status, createdAt, approvedBy, approvedAt, lastLoginAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id,
        username,
        fullName,
        passwordHash,
        role,
        status,
        createdAt,
        isFirstUser ? 'SYSTEM' : null,
        isFirstUser ? createdAt : null,
        isFirstUser ? createdAt : null,
      ],
    });

    const user: User = {
      id,
      username,
      fullName,
      role,
      status,
      createdAt,
      approvedBy: isFirstUser ? 'SYSTEM' : undefined,
      approvedAt: isFirstUser ? createdAt : undefined,
      lastLoginAt: isFirstUser ? createdAt : undefined,
    };

    return {
      success: true,
      isFirstAdmin: isFirstUser,
      isPending: !isFirstUser,
      user,
    };
  } catch (err: any) {
    console.error('Error registering user:', err);
    return { success: false, error: err.message || 'هەڵەیەک ڕوویدا لە کاتی تۆمارکردن' };
  }
}

/**
 * Log in with username and password
 */
export async function loginUserAction(data: {
  username: string;
  password: string;
}): Promise<{
  success: boolean;
  isPending?: boolean;
  isBlocked?: boolean;
  user?: User;
  error?: string;
}> {
  try {
    await ensureTables();
    const client = getTursoClient();

    const username = data.username.trim().toLowerCase();
    const password = data.password;

    const result = await client.execute({
      sql: `SELECT * FROM users WHERE LOWER(username) = ? LIMIT 1`,
      args: [username],
    });

    if (result.rows.length === 0) {
      return { success: false, error: 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە' };
    }

    const row: any = result.rows[0];
    const passwordHash = hashPassword(password);

    if (String(row.passwordHash) !== passwordHash) {
      return { success: false, error: 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە' };
    }

    const status: UserStatus = String(row.status) as UserStatus;

    if (status === 'PENDING') {
      return {
        success: false,
        isPending: true,
        error: 'هەژمارەکەت تۆمارکراوە بەڵام چاوەڕوانی پەسەندکردنی بەڕێوەبەر (ئادمین) دەکات.',
      };
    }

    if (status === 'BLOCKED') {
      return {
        success: false,
        isBlocked: true,
        error: 'ئەم هەژمارە لەلایەن بەڕێوەبەرەوە ڕاگیراوە.',
      };
    }

    // Update lastLoginAt
    const now = new Date().toISOString();
    await client.execute({
      sql: `UPDATE users SET lastLoginAt = ? WHERE id = ?`,
      args: [now, String(row.id)],
    });

    const user: User = {
      id: String(row.id),
      username: String(row.username),
      fullName: String(row.fullName),
      role: String(row.role) as UserRole,
      status: String(row.status) as UserStatus,
      createdAt: String(row.createdAt),
      approvedBy: row.approvedBy ? String(row.approvedBy) : undefined,
      approvedAt: row.approvedAt ? String(row.approvedAt) : undefined,
      lastLoginAt: now,
    };

    return {
      success: true,
      user,
    };
  } catch (err: any) {
    console.error('Error logging in:', err);
    return { success: false, error: err.message || 'هەڵەیەک ڕوویدا لە کاتی چوونەژوورەوە' };
  }
}

/**
 * Get all users in the system (Admin only)
 */
export async function getAllUsersAction(adminUserId: string): Promise<{
  success: boolean;
  users?: User[];
  error?: string;
}> {
  try {
    await ensureTables();
    const client = getTursoClient();

    // Verify admin
    const adminCheck = await client.execute({
      sql: `SELECT role FROM users WHERE id = ? LIMIT 1`,
      args: [adminUserId],
    });

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'ADMIN') {
      return { success: false, error: 'دەسەڵاتی ئادمین پێویستە' };
    }

    const result = await client.execute(`SELECT id, username, fullName, role, status, createdAt, approvedBy, approvedAt, lastLoginAt FROM users ORDER BY createdAt DESC`);

    const users: User[] = result.rows.map((row: any) => ({
      id: String(row.id),
      username: String(row.username),
      fullName: String(row.fullName),
      role: String(row.role) as UserRole,
      status: String(row.status) as UserStatus,
      createdAt: String(row.createdAt),
      approvedBy: row.approvedBy ? String(row.approvedBy) : undefined,
      approvedAt: row.approvedAt ? String(row.approvedAt) : undefined,
      lastLoginAt: row.lastLoginAt ? String(row.lastLoginAt) : undefined,
    }));

    return { success: true, users };
  } catch (err: any) {
    console.error('Error getting users:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Approve or Block a user (Admin only)
 */
export async function updateUserStatusAction(
  adminUserId: string,
  targetUserId: string,
  newStatus: UserStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    // Verify admin
    const adminCheck = await client.execute({
      sql: `SELECT role, fullName FROM users WHERE id = ? LIMIT 1`,
      args: [adminUserId],
    });

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'ADMIN') {
      return { success: false, error: 'دەسەڵاتی ئادمین پێویستە' };
    }

    const now = new Date().toISOString();
    const approvedBy = String(adminCheck.rows[0].fullName || 'Admin');

    if (newStatus === 'ACTIVE') {
      await client.execute({
        sql: `UPDATE users SET status = ?, approvedBy = ?, approvedAt = ? WHERE id = ?`,
        args: [newStatus, approvedBy, now, targetUserId],
      });
    } else {
      await client.execute({
        sql: `UPDATE users SET status = ? WHERE id = ?`,
        args: [newStatus, targetUserId],
      });
    }

    return { success: true };
  } catch (err: any) {
    console.error('Error updating user status:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Change user role between ADMIN and USER (Admin only)
 */
export async function updateUserRoleAction(
  adminUserId: string,
  targetUserId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    // Verify admin
    const adminCheck = await client.execute({
      sql: `SELECT role FROM users WHERE id = ? LIMIT 1`,
      args: [adminUserId],
    });

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'ADMIN') {
      return { success: false, error: 'دەسەڵاتی ئادمین پێویستە' };
    }

    await client.execute({
      sql: `UPDATE users SET role = ? WHERE id = ?`,
      args: [newRole, targetUserId],
    });

    return { success: true };
  } catch (err: any) {
    console.error('Error updating user role:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Delete a user (Admin only)
 */
export async function deleteUserAction(
  adminUserId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    // Prevent self-deletion
    if (adminUserId === targetUserId) {
      return { success: false, error: 'ناتوانیت هەژماری خۆت بسڕیتەوە' };
    }

    // Verify admin
    const adminCheck = await client.execute({
      sql: `SELECT role FROM users WHERE id = ? LIMIT 1`,
      args: [adminUserId],
    });

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'ADMIN') {
      return { success: false, error: 'دەسەڵاتی ئادمین پێویستە' };
    }

    await client.batch([
      {
        sql: `DELETE FROM charge_history WHERE userId = ?`,
        args: [targetUserId],
      },
      {
        sql: `DELETE FROM batteries WHERE userId = ?`,
        args: [targetUserId],
      },
      {
        sql: `DELETE FROM users WHERE id = ?`,
        args: [targetUserId],
      },
    ]);

    return { success: true };
  } catch (err: any) {
    console.error('Error deleting user:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Count pending users awaiting approval
 */
export async function getPendingUsersCountAction(adminUserId: string): Promise<number> {
  try {
    await ensureTables();
    const client = getTursoClient();

    const adminCheck = await client.execute({
      sql: `SELECT role FROM users WHERE id = ? LIMIT 1`,
      args: [adminUserId],
    });

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'ADMIN') {
      return 0;
    }

    const countRes = await client.execute(`SELECT COUNT(*) as count FROM users WHERE status = 'PENDING'`);
    return Number(countRes.rows[0]?.count || 0);
  } catch (e) {
    return 0;
  }
}
