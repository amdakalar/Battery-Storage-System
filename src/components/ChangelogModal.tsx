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
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
      case 'BATTERY_CHARGE':
        return {
          icon: BoltIcon,
          bg: 'bg-teal-50 text-teal-700 border-teal-200',
        };
      case 'BATTERY_UPDATE':
        return {
          icon: PencilSquareIcon,
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        };
      case 'BATTERY_DELETE':
        return {
          icon: TrashIcon,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
        };
      case 'USER_REGISTER':
      case 'USER_APPROVE':
      case 'USER_ROLE_CHANGE':
      case 'USER_BLOCK':
        return {
          icon: UserGroupIcon,
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
        };
      default:
        return {
          icon: ShieldCheckIcon,
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
        };
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.actionTitle && log.actionTitle.toLowerCase().includes(search.toLowerCase())) ||
      (log.performedBy && log.performedBy.toLowerCase().includes(search.toLowerCase())) ||
      (log.targetName && log.targetName.toLowerCase().includes(search.toLowerCase())) ||
      (log.details && log.details.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterAction === 'BATTERY') {
      return log.action.startsWith('BATTERY');
    }
    if (filterAction === 'USERS') {
      return log.action.startsWith('USER');
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in font-sans select-none" dir="rtl">
      <div className="bg-white border border-slate-200/90 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
              <ClockIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                مێژووی زیندووی گۆڕانکارییەکان (Activity Changelog)
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                تەواوی کردارە ئەنجامدراوەکانی سیستەم لەگەڵ ناوی ئەنجامدەر و بەروار
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-5 pb-3 flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-slate-100 bg-white">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="گەڕان لە گۆڕانکارییەکان..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white pr-9 transition-all"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex gap-1.5 w-full sm:w-auto bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setFilterAction('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterAction === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              هەموو کردارەکان ({logs.length})
            </button>
            <button
              onClick={() => setFilterAction('BATTERY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterAction === 'BATTERY'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              کردارەکانی باتری
            </button>
            <button
              onClick={() => setFilterAction('USERS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterAction === 'USERS'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              بەڕێوەبردنی بەکارهێنەران
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-2.5 bg-slate-50/40">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-bold">بارکردنی مێژووی چالاکییەکان...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs font-bold">
              هیچ چالاکییەک نەدۆزرایەوە
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
                  className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-300 hover:shadow-xs transition-all"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl border flex items-center justify-center shrink-0 ${badge.bg}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{log.actionTitle}</span>
                        {log.targetName && (
                          <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                            {log.targetName}
                          </span>
                        )}
                      </div>
                      {log.details && (
                        <p className="text-[11px] text-slate-500 font-medium mt-1 line-clamp-2">
                          {log.details}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Metadata: Performed By and Time */}
                  <div className="text-left sm:text-left shrink-0 self-end sm:self-center">
                    <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <span className="text-slate-400 font-medium text-[10px]">ئەنجامدەر:</span>
                      <span className="text-slate-900 font-bold bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                        {log.performedBy || 'سیستەم'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5 font-mono">
                      {dateStr}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500 font-bold">
          <span>پشاندانی {filteredLogs.length} لە کۆی {logs.length} چالاکی</span>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-1.5 text-slate-700 hover:text-slate-900 font-bold cursor-pointer transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            نوێکردنەوەی مێژوو
          </button>
        </div>

      </div>
    </div>
  );
}
