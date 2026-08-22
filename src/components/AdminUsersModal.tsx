'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from '../types';
import {
  getAllUsersAction,
  updateUserStatusAction,
  updateUserRoleAction,
  deleteUserAction,
  createUserByAdminAction,
} from '../actions/authActions';
import {
  XMarkIcon,
  UserGroupIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  TrashIcon,
  ShieldCheckIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  UserPlusIcon,
  PlusIcon,
  LockClosedIcon,
  UserIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAdmin: User;
  onUserListChange?: () => void;
}

export function AdminUsersModal({
  isOpen,
  onClose,
  currentAdmin,
  onUserListChange,
}: AdminUsersModalProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'BLOCKED'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New User Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('USER');
  const [isCreating, setIsCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getAllUsersAction(currentAdmin.id);
      if (res.success && res.users) {
        setUsers(res.users);
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: 'نەتوانرا لیستی بەکارهێنەران بهێنرێت' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setMessage(null);

    try {
      const res = await createUserByAdminAction(currentAdmin.id, {
        fullName: newFullName,
        username: newUsername,
        password: newPassword,
        role: newRole,
      });

      if (res.success && res.user) {
        setMessage({
          type: 'success',
          text: `بەکارهێنەر "${res.user.fullName}" بە سەرکەوتوویی دروستکرا و ڕاستەوخۆ چالاک کرا.`,
        });
        setNewFullName('');
        setNewUsername('');
        setNewPassword('');
        setNewRole('USER');
        setShowAddForm(false);
        await fetchUsers();
        onUserListChange?.();
      } else {
        setMessage({ type: 'error', text: res.error || 'هەڵەیەک ڕوویدا لە کاتی دروستکردن' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'پەیوەندی سەرکەوتوو نەبوو' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusChange = async (targetUser: User, newStatus: UserStatus) => {
    setActionLoading(targetUser.id);
    setMessage(null);
    try {
      const res = await updateUserStatusAction(currentAdmin.id, targetUser.id, newStatus);
      if (res.success) {
        setMessage({
          type: 'success',
          text: newStatus === 'ACTIVE' ? `هەژماری "${targetUser.fullName}" بە سەرکەوتوویی چالاک کرا` : `هەژماری "${targetUser.fullName}" ڕاگیرا`,
        });
        await fetchUsers();
        onUserListChange?.();
      } else {
        setMessage({ type: 'error', text: res.error || 'کردارەکە سەرکەوتوو نەبوو' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (targetUser: User, newRole: UserRole) => {
    setActionLoading(targetUser.id);
    setMessage(null);
    try {
      const res = await updateUserRoleAction(currentAdmin.id, targetUser.id, newRole);
      if (res.success) {
        setMessage({
          type: 'success',
          text: `دەسەڵاتی "${targetUser.fullName}" گۆڕدرا بۆ ${newRole === 'ADMIN' ? 'ئادمین' : 'بەکارهێنەر'}`,
        });
        await fetchUsers();
        onUserListChange?.();
      } else {
        setMessage({ type: 'error', text: res.error || 'کردارەکە سەرکەوتوو نەبوو' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (targetUser: User) => {
    if (!window.confirm(`ئایا دڵنیایت لە سڕینەوەی بەکارهێنەر "${targetUser.fullName}"؟ تەواوی باتری و داتاکانی دەسڕێنەوە.`)) {
      return;
    }

    setActionLoading(targetUser.id);
    setMessage(null);
    try {
      const res = await deleteUserAction(currentAdmin.id, targetUser.id);
      if (res.success) {
        setMessage({ type: 'success', text: `بەکارهێنەر "${targetUser.fullName}" سڕایەوە` });
        await fetchUsers();
        onUserListChange?.();
      } else {
        setMessage({ type: 'error', text: res.error || 'نەتوانرا بەکارهێنەر بسڕدرێتەوە' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = users.filter((u) => u.status === 'PENDING').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in font-sans" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UserGroupIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                بەڕێوەبردنی بەکارهێنەران
                {pendingCount > 0 && (
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full font-bold">
                    {pendingCount} چاوەڕوان
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">زیادکردنی کارمەند و دیاریکردنی دەسەڵاتەکان</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showAddForm
                  ? 'bg-slate-800 text-slate-300 border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 font-black'
              }`}
            >
              {showAddForm ? (
                <>
                  <XMarkIcon className="w-4 h-4" />
                  داخستنی فۆرم
                </>
              ) : (
                <>
                  <UserPlusIcon className="w-4 h-4" />
                  + زیادکردنی بەکارهێنەر
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Action feedback message */}
        {message && (
          <div
            className={`mx-6 mt-4 p-3 rounded-2xl text-xs font-bold flex items-center justify-between animate-slide-up ${
              message.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Add New User Collapsible Form */}
        {showAddForm && (
          <div className="p-6 bg-slate-950/80 border-b border-slate-800 animate-slide-up">
            <h3 className="text-xs font-black text-indigo-400 mb-3 flex items-center gap-1.5">
              <UserPlusIcon className="w-4 h-4" />
              فۆرمی تۆمارکردنی کارمەند / بەکارهێنەری نوێ لەلایەن بەڕێوەبەر
            </h3>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">ناوی تەواو</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="ناوی کارمەند..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pl-8"
                  />
                  <IdentificationIcon className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">ناوی بەکارهێنەر (Username)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="username..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pl-8 text-left dir-ltr"
                    dir="ltr"
                  />
                  <UserIcon className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">وشەی نهێنی (Password)</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pl-8 text-left dir-ltr"
                    dir="ltr"
                  />
                  <LockClosedIcon className="w-4 h-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">دەسەڵات</label>
                <div className="flex gap-2">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="USER">بەکارهێنەر (User)</option>
                    <option value="ADMIN">بەڕێوەبەر (Admin)</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isCreating ? '...' : 'تۆمارکردن'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="p-6 pb-2 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="گەڕان بەپێی ناو یان یوزەرنەیم..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 pr-10"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex gap-1.5 w-full sm:w-auto bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              هەموو ({users.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              چالاک
            </button>
            <button
              onClick={() => setStatusFilter('BLOCKED')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                statusFilter === 'BLOCKED' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              ڕاگیراو
            </button>
          </div>
        </div>

        {/* Users Table / List */}
        <div className="flex-1 overflow-y-auto p-6 pt-2">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">بارکردنی لیستی بەکارهێنەران...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              هیچ بەکارهێنەرێک نەدۆزرایەوە
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredUsers.map((user) => {
                const isCurrent = user.id === currentAdmin.id;
                const isActing = actionLoading === user.id;

                return (
                  <div
                    key={user.id}
                    className={`bg-slate-950/60 border rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                      user.status === 'PENDING'
                        ? 'border-amber-500/40 bg-amber-500/5'
                        : user.status === 'BLOCKED'
                        ? 'border-rose-500/30 opacity-75'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* User Info */}
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm ${
                          user.role === 'ADMIN'
                            ? 'bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{user.fullName}</span>
                          <span className="text-[11px] font-mono text-slate-400" dir="ltr">
                            @{user.username}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.2 rounded-full font-bold">
                              (تۆ)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-400">
                          <span
                            className={`inline-flex items-center gap-1 font-bold ${
                              user.role === 'ADMIN' ? 'text-purple-400' : 'text-slate-400'
                            }`}
                          >
                            <ShieldCheckIcon className="w-3.5 h-3.5" />
                            {user.role === 'ADMIN' ? 'بەڕێوەبەر (Admin)' : 'بەکارهێنەر (User)'}
                          </span>
                          <span>•</span>
                          <span className="text-[10px] text-slate-500">
                            تۆمارکردن: {new Date(user.createdAt).toLocaleDateString('ku-IQ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2 self-end md:self-auto">
                      {/* Status Badge */}
                      {user.status === 'PENDING' && (
                        <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-xl font-bold flex items-center gap-1">
                          <ClockIcon className="w-3.5 h-3.5" />
                          چاوەڕوان
                        </span>
                      )}
                      {user.status === 'ACTIVE' && (
                        <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-xl font-bold flex items-center gap-1">
                          <CheckCircleIcon className="w-3.5 h-3.5" />
                          چالاک
                        </span>
                      )}
                      {user.status === 'BLOCKED' && (
                        <span className="text-[11px] bg-rose-500/10 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-xl font-bold flex items-center gap-1">
                          <NoSymbolIcon className="w-3.5 h-3.5" />
                          ڕاگیراو
                        </span>
                      )}

                      {/* Action Buttons */}
                      {user.status === 'PENDING' && (
                        <button
                          disabled={isActing}
                          onClick={() => handleStatusChange(user, 'ACTIVE')}
                          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                        >
                          <CheckCircleIcon className="w-4 h-4" />
                          چالاککردن
                        </button>
                      )}

                      {user.status === 'ACTIVE' && !isCurrent && (
                        <button
                          disabled={isActing}
                          onClick={() => handleStatusChange(user, 'BLOCKED')}
                          title="ڕاگرتنی هەژمار"
                          className="p-2 rounded-xl bg-slate-800/80 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-700 transition-colors cursor-pointer"
                        >
                          <NoSymbolIcon className="w-4 h-4" />
                        </button>
                      )}

                      {user.status === 'BLOCKED' && (
                        <button
                          disabled={isActing}
                          onClick={() => handleStatusChange(user, 'ACTIVE')}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          چالاککردنەوە
                        </button>
                      )}

                      {/* Toggle Admin/User Role */}
                      {!isCurrent && (
                        <button
                          disabled={isActing}
                          onClick={() => handleRoleChange(user, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                          className="p-2 rounded-xl bg-slate-800/80 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-300 border border-slate-700 transition-colors text-xs font-bold cursor-pointer"
                          title={user.role === 'ADMIN' ? 'گۆڕین بۆ بەکارهێنەری ئاسایی' : 'بەرزکردنەوە بۆ ئادمین'}
                        >
                          <ShieldCheckIcon className="w-4 h-4" />
                        </button>
                      )}

                      {/* Delete User */}
                      {!isCurrent && (
                        <button
                          disabled={isActing}
                          onClick={() => handleDelete(user)}
                          title="سڕینەوەی بەکارهێنەر"
                          className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>کۆی گشتی: {users.length} بەکارهێنەر</span>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
          >
            <ArrowPathIcon className="w-4 h-4" />
            نوێکردنەوە
          </button>
        </div>
      </div>
    </div>
  );
}
