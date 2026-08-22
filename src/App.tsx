'use client';

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Battery, AppSettings } from './types';
import {
  loadBatteries,
  loadBatteriesAsync,
  saveBatteries,
  recordBatteryCharge,
  addBattery,
  deleteBattery,
  updateBattery,
  loadSettings,
  saveSettings,
  exportDataJSON,
  importDataJSON,
  loadDeletionLogs,
  clearAllSystemData,
  clearDeletionLogs,
  restoreDeletedData,
  restoreAllDeletedData,
} from './utils/storage';
import { DeletionLog } from './types';
import { getTodayISODate, formatGregorianKurdish, calculateBatteryStats } from './utils/dateUtils';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { BottomNavBar } from './components/BottomNavBar';
import { NotificationBanner } from './components/NotificationBanner';
import { BatteryCard } from './components/BatteryCard';
import { CompactBatteryCard } from './components/CompactBatteryCard';
import { DashboardUrgentCard } from './components/DashboardUrgentCard';
import { AddBatteryModal } from './components/AddBatteryModal';
import { EditBatteryModal } from './components/EditBatteryModal';
import { CustomDateModal } from './components/CustomDateModal';
import { HistoryModal } from './components/HistoryModal';
import { DateSimulatorModal } from './components/DateSimulatorModal';
import { ClearDataModal } from './components/ClearDataModal';
import { ActivationModal } from './components/ActivationModal';
import { PrintReportModal } from './components/PrintReportModal';
import { StorageConfirmModal } from './components/StorageConfirmModal';
import { UpdateModal } from './components/UpdateModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';
import { CustomDialog, DialogConfig } from './components/CustomDialog';
import { getLicenseState } from './utils/licenseManager';
import { LicenseState, UpdateCheckResult, User } from './types';
import { DroneCategoryInfo, loadCategories, addCustomCategory, updateCategory, deleteCustomCategory, getNormalizedCategory, DEFAULT_CATEGORY } from './constants/categories';
import { APP_CONFIG } from './constants/appConfig';
import { LoginPage } from './components/LoginPage';
import { ChangelogView } from './components/ChangelogView';
import { UsersManagementView } from './components/UsersManagementView';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { getPendingUsersCountAction, verifySessionAction } from './actions/authActions';
import { getBatteriesAction, saveBatteryAction, deleteBatteryAction, recordChargeAction, importBatteriesAction } from './actions/batteryActions';
import {
  BoltIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  PlusIcon,
  SparklesIcon,
  PrinterIcon,
  TableCellsIcon,
  CheckCircleIcon,
  ClockIcon,
  Square3Stack3DIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  ChartBarIcon,
  TrashIcon,
  CalendarIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ArrowUturnRightIcon,
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  VideoCameraIcon,
  SignalIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  TagIcon,
  GlobeAltIcon,
  KeyIcon,
  MoonIcon,
  SunIcon,
} from '@heroicons/react/24/outline';

