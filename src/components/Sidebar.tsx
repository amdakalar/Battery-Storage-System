/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { APP_CONFIG } from '../constants/appConfig';
import { User } from '../types';
import {
  HomeIcon,
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ArrowRightOnRectangleIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
  KeyIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  batteryCount: number;
  urgentCount: number;
  onOpenAddModal: () => void;
  onExportData: () => void;
  onImportData: () => void;
  onOpenSimulator: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hasUpdate?: boolean;
  latestVersion?: string;
  onOpenUpdateModal?: () => void;
  currentUser?: User | null;
  onOpenAdminModal?: () => void;
  onOpenChangelog?: () => void;
  onOpenChangePassword?: () => void;
  pendingUsersCount?: number;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  batteryCount,
  isCollapsed,
  onToggleCollapse,
  hasUpdate,
  latestVersion,
  onOpenUpdateModal,
  currentUser,
  onOpenChangePassword,
  pendingUsersCount,
  onLogout,
}) => {
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'داشبۆرد',
      icon: HomeIcon,
    },
    {
      id: 'batteries',
      label: 'باترییەکان',
      icon: BoltIcon,
      hasBadge: true,
    },
    {
      id: 'analytics',
      label: 'ڕاپۆرتی پیشەیی',
      icon: ChartBarIcon,
    },
    {
      id: 'history',
      label: 'مێژووی بارگاویکردن',
      icon: ClockIcon,
    },
    {
      id: 'changelog',
      label: 'مێژووی گۆڕانکارییەکان',
      icon: DocumentTextIcon,
    },
    ...(currentUser?.role === 'ADMIN'
      ? [
          {
            id: 'users',
            label: 'بەڕێوەبردنی بەکارهێنەران',
            icon: UserGroupIcon,
            badge: pendingUsersCount,
          },
        ]
      : []),
    {
      id: 'settings',
      label: 'ڕێکخستنەکان',
      icon: Cog6ToothIcon,
    },
  ];

  return (
    <div
      className={`fixed right-0 top-0 h-full z-40 flex flex-col transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-[72px]' : 'w-64'}
      `}
      style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #0c1424 100%)',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        boxShadow: '-4px 0 32px 0 rgba(0,0,0,0.28)',
      }}
    >
      {/* ───── Header ───── */}
      <div
        className={`flex items-center shrink-0 transition-all duration-300
          ${isCollapsed ? 'flex-col gap-3 px-0 py-4' : 'justify-between px-4 py-5'}
        `}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className={`flex items-center gap-2.5 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
          <div
            className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center p-1 overflow-hidden"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.2)',
            }}
          >
            <img
              src="./drone_battery_app_icon.svg"
              alt="App Icon"
              className="w-full h-full object-contain"
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-[13px] font-bold text-slate-100 tracking-tight leading-tight truncate">
                سیستەمی پیشەیی
              </h1>
              <p className="text-[10px] font-medium text-emerald-400/90 leading-tight">
                بەڕێوەبردنی ستۆرج
              </p>
            </div>
          )}
        </div>

        <button
          onClick={onToggleCollapse}
          title={isCollapsed ? 'کردنەوەی مێنۆ' : 'داخستنی مێنۆ'}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors cursor-pointer"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ───── Navigation Items ───── */}
      <nav className="flex-1 px-2.5 py-4 overflow-y-auto overflow-x-hidden">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            const badge = (item as any).badge ?? (item.hasBadge ? batteryCount : undefined);

            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center rounded-xl transition-all duration-200 cursor-pointer group relative ${
                    isCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 gap-3'
                  }`}
                  style={{
                    background: isActive ? 'rgba(52, 211, 153, 0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(52, 211, 153, 0.25)' : '1px solid transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div
                    className={`w-6 h-6 shrink-0 flex items-center justify-center transition-colors duration-200 ${
                      isActive ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {!isCollapsed && (
                    <>
                      <span
                        className="flex-1 text-[12.5px] transition-colors duration-200 text-right leading-tight"
                        style={{
                          color: isActive ? '#f1f5f9' : '#94a3b8',
                          fontWeight: isActive ? 700 : 500,
                        }}
                      >
                        {item.label}
                      </span>

                      {badge !== undefined && badge > 0 && (
                        <span
                          className="px-2 py-0.5 rounded-full text-[10.5px] font-bold font-mono shrink-0 transition-colors duration-200"
                          style={{
                            background: isActive ? 'rgba(52,211,153,0.18)' : 'rgba(255,255,255,0.06)',
                            color: isActive ? '#34d399' : '#94a3b8',
                            border: isActive ? '1px solid rgba(52,211,153,0.28)' : '1px solid rgba(255,255,255,0.08)',
                          }}
                        >
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ───── User Profile & Logout Strip ───── */}
      {currentUser && (
        <div className={`shrink-0 ${isCollapsed ? 'px-2 pb-2' : 'px-3 pb-2'}`}>
          <div
            className={`p-2 rounded-2xl flex items-center justify-between gap-2 transition-all ${
              isCollapsed ? 'justify-center' : ''
            }`}
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
            }}
          >
            <div className={`flex items-center gap-2 min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
              <div
                className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center font-black text-xs ${
                  currentUser.role === 'ADMIN'
                    ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {currentUser.fullName.charAt(0)}
              </div>
              {!isCollapsed && (
                <div className="min-w-0 text-right">
                  <p className="text-[11.5px] font-bold text-slate-200 truncate">{currentUser.fullName}</p>
                  <p className="text-[9.5px] text-slate-400 font-mono" dir="ltr">@{currentUser.username}</p>
                </div>
              )}
            </div>

            {!isCollapsed && (
              <div className="flex items-center gap-1 shrink-0">
                {onOpenChangePassword && (
                  <button
                    onClick={onOpenChangePassword}
                    title="گۆڕینی وشەی نهێنی"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
                  >
                    <KeyIcon className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={onLogout}
                  title="چوونەدەرەوە"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───── Bottom Update Notification ───── */}
      {hasUpdate && (
        <div className={`shrink-0 ${isCollapsed ? 'px-2 pb-2' : 'px-3 pb-2'}`}>
          {!isCollapsed ? (
            <button
              onClick={onOpenUpdateModal}
              className="w-full p-2.5 rounded-xl text-right flex items-center justify-between gap-2.5 transition-all group cursor-pointer"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(52, 211, 153, 0.22)',
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <div className="text-right min-w-0">
                  <p className="text-[11px] font-bold text-slate-200 group-hover:text-emerald-300 transition-colors truncate">
                    وەشانی نوێ بەردەستە
                  </p>
                  <p className="text-[9.5px] text-slate-400 font-mono">v{latestVersion || 'New'}</p>
                </div>
              </div>
              <span
                className="text-[10px] text-emerald-300 font-bold px-2 py-0.5 rounded-md shrink-0 transition-colors"
                style={{
                  background: 'rgba(52, 211, 153, 0.12)',
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                }}
              >
                ئاپدەیت
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenUpdateModal}
              title={`وەشانی نوێ بەردەستە (v${latestVersion || ''})`}
              className="w-full flex items-center justify-center p-2.5 rounded-xl transition-all cursor-pointer group"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(52, 211, 153, 0.25)',
              }}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </button>
          )}
        </div>
      )}

      {/* ───── Bottom version strip ───── */}
      {!isCollapsed ? (
        <div
          onClick={hasUpdate ? onOpenUpdateModal : undefined}
          className={`px-4 py-2.5 shrink-0 flex items-center justify-between ${hasUpdate ? 'cursor-pointer hover:bg-slate-800/40 transition-colors' : ''}`}
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          title={hasUpdate ? `وەشانی نوێ بەردەستە (v${latestVersion}) — کرتە بکە بۆ نوێکردنەوە` : `وەشانی ئێستا: v${APP_CONFIG.CURRENT_VERSION}`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
              v{APP_CONFIG.CURRENT_VERSION}
            </span>
            <p className="text-[10px] font-mono tracking-tight truncate" style={{ color: '#94a3b8' }}>
              Battery Storage
            </p>
          </div>
          <span className={`w-2 h-2 rounded-full ${hasUpdate ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500/60'}`} />
        </div>
      ) : (
        <div
          onClick={hasUpdate ? onOpenUpdateModal : undefined}
          className={`py-2 shrink-0 flex items-center justify-center ${hasUpdate ? 'cursor-pointer hover:bg-slate-800/40' : ''}`}
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          title={`وەشانی سیستەم: v${APP_CONFIG.CURRENT_VERSION}`}
        >
          <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-1 py-0.5 rounded border border-emerald-800/50">
            {APP_CONFIG.CURRENT_VERSION}
          </span>
        </div>
      )}
    </div>
  );
};