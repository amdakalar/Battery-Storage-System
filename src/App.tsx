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
import { ModernDialog, DialogState } from './components/ModernDialog';
import { getLicenseState } from './utils/licenseManager';
import { LicenseState, UpdateCheckResult } from './types';
import { APP_CONFIG } from './constants/appConfig';
import { DRONE_CATEGORIES, getNormalizedCategory, DEFAULT_CATEGORY } from './constants/categories';
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
  Bars3Icon,
  XMarkIcon,
  BellIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  VideoCameraIcon,
  SignalIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

export default function App() {
  const [batteries, setBatteries] = useState<Battery[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [simulatedReferenceDate, setSimulatedReferenceDate] = useState<string | undefined>(undefined);
  const [activeView, setActiveView] = useState<'dashboard' | 'batteries' | 'analytics' | 'notifications' | 'history' | 'settings'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('ALL');

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

  // Modern Dialog State
  const [dialogState, setDialogState] = useState<DialogState>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showDialog = (config: Omit<DialogState, 'isOpen'>) => {
    setDialogState({
      isOpen: true,
      ...config,
    });
  };

  const closeDialog = () => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleOpenAddModalForCategory = (catId?: string) => {
    setAddModalDefaultCategory(catId);
    setIsAddModalOpen(true);
  };

  // Load saved battery data & silently check for GitHub release updates on startup
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const loaded = await loadBatteriesAsync();
        if (isMounted) {
          setBatteries(loaded);
        }
      } catch (error) {
        console.error('Error loading batteries on startup:', error);
      }
    })();

    // Auto-check for updates silently after 2 seconds
    const timer = setTimeout(async () => {
      try {
        const repo = (settings.githubRepo || APP_CONFIG.GITHUB_REPO || '').trim();
        if (typeof window !== 'undefined' && (window as any).electronAPI?.checkForUpdate) {
          const res = await (window as any).electronAPI.checkForUpdate(repo);
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
  }, []);

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
  };

  // Action: Custom Storage Date
  const handleSaveCustomDate = (batteryId: string, customDate: string, notes: string) => {
    const updated = recordBatteryCharge(batteryId, customDate, notes || 'ستۆرجکردنی تۆمارکراو بە مێژووی دیاریکراو');
    setBatteries(updated);
    playSoundEffect('success');
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
    const updated = addBattery(data);
    setBatteries(updated);
    playSoundEffect('success');
  };

  // Action: GitHub Release Update Check (Fully Automatic with Electron & Web support)
  const handleCheckForUpdates = async (isSilent: boolean = false) => {
    setIsCheckingUpdate(true);
    setUpdateCheckError(null);

    const repo = (settings.githubRepo || APP_CONFIG.GITHUB_REPO || '').trim();

    try {
      if (typeof window !== 'undefined' && (window as any).electronAPI?.checkForUpdate) {
        const res = await (window as any).electronAPI.checkForUpdate(repo);
        setIsCheckingUpdate(false);
        if (res.success) {
          setUpdateCheckResult(res);
          if (res.hasUpdate) {
            setIsUpdateModalOpen(true);
          } else if (!isSilent) {
            showDialog({
              type: 'success',
              title: 'وەشانی بەرنامە نوێیە',
              message: `زۆر باشە! وەشانی بەرنامەکەت نوێترین وەشانە (v${res.currentVersion}).`,
              confirmText: 'دەستخۆش',
            });
          }
        } else {
          const errText = res.error || 'کێشە لە وەرگرتنی ئەپدەیت ڕوویدا';
          if (!isSilent) {
            setUpdateCheckError(errText);
            showDialog({
              type: 'warning',
              title: 'پشکنینی ئەپدەیت',
              message: errText,
              confirmText: 'باشە',
            });
          }
        }
      } else {
        // Fallback for Web Browser environment (direct GitHub API fetch)
        let repoPath = repo.replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/$/, '');
        if (!repoPath.includes('/')) repoPath = 'amdakalar/Battery-Storage-System';

        let res = await fetch(`https://api.github.com/repos/${repoPath}/releases/latest`);
        let releaseData: any;
        if (res.status === 404) {
          const listRes = await fetch(`https://api.github.com/repos/${repoPath}/releases`);
          if (listRes.ok) {
            const list = await listRes.json();
            if (Array.isArray(list) && list.length > 0) {
              releaseData = list[0];
            }
          }
        } else if (res.ok) {
          releaseData = await res.json();
        }

        setIsCheckingUpdate(false);

        const currentVersion = APP_CONFIG.CURRENT_VERSION || '1.0.0';

        if (!releaseData || !releaseData.tag_name) {
          if (!isSilent) {
            showDialog({
              type: 'info',
              title: 'پشکنینی ئەپدەیت',
              message: 'تا ئێستا هیچ وەشانێکی نوێ لە بەشی Releases لە گیتهاپ دانەنراوە.',
              confirmText: 'باشە',
            });
          }
          return;
        }

        const cleanV = (v: string) => {
          const m = v.match(/\d+(\.\d+)*/);
          return m ? m[0] : v.replace(/^v/i, '').trim();
        };

        const lParts = cleanV(releaseData.tag_name).split('.').map((p) => parseInt(p, 10) || 0);
        const cParts = cleanV(currentVersion).split('.').map((p) => parseInt(p, 10) || 0);
        let hasUpdate = false;
        for (let i = 0; i < Math.max(lParts.length, cParts.length, 3); i++) {
          const l = lParts[i] || 0;
          const c = cParts[i] || 0;
          if (l > c) {
            hasUpdate = true;
            break;
          }
          if (l < c) {
            hasUpdate = false;
            break;
          }
        }

        let exeAsset = (releaseData.assets || []).find((a: any) =>
          typeof a.name === 'string' &&
          a.name.toLowerCase().endsWith('.exe') &&
          !a.name.toLowerCase().includes('.blockmap')
        );
        if (!exeAsset && releaseData.assets && releaseData.assets.length > 0) {
          exeAsset = releaseData.assets.find((a: any) => !a.name.toLowerCase().endsWith('.blockmap')) || releaseData.assets[0];
        }

        const updateResult: UpdateCheckResult = {
          success: true,
          hasUpdate,
          latestVersion: cleanV(releaseData.tag_name),
          currentVersion,
          releaseName: releaseData.name || releaseData.tag_name,
          releaseNotes: releaseData.body || 'وەشانی نوێ لە گیتهاپ بەردەستە.',
          publishedAt: releaseData.published_at,
          downloadUrl: exeAsset ? exeAsset.browser_download_url : undefined,
          fileName: exeAsset ? exeAsset.name : undefined,
          fileSize: exeAsset ? exeAsset.size : undefined,
          htmlUrl: releaseData.html_url,
        };

        setUpdateCheckResult(updateResult);

        if (hasUpdate) {
          setIsUpdateModalOpen(true);
        } else if (!isSilent) {
          showDialog({
            type: 'success',
            title: 'وەشانی بەرنامە نوێیە',
            message: `زۆر باشە! وەشانی بەرنامەکەت نوێترین وەشانە (v${currentVersion}).`,
            confirmText: 'دەستخۆش',
          });
        }
      }
    } catch (err: any) {
      setIsCheckingUpdate(false);
      const errText = err.message || 'کێشە لە پەیوەندیکردن بە API ی گیتهاپ ڕوویدا';
      if (!isSilent) {
        setUpdateCheckError(errText);
        showDialog({
          type: 'danger',
          title: 'پشکنینی ئەپدەیت',
          message: errText,
          confirmText: 'تێگەیشتم',
        });
      }
    }
  };

  // Action: Update Battery & Cells
  const handleUpdateBattery = (batteryId: string, updatedFields: Partial<Battery>) => {
    const updated = updateBattery(batteryId, updatedFields);
    setBatteries(updated);
    playSoundEffect('success');
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
    showDialog({
      type: 'delete',
      title: 'سڕینەوەی لۆگەکانی سڕینەوە',
      message: 'ئایا دڵنیایت لە سڕینەوەی تەواوی لۆگەکانی سڕینەوە؟',
      details: 'سەرجەم تۆمار و مێژووی سڕینەوە لە بەشی لۆگ بە یەکجاری پاک دەکرێتەوە و ناگەڕێتەوە.',
      isConfirm: true,
      confirmText: 'سڕینەوە',
      cancelText: 'پەشیمانبوونەوە',
      onConfirm: () => {
        const updated = clearDeletionLogs();
        setDeletionLogs(updated);
        playSoundEffect('alert');
      },
    });
  };

  // Action: Delete Battery
  const handleDeleteBattery = (batteryId: string) => {
    const targetBattery = batteries.find((b) => b.id === batteryId);
    showDialog({
      type: 'delete',
      title: 'سڕینەوەی باتری',
      message: targetBattery
        ? `ئایا دڵنیایت لە سڕینەوەی باتری "${targetBattery.name}"؟`
        : 'ئایا دڵنیایت لە سڕینەوەی ئەم باترییە؟',
      details: 'باترییەکە و تەواوی زانیاری و مێژووی خولەکانی ستۆرجکردنی لە سیستەمەکە دەسڕدرێتەوە.',
      isConfirm: true,
      confirmText: 'سڕینەوە',
      cancelText: 'پەشیمانبوونەوە',
      onConfirm: () => {
        const updated = deleteBattery(batteryId);
        setBatteries(updated);
        playSoundEffect('alert');
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
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `battery_maintenance_backup_${getTodayISODate()}.json`;
    a.click();
    URL.revokeObjectURL(url);
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
            playSoundEffect('success');
            showDialog({
              type: 'success',
              title: 'سەرکەوتوو بوو',
              message: 'دراوەکان بەسەرکەوتوویی هێنرانە ناو سیستەمەکەوە.',
              confirmText: 'دەستخۆش',
            });
          } else {
            playSoundEffect('alert');
            showDialog({
              type: 'danger',
              title: 'هەڵە لە هێنانی داتا',
              message: 'هەڵەیەک لە خوێندنەوەی پەڕگەی پشتیوان ڕوویدا.',
              details: 'تکایە دڵنیابەرەوە پەڕگەیەکی دروستی JSONـی داتای باترییەکان هەڵبژێردراوە.',
              confirmText: 'تێگەیشتم',
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
      case 'settings':
        return renderSettingsContent();
      default:
        return renderDashboardContent();
    }
  };

  const renderBatteriesContent = () => {
    const filteredBatteries = batteries.filter((b) => {
      const matchesTab = selectedCategoryTab === 'ALL' || getNormalizedCategory(b.category) === selectedCategoryTab;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery = !q || (
        b.name.toLowerCase().includes(q) ||
        (b.notes && b.notes.toLowerCase().includes(q)) ||
        (b.category && b.category.toLowerCase().includes(q))
      );
      return matchesTab && matchesQuery;
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

        {/* 5 Distinct Drone Category Sections */}
        {(() => {
          const activeCategories = DRONE_CATEGORIES.filter((cat) =>
            filteredBatteries.some((b) => getNormalizedCategory(b.category) === cat.id)
          );

          if (activeCategories.length === 0) {
            return (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 sm:p-10 text-center shadow-2xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  <BoltIcon className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900">
                  {searchQuery ? 'هیچ باترییەک لە گەڕانەکەتدا نەدۆزرایەوە' : 'هیچ باترییەک لەم بەشەدا شایستەی پێشاندان نییە'}
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  {searchQuery
                    ? 'تکایە دڵنیابەرەوە لە ڕاستیی ناوی باتری یان بەشەکە.'
                    : 'دەتوانیت باتری نوێ بۆ ئەم بەشە زیاد بکەیت.'}
                </p>
                <button
                  onClick={() => handleOpenAddModalForCategory(selectedCategoryTab !== 'ALL' ? selectedCategoryTab : undefined)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4 text-white" />
                  <span>زیادکردنی باتری نوێ</span>
                </button>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {activeCategories.map((cat) => {
                const categoryBatteries = filteredBatteries.filter(
                  (b) => getNormalizedCategory(b.category) === cat.id
                );

                return (
                  <div
                    key={cat.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
                  >
                    {/* Executive Minimal Section Header with Dedicated Category Add Button */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                          {cat.type === 'CAMERA' ? (
                            <VideoCameraIcon className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <SignalIcon className="w-5 h-5 text-emerald-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-slate-900">{cat.name}</h3>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${cat.badgeColor}`}>
                              {cat.typeLabel} • {cat.weight}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            تۆمارکراوەکان: <span className="text-slate-900 font-bold">{categoryBatteries.length}</span> باتری
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenAddModalForCategory(cat.id)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                        title={`زیادکردنی باتری نوێ بۆ ${cat.name}`}
                      >
                        <PlusIcon className="w-4 h-4 text-white" />
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
        {/* Minimal Print & Export Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <PrinterIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900">ڕاپۆرتی پیشەیی و چاپکردن (A4)</h4>
              <p className="text-xs text-slate-500 font-semibold">داگرتنی خشتەی Excel یان چاپکردنی ڕاپۆرتی فەرمی A4</p>
            </div>
          </div>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <PrinterIcon className="w-4 h-4 text-emerald-400" />
            <span>پیشاندانی ڕاپۆرت & چاپکردن / Excel</span>
          </button>
        </div>

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
        batteryCategory: getNormalizedCategory(battery.category),
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
      <div className="space-y-5 dir-rtl animate-in fade-in duration-200">
        {allChargeRecords.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 border border-slate-200/80 text-center shadow-2xs space-y-3">
            <div className="w-14 h-14 bg-indigo-50 border border-indigo-200/60 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
              <DocumentTextIcon className="w-7 h-7" />
            </div>
            <h3 className="text-base font-extrabold text-slate-900">هیچ مێژوویەکی ستۆرجکردن تۆمار نەکراوە</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              کاتێک باترییەکانت ستۆرج دەکەیت، سەرجەم تۆمارەکان بە وردی لێرە پیشان دەدرێن.
            </p>
          </div>
        ) : (
          <>
            {/* Minimal Executive KPI Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-500">کۆی پرۆسەکانی ستۆرج</div>
                  <div className="text-xl font-black text-slate-900 mt-1">{allChargeRecords.length} چالاکی</div>
                </div>
                <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center text-slate-700 shrink-0">
                  <ClockIcon className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-700">تێکڕای ستۆرجکردن</div>
                  <div className="text-xl font-black text-emerald-800 mt-1">
                    {Math.round(allChargeRecords.length / Math.max(1, batteries.length))} جار / باتری
                  </div>
                </div>
                <div className="w-10 h-10 bg-emerald-50 border border-emerald-200/60 rounded-xl flex items-center justify-center text-emerald-700 shrink-0">
                  <BoltIcon className="w-5 h-5" />
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-indigo-700">دوایین بەرواری ستۆرج</div>
                  <div className="text-sm font-black text-indigo-900 mt-1">
                    {allChargeRecords.length > 0 
                      ? formatGregorianKurdish(allChargeRecords[0].chargeDate).split(' - ')[0]
                      : 'هیچ'
                    }
                  </div>
                </div>
                <div className="w-10 h-10 bg-indigo-50 border border-indigo-200/60 rounded-xl flex items-center justify-center text-indigo-700 shrink-0">
                  <CalendarIcon className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs space-y-3">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="relative flex-1 w-full">
                  <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    placeholder="گەڕان لە مێژوودا (ناوی باتری، تێبینی، بەروار، بەش)..."
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200/90 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
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

                {/* History Category Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 w-full md:w-auto">
                  <button
                    onClick={() => setHistoryCategoryFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      historyCategoryFilter === 'ALL'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    هەموو ({allChargeRecords.length})
                  </button>
                  {DRONE_CATEGORIES.map((cat) => {
                    const catCount = allChargeRecords.filter(r => r.batteryCategory === cat.id).length;
                    const isSelected = historyCategoryFilter === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setHistoryCategoryFilter(isSelected ? 'ALL' : cat.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                        }`}
                      >
                        {cat.type === 'CAMERA' ? (
                          <VideoCameraIcon className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <SignalIcon className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>{cat.name}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-700'
                        }`}>
                          {catCount}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Clean Activity History List */}
            {filteredRecords.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-2xs text-center">
                <MagnifyingGlassIcon className="w-7 h-7 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-bold">هیچ چالاکییەک بەرامبەر ئەم فلتەرە نەدۆزرایەوە</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredRecords.map((record, index) => {
                  const catObj = DRONE_CATEGORIES.find(c => c.id === record.batteryCategory);
                  const badgeColor = catObj?.badgeColor || 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <div 
                      key={record.id || index}
                      className="bg-white rounded-2xl p-4 border border-slate-200/80 hover:border-slate-300 transition-all shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-9 h-9 bg-emerald-50 border border-emerald-200/80 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                          <BoltIcon className="w-4.5 h-4.5" />
                        </div>

                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-slate-900 text-sm truncate">{record.batteryName}</span>
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${badgeColor}`}>
                              {record.batteryCategory}
                            </span>
                            <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 rounded-md">
                              ستۆرجکراو
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold flex-wrap">
                            <span className="flex items-center gap-1">
                              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatGregorianKurdish(record.chargeDate)}</span>
                            </span>
                            {record.chargeTime && (
                              <span className="text-slate-400">• کاتژمێر {record.chargeTime}</span>
                            )}
                          </div>
                          {record.notes && (
                            <p className="text-xs text-slate-600 font-medium bg-slate-50 rounded-lg px-2.5 py-1 mt-1 border border-slate-100 inline-block">
                              تێبینی: {record.notes}
                            </p>
                          )}
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
    <div className="space-y-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300 dir-rtl max-w-3xl">

      {/* ─── 1. نوێکردنەوەی ئۆتۆماتیکی ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center shrink-0">
              <SparklesIcon className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 leading-tight">نوێکردنەوەی ئۆتۆماتیکی بەرنامە</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">پشکنینی خۆکار و وەرگرتنی وەشانی نوێ لە GitHub Releases</p>
            </div>
          </div>
          <button
            onClick={() => handleCheckForUpdates(false)}
            disabled={isCheckingUpdate}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all shrink-0 flex items-center gap-2 disabled:opacity-50"
          >
            {isCheckingUpdate ? (
              <><ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-emerald-400" /><span>پشکنین دەکرێت...</span></>
            ) : (
              <><ArrowDownTrayIcon className="w-3.5 h-3.5 text-emerald-400" /><span>پشکنین بۆ وەشانی نوێ</span></>
            )}
          </button>
        </div>

        {updateCheckError && (
          <div className="border-t border-rose-100 bg-rose-50 px-5 py-3 flex items-center gap-2 text-xs text-rose-700 font-semibold">
            <ExclamationCircleIcon className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{updateCheckError}</span>
          </div>
        )}
      </div>

      {/* ─── 2. دەنگی ئاگادارکردنەوە ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <SpeakerWaveIcon className="w-4.5 h-4.5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 leading-tight">دەنگی ئاگادارکردنەوە</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">لێدانی دەنگ لە کاتی ئەنجامدانی ستۆرج یان کردارەکان</p>
            </div>
          </div>
          <button
            onClick={handleToggleAudio}
            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
              settings.enableAudioAlerts ? 'bg-slate-900' : 'bg-slate-200'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200 ${
              settings.enableAudioAlerts ? 'right-5.5' : 'right-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* ─── 3. پشتیوانکردنی داتاکان ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            <ArrowDownTrayIcon className="w-4.5 h-4.5 text-slate-600" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-slate-900 leading-tight">پشتیوانکردنی داتاکان</h3>
            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">دەرهێنانی پشتیوان (Export) یان گەڕاندنەوەی (Import) پەڕگەی دراوەکان</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px bg-slate-100">
          <button
            onClick={handleExportData}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 px-4 py-3.5 text-xs font-bold text-slate-900 transition-colors"
          >
            <ArrowDownTrayIcon className="w-4 h-4 text-slate-600" />
            <span>دەرهێنانی داتا (Export JSON)</span>
          </button>
          <button
            onClick={handleImportData}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 px-4 py-3.5 text-xs font-bold text-slate-900 transition-colors"
          >
            <ArrowUpTrayIcon className="w-4 h-4 text-slate-600" />
            <span>هێنانی داتا (Import JSON)</span>
          </button>
        </div>
      </div>

      {/* ─── 4. سڕینەوەی سەرجەم داتاکان (Danger Zone) ─── */}
      <div className="bg-white rounded-2xl border border-rose-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center shrink-0 border border-rose-100">
              <TrashIcon className="w-4.5 h-4.5 text-rose-500" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 leading-tight">سڕینەوەی سەرجەم داتاکانی سیستەم</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium leading-relaxed">
                سڕینەوەی سەرجەم باترییەکان، مێژوو و داتاکانی ستۆرج بە شێوەیەکی یەکجاری
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsClearDataModalOpen(true)}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition-all shrink-0 flex items-center gap-2"
          >
            <TrashIcon className="w-3.5 h-3.5" />
            <span>سڕینەوەی داتاکان</span>
          </button>
        </div>
      </div>

      {/* ─── 5. لۆگی سڕینەوەکان ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              <ClockIcon className="w-4.5 h-4.5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-slate-900 leading-tight">لۆگی سڕینەوەی داتاکان</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-medium">تۆماری فەرمی سەرجەم پرۆسەکانی سڕینەوەی گشتی</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
              {deletionLogs.length}
            </span>
            {deletionLogs.length > 0 && (
              <button
                onClick={handleClearDeletionLogs}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold hover:bg-rose-50 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                <span>پاککردنەوە</span>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        {deletionLogs.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-xs text-slate-400 font-semibold">هیچ لۆگێکی سڕینەوە تۆمار نەکراوە</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {deletionLogs.map((log) => (
              <div key={log.id} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                      سڕینەوەی {log.batteryCountCleared} باتری
                    </span>
                    <span className="text-slate-400 font-medium">
                      لەگەڵ {log.historyCountCleared} تۆماری مێژوویی
                    </span>
                  </div>
                  <p className="text-slate-500 font-medium">
                    هۆکار: <span className="font-bold text-slate-700">{log.reason || 'سڕینەوەی دەستی'}</span>
                  </p>
                </div>
                <div className="shrink-0 text-right font-mono font-bold text-slate-500 text-[11px] bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                  {formatGregorianKurdish(log.timestamp.split('T')[0])}
                  <div className="text-[10px] text-slate-400 font-normal dir-ltr">
                    {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

  const renderDashboardContent = () => {
    if (batteries.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-100 to-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-lg shadow-emerald-500/10">
              <BoltIcon className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">سیستەمی پیشەیی بەڕێوەبردنی ستۆرج باتری</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">
              سیستەمێکی زیرەک بۆ بیرخستنەوەی ستورجکردنی باترییەکانت. یادەوەری لە ٣٥ ڕۆژەوە و ئاگادارکردنەوە دوای ٤٠ ڕۆژ.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all inline-flex items-center gap-3 hover:scale-105"
            >
              <PlusIcon className="w-6 h-6" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dir-rtl flex">
      
      {/* Sidebar - Desktop */}
      <div className="hidden lg:block">
        <Sidebar
          activeView={activeView}
          onViewChange={setActiveView}
          batteryCount={batteries.length}
          urgentCount={urgentBatteries.length}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onExportData={handleExportData}
          onImportData={handleImportData}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        sidebarCollapsed ? 'lg:mr-[72px]' : 'lg:mr-64'
      }`}>
        
        {/* Mobile Header */}
        <div className="lg:hidden bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              
              {/* Logo and Title */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
                  <BoltIcon className="w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    سیستەمی پیشەیی
                  </h1>
                  <p className="text-sm font-bold text-emerald-700">
                    بەڕێوەبردنی ستۆرج باتری
                  </p>
                </div>
              </div>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              >
                {mobileMenuOpen ? <XMarkIcon className="w-6 h-6" /> : <Bars3Icon className="w-6 h-6" />}
              </button>

            </div>
          </div>
        </div>

        {/* Desktop Header / Top Navigation Bar */}
        <div className="hidden lg:block bg-white/80 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-30 shadow-sm">
          {activeView === 'batteries' ? (
            /* Batteries View: Professional two-row header */
            <div className="px-6 pt-3 pb-2.5 space-y-2">
              {/* Row 1: Title + Search */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100/80 rounded-xl flex items-center justify-center shrink-0">
                    <BoltIcon className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">باترییەکان</h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      بەڕێوەبردنی {batteries.length} باتری تۆمارکراو
                    </p>
                  </div>
                </div>

                <div className="relative w-64">
                  <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="گەڕان بەدوای باتری..."
                    className="w-full pl-8 pr-9 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
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
              </div>

              {/* Row 2: Category Tabs — minimal formal underline style */}
              <div className="flex items-center gap-0 border-b border-slate-100 overflow-x-auto scrollbar-none -mb-px">
                {/* "All" tab */}
                <button
                  onClick={() => setSelectedCategoryTab('ALL')}
                  className={`
                    relative flex items-center gap-1.5 px-4 py-2.5 text-[11.5px] font-semibold
                    shrink-0 transition-all duration-150 border-b-2 -mb-px
                    ${selectedCategoryTab === 'ALL'
                      ? 'border-slate-900 text-slate-900 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'}
                  `}
                >
                  <span>هەموو بەشەکان</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-colors ${
                    selectedCategoryTab === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {batteries.length}
                  </span>
                </button>

                {/* Divider */}
                <div className="w-px h-4 bg-slate-200 mx-1 shrink-0" />

                {DRONE_CATEGORIES.map((cat) => {
                  const catCount = batteries.filter(b => getNormalizedCategory(b.category) === cat.id).length;
                  const isSelected = selectedCategoryTab === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategoryTab(isSelected ? 'ALL' : cat.id)}
                      className={`
                        relative flex items-center gap-1.5 px-3.5 py-2.5 text-[11.5px] font-semibold
                        shrink-0 transition-all duration-150 border-b-2 -mb-px
                        ${isSelected
                          ? 'border-slate-900 text-slate-900 font-bold'
                          : 'border-transparent text-slate-400 hover:text-slate-700 hover:border-slate-300'}
                      `}
                    >
                      {cat.type === 'CAMERA' ? (
                        <VideoCameraIcon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isSelected ? 'text-slate-700' : 'text-slate-400'}`} />
                      ) : (
                        <SignalIcon className={`w-3.5 h-3.5 shrink-0 transition-colors ${isSelected ? 'text-slate-700' : 'text-slate-400'}`} />
                      )}
                      <span>{cat.name}</span>
                      {catCount > 0 && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md transition-colors ${
                          isSelected
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {catCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Other views: standard single-row header */
            <div className="px-6 py-3.5">
              <div className="flex items-center justify-between gap-4">
                {/* Current View Title & Icon */}
                <div className="flex items-center gap-3">
                  {activeView === 'dashboard' && (
                    <div className="w-10 h-10 bg-emerald-100/80 rounded-xl flex items-center justify-center shrink-0">
                      <BoltIcon className="w-5 h-5 text-emerald-700" />
                    </div>
                  )}
                  {activeView === 'analytics' && (
                    <div className="w-10 h-10 bg-purple-100/80 rounded-xl flex items-center justify-center shrink-0">
                      <ChartBarIcon className="w-5 h-5 text-purple-700" />
                    </div>
                  )}
                  {activeView === 'notifications' && (
                    <div className="w-10 h-10 bg-amber-100/80 rounded-xl flex items-center justify-center shrink-0">
                      <BellIcon className="w-5 h-5 text-amber-700" />
                    </div>
                  )}
                  {activeView === 'history' && (
                    <div className="w-10 h-10 bg-indigo-100/80 rounded-xl flex items-center justify-center shrink-0">
                      <ClockIcon className="w-5 h-5 text-indigo-700" />
                    </div>
                  )}
                  {activeView === 'settings' && (
                    <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                      <AdjustmentsHorizontalIcon className="w-5 h-5 text-slate-600" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">
                      {activeView === 'dashboard' && 'داشبۆرد'}
                      {activeView === 'analytics' && 'ڕاپۆرتی پیشەیی'}
                      {activeView === 'notifications' && 'ئاگادارکردنەوەکان'}
                      {activeView === 'history' && 'مێژووی چالاکییەکان'}
                      {activeView === 'settings' && 'ڕێکخستنەکان'}
                    </h1>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {activeView === 'dashboard' && 'پێشاندانی گشتی و پوختەی باترییەکان'}
                      {activeView === 'analytics' && 'شیکاری تەندروستی و کارایی باترییەکانت'}
                      {activeView === 'notifications' && 'یادەوەری و هۆشدارییەکانی ستۆرجکردن'}
                      {activeView === 'history' && 'تۆماری تەواوی چالاکییەکانی ستۆرجکردن'}
                      {activeView === 'settings' && 'ڕێکخستنی سیستەم و بژاردەکان'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>


        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
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
                onExportData={handleExportData}
                onImportData={handleImportData}
                onOpenSimulator={() => {
                  setIsSimulatorOpen(true);
                  setMobileMenuOpen(false);
                }}
                isCollapsed={false}
                onToggleCollapse={() => {}}
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
        <main className="flex-1 px-6 py-8 pb-24 lg:pb-8">
          {renderContent()}
        </main>

      </div>

      {/* Bottom Navigation - Mobile & Desktop Quick Actions */}
      <BottomNavBar
        activeView={activeView}
        onViewChange={setActiveView}
        urgentCount={urgentBatteries.length}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Modals */}
      <AddBatteryModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultCategory={addModalDefaultCategory}
        onAddBattery={handleAddBattery}
      />

      <EditBatteryModal
        battery={activeBatteryForEdit}
        isOpen={!!activeBatteryForEdit}
        onClose={() => setActiveBatteryForEdit(null)}
        onUpdateBattery={handleUpdateBattery}
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
      />

      <ModernDialog
        dialog={dialogState}
        onClose={closeDialog}
      />

    </div>
  );
}



