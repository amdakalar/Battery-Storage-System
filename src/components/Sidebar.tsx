/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  HomeIcon,
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  Cog6ToothIcon,
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
      </nav>

      {/* ───── Bottom version strip ───── */}
      {!isCollapsed && (
        <div
          className="px-4 py-3 shrink-0 flex items-center justify-between"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-[10px] font-mono tracking-tight" style={{ color: '#94a3b8' }}>
            v1.0.0 — Battery Storage System
          </p>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80 shadow-xs shadow-emerald-400/50" />
        </div>
      )}
    </div>
  );
};