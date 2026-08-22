'use client';

import React, { useState, useEffect } from 'react';
import { User, UserRole, UserStatus } from '../types';
import {
  getAllUsersAction,
  updateUserStatusAction,
  updateUserRoleAction,
  deleteUserAction,
  createUserByAdminAction,
  updateUserProfileAction,
  changeUserPasswordAction,
} from '../actions/authActions';
import {
  UserGroupIcon,
  CheckCircleIcon,
  NoSymbolIcon,
  TrashIcon,
  ShieldCheckIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  UserPlusIcon,
  LockClosedIcon,
  UserIcon,
  IdentificationIcon,
  KeyIcon,
  PencilSquareIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface UsersManagementViewProps {
  currentAdmin: User;
  onUserUpdated?: (updatedUser: User) => void;
  onUserListChange?: () => void;
}

export function UsersManagementView({
  currentAdmin,
  onUserUpdated,
  onUserListChange,
}: UsersManagementViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'BLOCKED'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New User Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('USER');
  const [isCreating, setIsCreating] = useState(false);

  // Edit User State (Especially for Admin or any user)
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState<UserRole>('USER');
  const [editPassword, setEditPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Quick Password Reset State
  const [targetUserForPassword, setTargetUserForPassword] = useState<User | null>(null);
  const [adminSetNewPassword, setAdminSetNewPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

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
    fetchUsers();
  }, []);

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
          text: `بەکارهێنەر "${res.user.fullName}" بە سەرکەوتوویی دروستکرا و چالاک کرا.`,
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

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditFullName(user.fullName);
    setEditUsername(user.username);
    setEditRole(user.role);
    setEditPassword('');
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    setIsUpdating(true);
    setMessage(null);

    try {
      const res = await updateUserProfileAction(currentAdmin.id, editingUser.id, {
        fullName: editFullName,
        username: editUsername,
        role: editRole,
        newPassword: editPassword || undefined,
      });

      if (res.success && res.user) {
        setMessage({
          type: 'success',
          text: `زانیارییەکانی هەژماری "${res.user.fullName}" بە سەرکەوتوویی نوێکرایەوە.`,
        });

        // If editing current admin account, update local state
        if (editingUser.id === currentAdmin.id) {
          onUserUpdated?.(res.user);
        }

        setEditingUser(null);
        await fetchUsers();
        onUserListChange?.();
      } else {
        setMessage({ type: 'error', text: res.error || 'نەتوانرا زانیارییەکان نوێ بکرێتەوە' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'پەیوەندی سەرکەوتوو نەبوو' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUserForPassword) return;

    if (adminSetNewPassword.length < 4) {
      setMessage({ type: 'error', text: 'وشەی نهێنی دەبێت کەمترین ٤ پیت یان ژمارە بێت' });
      return;
    }

    setIsChangingPass(true);
    try {
      const res = await changeUserPasswordAction({
        userId: targetUserForPassword.id,
        newPassword: adminSetNewPassword,
      });

      if (res.success) {
        setMessage({
          type: 'success',
          text: `وشەی نهێنی بۆ "${targetUserForPassword.fullName}" بە سەرکەوتوویی گۆڕدرا.`,
        });
        setTargetUserForPassword(null);
        setAdminSetNewPassword('');
      } else {
        setMessage({ type: 'error', text: res.error || 'نەتوانرا وشەی نهێنی نوێ بکرێتەوە' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsChangingPass(false);
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
          text: newStatus === 'ACTIVE' ? `هەژماری "${targetUser.fullName}" چالاک کرا` : `هەژماری "${targetUser.fullName}" ڕاگیرا`,
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
    <div className="space-y-6 dir-rtl animate-in fade-in duration-200">
      
      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-sm shrink-0">
              <UserGroupIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                بەڕێوەبردنی بەکارهێنەران و هەژمارەکان
                {pendingCount > 0 && (
                  <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold">
                    {pendingCount} چاوەڕوان
                  </span>
                )}
              </h1>
              <p className="text-xs text-slate-500 font-semibold mt-0.5">
                زیادکردنی کارمەند، دەستکاریکردنی زانیاری، گۆڕینی وشەی نهێنی و دیاریکردنی دەسەڵاتەکان
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                showAddForm
                  ? 'bg-slate-100 text-slate-700 border border-slate-200'
                  : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs font-black'
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
              onClick={fetchUsers}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="نوێکردنەوەی لیست"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {message && (
          <div
            className={`mt-4 p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between animate-slide-up ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">
              ✕
            </button>
          </div>
        )}

        {/* Edit User Form (Modal/Inline) */}
        {editingUser && (
          <div className="mt-5 p-5 bg-slate-50 border border-slate-300/80 rounded-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                <PencilSquareIcon className="w-4 h-4 text-slate-700" />
                دەستکاریکردنی زانیارییەکانی "{editingUser.fullName}" (@{editingUser.username})
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold"
              >
                پاشگەزبوونەوە ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ناوی تەواو</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ناوی بەکارهێنەر (Username)</label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900 text-left dir-ltr"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">وشەی نهێنی نوێ (ئارەزوومەندانە)</label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="بە بەتاڵی بهێڵەرەوە ئەگەر ناگۆڕدرێت"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 text-left dir-ltr"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">دەسەڵات</label>
                <div className="flex gap-2">
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    <option value="USER">بەکارهێنەر (User)</option>
                    <option value="ADMIN">بەڕێوەبەر (Admin)</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isUpdating ? '...' : 'پاشەکەوتکردن'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Add New User Collapsible Form */}
        {showAddForm && (
          <div className="mt-5 p-5 bg-slate-50 border border-slate-200 rounded-2xl animate-slide-up">
            <h3 className="text-xs font-black text-slate-900 mb-3 flex items-center gap-1.5">
              <UserPlusIcon className="w-4 h-4 text-slate-700" />
              تۆمارکردنی کارمەند / بەکارهێنەری نوێ لەلایەن بەڕێوەبەر
            </h3>
            <form onSubmit={handleCreateUser} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ناوی تەواو</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="ناوی کارمەند..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 pl-8"
                  />
                  <IdentificationIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ناوی بەکارهێنەر (Username)</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="username..."
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 pl-8 text-left dir-ltr"
                    dir="ltr"
                  />
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">وشەی نهێنی (Password)</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 pl-8 text-left dir-ltr"
                    dir="ltr"
                  />
                  <LockClosedIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">دەسەڵات</label>
                <div className="flex gap-2">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-slate-900"
                  >
                    <option value="USER">بەکارهێنەر (User)</option>
                    <option value="ADMIN">بەڕێوەبەر (Admin)</option>
                  </select>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black transition-all shadow-sm disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    {isCreating ? '...' : 'تۆمارکردن'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Quick Password Reset Sub-Form */}
        {targetUserForPassword && (
          <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl animate-slide-up">
            <div className="max-w-md space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <KeyIcon className="w-4 h-4 text-slate-700" />
                  گۆڕینی وشەی نهێنی بۆ "{targetUserForPassword.fullName}"
                </h3>
                <button
                  onClick={() => setTargetUserForPassword(null)}
                  className="text-xs text-slate-400 hover:text-slate-700"
                >
                  پاشگەزبوونەوە
                </button>
              </div>
              <form onSubmit={handleAdminResetPassword} className="flex gap-2">
                <input
                  type="password"
                  required
                  autoFocus
                  value={adminSetNewPassword}
                  onChange={(e) => setAdminSetNewPassword(e.target.value)}
                  placeholder="وشەی نهێنی نوێ بنووسە..."
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-slate-900 text-left dir-ltr"
                  dir="ltr"
                />
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {isChangingPass ? '...' : 'تۆمارکردن'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Filters and Search Row */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="گەڕان بەپێی ناو یان ناوی بەکارهێنەر..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900 focus:bg-white pr-9"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex gap-1.5 w-full md:w-auto bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-slate-900 text-white shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              هەموو ({users.length})
            </button>
            <button
              onClick={() => setStatusFilter('ACTIVE')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'ACTIVE' ? 'bg-slate-900 text-white shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              چالاک
            </button>
            <button
              onClick={() => setStatusFilter('BLOCKED')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === 'BLOCKED' ? 'bg-slate-900 text-white shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ڕاگیراو
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center space-y-3 bg-white border border-slate-200 rounded-3xl">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400 font-bold">بارکردنی لیستی بەکارهێنەران...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-slate-400 text-xs font-bold bg-white border border-slate-200 rounded-3xl">
            هیچ بەکارهێنەرێک نەدۆزرایەوە
          </div>
        ) : (
          filteredUsers.map((user) => {
            const isCurrent = user.id === currentAdmin.id;
            const isActing = actionLoading === user.id;

            return (
              <div
                key={user.id}
                className={`bg-white border rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all shadow-xs ${
                  user.status === 'PENDING'
                    ? 'border-amber-300 bg-amber-50/30'
                    : user.status === 'BLOCKED'
                    ? 'border-rose-200 opacity-80'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* User Info */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-xs border shrink-0 ${
                      user.role === 'ADMIN'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {user.fullName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">{user.fullName}</span>
                      <span className="text-[11px] font-mono text-slate-400" dir="ltr">
                        @{user.username}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.2 rounded-full font-bold">
                          (هەژماری تۆ)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-medium">
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          user.role === 'ADMIN' ? 'text-indigo-700' : 'text-slate-600'
                        }`}
                      >
                        <ShieldCheckIcon className="w-3.5 h-3.5" />
                        {user.role === 'ADMIN' ? 'بەڕێوەبەر (Admin)' : 'بەکارهێنەر (User)'}
                      </span>
                      <span>•</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        تۆمارکردن: {new Date(user.createdAt).toLocaleDateString('ku-IQ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
                  {/* Status Badge */}
                  {user.status === 'PENDING' && (
                    <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
                      <ClockIcon className="w-3.5 h-3.5" />
                      چاوەڕوان
                    </span>
                  )}
                  {user.status === 'ACTIVE' && (
                    <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                      چالاک
                    </span>
                  )}
                  {user.status === 'BLOCKED' && (
                    <span className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-1 rounded-xl font-bold flex items-center gap-1">
                      <NoSymbolIcon className="w-3.5 h-3.5" />
                      ڕاگیراو
                    </span>
                  )}

                  {/* Edit User Button (Works for Admin and all users) */}
                  <button
                    onClick={() => handleOpenEdit(user)}
                    title="دەستکاریکردنی زانیارییەکان"
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <PencilSquareIcon className="w-3.5 h-3.5 text-slate-600" />
                    <span>دەستکاری</span>
                  </button>

                  {/* Reset Password Button */}
                  <button
                    onClick={() => {
                      setTargetUserForPassword(user);
                      setAdminSetNewPassword('');
                    }}
                    title="گۆڕینی وشەی نهێنی"
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
                  >
                    <KeyIcon className="w-4 h-4" />
                  </button>

                  {/* Action Buttons */}
                  {user.status === 'PENDING' && (
                    <button
                      disabled={isActing}
                      onClick={() => handleStatusChange(user, 'ACTIVE')}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
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
                      className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <NoSymbolIcon className="w-4 h-4" />
                    </button>
                  )}

                  {user.status === 'BLOCKED' && (
                    <button
                      disabled={isActing}
                      onClick={() => handleStatusChange(user, 'ACTIVE')}
                      className="bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      چالاککردنەوە
                    </button>
                  )}

                  {/* Delete User */}
                  {!isCurrent && (
                    <button
                      disabled={isActing}
                      onClick={() => handleDelete(user)}
                      title="سڕینەوەی بەکارهێنەر"
                      className="p-2 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 transition-colors cursor-pointer"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
