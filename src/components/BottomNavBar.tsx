/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

'use client';

import React, { useState } from 'react';
import {
  HomeIcon,
  BoltIcon,
  ClockIcon,
  PlusIcon,
  Cog6ToothIcon,
  EllipsisHorizontalIcon,
  DocumentTextIcon,
  UserGroupIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { User } from '../types';

interface BottomNavBarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  urgentCount: number;
  onOpenAddModal: () => void;
  currentUser?: User | null;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeView,
  onViewChange,
  urgentCount,
  onOpenAddModal,
  currentUser,
}) => {
  const [showMore, setShowMore] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN';

  const mainItems = [
    { id: 'dashboard', label: 'داشبۆرد', icon: HomeIcon },
    { id: 'batteries', label: 'باترییەکان', icon: BoltIcon },
    { id: '__add__', label: 'زیادکردن', icon: PlusIcon, isAction: true },
    { id: 'history', label: 'مێژوو', icon: ClockIcon },
    { id: 'settings', label: 'ڕێکخستن', icon: Cog6ToothIcon },
  ];

  const moreItems = [
    { id: 'changelog', label: 'مێژووی گۆڕانکاری', icon: DocumentTextIcon },
    ...(isAdmin ? [{ id: 'users', label: 'بەکارهێنەران', icon: UserGroupIcon }] : []),
    { id: 'analytics', label: 'ڕاپۆرتەکان', icon: DocumentTextIcon },
  ];

  const isMoreActive = moreItems.some((i) => i.id === activeView);

  return (
    <>
      {/* More Drawer */}
      {showMore && (
        <div
          className="fixed inset-0 z-[55] lg:hidden"
          onClick={() => setShowMore(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="absolute bottom-[64px] left-0 right-0 mx-4 rounded-3xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: '1px solid var(--bg-border)' }}
            >
              <span className="text-xs font-black" style={{ color: 'var(--text-primary)' }}>
                بەشەکانی دیکە
              </span>
              <button
                onClick={() => setShowMore(false)}
                className="p-1.5 rounded-xl transition-colors cursor-pointer"
                style={{ background: 'var(--bg-surface2)' }}
              >
                <XMarkIcon className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* More Items Grid */}
            <div className="grid grid-cols-3 gap-2 p-4">
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onViewChange(item.id);
                      setShowMore(false);
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all cursor-pointer"
                    style={{
                      background: isActive ? 'rgba(5,150,105,0.12)' : 'var(--bg-surface2)',
                      border: isActive ? '1px solid rgba(5,150,105,0.3)' : '1px solid transparent',
                    }}
                  >
                    <Icon
                      className="w-6 h-6"
                      style={{ color: isActive ? '#059669' : 'var(--text-secondary)' }}
                    />
                    <span
                      className="text-[11px] font-bold text-center leading-tight"
                      style={{ color: isActive ? '#059669' : 'var(--text-secondary)' }}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        style={{
          background: 'var(--header-bg)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTop: '1px solid var(--bg-border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-center justify-around px-2 pt-2 pb-1">
          {mainItems.map((item) => {
            const Icon = item.icon;

            if (item.isAction) {
              return (
                <button
                  key={item.id}
                  onClick={onOpenAddModal}
                  className="flex flex-col items-center gap-1 p-2 cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                    {item.label}
                  </span>
                </button>
              );
            }

            const isActive = activeView === item.id;
            const hasBadge = item.id === 'batteries' && urgentCount > 0;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onViewChange(item.id);
                  setShowMore(false);
                }}
                className="flex flex-col items-center gap-1 p-2 min-w-[52px] cursor-pointer rounded-2xl transition-all relative"
                style={{
                  background: isActive ? 'rgba(5,150,105,0.10)' : 'transparent',
                }}
              >
                <div className="relative">
                  <Icon
                    className="w-6 h-6 transition-colors"
                    style={{ color: isActive ? '#059669' : 'var(--text-muted)' }}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {hasBadge && (
                    <span className="absolute -top-1 -right-2 bg-rose-500 text-white font-mono text-[9.5px] font-black min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center shadow-xs border-2 border-white dark:border-slate-900 animate-pulse">
                      {urgentCount > 99 ? '99+' : urgentCount}
                    </span>
                  )}
                </div>
                <span
                  className="text-[10px] font-bold transition-colors"
                  style={{ color: isActive ? '#059669' : 'var(--text-muted)' }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* More Button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex flex-col items-center gap-1 p-2 min-w-[52px] cursor-pointer rounded-2xl transition-all"
            style={{
              background: (showMore || isMoreActive) ? 'rgba(5,150,105,0.10)' : 'transparent',
            }}
          >
            <EllipsisHorizontalIcon
              className="w-6 h-6 transition-colors"
              style={{ color: (showMore || isMoreActive) ? '#059669' : 'var(--text-muted)' }}
              strokeWidth={(showMore || isMoreActive) ? 2.2 : 1.8}
            />
            <span
              className="text-[10px] font-bold transition-colors"
              style={{ color: (showMore || isMoreActive) ? '#059669' : 'var(--text-muted)' }}
            >
              زیاتر
            </span>
          </button>
        </div>
      </div>

      {/* Bottom spacer to prevent content being hidden behind BottomNavBar */}
      <div
        className="lg:hidden"
        style={{ height: `calc(64px + env(safe-area-inset-bottom))` }}
      />
    </>
  );
};