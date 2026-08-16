/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  HomeIcon,
  BoltIcon,
  ClockIcon,
  PlusIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface BottomNavBarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  urgentCount: number;
  onQuickCharge?: () => void;
  onOpenAddModal: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeView,
  onViewChange,
  onOpenAddModal,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'داشبۆرد',
      icon: HomeIcon,
      color: 'text-emerald-600',
      activeColor: 'text-emerald-700'
    },
    {
      id: 'batteries',
      label: 'باترییەکان',
      icon: BoltIcon,
      color: 'text-blue-600',
      activeColor: 'text-blue-700'
    },
    {
      id: 'add',
      label: 'زیادکردن',
      icon: PlusIcon,
      color: 'text-white',
      activeColor: 'text-white',
      isAction: true,
      action: onOpenAddModal
    },
    {
      id: 'history',
      label: 'مێژوو',
      icon: ClockIcon,
      color: 'text-amber-600',
      activeColor: 'text-amber-700'
    },
    {
      id: 'settings',
      label: 'ڕێکخستن',
      icon: Cog6ToothIcon,
      color: 'text-slate-600',
      activeColor: 'text-slate-700'
    }
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-slate-200 z-50 md:hidden">
        <div className="flex items-center justify-around p-2 pb-safe">
          {navItems.map((item) => {
            const isActive = activeView === item.id;
            const handleClick = item.isAction ? item.action : () => onViewChange(item.id);
            
            return (
              <button
                key={item.id}
                onClick={handleClick}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all min-w-0 flex-1 max-w-16 relative ${
                  item.isAction
                    ? 'bg-gradient-to-tr from-emerald-600 to-emerald-500 shadow-lg hover:shadow-xl transform hover:scale-105'
                    : isActive
                    ? 'bg-slate-100 scale-105'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="relative">
                  <item.icon
                    className={`w-6 h-6 ${
                      item.isAction
                        ? item.color
                        : isActive
                        ? item.activeColor
                        : item.color
                    }`}
                  />
                </div>
                
                <span
                  className={`text-xs font-semibold truncate ${
                    item.isAction
                      ? item.color
                      : isActive
                      ? item.activeColor
                      : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Safe area for mobile navigation */}
      <div className="h-20 md:hidden"></div>
    </>
  );
};