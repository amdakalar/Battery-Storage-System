/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type StatusType = 'ON_TIME' | 'EARLY_WARNING' | 'TIME_TO_CHARGE' | 'OVERDUE';

export type UserRole = 'ADMIN' | 'USER';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'BLOCKED';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  lastLoginAt?: string;
}

export interface ChargeRecord {
  id: string;
  batteryId: string;
  userId?: string;
  chargeDate: string; // ISO format string YYYY-MM-DD
  chargeTime?: string; // HH:mm format
  daysSincePrevious?: number;
  notes?: string;
  percentage?: number;
}

export interface Battery {
  id: string;
  userId?: string;
  name: string;
  category: 'DRONE' | 'CAR' | 'SOLAR' | 'UPS' | 'SCOOTER' | 'GENERAL' | string;
  lastChargeDate: string; // ISO YYYY-MM-DD
  reminderIntervalDays: number; // default 40
  createdAt: string;
  notes?: string;
  voltage?: number; // Battery voltage (V)
  capacity?: string; // Battery capacity (e.g. 5000 mAh)
  storagePercentage?: number; // Battery storage percentage (e.g. 50%)
  cells?: {
    cell1?: number;
    cell2?: number;
    cell3?: number;
    cell4?: number;
    cell5?: number;
    cell6?: number;
    cell7?: number;
    cell8?: number;
    cell9?: number;
    cell10?: number;
    cell11?: number;
    cell12?: number;
  };
  history: ChargeRecord[];
}

export interface BatteryStats {
  lastChargeDateFormatted: string;
  nextDueDate: string;
  daysElapsed: number;
  daysRemaining: number;
  status: StatusType;
  statusText: string;
  statusColorClass: {
    bg: string;
    text: string;
    border: string;
    badge: string;
    ring: string;
    lightBg: string;
  };
  progressPercentage: number;
}

export interface AppSettings {
  enableAudioAlerts: boolean;
  enableBrowserNotifications: boolean;
  theme: 'light' | 'dark' | 'system';
  githubRepo?: string;
}

export interface UpdateCheckResult {
  success: boolean;
  hasUpdate: boolean;
  latestVersion?: string;
  currentVersion?: string;
  releaseName?: string;
  releaseNotes?: string;
  publishedAt?: string;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  htmlUrl?: string;
  error?: string;
}

export interface UpdateProgress {
  percent: number;
  transferred: number;
  total: number;
}

export interface DeletionLog {
  id: string;
  timestamp: string;
  batteryCountCleared: number;
  historyCountCleared: number;
  reason?: string;
  clearedBy?: string;
  deletedBatteries?: Battery[];
  isRestored?: boolean;
}

export type LicenseType = 'TRIAL_6M' | 'CODE_6M' | 'CODE_1Y' | 'LIFETIME' | 'EXPIRED';

export interface LicenseState {
  isActivated: boolean;
  licenseType: LicenseType;
  firstLaunchDate: string;
  expirationDate: string | null;
  hardwareId: string;
  daysRemaining: number;
  isExpired: boolean;
  activationCodeUsed?: string;
  activatedAt?: string;
  lastCheckDate?: string;
}
