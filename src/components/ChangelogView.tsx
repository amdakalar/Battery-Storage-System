'use client';

import React, { useState, useEffect } from 'react';
import { ActivityLog } from '../types';
import { getActivityLogsAction } from '../actions/batteryActions';
import {
  ClockIcon,
  PlusCircleIcon,
  BoltIcon,
  PencilSquareIcon,
  TrashIcon,
  UserGroupIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  ShieldCheckIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export function ChangelogView() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await getActivityLogsAction(150);
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
    fetchLogs();
  }, []);

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
    <div className="space-y-6 dir-rtl animate-in fade-in duration-200">
      
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm shrink-0">
              <DocumentTextIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                مێژووی گۆڕانکارییەکان (Activity Changelog)
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                تەواوی چالاکی و گۆڕانکارییە ئەنجامدراوەکانی سیستەم بە شێوەی زیندوو
              </p>
            </div>
          </div>

          <button
            onClick={fetchLogs}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border border-slate-200 shrink-0"
          >
            <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>نوێکردنەوەی مێژوو</span>
          </button>
        </div>

        {/* Filters and Search Row */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="گەڕان لە گۆڕانکارییەکان (ناو، ئەنجامدەر، کات)..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white pr-9 transition-all"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex gap-1.5 w-full md:w-auto bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setFilterAction('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterAction === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              هەموو ({logs.length})
            </button>
            <button
              onClick={() => setFilterAction('BATTERY')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterAction === 'BATTERY'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              کردارەکانی باتری
            </button>
            <button
              onClick={() => setFilterAction('USERS')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterAction === 'USERS'
                  ? 'bg-slate-900 text-white shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              بەکارهێنەران
            </button>
          </div>
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center space-y-3 bg-white border border-slate-200 rounded-3xl">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-bold">بارکردنی مێژووی چالاکییەکان...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs font-bold bg-white border border-slate-200 rounded-3xl">
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
                className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-slate-300 hover:shadow-xs transition-all"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${badge.bg}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-xs sm:text-sm text-slate-900">{log.actionTitle}</span>
                      {log.targetName && (
                        <span className="text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200 font-mono">
                          {log.targetName}
                        </span>
                      )}
                    </div>
                    {log.details && (
                      <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                        {log.details}
                      </p>
                    )}
                  </div>
                </div>

                {/* Metadata: Performed By and Time */}
                <div className="text-left shrink-0 self-end sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 w-full sm:w-auto">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 justify-end sm:justify-start">
                    <span className="text-slate-400 font-medium text-[10px]">ئەنجامدەر:</span>
                    <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {log.performedBy || 'سیستەم'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium mt-1 font-mono text-left">
                    {dateStr}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
