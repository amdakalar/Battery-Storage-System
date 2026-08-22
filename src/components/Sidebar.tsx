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
  pendingUsersCount?: number;
  onLogout?: () => void;
}

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
    label: 'مێژووی چالاکییەکان',
    icon: ClockIcon,
  },
  {
    id: 'settings',
    label: 'ڕێکخستنەکان',
    icon: Cog6ToothIcon,
  },
];

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
  onOpenAdminModal,
  pendingUsersCount,
  onLogout,
}) => {
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
          ${isCollapsed ? 'justify-center px-0 py-5' : 'justify-between px-4 py-5'}
        `}
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl shrink-0 flex items-center justify-center"
              style={{
                background: 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.2)',
              }}
            >
              <img
                src="./drone_battery_app_icon.svg"
                alt="App Logo"
                className="w-5 h-5 object-cover"
              />
            </div>
            <div className="text-right min-w-0">
              <h2
                className="text-[13px] font-extrabold leading-snug tracking-tight"
                style={{ color: '#f1f5f9' }}
              >
                سیستەمی بەڕێوەبردنی ستۆرج
              </h2>
            </div>
          </div>
        )}

        {/* Hamburger / Logo toggle */}
        <button
          onClick={onToggleCollapse}
          className={`shrink-0 rounded-xl transition-all duration-200 ${isCollapsed ? 'p-2.5' : 'p-1.5'}`}
          style={{ color: '#94a3b8' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          title={isCollapsed ? 'کردنەوەی سایدبار' : 'کۆکردنەوەی سایدبار'}
        >
          {isCollapsed ? (
            <div
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{
                background: 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.2)',
              }}
            >
              <img src="./drone_battery_app_icon.svg" alt="App Logo" className="w-4 h-4 object-cover" />
            </div>
          ) : (
            <div className="w-[18px] h-[14px] flex flex-col justify-between">
              <span className="block w-full h-[2px] rounded-full" style={{ background: '#64748b' }} />
              <span className="block w-3/4 h-[2px] rounded-full self-end" style={{ background: '#475569' }} />
              <span className="block w-full h-[2px] rounded-full" style={{ background: '#64748b' }} />
            </div>
          )}
        </button>
      </div>

      {/* ───── Navigation ───── */}
      <nav className={`flex-1 overflow-y-auto overflow-x-hidden py-3.5 ${isCollapsed ? 'px-2' : 'px-3'}`}>
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = activeView === item.id;
            const badge = item.hasBadge ? batteryCount : undefined;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  title={isCollapsed ? item.label : ''}
                  className={`
                    w-full flex items-center gap-3 rounded-xl
                    transition-all duration-200 ease-in-out
                    ${isCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 text-right'}
                  `}
                  style={{
                    background: isActive
                      ? 'rgba(52,211,153,0.1)'
                      : 'transparent',
                    border: isActive
                      ? '1px solid rgba(52,211,153,0.16)'
                      : '1px solid transparent',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {/* Icon */}
                  <div className="relative shrink-0">
                    <item.icon
                      className="w-[19px] h-[19px] transition-colors duration-200"
                      style={{ color: isActive ? '#34d399' : '#94a3b8' }}
                    />
                    {isCollapsed && badge !== undefined && badge > 0 && (
                      <span
                        className="absolute -top-1.5 -left-1.5 min-w-[16px] h-4 px-0.5 rounded-full
                          flex items-center justify-center text-[9px] font-bold leading-none"
                        style={{
                          background: isActive ? 'rgba(52,211,153,0.25)' : '#1e293b',
                          color: isActive ? '#6ee7b7' : '#94a3b8',
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </div>

                  {/* Label & Badge */}
                  {!isCollapsed && (
                    <>
                      <span
                        className="flex-1 text-[13px] leading-none transition-colors duration-200"
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

        {/* ───── Admin Management Button ───── */}
        {currentUser?.role === 'ADMIN' && (
          <div className="mt-4 pt-3 border-t border-white/5">
            <button
              onClick={onOpenAdminModal}
              title={isCollapsed ? 'بەڕێوەبردنی بەکارهێنەران' : undefined}
              className={`w-full flex items-center rounded-xl transition-all duration-200 cursor-pointer group ${
                isCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5 gap-3'
              }`}
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <div className="w-6 h-6 shrink-0 flex items-center justify-center text-indigo-400 group-hover:text-indigo-300">
                <UserGroupIcon className="w-5 h-5" />
              </div>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-[12.5px] font-bold text-slate-200 group-hover:text-indigo-200 text-right">
                    بەڕێوەبردنی بەکارهێنەران
                  </span>
                  {pendingUsersCount !== undefined && pendingUsersCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 shrink-0 animate-pulse">
                      {pendingUsersCount} نوێ
                    </span>
                  )}
                </>
              )}
            </button>
          </div>
        )}
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
              <button
                onClick={onLogout}
                title="چوونەدەرەوە"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
              >
                <ArrowRightOnRectangleIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ───── Bottom Update Notification (Minimal & Integrated) ───── */}
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
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(52, 211, 153, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.35)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.22)';
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
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52, 211, 153, 0.1)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
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
      {!isCollapsed && (
        <div
          onClick={hasUpdate ? onOpenUpdateModal : undefined}
          className={`px-4 py-2.5 shrink-0 flex items-center justify-between ${hasUpdate ? 'cursor-pointer hover:bg-slate-800/40 transition-colors' : ''}`}
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
          title={hasUpdate ? 'کرتە بکە بۆ نوێکردنەوەی بەرنامە' : `وەشانی ئێستا: v${APP_CONFIG.CURRENT_VERSION}`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-[10px] font-mono tracking-tight" style={{ color: '#64748b' }}>
              v{APP_CONFIG.CURRENT_VERSION} — Battery Storage System
            </p>
          </div>
          <span className={`w-1.5 h-1.5 rounded-full ${hasUpdate ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
        </div>
      )}
    </div>
  );
};