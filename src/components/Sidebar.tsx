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

export const Sidebar: React.FC<SidebarProps> = ({
  activeView,
  onViewChange,
  batteryCount,
  isCollapsed,
  onToggleCollapse,
}) => {
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'داشبۆرد',
      icon: HomeIcon,
      description: 'پێشاندانی گشتی'
    },
    {
      id: 'batteries',
      label: 'باترییەکان',
      icon: BoltIcon,
      description: 'بەڕێوەبردنی باترییەکان',
      badge: batteryCount
    },
    {
      id: 'analytics',
      label: 'ڕاپۆرتی پیشەیی',
      icon: ChartBarIcon,
      description: 'شیکاری ستاندارد'
    },
    {
      id: 'history',
      label: 'مێژووی چالاکییەکان',
      icon: ClockIcon,
      description: 'تۆماری چالاکییەکان'
    },
    {
      id: 'settings',
      label: 'ڕێکخستنەکان',
      icon: Cog6ToothIcon,
      description: 'ڕێکخستنی سیستەم'
    }
  ];

  return (
    <div className={`fixed right-0 top-0 h-full bg-white border-l border-slate-200/80 shadow-xl z-40 transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-80'
    }`}>
      
      {/* Sidebar Header */}
      <div className="p-5 border-b border-slate-100 bg-white">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <img 
                src="./drone_battery_app_icon.svg" 
                alt="Storage Battery Icon" 
                className="w-10 h-10 rounded-2xl shadow-xs border border-slate-200 shrink-0 object-cover" 
              />
              <div>
                <h2 className="text-sm font-bold text-slate-900 leading-tight">
                  سیستەمی بەڕێوەبردنی ستۆرج
                </h2>
                <p className="text-[11px] font-semibold text-slate-500">
                  باترییەکانی درۆن
                </p>
              </div>
            </div>
          )}
          
          <button
            onClick={onToggleCollapse}
            className={`p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 transition-all ${
              isCollapsed ? 'mx-auto' : ''
            }`}
            title={isCollapsed ? 'کردنەوەی سایدبار' : 'کۆکردنەوەی سایدبار'}
          >
            {isCollapsed ? (
              <img src="./drone_battery_app_icon.svg" alt="App Logo" className="w-5 h-5 rounded-md shrink-0 object-cover" />
            ) : (
              <div className="w-4 h-4 flex flex-col justify-between py-0.5">
                <div className="w-full h-0.5 bg-slate-600 rounded"></div>
                <div className="w-full h-0.5 bg-slate-600 rounded"></div>
                <div className="w-full h-0.5 bg-slate-600 rounded"></div>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Items (Minimal Executive Theme) */}
      <div className="p-3 space-y-1.5 overflow-y-auto">
          {!isCollapsed && (
            <div className="text-[10px] font-bold text-slate-400 px-3 py-2 uppercase tracking-wider">
              بەشە سەرەکییەکان
            </div>
          )}
          
          {navigationItems.map((item) => {
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group relative ${
                  isActive
                    ? 'bg-slate-900 text-white font-bold shadow-xs'
                    : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900 font-medium'
                } ${isCollapsed ? 'justify-center' : ''}`}
                title={isCollapsed ? item.label : ''}
              >
                <div className={`relative ${isCollapsed ? '' : 'shrink-0'}`}>
                  <item.icon className={`w-5 h-5 ${
                    isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-800'
                  }`} />
                  
                  {item.badge !== undefined && item.badge > 0 && (
                    <div className={`absolute -top-1.5 -left-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </div>
                  )}
                </div>
                
                {!isCollapsed && (
                  <div className="flex-1 text-right">
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className={`text-[10px] ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                      {item.description}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

    </div>
  );
};