export default function App() {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [simulatedReferenceDate, setSimulatedReferenceDate] = useState<string | undefined>(undefined);
  const [activeView, setActiveView] = useState<
    'dashboard' | 'batteries' | 'analytics' | 'notifications' | 'history' | 'changelog' | 'users' | 'settings'
  >('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dark mode state — persisted in localStorage, defaults to system preference
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('storage_dark_mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply dark mode class to <html> element
  React.useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('storage_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((d) => !d);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('ALL');

  // User Authentication & RBAC State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('storage_auth_user');
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return null;
  });
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [pendingUsersCount, setPendingUsersCount] = useState(0);

  // Workspace Data Mode: 'TEAM' (collaborative team view) vs 'PERSONAL' (my batteries only)
  const [workspaceMode, setWorkspaceMode] = useState<'TEAM' | 'PERSONAL'>('TEAM');

  // Auto-verify persistent session on app mount
  useEffect(() => {
    if (currentUser?.id) {
      verifySessionAction(currentUser.id).then((res) => {
        if (!res.valid) {
          setCurrentUser(null);
          localStorage.removeItem('storage_auth_user');
        } else if (res.user) {
          setCurrentUser(res.user);
          localStorage.setItem('storage_auth_user', JSON.stringify(res.user));
        }
      }).catch(() => {});
    }
  }, []);

  const refreshPendingCount = async () => {
    if (currentUser && currentUser.role === 'ADMIN') {
      try {
        const count = await getPendingUsersCountAction(currentUser.id);
        setPendingUsersCount(count);
      } catch (e) {}
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('storage_auth_user');
  };

  // License & Activation State (6 Months Trial / Lockout)
  const [licenseState, setLicenseState] = useState<LicenseState>(getLicenseState());
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);

  // Deletion Logs & Reset State
  const [deletionLogs, setDeletionLogs] = useState<DeletionLog[]>(loadDeletionLogs());
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalDefaultCategory, setAddModalDefaultCategory] = useState<string | undefined>(undefined);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('ALL');
  const [categories, setCategories] = useState<DroneCategoryInfo[]>(() => loadCategories());
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const handleAddCategory = (categoryData: { name: string; type?: string; typeLabel?: string; weight?: string }) => {
    const updated = addCustomCategory(categoryData);
    setCategories(updated);
    showAlert({
      type: 'success',
      title: 'هاوپۆل زیادکرا',
      message: `هاوپۆلی "${categoryData.name}" بە سەرکەوتوویی زیادکرا بۆ سیستەمەکە.`,
    });
  };

  const handleUpdateCategory = (
    categoryId: string,
    categoryData: { name: string; type?: string; typeLabel?: string; weight?: string }
  ) => {
    const result = updateCategory(categoryId, categoryData);
    setCategories(result.categories);

    // If category ID or name changed, update all batteries that belong to this category
    if (result.oldId !== result.newId) {
      const updatedBatteries = batteries.map((b) => {
        if (b.category === result.oldId || getNormalizedCategory(b.category, categories) === result.oldId) {
          return { ...b, category: result.newId };
        }
        return b;
      });
      setBatteries(updatedBatteries);
      saveBatteries(updatedBatteries);
      if (selectedCategoryTab === result.oldId) {
        setSelectedCategoryTab(result.newId);
      }
    }

    showAlert({
      type: 'success',
      title: 'هاوپۆل دەستکاریکرا',
      message: `زانیارییەکانی هاوپۆلەکە بە سەرکەوتوویی نوێکرانەوە.`,
    });
  };

  const handleDeleteCategory = (categoryId: string) => {
    const updated = deleteCustomCategory(categoryId);
    setCategories(updated);
    if (selectedCategoryTab === categoryId) {
      setSelectedCategoryTab('ALL');
    }
    showAlert({
      type: 'success',
      title: 'هاوپۆل سڕایەوە',
      message: 'هاوپۆلی هەڵبژێردراو بە سەرکەوتوویی سڕایەوە.',
    });
  };

  // Reset filters when navigating to batteries or history view
  React.useEffect(() => {
    if (activeView === 'batteries') {
      setSearchQuery('');
      setSelectedCategoryTab('ALL');
    }
    if (activeView === 'history') {
      setHistorySearchQuery('');
      setHistoryCategoryFilter('ALL');
    }
  }, [activeView]);

  // Global memoized allChargeRecords across all batteries
  const allChargeRecords = React.useMemo(() => {
    return batteries.flatMap(battery => 
      (battery.history || []).map(record => ({
        ...record,
        batteryName: battery.name,
        batteryCategory: getNormalizedCategory(battery.category, categories),
        batteryObj: battery,
      }))
    ).sort((a, b) => new Date(b.chargeDate).getTime() - new Date(a.chargeDate).getTime());
  }, [batteries, categories]);

  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [activeBatteryForCustomDate, setActiveBatteryForCustomDate] = useState<Battery | null>(null);
  const [activeBatteryForHistory, setActiveBatteryForHistory] = useState<Battery | null>(null);
  const [activeBatteryForEdit, setActiveBatteryForEdit] = useState<Battery | null>(null);
  const [activeBatteryForStorageConfirm, setActiveBatteryForStorageConfirm] = useState<Battery | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // GitHub Auto-Update State
  const [githubRepoInput, setGithubRepoInput] = useState<string>(settings.githubRepo || '');
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [updateCheckResult, setUpdateCheckResult] = useState<UpdateCheckResult | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [updateCheckError, setUpdateCheckError] = useState<string | null>(null);

  // Global In-App Dialog State (Replacing browser/electron raw alerts & confirms)
  const [dialogConfig, setDialogConfig] = useState<DialogConfig | null>(null);

  const handleOpenAddModalForCategory = (catId?: string) => {
    setAddModalDefaultCategory(catId);
    setIsAddModalOpen(true);
  };

  // Synchronize and refresh batteries silently in the background without UI interruption
  const syncBatteriesSilently = React.useCallback(async () => {
    if (!currentUser) return;
    try {
      const cloudBatteries = await getBatteriesAction();
      if (cloudBatteries && cloudBatteries.length > 0) {
        setBatteries((prev) => {
          if (JSON.stringify(prev) !== JSON.stringify(cloudBatteries)) {
            saveBatteries(cloudBatteries);
            return cloudBatteries;
          }
          return prev;
        });
      } else {
        // If cloud returned 0 batteries (e.g. fresh database / container reset),
        // check if we have local cached batteries to auto-restore and protect
        const localCached = loadBatteries();
        if (localCached && localCached.length > 0) {
          await importBatteriesAction(localCached, currentUser.id, currentUser.fullName);
          const restored = await getBatteriesAction();
          if (restored && restored.length > 0) {
            setBatteries(restored);
            saveBatteries(restored);
          }
        }
      }
    } catch (e) {
      console.error('Silent sync error:', e);
    }
  }, [currentUser]);

  // Initial load: load from local storage instantly (0ms blank delay), then sync cloud
  useEffect(() => {
    if (!currentUser) return;
    let isMounted = true;

    // 1. Instant local display
    const cached = loadBatteries();
    if (cached && cached.length > 0) {
      setBatteries(cached);
    }

    // 2. Fetch and sync cloud
    (async () => {
      try {
        const cloudBatteries = await getBatteriesAction();
        if (isMounted) {
          if (cloudBatteries && cloudBatteries.length > 0) {
            setBatteries(cloudBatteries);
            saveBatteries(cloudBatteries);
          } else if (cached && cached.length > 0) {
            // Auto-restore local data into cloud
            await importBatteriesAction(cached, currentUser.id, currentUser.fullName);
          }
        }
      } catch (error) {
        console.error('Error loading batteries from Turso:', error);
      }
    })();

    if (currentUser.role === 'ADMIN') {
      refreshPendingCount();
    }

    // 3. Auto-check for updates silently after 2 seconds (desktop)
    const timer = setTimeout(async () => {
      try {
        if (typeof window !== 'undefined' && (window as any).electronAPI?.checkForUpdate) {
          const res = await (window as any).electronAPI.checkForUpdate();
          if (isMounted && res && res.success && res.hasUpdate) {
            setUpdateCheckResult(res);
            setIsUpdateModalOpen(true);
          }
        }
      } catch {
        /* silent catch */
      }
    }, 2000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [currentUser]);

  // Live Auto-Refresh:
  // Automatically re-fetch latest data when switching tabs (activeView), focusing window, or every 15 seconds
  useEffect(() => {
    if (!currentUser) return;

    // Refresh immediately on activeView change
    syncBatteriesSilently();
    if (currentUser.role === 'ADMIN') {
      refreshPendingCount();
    }

    // Refresh on tab focus / visibility change
    const handleFocus = () => {
      syncBatteriesSilently();
      if (currentUser.role === 'ADMIN') {
        refreshPendingCount();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // Periodic live sync every 15 seconds so changes from all team members appear live
    const liveInterval = setInterval(() => {
      syncBatteriesSilently();
    }, 15000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      clearInterval(liveInterval);
    };
  }, [activeView, currentUser, syncBatteriesSilently]);

  // Audio effect generator using Web Audio API for feedback (console warning safe)
  const playSoundEffect = (type: 'success' | 'alert') => {
    if (!settings.enableAudioAlerts) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playAudio = () => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.connect(gain);
          gain.connect(ctx.destination);

          if (type === 'success') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(523.25, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);
            osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.35);
          } else {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.setValueAtTime(349.23, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.4);
          }

          setTimeout(() => {
            try {
              ctx.close().catch(() => {});
            } catch (e) {}
          }, 500);
        } catch (e) {}
      };

      if (ctx.state === 'suspended') {
        ctx.resume().then(playAudio).catch(() => {});
      } else {
        playAudio();
      }
    } catch (error) {
      // Audio context standard fallback silent ignore
    }
  };

  // Action: Quick Storage Confirmation Request ("ستۆرج کرا")
  const handleQuickChargeToday = (batteryId: string) => {
    const bat = batteries.find((b) => b.id === batteryId);
    if (bat) {
      setActiveBatteryForStorageConfirm(bat);
    }
  };

  // Action: Confirm and Record Quick Storage Today
  const handleConfirmQuickCharge = (batteryId: string) => {
    const todayToUse = simulatedReferenceDate || getTodayISODate();
    const updated = recordBatteryCharge(batteryId, todayToUse, 'ستۆرجکرا لەم ڕێکەوتەدا');
    setBatteries(updated);
    playSoundEffect('success');
    recordChargeAction(
      {
        id: 'hist_' + Date.now(),
        batteryId,
        userId: currentUser?.id,
        authorName: currentUser?.fullName,
        chargeDate: todayToUse,
        notes: 'ستۆرجکرا لەم ڕێکەوتەدا',
      },
      currentUser?.id,
      currentUser?.fullName
    ).catch(() => {});
  };

  // Action: Custom Storage Date
  const handleSaveCustomDate = (batteryId: string, customDate: string, notes: string) => {
    const updated = recordBatteryCharge(batteryId, customDate, notes || 'ستۆرجکردنی تۆمارکراو بە مێژووی دیاریکراو');
    setBatteries(updated);
    playSoundEffect('success');
    recordChargeAction(
      {
        id: 'hist_' + Date.now(),
        batteryId,
        userId: currentUser?.id,
        authorName: currentUser?.fullName,
        chargeDate: customDate,
        notes: notes || 'ستۆرجکردنی تۆمارکراو بە مێژووی دیاریکراو',
      },
      currentUser?.id,
      currentUser?.fullName
    ).catch(() => {});
  };

  // Action: Add New Battery
  const handleAddBattery = (data: {
    name: string;
    category: string;
    lastChargeDate: string;
    reminderIntervalDays: number;
    notes?: string;
    voltage?: number;
    storagePercentage?: number;
    cells?: any;
  }) => {
    const today = getTodayISODate();
    const id = 'bat_' + Date.now();
    const newBattery: Battery = {
      ...data,
      id,
      userId: currentUser?.id,
      authorName: currentUser?.fullName,
      createdAt: today,
      history: [
        {
          id: 'hist_init_' + Date.now(),
          batteryId: id,
          userId: currentUser?.id,
          authorName: currentUser?.fullName,
          chargeDate: data.lastChargeDate || today,
          notes: 'دروستکردنی ڕیکۆرد و یەکەم ستۆرج',
        },
      ],
    };

    const updated = [newBattery, ...batteries];
    setBatteries(updated);
    saveBatteries(updated);
    playSoundEffect('success');
    saveBatteryAction(newBattery, currentUser?.id, currentUser?.fullName).catch(() => {});
  };

  // Custom In-App Alert Dialog Trigger
  const showAlert = (options: {
    type?: 'info' | 'success' | 'warning' | 'error';
    title: string;
    message: string | React.ReactNode;
    subMessage?: string;
    confirmText?: string;
    onConfirm?: () => void;
  }) => {
    if (options.type === 'success') {
      playSoundEffect('success');
    } else if (options.type === 'warning' || options.type === 'error') {
      playSoundEffect('alert');
    }
    setDialogConfig({
      isOpen: true,
      type: options.type || 'info',
      title: options.title,
      message: options.message,
      subMessage: options.subMessage,
      confirmText: options.confirmText || 'باشە',
      isConfirm: false,
      onConfirm: options.onConfirm,
    });
  };

  // Custom In-App Confirmation Dialog Trigger
  const showConfirm = (options: {
    type?: 'danger' | 'warning' | 'info';
    title: string;
    message: string | React.ReactNode;
    subMessage?: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  }) => {
    playSoundEffect('alert');
    setDialogConfig({
      isOpen: true,
      type: options.type || 'warning',
      title: options.title,
      message: options.message,
      subMessage: options.subMessage,
      confirmText: options.confirmText || 'پشتڕاستکردنەوە',
      cancelText: options.cancelText || 'پاشگەزبوونەوە',
      isConfirm: true,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    });
  };

  // Action: GitHub Release Update Check (Fully Automatic)
  const handleCheckForUpdates = async (isSilent: boolean = false) => {
    setIsCheckingUpdate(true);
    setUpdateCheckError(null);

    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.checkForUpdate) {
        const res = await (window as any).electronAPI.checkForUpdate();
        setIsCheckingUpdate(false);
        if (res.success) {
          setUpdateCheckResult(res);
          if (res.hasUpdate) {
            setIsUpdateModalOpen(true);
          } else if (!isSilent) {
            showAlert({
              type: 'success',
              title: 'پشکنینی وەشانی بەرنامە',
              message: `زۆر باشە! وەشانی بەرنامەکەت نوێترین وەشانە (v${res.currentVersion}).`,
              subMessage: 'هیچ وەشانێکی نوێتر لەسەر سێرڤەر و گیتهاپ بەردەست نییە.',
              confirmText: 'باشە',
            });
          }
        } else {
          const errMsg = res.error || 'کێشە لە وەرگرتنی ئەپدەیت ڕوویدا';
          if (!isSilent) {
            setUpdateCheckError(errMsg);
            showAlert({
              type: 'error',
              title: 'کێشە لە پشکنینی ئەپدەیت',
              message: errMsg,
              subMessage: 'تکایە دڵنیابەرەوە لە هەبوونی هێڵی ئینتەرنێت و پەیوەندی بە GitHub.',
            });
          }
        }
      } else {
        setIsCheckingUpdate(false);
        const errMsg = 'ئەم تایبەتمەندییە تەنها لە ناو بەرنامەی سەر کۆمپیوتەر (Electron) ئیش دەکات.';
        if (!isSilent) {
          setUpdateCheckError(errMsg);
          showAlert({
            type: 'warning',
            title: 'ئاگاداری سیستەم',
            message: errMsg,
          });
        }
      }
    } catch (err: any) {
      setIsCheckingUpdate(false);
      const errMsg = 'کێشە لە پەیوەندیکردن بە API ی گیتهاپ ڕوویدا';
      if (!isSilent) {
        setUpdateCheckError(errMsg);
        showAlert({
          type: 'error',
          title: 'هەڵە لە پشکنین',
          message: errMsg,
          subMessage: err.message || undefined,
        });
      }
    }
  };

  // Action: Update Battery & Cells
  const handleUpdateBattery = (batteryId: string, updatedFields: Partial<Battery>) => {
    const updated = updateBattery(batteryId, updatedFields);
    setBatteries(updated);
    playSoundEffect('success');
    const existing = updated.find((b) => b.id === batteryId);
    if (existing) {
      saveBatteryAction(existing, currentUser?.id, currentUser?.fullName).catch(() => {});
    }
  };

  // Action: Clear All System Data & Save Log
  const handleClearAllData = (reason: string) => {
    const res = clearAllSystemData(reason);
    setBatteries(res.batteries);
    setDeletionLogs(res.logs);
    playSoundEffect('alert');
  };

  // Action: Clear Deletion Logs
  const handleClearDeletionLogs = () => {
    showConfirm({
      type: 'danger',
      title: 'پاککردنەوەی لۆگی سڕینەوەکان',
      message: 'ئایا دڵنیایت لە سڕینەوەی تەواوی لۆگەکانی سڕینەوە؟',
      subMessage: 'سەرجەم تۆمارەکانی پێشووی سڕینەوە بە یەکجاری پاک دەکرێنەوە.',
      confirmText: 'سڕینەوە',
      cancelText: 'پاشگەزبوونەوە',
      onConfirm: () => {
        const updated = clearDeletionLogs();
        setDeletionLogs(updated);
        playSoundEffect('success');
      },
    });
  };

  // Action: Delete Battery
  const handleDeleteBattery = (batteryId: string) => {
    const bat = batteries.find((b) => b.id === batteryId);
    const batName = bat?.name ? `«${bat.name}»` : 'ئەم باترییە';

    showConfirm({
      type: 'danger',
      title: 'سڕینەوەی باتری',
      message: `ئایا دڵنیایت لە سڕینەوەی ${batName}؟`,
      subMessage: 'تەواوی داتای ئەم باترییە بە سێڵەکان و مێژووەکەیەوە دەسڕدرێتەوە.',
      confirmText: 'سڕینەوەی باتری',
      cancelText: 'پاشگەزبوونەوە',
      onConfirm: () => {
        const updated = deleteBattery(batteryId);
        setBatteries(updated);
        setDeletionLogs(loadDeletionLogs());
        playSoundEffect('success');
        deleteBatteryAction(batteryId, currentUser?.id, currentUser?.fullName, currentUser?.role === 'ADMIN').catch(() => {});
      },
    });
  };

  // Action: Restore Single Deleted Data Log
  const handleRestoreDeletedData = (logId: string) => {
    const res = restoreDeletedData(logId);
    if (res.restoredCount > 0) {
      setBatteries(res.updatedBatteries);
      setDeletionLogs(res.updatedLogs);
      playSoundEffect('success');
      showAlert({
        type: 'success',
        title: 'گەڕاندنەوەی داتاکان',
        message: `کۆی ${res.restoredCount} باتری بە سەرکەوتوویی لەگەڵ مێژوو و سێڵەکانی گەڕێنرانەوە بۆ سیستەمەکە.`,
        confirmText: 'باشە',
      });
    } else {
      showAlert({
        type: 'warning',
        title: 'ئاگاداری',
        message: 'هیچ داتایەکی گەڕێنراو لەم لۆگەدا نەدۆزرایەوە یان پێشتر گەڕێندراوەتەوە.',
        confirmText: 'باشە',
      });
    }
  };

  // Action: Restore All Deleted Data
  const handleRestoreAllDeletedData = () => {
    showConfirm({
      type: 'info',
      title: 'گەڕاندنەوەی سەرجەم داتاکان',
      message: 'ئایا دڵنیایت لە گەڕاندنەوەی سەرجەم باترییە سڕاوەکان بۆ ناو سیستەمەکە؟',
      subMessage: 'هەموو ئەو باترییانەی پێشتر لە لۆگەکاندا ماونەتەوە سەرلەنوێ دەگەڕێنرێنەوە.',
      confirmText: 'گەڕاندنەوەی هەموو',
      cancelText: 'پاشگەزبوونەوە',
      onConfirm: () => {
        const res = restoreAllDeletedData();
        if (res.restoredCount > 0) {
          setBatteries(res.updatedBatteries);
          setDeletionLogs(res.updatedLogs);
          playSoundEffect('success');
          showAlert({
            type: 'success',
            title: 'سەرجەم داتاکان گەڕێنرانەوە',
            message: `کۆی ${res.restoredCount} باتریی سڕاوە بە سەرکەوتوویی گەڕێنرانەوە بۆ سیستەمەکە.`,
            confirmText: 'باشە',
          });
        } else {
          showAlert({
            type: 'info',
            title: 'هیچ داتایەک نەدۆزرایەوە',
            message: 'هیچ باترییەکی سڕاوە بۆ گەڕاندنەوە نەماوە.',
            confirmText: 'باشە',
          });
        }
      },
    });
  };

  // Action: Toggle Audio
  const handleToggleAudio = () => {
    const newSettings = { ...settings, enableAudioAlerts: !settings.enableAudioAlerts };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Export Data JSON
  const handleExportData = () => {
    try {
      const jsonStr = exportDataJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `battery_maintenance_backup_${getTodayISODate()}.json`;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      showAlert({
        type: 'success',
        title: 'دەرهێنانی پشتیوانی داتا (Export)',
        message: 'پەڕگەی پشتیوانی داتاکانی سیستەم بە سەرکەوتوویی هەناردە کرا و داگیرا.',
        subMessage: `ناوی پەڕگە: ${fileName}`,
      });
    } catch {
      showAlert({
        type: 'error',
        title: 'هەڵە لە دەرهێنانی داتا',
        message: 'کێشەیەک لە پرۆسەی هەناردەکردنی داتاکاندا ڕوویدا.',
      });
    }
  };

  // Import Data JSON
  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target?.result as string;
          if (content && importDataJSON(content)) {
            setBatteries(loadBatteries());
            showAlert({
              type: 'success',
              title: 'هێنانی داتا (Import JSON)',
              message: 'دراوەکان بە سەرکەوتوویی هێنرانە ناو سیستەمەکەوە و باترییەکان نوێکرانەوە.',
            });
          } else {
            showAlert({
              type: 'error',
              title: 'هەڵە لە خوێندنەوەی پەڕگە',
              message: 'هەڵەیەک لە خوێندنەوەی پەڕگەی پشتیوان ڕوویدا. تکایە دڵنیابەرەوە لە دروستی فایلەکە.',
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return renderDashboardContent();
      case 'batteries':
        return renderBatteriesContent();
      case 'analytics':
        return renderAnalyticsContent();
      case 'notifications':
        return renderNotificationsContent();
      case 'history':
        return renderHistoryContent();
      case 'changelog':
        return <ChangelogView />;
      case 'users':
        return currentUser && currentUser.role === 'ADMIN' ? (
          <UsersManagementView
            currentAdmin={currentUser}
            onUserUpdated={(updated) => {
              setCurrentUser(updated);
              localStorage.setItem('storage_auth_user', JSON.stringify(updated));
            }}
            onUserListChange={refreshPendingCount}
          />
        ) : (
          renderDashboardContent()
        );
      case 'settings':
        return renderSettingsContent();
      default:
        return renderDashboardContent();
    }
  };

  const renderBatteriesContent = () => {
    const filteredBatteries = batteries.filter((b) => {
      const matchesWorkspace = workspaceMode === 'TEAM' || !currentUser || b.userId === currentUser.id;
      const matchesTab = selectedCategoryTab === 'ALL' || getNormalizedCategory(b.category, categories) === selectedCategoryTab;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery = !q || (
        b.name.toLowerCase().includes(q) ||
        (b.notes && b.notes.toLowerCase().includes(q)) ||
        (b.category && b.category.toLowerCase().includes(q)) ||
        (b.authorName && b.authorName.toLowerCase().includes(q))
      );
      return matchesWorkspace && matchesTab && matchesQuery;
    });

    const statusCounts = {
      onTime: batteries.filter(b => calculateBatteryStats(b.lastChargeDate, b.reminderIntervalDays, simulatedReferenceDate).status === 'ON_TIME').length,
      earlyWarning: batteries.filter(b => calculateBatteryStats(b.lastChargeDate, b.reminderIntervalDays, simulatedReferenceDate).status === 'EARLY_WARNING').length,
      timeToCharge: batteries.filter(b => calculateBatteryStats(b.lastChargeDate, b.reminderIntervalDays, simulatedReferenceDate).status === 'TIME_TO_CHARGE').length,
      overdue: batteries.filter(b => calculateBatteryStats(b.lastChargeDate, b.reminderIntervalDays, simulatedReferenceDate).status === 'OVERDUE').length,
    };

    return (
      <div className="space-y-5 dir-rtl animate-in fade-in duration-200">
        {/* Urgent Storage Notification Banner */}
        {urgentBatteries.length > 0 && (
          <NotificationBanner
            batteries={batteries}
            referenceDate={simulatedReferenceDate}
          />
        )}

        {/* Dynamic Drone Category Sections */}
        {(() => {
          const activeCategories = categories.filter((cat) =>
            filteredBatteries.some((b) => getNormalizedCategory(b.category, categories) === cat.id)
          );

          if (activeCategories.length === 0) {
            return (
              <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-center max-w-sm mx-auto px-4">
                  {/* Icon — bordered app icon */}
                  <div className="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-5 shadow-sm">
                    <img
                      src="./drone_battery_app_icon.svg"
                      alt="App Icon"
                      className="w-8 h-8 object-contain"
                    />
                  </div>

                  {/* Title */}
                  <h3 className="text-[15px] font-bold text-slate-800 mb-2 tracking-tight">
                    {searchQuery ? 'هیچ باترییەک نەدۆزرایەوە' : 'هیچ باترییەک لەم بەشەدا نییە'}
                  </h3>

                  {/* Divider */}
                  <div className="w-8 h-px bg-slate-300 mx-auto my-3.5" />

                  {/* Description */}
                  <p className="text-[12px] text-slate-400 leading-relaxed font-medium mb-7">
                    {searchQuery
                      ? 'تکایە دڵنیابەرەوە لە ڕاستیی ناوی باتری یان بەشەکە.'
                      : 'دەتوانیت باتری نوێ بۆ ئەم بەشە زیاد بکەیت.'}
                  </p>

                  {/* CTA Button */}
                  {!searchQuery && (
                    <button
                      onClick={() => handleOpenAddModalForCategory(selectedCategoryTab !== 'ALL' ? selectedCategoryTab : undefined)}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-all inline-flex items-center gap-2 shadow-sm"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                      <span>زیادکردنی باتری نوێ</span>
                    </button>
                  )}
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {activeCategories.map((cat) => {
                const categoryBatteries = filteredBatteries.filter(
                  (b) => getNormalizedCategory(b.category, categories) === cat.id
                );

                return (
                  <div
                    key={cat.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
                  >
                    {/* Category Section Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[13px] font-bold text-slate-800">{cat.name}</h3>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${cat.badgeColor}`}>
                            {cat.typeLabel} • {cat.weight}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-medium">
                          — <span className="text-slate-600 font-semibold">{categoryBatteries.length}</span> باتری
                        </span>
                      </div>

                      <button
                        onClick={() => handleOpenAddModalForCategory(cat.id)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-700 text-white font-semibold text-[11px] rounded-lg transition-all flex items-center gap-1.5 shrink-0"
                        title={`زیادکردنی باتری نوێ بۆ ${cat.name}`}
                      >
                        <PlusIcon className="w-3.5 h-3.5" />
                        <span>زیادکردنی باتری نوێ</span>
                      </button>
                    </div>

                    {/* Battery Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {categoryBatteries.map((battery) => (
                        <CompactBatteryCard
                          key={battery.id}
                          battery={battery}
                          onChargeToday={handleQuickChargeToday}
                          onOpenCustomDateModal={(b) => setActiveBatteryForCustomDate(b)}
                          onOpenHistoryModal={(b) => setActiveBatteryForHistory(b)}
                          onOpenEditModal={(b) => setActiveBatteryForEdit(b)}
                          onDeleteBattery={handleDeleteBattery}
                          referenceDate={simulatedReferenceDate}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    );
  };

  const renderAnalyticsContent = () => {
    const totalBatteries = batteries.length;
    const batteryStats = batteries.map(b => calculateBatteryStats(b.lastChargeDate, b.reminderIntervalDays, simulatedReferenceDate));
    
    const statusCounts = {
      onTime: batteryStats.filter(s => s.status === 'ON_TIME').length,
      earlyWarning: batteryStats.filter(s => s.status === 'EARLY_WARNING').length,
      timeToCharge: batteryStats.filter(s => s.status === 'TIME_TO_CHARGE').length,
      overdue: batteryStats.filter(s => s.status === 'OVERDUE').length
    };

    const averageDaysElapsed = totalBatteries > 0 
      ? Math.round(batteryStats.reduce((sum, s) => sum + s.daysElapsed, 0) / totalBatteries)
      : 0;

    const fleetHealthPercent = totalBatteries > 0 ? Math.round((statusCounts.onTime / totalBatteries) * 100) : 100;
    
    // Calculate total cell count & avg cell voltage across fleet
    let totalCells = 0;
    let totalVoltagesSum = 0;
    let totalVoltageCount = 0;

    batteries.forEach(b => {
      if (b.cells) {
        Object.values(b.cells).forEach(val => {
          const num = typeof val === 'number' ? val : parseFloat(val as string);
          if (!isNaN(num)) {
            totalCells++;
            totalVoltagesSum += num;
            totalVoltageCount++;
          }
        });
      }
    });

    const avgCellVoltage = totalVoltageCount > 0 ? (totalVoltagesSum / totalVoltageCount).toFixed(2) : '3.85';

    return (
      <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300 dir-rtl">
        {/* Executive Fleet Health KPI Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                <ArrowTrendingUpIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">تەندروستی و کارایی سەرجەم باترییەکان</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">شیکاری ڕاستەوخۆی خولی ٤٠ ڕۆژە و دۆخی سێڵەکان</p>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 shrink-0 text-xs">
              <div className="text-center">
                <div className="text-lg font-black text-emerald-700">{fleetHealthPercent}%</div>
                <div className="text-[10px] text-slate-500 font-bold">پابەندبوون</div>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="text-center">
                <div className="text-lg font-black text-slate-900">{totalCells}</div>
                <div className="text-[10px] text-slate-500 font-bold">سێڵەکان</div>
              </div>
              <div className="h-6 w-px bg-slate-200"></div>
              <div className="text-center">
                <div className="text-lg font-black text-slate-800">{avgCellVoltage}V</div>
                <div className="text-[10px] text-slate-500 font-bold">ناوەندی ڤۆڵت</div>
              </div>
            </div>
          </div>
        </div>

        {/* Minimal Status Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">کۆی باترییەکان</span>
              <BoltIcon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900">{totalBatteries}</div>
            <div className="text-[10px] text-slate-400 mt-1 font-semibold">تۆمارکراو لە سیستەمدا</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-700">لە کاتی خۆیاندا</span>
              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-700">{statusCounts.onTime}</div>
            <div className="text-[10px] text-emerald-600 mt-1 font-semibold">
              {totalBatteries > 0 ? Math.round((statusCounts.onTime / totalBatteries) * 100) : 0}% لە خولی تەواودا
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-700">یادەوەری ٥ ڕۆژە</span>
              <ClockIcon className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-700">{statusCounts.earlyWarning}</div>
            <div className="text-[10px] text-amber-600 mt-1 font-semibold">نزیك لە ستۆرج</div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-700">بەپەلە / دواکەوتوو</span>
              <ExclamationCircleIcon className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-700">{statusCounts.timeToCharge + statusCounts.overdue}</div>
            <div className="text-[10px] text-rose-600 mt-1 font-semibold">پێویستی بە ستۆرجی بەپەلە</div>
          </div>
        </div>

        {/* Minimal Benchmarks Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChartBarIcon className="w-4 h-4 text-slate-600" />
              <h4 className="text-xs font-extrabold text-slate-800">تێکڕای تێپەڕبوونی ڕۆژەکان لە ناوەنددا</h4>
            </div>
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              ئامانج: ٤٠ ڕۆژ
            </span>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 text-center border border-slate-200/60 space-y-2">
            <div className="text-3xl font-black text-slate-900">{averageDaysElapsed}</div>
            <div className="text-xs text-slate-500 font-bold">ڕۆژ ناوەندی تێپەڕیوە لە دوایین ستۆرجەوە</div>
            
            <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden max-w-md mx-auto">
              <div 
                className="bg-slate-900 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (averageDaysElapsed / 40) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>
    );
  };

  const renderNotificationsContent = () => {
    const earlyWarningBatteries = batteries
      .map((bat) => ({
        battery: bat,
        stats: calculateBatteryStats(bat.lastChargeDate, bat.reminderIntervalDays, simulatedReferenceDate),
      }))
      .filter((item) => item.stats.status === 'EARLY_WARNING');

    const urgentBatteries = batteries
      .map((bat) => ({
        battery: bat,
        stats: calculateBatteryStats(bat.lastChargeDate, bat.reminderIntervalDays, simulatedReferenceDate),
      }))
      .filter((item) => item.stats.status === 'TIME_TO_CHARGE' || item.stats.status === 'OVERDUE');

    const totalNotifications = earlyWarningBatteries.length + urgentBatteries.length;

    return (
      <div className="space-y-6">
        {/* Summary Cards (Minimal Executive Theme) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{earlyWarningBatteries.length}</div>
                <div className="text-xs font-bold text-slate-700 mt-1">یادەوەری ٥ ڕۆژە</div>
              </div>
              <div className="w-10 h-10 bg-amber-50 border border-amber-200/60 rounded-xl flex items-center justify-center text-amber-700">
                <ClockIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-2">
              نزیک لە کاتی ستۆرجکردن (٥ ڕۆژ)
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{urgentBatteries.filter(b => b.stats.status === 'TIME_TO_CHARGE').length}</div>
                <div className="text-xs font-bold text-slate-700 mt-1">کاتی ستۆرج هاتووە</div>
              </div>
              <div className="w-10 h-10 bg-amber-50 border border-amber-200/60 rounded-xl flex items-center justify-center text-amber-700">
                <BoltIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-2">
              ئەمڕۆ ٤٠ ڕۆژەکەیە
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-slate-900">{urgentBatteries.filter(b => b.stats.status === 'OVERDUE').length}</div>
                <div className="text-xs font-bold text-slate-700 mt-1">دواکەوتوو</div>
              </div>
              <div className="w-10 h-10 bg-rose-50 border border-rose-200/60 rounded-xl flex items-center justify-center text-rose-700">
                <ExclamationCircleIcon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-2">
              زیاتر لە ٤٠ ڕۆژ بەسەرچووە
            </div>
          </div>
        </div>

        {totalNotifications === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-2xs text-center">
            <div className="w-14 h-14 bg-emerald-50 border border-emerald-200/60 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-700">
              <CheckCircleIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">هەموو شتێک جێگیرە!</h3>
            <p className="text-xs text-slate-500 font-medium">
              هیچ باترییەک پێویستی بە ئاگادارکردنەوەی فەوری یان ستۆرجی نوێ نییە.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Early Warning Section */}
            {earlyWarningBatteries.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ClockIcon className="w-4 h-4 text-amber-600" />
                  <span>یادەوەری ٥ ڕۆژە</span>
                  <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-lg">
                    {earlyWarningBatteries.length} باتری
                  </span>
                </h3>
                <div className="space-y-3">
                  {earlyWarningBatteries.map(item => (
                    <div key={item.battery.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 bg-amber-50 border border-amber-200/60 rounded-xl flex items-center justify-center text-amber-700 shrink-0">
                            <BoltIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{item.battery.name}</h3>
                            <p className="text-xs text-amber-800 font-semibold">{item.stats.statusText}</p>
                            <p className="text-[11px] text-slate-500 font-medium">{item.stats.daysElapsed} ڕۆژ تێپەڕیوە، {item.stats.daysRemaining} ڕۆژ ماوە</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <div className="text-right text-xs">
                            <div className="text-slate-500 font-medium">کاتی ستۆرجکردن:</div>
                            <div className="font-bold text-amber-800">{item.stats.daysRemaining} ڕۆژی تر</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Urgent Section */}
            {urgentBatteries.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ExclamationCircleIcon className="w-4 h-4 text-rose-600" />
                  <span>پێویستی بە ستۆرجی فەوری</span>
                  <span className="text-xs bg-rose-50 text-rose-800 border border-rose-200/80 px-2 py-0.5 rounded-lg">
                    {urgentBatteries.length} باتری
                  </span>
                </h3>
                <div className="space-y-3">
                  {urgentBatteries.map(item => (
                    <div key={item.battery.id} className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${
                            item.stats.status === 'OVERDUE'
                              ? 'bg-rose-50 border-rose-200/60 text-rose-700'
                              : 'bg-amber-50 border-amber-200/60 text-amber-700'
                          }`}>
                            <BoltIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{item.battery.name}</h3>
                            <p className={`text-xs font-bold ${
                              item.stats.status === 'OVERDUE' ? 'text-rose-700' : 'text-amber-800'
                            }`}>
                              {item.stats.statusText}
                            </p>
                            <p className="text-[11px] text-slate-500 font-medium">
                              {item.stats.daysElapsed} ڕۆژ تێپەڕیوە
                              {item.stats.status === 'OVERDUE' && ` (${Math.abs(item.stats.daysRemaining)} ڕۆژ دواکەوتووە)`}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleQuickChargeToday(item.battery.id)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                        >
                          <BoltIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ستۆرج کرا</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderHistoryContent = () => {
    // Collect all charge records from all batteries
    const allChargeRecords = batteries.flatMap(battery => 
      (battery.history || []).map(record => ({
        ...record,
        batteryName: battery.name,
        batteryCategory: getNormalizedCategory(battery.category, categories),
        batteryObj: battery,
      }))
    ).sort((a, b) => new Date(b.chargeDate).getTime() - new Date(a.chargeDate).getTime());

    // Filter history records by historySearchQuery and historyCategoryFilter
    const filteredRecords = allChargeRecords.filter((rec) => {
      const matchesCategory = historyCategoryFilter === 'ALL' || rec.batteryCategory === historyCategoryFilter;
      const q = historySearchQuery.trim().toLowerCase();
      const matchesQuery = !q || (
        rec.batteryName.toLowerCase().includes(q) ||
        (rec.notes && rec.notes.toLowerCase().includes(q)) ||
        rec.chargeDate.includes(q) ||
        rec.batteryCategory.toLowerCase().includes(q)
      );
      return matchesCategory && matchesQuery;
    });

    return (
      <div className="space-y-4 dir-rtl animate-in fade-in duration-200">
        {allChargeRecords.length === 0 ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center max-w-sm mx-auto px-4">
              <div className="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                <img
                  src="./drone_battery_app_icon.svg"
                  alt="App Icon"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <h3 className="text-[15px] font-bold text-slate-800 mb-1.5 tracking-tight">
                هیچ مێژوویەکی ستۆرجکردن تۆمار نەکراوە
              </h3>
              <div className="w-8 h-px bg-slate-300 mx-auto my-3" />
              <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
                کاتێک باترییەکانت ستۆرج دەکەیت، سەرجەم تۆمارەکان بە وردی لێرە پیشان دەدرێن.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Minimal Executive KPI Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400">کۆی پرۆسەکانی ستۆرج</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{allChargeRecords.length} چالاکی</div>
                </div>
                <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                  <ClockIcon className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400">تێکڕای ستۆرجکردن</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {Math.round(allChargeRecords.length / Math.max(1, batteries.length))} جار / باتری
                  </div>
                </div>
                <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                  <BoltIcon className="w-4 h-4" />
                </div>
              </div>

              <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-slate-400">دوایین بەرواری ستۆرج</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">
                    {allChargeRecords.length > 0 ? allChargeRecords[0].chargeDate : '—'}
                  </div>
                </div>
                <div className="w-8 h-8 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                  <CalendarIcon className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Mobile-only quick search */}
            <div className="lg:hidden relative w-full">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearchQuery}
                onChange={(e) => setHistorySearchQuery(e.target.value)}
                placeholder="گەڕان لە مێژوودا..."
                className="w-full pl-8 pr-9 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all font-medium"
              />
              {historySearchQuery && (
                <button
                  onClick={() => setHistorySearchQuery('')}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* History List */}
            {filteredRecords.length === 0 ? (
              <div className="flex items-center justify-center min-h-[35vh] bg-white rounded-xl border border-slate-200 p-8">
                <div className="text-center max-w-sm mx-auto px-4">
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-3.5 shadow-sm">
                    <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <h3 className="text-[14px] font-bold text-slate-800 mb-1 tracking-tight">
                    هیچ چالاکییەک نەدۆزرایەوە
                  </h3>
                  <div className="w-6 h-px bg-slate-300 mx-auto my-2.5" />
                  <p className="text-[11.5px] text-slate-400 leading-relaxed font-medium">
                    هیچ تۆمارێک بەرامبەر ئەم گەڕانە یان بەشە بەردەست نییە.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredRecords.map((record, index) => {
                  return (
                    <div 
                      key={record.id || index}
                      className="bg-white rounded-xl p-3.5 border border-slate-200 hover:border-slate-300 transition-all shadow-sm flex items-center justify-between gap-4"
                    >
                      {/* Right side: Battery details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-[13px] truncate">
                            {record.batteryName}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {record.batteryCategory}
                          </span>
                        </div>
                        {record.notes && (
                          <p className="text-[11px] text-slate-500 mt-1 truncate">
                            {record.notes}
                          </p>
                        )}
                      </div>

                      {/* Left side: Date & Time */}
                      <div className="text-left shrink-0">
                        <div className="text-[12.5px] font-bold text-slate-800 font-mono">
                          {record.chargeDate}
                        </div>
                        <div className="text-[10.5px] text-slate-400 font-medium mt-0.5">
                          {formatGregorianKurdish(record.chargeDate)}
                          {record.chargeTime && ` • ${record.chargeTime}`}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderSettingsContent = () => (
    <div className="space-y-6 w-full animate-in fade-in slide-in-from-bottom-2 duration-300 dir-rtl max-w-4xl pb-10">

      {/* ═══════════════════════════════════════════════════════════════════════
          گرووپی ١: ڕێکخستنە گشتییەکان و سیستەم (General Preferences & System)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Section Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-emerald-400 shadow-2xs shrink-0">
              <Cog6ToothIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white tracking-wide leading-tight">ڕێکخستنە گشتییەکان (General Preferences)</h3>
              <p className="text-[11px] text-slate-300 mt-0.5 font-medium">هەڵبژاردنی تایبەتمەندییە سەرەکییەکان، دەنگ و بەشەکان</p>
            </div>
          </div>
        </div>

        {/* Section Items */}
        <div className="divide-y divide-slate-100 p-1">
          {/* ١.١ دەنگی ئاگادارکردنەوە */}
          <div className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/40 transition-colors rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                <SpeakerWaveIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800">دەنگی ئاگادارکردنەوە (Audio Alerts)</h4>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">لێدانی دەنگ لە کاتی ئەنجامدانی چارجی ستۆرج یان کردارەکان</p>
              </div>
            </div>
            <button
              onClick={handleToggleAudio}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ${
                settings.enableAudioAlerts ? 'bg-slate-900' : 'bg-slate-200'
              }`}
              title={settings.enableAudioAlerts ? 'ناچالاککردنی دەنگ' : 'چالاککردنی دەنگ'}
            >
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-xs transition-all duration-200 ${
                settings.enableAudioAlerts ? 'right-5.5' : 'right-0.5'
              }`} />
            </button>
          </div>

          {/* ١.٢ بەڕێوەبردنی پۆل و جۆری درۆنەکان */}
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/40 transition-colors rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 shrink-0">
                <TagIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-800">بەڕێوەبردنی پۆل و مۆدێلەکان (Categories)</h4>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded border border-slate-200">
                    {categories.length} پۆل
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">زیادکردن، سڕینەوە و ڕێکخستنی جۆرەکانی درۆن و باتری</p>
              </div>
            </div>
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 font-bold text-xs rounded-lg transition-all shadow-2xs flex items-center justify-center gap-1.5 shrink-0"
            >
              <AdjustmentsHorizontalIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>بەڕێوەبردنی پۆلەکان</span>
            </button>
          </div>

        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          گرووپی ٢: بەڕێوەبردن و پشتیوانیکردنی داتاکان (Data Management & Storage)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Section Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/15 flex items-center justify-center text-emerald-400 shadow-2xs shrink-0">
              <ArrowDownTrayIcon className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xs font-black text-white tracking-wide leading-tight">بەڕێوەبردن و پشتیوانیکردنی داتاکان (Data & Backup)</h3>
              <p className="text-[11px] text-slate-300 mt-0.5 font-medium">دەرهێنان، هاوردەکردن و گەڕاندنەوەی مێژووی باترییەکان</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* دوگمەکانی هاوردەکردن و هەناردەکردنی JSON */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 flex flex-col justify-between gap-3.5 shadow-2xs hover:border-slate-300 transition-all">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <ArrowDownTrayIcon className="w-3.5 h-3.5" />
                  </div>
                  <span>دەرهێنانی کۆپیی یەدەگ (Export JSON)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium leading-relaxed">
                  پاشەکەوتکردنی تەواوی باترییەکان، مێژوو و زانیارییەکان لە پەڕگەیەکی JSON
                </p>
              </div>
              <button
                onClick={handleExportData}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
              >
                <ArrowDownTrayIcon className="w-4 h-4 text-emerald-100" />
                <span>دەرهێنانی داتا (Export)</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-slate-200/90 bg-slate-50/50 flex flex-col justify-between gap-3.5 shadow-2xs hover:border-slate-300 transition-all">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-slate-200 text-slate-800 flex items-center justify-center shrink-0">
                    <ArrowUpTrayIcon className="w-3.5 h-3.5" />
                  </div>
                  <span>هێنانی کۆپیی یەدەگ (Import JSON)</span>
                </h4>
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium leading-relaxed">
                  گەڕاندنەوە و هاوردەکردنی داتاکان لە پەڕگەیەکی پێشتری JSON
                </p>
              </div>
              <button
                onClick={handleImportData}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.99] cursor-pointer"
              >
                <ArrowUpTrayIcon className="w-4 h-4 text-slate-200" />
                <span>هێنانی داتا (Import)</span>
              </button>
            </div>
          </div>

          {/* لۆگ و گەڕاندنەوەی داتاکان */}
          <div className="rounded-xl border border-slate-200/90 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 border-b border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <ClockIcon className="w-4 h-4 text-slate-600" />
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">تۆماری سڕینەوە و گەڕاندنەوە (Deletion Logs)</h4>
                  <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-200/80 px-2 py-0.5 rounded-md">
                    {deletionLogs.length}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {deletionLogs.some((l) => l.deletedBatteries && l.deletedBatteries.length > 0 && !l.isRestored) && (
                  <button
                    onClick={handleRestoreAllDeletedData}
                    className="text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-2xs"
                    title="گەڕاندنەوەی سەرجەم باترییە سڕاوەکان"
                  >
                    <ArrowUturnRightIcon className="w-3.5 h-3.5 text-emerald-400" />
                    <span>گەڕاندنەوەی هەموو</span>
                  </button>
                )}

                {deletionLogs.length > 0 && (
                  <button
                    onClick={handleClearDeletionLogs}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
                    title="سڕینەوەی مێژووی لۆگەکان"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    <span>پاککردنەوەی لۆگەکان</span>
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            {deletionLogs.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-xs text-slate-400 font-medium">هیچ داتایەکی سڕاوە یان لۆگێک تۆمار نەکراوە</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {deletionLogs.map((log) => {
                  const hasDeletedBatteries = log.deletedBatteries && log.deletedBatteries.length > 0;
                  return (
                    <div key={log.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50/60 transition-colors">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                            سڕینەوەی {log.batteryCountCleared} باتری
                          </span>
                          <span className="text-slate-400 font-medium text-[11px]">
                            لەگەڵ {log.historyCountCleared} تۆماری مێژوویی
                          </span>
                          {log.isRestored && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <CheckCircleIcon className="w-3 h-3 text-emerald-600" />
                              گەڕێندراوەتەوە
                            </span>
                          )}
                        </div>
                        <p className="text-slate-500 font-medium text-[11px] truncate">
                          هۆکار: <span className="font-semibold text-slate-700">{log.reason || 'سڕینەوەی دەستی'}</span>
                        </p>
                        {hasDeletedBatteries && (
                          <p className="text-[10.5px] text-slate-400 font-medium truncate">
                            باترییەکان:{' '}
                            <span className="text-slate-600 font-semibold">
                              {log.deletedBatteries!.map((b) => b.name).slice(0, 4).join('، ')}
                              {log.deletedBatteries!.length > 4 ? ` و ${log.deletedBatteries!.length - 4} دانەی تر` : ''}
                            </span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        <div className="text-left font-mono font-bold text-slate-600 text-[11px]">
                          <div>{log.timestamp.split('T')[0]}</div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            {formatGregorianKurdish(log.timestamp.split('T')[0])} • {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        {hasDeletedBatteries && !log.isRestored && (
                          <button
                            onClick={() => handleRestoreDeletedData(log.id)}
                            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-2xs shrink-0"
                            title="گەڕاندنەوەی ئەم باترییانە"
                          >
                            <ArrowUturnRightIcon className="w-3.5 h-3.5 text-emerald-400" />
                            <span>گەڕاندنەوە</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          گرووپی ٣: ناوچەی مەترسیدار و سڕینەوە (Danger Zone)
         ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-rose-200/90 shadow-2xs overflow-hidden">
        {/* Section Header */}
        <div className="px-5 py-3.5 bg-rose-50/80 border-b border-rose-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 shrink-0">
              <ExclamationTriangleIcon className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h3 className="text-xs font-black text-rose-900 leading-tight">ناوچەی مەترسیدار (Danger Zone)</h3>
              <p className="text-[10.5px] text-rose-600 font-medium">کردارە هەستیار و سڕینەوە سەرەکییەکان</p>
            </div>
          </div>
        </div>

        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200/70 flex items-center justify-center shrink-0">
              <TrashIcon className="w-4 h-4 text-rose-600" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900 leading-tight">سڕینەوەی سەرجەم داتاکانی سیستەم (Clear All Data)</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium leading-relaxed">
                سڕینەوەی سەرجەم باترییەکان، مێژوو و داتاکانی ستۆرج بە شێوەیەکی یەکجاری
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsClearDataModalOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shrink-0 flex items-center justify-center gap-1.5 shadow-xs"
          >
            <TrashIcon className="w-3.5 h-3.5" />
            <span>سڕینەوەی داتاکان</span>
          </button>
        </div>
      </div>

    </div>
  );

  // Priority score helper for sorting
  const getStatusPriority = (status: string) => {
    switch (status) {
      case 'OVERDUE': return 3;
      case 'TIME_TO_CHARGE': return 2;
      case 'EARLY_WARNING': return 1;
      default: return 0;
    }
  };

  // Calculate urgent batteries for notifications & urgent section (sorted from most overdue to early warning)
  const urgentBatteries = batteries
    .map((bat) => ({
      battery: bat,
      stats: calculateBatteryStats(bat.lastChargeDate, bat.reminderIntervalDays, simulatedReferenceDate),
    }))
    .filter((item) => item.stats.status === 'EARLY_WARNING' || item.stats.status === 'TIME_TO_CHARGE' || item.stats.status === 'OVERDUE')
    .sort((a, b) => {
      const priorityDiff = getStatusPriority(b.stats.status) - getStatusPriority(a.stats.status);
      if (priorityDiff !== 0) return priorityDiff;
      return b.stats.daysElapsed - a.stats.daysElapsed;
    });

  // Calculate overview stats
  const overdueCount = batteries.filter(b => {
    const stats = calculateBatteryStats(b.lastChargeDate, b.reminderIntervalDays, simulatedReferenceDate);
    return stats.status === 'OVERDUE';
  }).length;

  const dueCount = batteries.filter(b => {
    const stats = calculateBatteryStats(b.lastChargeDate, b.reminderIntervalDays, simulatedReferenceDate);
    return stats.status === 'TIME_TO_CHARGE';
  }).length;

  const earlyWarningCount = batteries.filter(b => {
    const stats = calculateBatteryStats(b.lastChargeDate, b.reminderIntervalDays, simulatedReferenceDate);
    return stats.status === 'EARLY_WARNING';
  }).length;

  const onTimeCount = batteries.length - overdueCount - dueCount - earlyWarningCount;

  // PWA Home Screen Icon Red Badge Notification:
  // When batteries are overdue or urgent, display a red notification badge on the device's home screen app icon
  useEffect(() => {
    const totalBadges = overdueCount > 0 ? overdueCount : urgentBatteries.length;
    if (typeof navigator !== 'undefined' && 'setAppBadge' in navigator) {
      if (totalBadges > 0) {
        navigator.setAppBadge(totalBadges).catch(() => {});
      } else {
        navigator.clearAppBadge().catch(() => {});
      }
    }
    // Also notify Service Worker
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: totalBadges > 0 ? 'SET_BADGE' : 'CLEAR_BADGE',
        count: totalBadges,
      });
    }
  }, [overdueCount, urgentBatteries.length]);

  const renderDashboardContent = () => {
    if (batteries.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-sm mx-auto px-4">
            {/* Icon — simple bordered, no gradient */}
            <div className="w-14 h-14 bg-white border border-slate-200 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <img
                src="./drone_battery_app_icon.svg"
                alt="App Icon"
                className="w-8 h-8 object-contain"
              />
            </div>

            {/* Title */}
            <h3 className="text-[17px] font-bold text-slate-800 mb-2 tracking-tight leading-snug">
              سیستەمی پیشەیی بەڕێوەبردنی<br />ستۆرج باتری
            </h3>

            {/* Divider */}
            <div className="w-8 h-px bg-slate-300 mx-auto my-4" />

            {/* Description */}
            <p className="text-[12.5px] text-slate-500 leading-relaxed font-medium mb-8">
              سیستەمێکی زیرەک بۆ بیرخستنەوەی ستۆرجکردنی باترییەکانت.<br />
              یادەوەری لە ٣٥ ڕۆژەوە و ئاگادارکردنەوە دوای ٤٠ ڕۆژ.
            </p>

            {/* CTA Button — formal slate */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-7 py-2.5 bg-slate-900 hover:bg-slate-700 text-white font-semibold text-sm rounded-lg transition-all inline-flex items-center gap-2.5 shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              <span>دەست بکە بە یەکەم باتری</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 dir-rtl">
        {/* Quick Stats Overview - 4 Executive Minimal Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold">کۆی باترییەکان</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{batteries.length}</p>
              </div>
              <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 shrink-0">
                <Square3Stack3DIcon className="w-5 h-5 text-slate-700" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 font-semibold mt-2">تۆمارکراو لە سیستەمدا</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-700 text-xs font-bold">لە کاتی خۆیاندا</p>
                <p className="text-2xl font-black text-emerald-800 mt-1">{onTimeCount}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-200/70 rounded-xl flex items-center justify-center text-emerald-700 shrink-0">
                <CheckCircleIcon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-emerald-600 font-semibold mt-2">لە خولی ٤٠ ڕۆژەدا</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-700 text-xs font-bold">یادەوەری ٥ ڕۆژە</p>
                <p className="text-2xl font-black text-amber-800 mt-1">{earlyWarningCount}</p>
              </div>
              <div className="w-10 h-10 bg-amber-50 border border-amber-200/70 rounded-xl flex items-center justify-center text-amber-700 shrink-0">
                <ClockIcon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-amber-600 font-semibold mt-2">نزیك لە کاتی ستۆرج</p>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-700 text-xs font-bold">ستۆرجی بەپەلە</p>
                <p className="text-2xl font-black text-rose-800 mt-1">{dueCount + overdueCount}</p>
              </div>
              <div className="w-10 h-10 bg-rose-50 border border-rose-200/70 rounded-xl flex items-center justify-center text-rose-700 shrink-0">
                <ExclamationTriangleIcon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-rose-600 font-semibold mt-2">پێویست بە ستۆرج / دواکەوتوو</p>
          </div>
        </div>

        {/* Batteries Requiring Urgent Storage Section */}
        {urgentBatteries.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-rose-600" />
                  <span>باترییەکان کە پێویستیان بە ستۆرجی بەپەلەیە ({urgentBatteries.length})</span>
                </h2>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">ئەم باترییانە گەیشتوونەتە خولی ٣٥-٤٠ ڕۆژ یان تێپەڕیون</p>
              </div>
              <button
                onClick={() => setActiveView('batteries')}
                className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>بەڕێوەبردنی تەواوی باترییەکان</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {urgentBatteries.map(({ battery }) => (
                <DashboardUrgentCard
                  key={`dash_urgent_${battery.id}`}
                  battery={battery}
                  onChargeToday={handleQuickChargeToday}
                  onOpenHistoryModal={(b) => setActiveBatteryForHistory(b)}
                  onOpenEditModal={(b) => setActiveBatteryForEdit(b)}
                  referenceDate={simulatedReferenceDate}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    );
  };

  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          localStorage.setItem('storage_auth_user', JSON.stringify(user));
        }}
      />
    );
  }

  return (
    <div
      className="min-h-screen min-h-dvh dir-rtl flex overflow-x-hidden"
      style={{ background: 'var(--bg-app)' }}
    >
      
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar
          activeView={activeView}
          onViewChange={(v: string) => setActiveView(v as any)}
          batteryCount={batteries.length}
          urgentCount={urgentBatteries.length}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          hasUpdate={!!updateCheckResult?.hasUpdate}
          latestVersion={updateCheckResult?.latestVersion}
          onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
          currentUser={currentUser}
          onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
          pendingUsersCount={pendingUsersCount}
          onLogout={handleLogout}
        />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'lg:mr-[72px]' : 'lg:mr-64'
      }`}>
        
        {/* Mobile Header */}
        <div
          className="lg:hidden sticky top-0 z-50 shadow-sm"
          style={{
            background: 'var(--header-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--bg-border)',
            paddingTop: 'env(safe-area-inset-top)',
          }}
        >
          <div className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              {/* Logo and Title */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
                    <BoltIcon className="w-5 h-5" />
                  </div>
                  {overdueCount > 0 && (
                    <span className="absolute -top-1 -right-1.5 bg-rose-500 text-white font-mono text-[9px] font-black min-w-[16px] h-[16px] px-0.5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-pulse shadow-xs">
                      {overdueCount > 9 ? '9+' : overdueCount}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm font-black tracking-tight leading-tight truncate" style={{ color: 'var(--text-primary)' }}>
                    سیستەمی پیشەیی
                  </h1>
                  <p className="text-[10px] font-bold text-emerald-600 leading-tight">
                    {currentUser?.fullName || 'بەڕێوەبردنی ستۆرج'}
                  </p>
                </div>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Dark Mode Toggle */}
                <button
                  onClick={toggleDarkMode}
                  className="p-2 rounded-xl transition-colors cursor-pointer"
                  style={{ background: 'var(--bg-surface2)', border: '1px solid var(--bg-border)' }}
                  title={isDarkMode ? 'گۆڕین بۆ لایت مۆد' : 'گۆڕین بۆ دارک مۆد'}
                >
                  {isDarkMode
                    ? <SunIcon className="w-5 h-5 text-amber-400" />
                    : <MoonIcon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
                  }
                </button>

                {/* Mobile Menu Toggle (opens sidebar overlay) */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="p-2 rounded-xl transition-colors cursor-pointer"
                  style={{ background: 'var(--bg-surface2)', border: '1px solid var(--bg-border)' }}
                >
                  {mobileMenuOpen
                    ? <XMarkIcon className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                    : <Bars3Icon className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
                  }
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Header / Top Navigation Bar */}
        <div
          className="hidden lg:block sticky top-0 z-30"
          style={{
            background: 'var(--header-bg)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid var(--bg-border)',
          }}
        >
          {activeView === 'batteries' ? (
            /* Batteries View: Minimal Executive Header */
            <div className="px-7 py-3.5 space-y-3">
              {/* Row 1: Title + Search & Category Action */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-[15px] font-bold text-slate-900 tracking-tight">باترییەکان</h1>
                      <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/70">
                        {batteries.length} باتری
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      بەڕێوەبردن و چاودێریی پاترییە تۆمارکراوەکان
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Team vs Personal Workspace Switcher */}
                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                    <button
                      onClick={() => setWorkspaceMode('TEAM')}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        workspaceMode === 'TEAM'
                          ? 'bg-white text-emerald-800 shadow-xs font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>👥 تیمی هاوبەش</span>
                      <span className="text-[10px] bg-slate-200/80 px-1.5 py-0.2 rounded-md text-slate-700 font-mono">
                        {batteries.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setWorkspaceMode('PERSONAL')}
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        workspaceMode === 'PERSONAL'
                          ? 'bg-white text-indigo-800 shadow-xs font-black'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <span>👤 باترییەکانم</span>
                      <span className="text-[10px] bg-slate-200/80 px-1.5 py-0.2 rounded-md text-slate-700 font-mono">
                        {batteries.filter((b) => b.userId === currentUser?.id).length}
                      </span>
                    </button>
                  </div>

                  <div className="relative w-60">
                    <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="گەڕان بەدوای باتری..."
                      className="w-full pl-8 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-400 transition-all font-medium"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <XMarkIcon className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setIsCategoryModalOpen(true)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-all flex items-center gap-1.5 shrink-0"
                    title="زیادکردن و بەڕێوەبردنی هاوپۆلەکان"
                  >
                    <PlusIcon className="w-3.5 h-3.5 text-slate-600" />
                    <span>هاوپۆلی نوێ</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Category Filter Tabs — Segmented Control Container */}
              <div className="pt-0.5">
                <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-xl gap-1 border border-slate-200/60 overflow-x-auto max-w-full scrollbar-none">
                  <button
                    onClick={() => setSelectedCategoryTab('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                      selectedCategoryTab === 'ALL'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>هەموو بەشەکان</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded transition-colors ${
                      selectedCategoryTab === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-500'
                    }`}>
                      {batteries.length}
                    </span>
                  </button>

                  {categories.map((cat) => {
                    const catCount = batteries.filter(b => getNormalizedCategory(b.category, categories) === cat.id).length;
                    const isSelected = selectedCategoryTab === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategoryTab(isSelected ? 'ALL' : cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        <span>{cat.name}</span>
                        {catCount > 0 && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded transition-colors ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-500'
                          }`}>
                            {catCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : activeView === 'history' ? (
            /* History View: Minimal Executive Header */
            <div className="px-7 py-3.5 space-y-3">
              {/* Row 1: Title + Search */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-[15px] font-bold text-slate-900 tracking-tight">مێژووی چالاکییەکان</h1>
                      <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200/70">
                        {allChargeRecords.length} چالاکی
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      تۆماری تەواوی پرۆسەکانی ستۆرجکردنی باتری
                    </p>
                  </div>
                </div>

                <div className="relative w-64">
                  <MagnifyingGlassIcon className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="گەڕان لە مێژوودا..."
                    className="w-full pl-8 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-400 transition-all font-medium"
                  />
                  {historySearchQuery && (
                    <button
                      onClick={() => setHistorySearchQuery('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Row 2: Category Filter Tabs — Segmented Control Container */}
              <div className="pt-0.5">
                <div className="inline-flex items-center bg-slate-100/90 p-1 rounded-xl gap-1 border border-slate-200/60 overflow-x-auto max-w-full scrollbar-none">
                  <button
                    onClick={() => setHistoryCategoryFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                      historyCategoryFilter === 'ALL'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <span>هەموو بەشەکان</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded transition-colors ${
                      historyCategoryFilter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-500'
                    }`}>
                      {allChargeRecords.length}
                    </span>
                  </button>

                  {categories.map((cat) => {
                    const catCount = allChargeRecords.filter(r => r.batteryCategory === cat.id).length;
                    const isSelected = historyCategoryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setHistoryCategoryFilter(isSelected ? 'ALL' : cat.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                        }`}
                      >
                        <span>{cat.name}</span>
                        {catCount > 0 && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded transition-colors ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-400'
                          }`}>
                            {catCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Other views: minimal single-row header */
            <div className="px-7 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Current View Title */}
                <div className="flex items-center gap-3">
                  <div>
                    <h1 className="text-[15px] font-bold text-slate-900 tracking-tight">
                      {activeView === 'dashboard' && 'داشبۆرد'}
                      {activeView === 'analytics' && 'ڕاپۆرتی پیشەیی'}
                      {activeView === 'notifications' && 'ئاگادارکردنەوەکان'}
                      {activeView === 'changelog' && 'مێژووی گۆڕانکارییەکان'}
                      {activeView === 'users' && 'بەڕێوەبردنی بەکارهێنەران'}
                      {activeView === 'settings' && 'ڕێکخستنەکان'}
                    </h1>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {activeView === 'dashboard' && 'پێشاندانی گشتی و پوختەی باترییەکان'}
                      {activeView === 'analytics' && 'شیکاری تەندروستی و کارایی باترییەکانت'}
                      {activeView === 'notifications' && 'یادەوەری و هۆشدارییەکانی ستۆرجکردن'}
                      {activeView === 'changelog' && 'تەواوی مێژووی چالاکی و گۆڕانکارییەکانی سیستەم'}
                      {activeView === 'users' && 'بەڕێوەبردن و دەستکاریکردنی کارمەندان و دەسەڵاتەکان'}
                      {activeView === 'settings' && 'ڕێکخستنی سیستەم و بژاردەکان'}
                    </p>
                  </div>
                </div>
                
                {/* View Specific Actions + Dark Mode Toggle */}
                <div className="flex items-center gap-2 shrink-0">
                  {activeView === 'analytics' && (
                    <button
                      onClick={() => setIsPrintModalOpen(true)}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-all flex items-center gap-2"
                    >
                      <PrinterIcon className="w-3.5 h-3.5 text-emerald-400" />
                      <span>پیشاندانی ڕاپۆرت & چاپکردن / Excel</span>
                    </button>
                  )}
                  {/* Dark Mode Toggle Button */}
                  <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-xl transition-colors cursor-pointer"
                    style={{ background: 'var(--bg-surface2)', border: '1px solid var(--bg-border)' }}
                    title={isDarkMode ? 'گۆڕین بۆ لایت مۆد' : 'گۆڕین بۆ دارک مۆد'}
                  >
                    {isDarkMode
                      ? <SunIcon className="w-4 h-4 text-amber-400" />
                      : <MoonIcon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
            <div
              className="absolute right-0 top-0 h-full w-72 shadow-2xl"
              style={{ background: 'var(--bg-surface)' }}
            >
              <Sidebar
                activeView={activeView}
                onViewChange={(view) => {
                  setActiveView(view as any);
                  setMobileMenuOpen(false);
                }}
                batteryCount={batteries.length}
                urgentCount={urgentBatteries.length}
                onOpenAddModal={() => {
                  setIsAddModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                onExportData={() => {
                  handleExportData();
                  setMobileMenuOpen(false);
                }}
                onImportData={() => {
                  handleImportData();
                  setMobileMenuOpen(false);
                }}
                onOpenSimulator={() => {
                  setIsSimulatorOpen(true);
                  setMobileMenuOpen(false);
                }}
                isCollapsed={false}
                onToggleCollapse={() => setMobileMenuOpen(false)}
                hasUpdate={!!updateCheckResult?.hasUpdate}
                latestVersion={updateCheckResult?.latestVersion}
                onOpenUpdateModal={() => {
                  setIsUpdateModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                currentUser={currentUser}
                onOpenChangePassword={() => {
                  setIsChangePasswordModalOpen(true);
                  setMobileMenuOpen(false);
                }}
                pendingUsersCount={pendingUsersCount}
                onLogout={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* Notification Banner moved into batteries content */}

        {/* Active Simulation Notice */}
        {simulatedReferenceDate && (
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-300/60 backdrop-blur-sm py-4 px-6">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500 text-white rounded-xl animate-pulse">
                  <ClockIcon className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-bold text-amber-900">
                    مۆدی تاقیکاری کات چالاککراوە
                  </span>
                  <span className="text-amber-800 mr-2">
                    ({simulatedReferenceDate})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSimulatedReferenceDate(undefined)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-2"
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>گەڕانەوە بۆ ڕاستەقینە</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 px-4 py-6 pb-24 lg:px-6 lg:py-8 lg:pb-8">
          {renderContent()}
        </main>

      </div>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavBar
        activeView={activeView}
        onViewChange={(v: string) => setActiveView(v as any)}
        urgentCount={urgentBatteries.length}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        currentUser={currentUser}
      />

      {/* Modals */}
      <AddBatteryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultCategory={addModalDefaultCategory}
        categories={categories}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onAddBattery={handleAddBattery}
      />

      <EditBatteryModal
        battery={activeBatteryForEdit}
        isOpen={!!activeBatteryForEdit}
        onClose={() => setActiveBatteryForEdit(null)}
        categories={categories}
        onOpenCategoryManager={() => setIsCategoryModalOpen(true)}
        onUpdateBattery={handleUpdateBattery}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        batteries={batteries}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <CustomDateModal
        battery={activeBatteryForCustomDate}
        isOpen={!!activeBatteryForCustomDate}
        onClose={() => setActiveBatteryForCustomDate(null)}
        onSaveCustomChargeDate={handleSaveCustomDate}
      />

      <HistoryModal
        battery={activeBatteryForHistory}
        isOpen={!!activeBatteryForHistory}
        onClose={() => setActiveBatteryForHistory(null)}
      />

      <DateSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        currentSimulatedDate={simulatedReferenceDate}
        onApplySimulatedDate={(date) => setSimulatedReferenceDate(date)}
        lastChargeDateOfActiveBattery={batteries[0]?.lastChargeDate}
      />

      <ClearDataModal
        isOpen={isClearDataModalOpen}
        onClose={() => setIsClearDataModalOpen(false)}
        onConfirmClear={handleClearAllData}
        batteryCount={batteries.length}
      />

      <ActivationModal
        isOpen={isActivationModalOpen || (licenseState.isExpired && !licenseState.isActivated)}
        onClose={() => setIsActivationModalOpen(false)}
        licenseState={licenseState}
        onLicenseUpdated={(newState) => setLicenseState(newState)}
        isForcedLockout={licenseState.isExpired && !licenseState.isActivated}
      />

      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        batteries={batteries}
        simulatedReferenceDate={simulatedReferenceDate}
      />

      <StorageConfirmModal
        battery={activeBatteryForStorageConfirm}
        isOpen={!!activeBatteryForStorageConfirm}
        onClose={() => setActiveBatteryForStorageConfirm(null)}
        onConfirm={handleConfirmQuickCharge}
      />

      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        updateData={updateCheckResult}
        onExportBackup={handleExportData}
      />

      <CustomDialog
        config={dialogConfig}
        onClose={() => setDialogConfig(null)}
      />

      {currentUser && (
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          currentUser={currentUser}
        />
      )}

    </div>
  );
}



