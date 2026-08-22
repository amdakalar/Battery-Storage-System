'use client';

import React, { useState, useEffect } from 'react';
import { ActivityLog } from '../types';
import { getActivityLogsAction } from '../actions/batteryActions';
import {
  XMarkIcon,
  ClockIcon,
  PlusCircleIcon,
  BoltIcon,
  PencilSquareIcon,
  TrashIcon,
  UserGroupIcon,
  ArrowPathIcon,
  SparklesIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangelogModal({ isOpen, onClose }: ChangelogModalProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getActivityLogsAction(100);
      if (res.success && res.logs) {
        setLogs(res.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getActionBadge = (action: ActivityLog['action']) => {
    switch (action) {
      case 'BATTERY_ADD':
        return {
          icon: PlusCircleIcon,
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          dot: 'bg-emerald-500',
        };
      case 'BATTERY_CHARGE':
        return {
          icon: BoltIcon,
          bg: 'bg-teal-500/10 text-teal-300 border-teal-500/30',
          dot: 'bg-teal-400',
        };
      case 'BATTERY_UPDATE':
        return {
          icon: PencilSquareIcon,
          bg: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
          dot: 'bg-indigo-400',
        };
      case 'BATTERY_DELETE':
        return {
          icon: TrashIcon,
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
          dot: 'bg-rose-500',
        };
      case 'USER_REGISTER':
      case 'USER_APPROVE':
      case 'USER_ROLE_CHANGE':
      case 'USER_BLOCK':
        return {
          icon: UserGroupIcon,
          bg: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
          dot: 'bg-purple-400',
        };
      default:
        return {
          icon: ShieldCheckIcon,
          bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30',
          dot: 'bg-slate-400',
        };
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.actionTitle && log.actionTitle.toLowerCase().includes(search.toLowerCase())) ||
      (log.performedBy && log.performedBy.toLowerCase().includes(search.toLowerCase())) ||
      (log.targetName && log.targetName.toLowerCase().includes(search.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase()));

    const matchesFilter =
      filterAction === 'ALL' ||
      (filterAction === 'BATTERY' &&
        ['BATTERY_ADD', 'BATTERY_UPDATE', 'BATTERY_CHARGE', 'BATTERY_DELETE'].includes(log.action)) ||
      (filterAction === 'USERS' &&
        ['USER_REGISTER', 'USER_APPROVE', 'USER_ROLE_CHANGE', 'USER_BLOCK'].includes(log.action));

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-sans" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <ClockIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                مێژووی زیندووی گۆڕانکارییەکان (Activity Changelog)
              </h2>
              <p className="text-xs text-slate-400">تەواوی کردارە ئەنجامدراوەکانی سیستەم لەگەڵ ناوی ئەنجامدەر</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Filter and Search */}
        <div className="p-6 pb-3 flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-slate-800/60">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="گەڕان لە گۆڕانکارییەکان..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 pr-10"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex gap-1.5 w-full sm:w-auto bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setFilterAction('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterAction === 'ALL' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              هەموو کردارەکان ({logs.length})
            </button>
            <button
              onClick={() => setFilterAction('BATTERY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterAction === 'BATTERY' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              کردارەکانی باتری
            </button>
            <button
              onClick={() => setFilterAction('USERS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                filterAction === 'USERS' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              بەکارهێنەران
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">بارکردنی مێژووی چالاکییەکان...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              هیچ چالاکییەک تۆمار نەکراوە
            </div>
          ) : (
            filteredLogs.map((log) => {
              const badge = getActionBadge(log.action);
              const Icon = badge.icon;
              const dateStr = new Date(log.timestamp).toLocaleString('ku-IQ', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={log.id}
                  className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
                >
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${badge.bg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-white">{log.actionTitle}</span>
                        {log.targetName && (
                          <span className="text-[11px] font-bold bg-slate-800 text-slate-200 px-2 py-0.5 rounded-md border border-slate-700">
                            {log.targetName}
                          </span>
                        )}
                      </div>
                      {log.details && (
                        <p className="text-[11.5px] text-slate-400 mt-1 leading-relaxed">{log.details}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-300 font-bold text-[11px]">
                      <span className="text-slate-500 font-normal">ئەنجامدەر:</span>
                      <span className="text-teal-400">{log.performedBy}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5" dir="ltr">
                      {dateStr}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>پیشاندانی {filteredLogs.length} لە کۆی {logs.length} چالاکی</span>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 text-teal-400 hover:text-teal-300 font-bold cursor-pointer"
          >
            <ArrowPathIcon className="w-4 h-4" />
            نوێکردنەوەی مێژوو
          </button>
        </div>
      </div>
    </div>
  );
}
