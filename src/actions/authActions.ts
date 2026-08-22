'use server';

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getTursoClient, initTursoTables } from '@/src/lib/turso';
import { User, UserRole, UserStatus } from '@/src/types';

// Auto-initialize tables and seed default admin
let tablesInitialized = false;
async function ensureTables() {
  if (!tablesInitialized) {
    await initTursoTables();
    tablesInitialized = true;
  }

  // Auto-seed initial admin if database has 0 users
  try {
    const client = getTursoClient();
    const countRes = await client.execute(`SELECT COUNT(*) as count FROM users`);
    if (Number(countRes.rows[0]?.count || 0) === 0) {
      const defaultAdminPass = await hashPasswordBcrypt('admin');
      const now = new Date().toISOString();
      await client.execute({
        sql: `INSERT INTO users (id, username, fullName, passwordHash, role, status, createdAt, approvedBy, approvedAt, lastLoginAt)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          'usr_admin_default',
          'admin',
          'بەڕێوەبەری سەرەکی (Admin)',
          defaultAdminPass,
          'ADMIN',
          'ACTIVE',
          now,
          'SYSTEM',
          now,
          now,
        ],
      });
    }
  } catch (e) {
    console.error('Error checking/seeding default admin:', e);
  }
}

/**
 * Hash password securely using bcrypt with fallback support
 */
async function hashPasswordBcrypt(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Compare plain password against bcrypt hash (or fallback sha256)
 */
async function verifyPassword(password: string, hashOrDigest: string): Promise<boolean> {
  if (hashOrDigest.startsWith('$2a$') || hashOrDigest.startsWith('$2b$')) {
    return await bcrypt.compare(password, hashOrDigest);
  }
  // Fallback for legacy sha256 hash
  const legacyHash = crypto.createHash('sha256').update(`${password}:storage_salt_v1`).digest('hex');
  return legacyHash === hashOrDigest;
}

/**
 * Log activity in audit_logs table
 */
async function logActivity(
  action: string,
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
        performedBy,
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
 * Create a new user (Only by Admin)
 */
export async function createUserByAdminAction(
  adminUserId: string,
  data: {
    username: string;
    fullName: string;
    password: string;
    role: UserRole;
  }
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    // Verify requester is ADMIN
    const adminCheck = await client.execute({
      sql: `SELECT role, fullName FROM users WHERE id = ? LIMIT 1`,
      args: [adminUserId],
    });

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'ADMIN') {
      return { success: false, error: 'تەنها بەڕێوەبەر (ئادمین) دەتوانێت بەکارهێنەری نوێ زیاد بکات' };
    }

    const adminName = String(adminCheck.rows[0].fullName || 'Admin');
    const username = data.username.trim().toLowerCase();
    const fullName = data.fullName.trim();
    const password = data.password;
    const role: UserRole = data.role || 'USER';

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

    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const status: UserStatus = 'ACTIVE';
    const createdAt = new Date().toISOString();
    const passwordHash = await hashPasswordBcrypt(password);

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
        adminName,
        createdAt,
        null,
      ],
    });

    const user: User = {
      id,
      username,
      fullName,
      role,
      status,
      createdAt,
      approvedBy: adminName,
      approvedAt: createdAt,
    };

    await logActivity(
      'USER_APPROVE',
      'زیادکردنی بەکارهێنەری نوێ لەلایەن ئادمین',
      adminName,
      adminUserId,
      fullName,
      `بەکارهێنەری نوێ "${fullName}" (@${username}) بە دەسەڵاتی ${role === 'ADMIN' ? 'ئادمین' : 'بەکارهێنەر'} دروستکرا و چالاک کرا`
    );

    return {
      success: true,
      user,
    };
  } catch (err: any) {
    console.error('Error creating user by admin:', err);
    return { success: false, error: err.message || 'هەڵەیەک ڕوویدا لە کاتی زیادکردنی بەکارهێنەر' };
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
    const passwordMatches = await verifyPassword(password, String(row.passwordHash));

    if (!passwordMatches) {
      return { success: false, error: 'ناوی بەکارهێنەر یان وشەی نهێنی هەڵەیە' };
    }

    const status: UserStatus = String(row.status) as UserStatus;

    if (status === 'PENDING') {
      return {
        success: false,
        isPending: true,
        error: 'هەژمارەکەت چاوەڕوانی چالاککردنی بەڕێوەبەر (ئادمین) دەکات.',
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
 * Verify saved persistent session
 */
export async function verifySessionAction(userId: string): Promise<{
  valid: boolean;
  user?: User;
}> {
  try {
    await ensureTables();
    const client = getTursoClient();

    const result = await client.execute({
      sql: `SELECT id, username, fullName, role, status, createdAt, approvedBy, approvedAt, lastLoginAt FROM users WHERE id = ? LIMIT 1`,
      args: [userId],
    });

    if (result.rows.length === 0) return { valid: false };

    const row: any = result.rows[0];
    if (row.status !== 'ACTIVE') return { valid: false };

    const user: User = {
      id: String(row.id),
      username: String(row.username),
      fullName: String(row.fullName),
      role: String(row.role) as UserRole,
      status: String(row.status) as UserStatus,
      createdAt: String(row.createdAt),
      approvedBy: row.approvedBy ? String(row.approvedBy) : undefined,
      approvedAt: row.approvedAt ? String(row.approvedAt) : undefined,
      lastLoginAt: row.lastLoginAt ? String(row.lastLoginAt) : undefined,
    };

    return { valid: true, user };
  } catch (e) {
    return { valid: false };
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

    const adminName = String(adminCheck.rows[0].fullName || 'Admin');
    const targetUserRes = await client.execute({
      sql: `SELECT fullName, username FROM users WHERE id = ? LIMIT 1`,
      args: [targetUserId],
    });
    const targetName = targetUserRes.rows[0]?.fullName ? String(targetUserRes.rows[0].fullName) : targetUserId;

    const now = new Date().toISOString();

    if (newStatus === 'ACTIVE') {
      await client.execute({
        sql: `UPDATE users SET status = ?, approvedBy = ?, approvedAt = ? WHERE id = ?`,
        args: [newStatus, adminName, now, targetUserId],
      });
      await logActivity(
        'USER_APPROVE',
        'چالاککردنی هەژماری بەکارهێنەر',
        adminName,
        adminUserId,
        targetName,
        `هەژماری "${targetName}" لەلایەن بەڕێوەبەر پەسەند و چالاک کرا`
      );
    } else {
      await client.execute({
        sql: `UPDATE users SET status = ? WHERE id = ?`,
        args: [newStatus, targetUserId],
      });
      await logActivity(
        'USER_BLOCK',
        'ڕاگرتنی هەژماری بەکارهێنەر',
        adminName,
        adminUserId,
        targetName,
        `هەژماری "${targetName}" لەلایەن بەڕێوەبەرەوە ڕاگیرا`
      );
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
      sql: `SELECT role, fullName FROM users WHERE id = ? LIMIT 1`,
      args: [adminUserId],
    });

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'ADMIN') {
      return { success: false, error: 'دەسەڵاتی ئادمین پێویستە' };
    }

    const adminName = String(adminCheck.rows[0].fullName || 'Admin');
    const targetUserRes = await client.execute({
      sql: `SELECT fullName FROM users WHERE id = ? LIMIT 1`,
      args: [targetUserId],
    });
    const targetName = targetUserRes.rows[0]?.fullName ? String(targetUserRes.rows[0].fullName) : targetUserId;

    await client.execute({
      sql: `UPDATE users SET role = ? WHERE id = ?`,
      args: [newRole, targetUserId],
    });

    await logActivity(
      'USER_ROLE_CHANGE',
      'گۆڕینی دەسەڵاتی بەکارهێنەر',
      adminName,
      adminUserId,
      targetName,
      `دەسەڵاتی بەکارهێنەر "${targetName}" گۆڕدرا بۆ ${newRole === 'ADMIN' ? 'ئادمین' : 'بەکارهێنەری ئاسایی'}`
    );

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
      sql: `SELECT role, fullName FROM users WHERE id = ? LIMIT 1`,
      args: [adminUserId],
    });

    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'ADMIN') {
      return { success: false, error: 'دەسەڵاتی ئادمین پێویستە' };
    }

    const adminName = String(adminCheck.rows[0].fullName || 'Admin');
    const targetUserRes = await client.execute({
      sql: `SELECT fullName FROM users WHERE id = ? LIMIT 1`,
      args: [targetUserId],
    });
    const targetName = targetUserRes.rows[0]?.fullName ? String(targetUserRes.rows[0].fullName) : targetUserId;

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

    await logActivity(
      'SYSTEM_RESET',
      'سڕینەوەی هەژماری بەکارهێنەر',
      adminName,
      adminUserId,
      targetName,
      `هەژماری "${targetName}" لە سیستەم سڕایەوە لەگەڵ داتاکانی`
    );

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

/**
 * Change user password (For Admin or Logged-in User)
 */
export async function changeUserPasswordAction(data: {
  userId: string;
  currentPassword?: string;
  newPassword: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await ensureTables();
    const client = getTursoClient();

    const { userId, currentPassword, newPassword } = data;

    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'وشەی نهێنی نوێ دەبێت کەمترین ٤ پیت یان ژمارە بێت' };
    }

    const userRes = await client.execute({
      sql: `SELECT id, fullName, passwordHash FROM users WHERE id = ? LIMIT 1`,
      args: [userId],
    });

    if (userRes.rows.length === 0) {
      return { success: false, error: 'بەکارهێنەر نەدۆزرایەوە' };
    }

    const row: any = userRes.rows[0];

    // If currentPassword provided, verify it
    if (currentPassword) {
      const match = await verifyPassword(currentPassword, String(row.passwordHash));
      if (!match) {
        return { success: false, error: 'وشەی نهێنی ئێستات هەڵەیە' };
      }
    }

    const newHash = await hashPasswordBcrypt(newPassword);
    await client.execute({
      sql: `UPDATE users SET passwordHash = ? WHERE id = ?`,
      args: [newHash, userId],
    });

    await logActivity(
      'USER_ROLE_CHANGE',
      'گۆڕینی وشەی نهێنی',
      String(row.fullName || 'User'),
      userId,
      String(row.fullName),
      `وشەی نهێنی هەژماری "${row.fullName}" بە سەرکەوتوویی نوێکرایەوە`
    );

    return { success: true };
  } catch (err: any) {
    console.error('Error changing password:', err);
    return { success: false, error: err.message || 'نەتوانرا وشەی نهێنی نوێ بکرێتەوە' };
  }
}
