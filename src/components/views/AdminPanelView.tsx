import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Language, AdminStats, AdminUserItem, SystemAnnouncement } from '../../types';
import { adminApi } from '../../lib/api';
import { formatMoney, formatRelativeTime } from '../../lib/i18n/formatter';
import { IconRenderer } from '../common/IconRenderer';
import { triggerConfetti } from '../common/Graphics';

interface AdminPanelViewProps {
  currentUser: UserProfile;
  lang: Language;
  onBackToApp: () => void;
}

type AdminTab = 'overview' | 'users' | 'announcement' | 'system';

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  currentUser,
  lang,
  onBackToApp,
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // User details modal state
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<{ user: any; appState: any } | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Password reset modal state
  const [resetModalUserId, setResetModalUserId] = useState<string | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  // Delete modal state
  const [deleteModalUserId, setDeleteModalUserId] = useState<string | null>(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  // Announcement edit form
  const [annMessage, setAnnMessage] = useState('');
  const [annActive, setAnnActive] = useState(false);
  const [annType, setAnnType] = useState<'info' | 'warning' | 'urgent'>('info');
  const [isSavingAnn, setIsSavingAnn] = useState(false);

  const showNotice = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const fetchAdminData = async () => {
    setIsRefreshing(true);
    try {
      const [statsData, usersData, annData] = await Promise.all([
        adminApi.getStats().catch(() => null),
        adminApi.getUsers().catch(() => ({ users: [], total: 0 })),
        adminApi.getAnnouncement().catch(() => null),
      ]);

      if (statsData) setStats(statsData);
      if (usersData?.users) setUsers(usersData.users);
      if (annData) {
        setAnnouncement(annData);
        setAnnMessage(annData.message || '');
        setAnnActive(!!annData.active);
        setAnnType(annData.type || 'info');
      }
    } catch (err: any) {
      console.error('Failed to load admin data:', err);
      showNotice(lang === 'bn' ? 'ডাটা লোড করতে সমস্যা হয়েছে।' : 'Failed to load data.', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleOpenUserDetails = async (userId: string) => {
    setSelectedUserId(userId);
    setIsLoadingDetails(true);
    try {
      const details = await adminApi.getUserDetails(userId);
      setSelectedUserDetails(details);
    } catch (e: any) {
      showNotice(e.message || 'Error fetching user details', 'error');
      setSelectedUserId(null);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUserId || !newPasswordInput) return;
    setIsResettingPassword(true);
    try {
      const res = await adminApi.resetUserPassword(resetModalUserId, newPasswordInput);
      showNotice(res.message || 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে।');
      setResetModalUserId(null);
      setNewPasswordInput('');
      fetchAdminData();
    } catch (e: any) {
      showNotice(e.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে।', 'error');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleToggleUserStatus = async (userId: string) => {
    try {
      const res = await adminApi.toggleUserStatus(userId);
      showNotice(res.message || 'ইউজার স্ট্যাটাস পরিবর্তন করা হয়েছে।');
      fetchAdminData();
    } catch (e: any) {
      showNotice(e.message || 'স্ট্যাটাস পরিবর্তন ব্যর্থ হয়েছে।', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModalUserId) return;
    setIsDeletingUser(true);
    try {
      await adminApi.deleteUser(deleteModalUserId);
      showNotice('ইউজার সফলভাবে মুছে ফেলা হয়েছে।');
      setDeleteModalUserId(null);
      setDeleteConfirmEmail('');
      fetchAdminData();
    } catch (e: any) {
      showNotice(e.message || 'ইউজার মুছতে ব্যর্থ হয়েছে।', 'error');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAnn(true);
    try {
      const res = await adminApi.setAnnouncement({
        message: annMessage,
        active: annActive,
        type: annType,
      });
      setAnnouncement(res.announcement);
      showNotice('সিস্টেম নোটিশ সফলভাবে প্রকাশ করা হয়েছে!');
      triggerConfetti();
    } catch (e: any) {
      showNotice(e.message || 'নোটিশ সেভ করতে ব্যর্থ হয়েছে।', 'error');
    } finally {
      setIsSavingAnn(false);
    }
  };

  const handleExportUsersCsv = () => {
    if (users.length === 0) return;
    const headers = ['ID', 'Email', 'Name', 'Phone', 'Role', 'Status', 'Balance', 'Total Income', 'Total Expense', 'Transactions', 'Created At'];
    const rows = users.map((u) => [
      u.id,
      u.email,
      `"${u.name || ''}"`,
      u.phone || '',
      u.role,
      u.status,
      u.currentBalance,
      u.totalIncome,
      u.totalExpense,
      u.transactionCount,
      new Date(u.createdAt).toISOString(),
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mash_khoroch_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice('CSV ফাইল সফলভাবে ডাউনলোড হয়েছে।');
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery =
      !q ||
      u.email.toLowerCase().includes(q) ||
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.institutionOrJob && u.institutionOrJob.toLowerCase().includes(q));

    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && u.status !== 'suspended') ||
      (statusFilter === 'suspended' && u.status === 'suspended');

    return matchQuery && matchStatus;
  });

  return (
    <div className="min-h-screen app-mint-gradient text-slate-900 font-sans pb-24">
      {/* Top Banner / Navbar */}
      <header className="sticky top-0 z-30 bg-[#032b21]/90 backdrop-blur-xl border-b border-emerald-500/20 text-white px-4 py-3 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-lime-300 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-900/30">
              <IconRenderer name="Crown" className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  অ্যাডমিন প্যানেল
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-lime-300 border border-emerald-400/40">
                    SUPER ADMIN
                  </span>
                </h1>
              </div>
              <p className="text-xs text-emerald-300/80 font-mono truncate max-w-[200px] sm:max-w-xs">
                {currentUser.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAdminData}
              disabled={isRefreshing}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-200 hover:text-white transition-all cursor-pointer"
              title="ডাটা রিফ্রেশ করুন"
            >
              <IconRenderer name="RefreshCw" className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-lime-300' : ''}`} />
            </button>

            <button
              onClick={onBackToApp}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-950/40 cursor-pointer transition-all active:scale-95"
            >
              <IconRenderer name="Home" className="w-3.5 h-3.5" />
              <span>ইউজার অ্যাপ</span>
            </button>
          </div>
        </div>

        {/* Admin Tab Switcher */}
        <div className="max-w-4xl mx-auto mt-3 flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'overview', labelBn: 'ওভারভিউ', labelEn: 'Overview', icon: 'BarChart3' },
            { id: 'users', labelBn: 'ইউজার তালিকা', labelEn: 'Users', icon: 'Users' },
            { id: 'announcement', labelBn: 'নোটিশ ব্রডকাস্ট', labelEn: 'Broadcast', icon: 'Megaphone' },
            { id: 'system', labelBn: 'সিস্টেম ও ব্যাকআপ', labelEn: 'System', icon: 'Server' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as AdminTab)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                activeTab === t.id
                  ? 'bg-gradient-to-r from-emerald-600 to-lime-500 text-slate-950 shadow-md font-extrabold'
                  : 'text-emerald-200/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <IconRenderer name={t.icon} className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? t.labelBn : t.labelEn}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Floating Global Notification Banner */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2 ${
              notification.type === 'success'
                ? 'bg-emerald-900/95 text-lime-300 border-emerald-500/40 shadow-emerald-950/50'
                : 'bg-rose-900/95 text-rose-200 border-rose-500/40 shadow-rose-950/50'
            }`}
          >
            <IconRenderer name={notification.type === 'success' ? 'CheckCircle' : 'AlertTriangle'} className="w-4 h-4" />
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-600">
            <div className="w-10 h-10 border-3 border-emerald-600/20 border-t-emerald-700 rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold">অ্যাডমিন ড্যাশবোর্ড লোড হচ্ছে...</p>
          </div>
        ) : (
          <>
            {/* ========================================================= */}
            {/* TAB 1: OVERVIEW & ANALYTICS                               */}
            {/* ========================================================= */}
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {/* Metric Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* Total Users */}
                  <div className="fintech-card p-4 rounded-2xl border border-emerald-500/20 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-xs font-bold">মোট নিবন্ধিত ইউজার</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                        <IconRenderer name="Users" className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {stats?.totalUsers ?? users.length} <span className="text-xs font-normal text-slate-500">জন</span>
                    </div>
                    <div className="mt-1 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {stats?.activeUsersToday ?? 0} জন আজ সক্রিয়
                    </div>
                  </div>

                  {/* Total System Balance */}
                  <div className="fintech-card p-4 rounded-2xl border border-emerald-500/20 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-xs font-bold">নেট সিস্টেম ব্যালেন্স</span>
                      <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-700 flex items-center justify-center">
                        <IconRenderer name="Wallet" className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
                      {formatMoney(stats?.totalSystemBalance ?? 0, '৳')}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 font-medium">
                      সব ইউজারের সর্বমোট স্থিতি
                    </div>
                  </div>

                  {/* Total Transactions */}
                  <div className="fintech-card p-4 rounded-2xl border border-emerald-500/20 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-xs font-bold">মোট লেনদেন সংখ্যা</span>
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-700 flex items-center justify-center">
                        <IconRenderer name="CreditCard" className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                      {stats?.totalTransactionsCount ?? 0} <span className="text-xs font-normal text-slate-500">টি</span>
                    </div>
                    <div className="mt-1 text-[11px] text-indigo-700 font-semibold">
                      সার্ভার ডেটাবেজে সংরক্ষিত
                    </div>
                  </div>

                  {/* Total Income Added */}
                  <div className="fintech-card p-4 rounded-2xl border border-emerald-500/20 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-xs font-bold">সর্বমোট টাকা যোগ</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                        <IconRenderer name="TrendingUp" className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
                      {formatMoney(stats?.totalIncomeVolume ?? 0, '৳')}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 font-medium">
                      ইউজারদের যোগকৃত টাকা
                    </div>
                  </div>

                  {/* Total Expenses */}
                  <div className="fintech-card p-4 rounded-2xl border border-emerald-500/20 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-xs font-bold">সর্বমোট খরচ হিসাব</span>
                      <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-700 flex items-center justify-center">
                        <IconRenderer name="TrendingDown" className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl font-black text-rose-700 tracking-tight">
                      {formatMoney(stats?.totalExpenseVolume ?? 0, '৳')}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 font-medium">
                      ইউজারদের এন্ট্রি করা মোট খরচ
                    </div>
                  </div>

                  {/* Seed Backup Adoption */}
                  <div className="fintech-card p-4 rounded-2xl border border-emerald-500/20 shadow-sm relative overflow-hidden group">
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                      <span className="text-xs font-bold">রিকভারি ফ্রেজ ব্যাকআপ</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                        <IconRenderer name="ShieldCheck" className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
                      {users.filter((u) => u.seedBackupEnabled).length} / {users.length}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 font-medium">
                      সিকিউর ভল্ট সক্রিয় ইউজার
                    </div>
                  </div>
                </div>

                {/* 7-Day Activity / Registrations Visual */}
                <div className="fintech-card p-5 rounded-2xl border border-emerald-500/20 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-black text-slate-900">গত ৭ দিনের রেজিস্ট্রেশন ট্রেন্ড</h2>
                      <p className="text-xs text-slate-500">প্রতিদিনের নতুন ইউজার যুক্ত হওয়ার হিসাব</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                      লাইভ স্ট্যাটাস
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-2 pt-2 pb-1 items-end h-28">
                    {stats?.dailyRegistrations?.map((item, idx) => {
                      const maxCount = Math.max(...(stats?.dailyRegistrations?.map((d) => d.count) || [1]), 1);
                      const heightPercent = Math.max(15, Math.round((item.count / maxCount) * 100));
                      const dayLabel = new Date(item.date).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                        weekday: 'short',
                      });

                      return (
                        <div key={idx} className="flex flex-col items-center h-full justify-end group">
                          <span className="text-[10px] font-black text-slate-700 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.count}
                          </span>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full max-w-[32px] rounded-t-lg bg-gradient-to-t from-emerald-600 to-lime-400 group-hover:from-emerald-500 group-hover:to-lime-300 transition-all shadow-xs"
                          />
                          <span className="text-[10px] font-bold text-slate-500 mt-2 truncate max-w-full">
                            {dayLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Users Quick List */}
                <div className="fintech-card p-5 rounded-2xl border border-emerald-500/20 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-black text-slate-900">সম্প্রতি যুক্ত হওয়া ইউজারবৃন্দ</h2>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1"
                    >
                      সব ইউজার দেখুন ({users.length})
                      <IconRenderer name="ChevronRight" className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {users.slice(0, 5).map((u) => (
                      <div key={u.id} className="py-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                            {(u.nameBn || u.name || u.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-black text-slate-900 truncate">{u.nameBn || u.name}</p>
                              {u.role === 'admin' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300">
                                  ADMIN
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono truncate">{u.email}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xs font-black text-slate-900">
                            {formatMoney(u.currentBalance, '৳')}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {formatRelativeTime(u.createdAt, lang)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* TAB 2: USERS MANAGEMENT & ACTIONS                         */}
            {/* ========================================================= */}
            {activeTab === 'users' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                {/* Search and Filters */}
                <div className="fintech-card p-3.5 rounded-2xl border border-emerald-500/20 shadow-sm space-y-3">
                  <div className="relative">
                    <IconRenderer name="Search" className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="নাম, ইমেইল, মোবাইল অথবা প্রতিষ্ঠান দিয়ে খুঁজুন..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-100/80 border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <IconRenderer name="X" className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-500">ফিল্টার:</span>
                      {[
                        { id: 'all', label: 'সকল ইউজার' },
                        { id: 'active', label: 'সক্রিয়' },
                        { id: 'suspended', label: 'সাসপেন্ডেড' },
                      ].map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setStatusFilter(f.id as any)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            statusFilter === f.id
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleExportUsersCsv}
                      className="px-3 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <IconRenderer name="Download" className="w-3 h-3" />
                      <span>CSV এক্সপোর্ট ({filteredUsers.length})</span>
                    </button>
                  </div>
                </div>

                {/* Users List Cards */}
                <div className="space-y-2.5">
                  {filteredUsers.length === 0 ? (
                    <div className="fintech-card p-10 text-center rounded-2xl border border-dashed border-slate-200">
                      <IconRenderer name="Users" className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-600">কোনো ইউজার পাওয়া যায়নি</p>
                      <p className="text-xs text-slate-400 mt-0.5">অনুসন্ধানের কি-ওয়ার্ড পরিবর্তন করে দেখুন</p>
                    </div>
                  ) : (
                    filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        className={`fintech-card p-4 rounded-2xl border shadow-sm transition-all ${
                          u.status === 'suspended'
                            ? 'border-rose-300/80 bg-rose-50/40'
                            : 'border-emerald-500/20 hover:border-emerald-500/40'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          {/* User Avatar & Bio */}
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black flex items-center justify-center text-base shadow-sm shrink-0 mt-0.5">
                              {(u.nameBn || u.name || u.email).charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-sm font-black text-slate-900">{u.nameBn || u.name}</h3>
                                {u.role === 'admin' ? (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold border border-amber-300">
                                    এডমিন
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                                    ইউজার
                                  </span>
                                )}
                                {u.status === 'suspended' && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-bold border border-rose-300">
                                    সাসপেন্ডেড
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 font-mono mt-0.5">{u.email}</p>
                              {u.phone && <p className="text-[11px] text-slate-500">ফোন: {u.phone}</p>}
                              {u.institutionOrJob && (
                                <p className="text-[11px] text-emerald-800 font-medium truncate">
                                  {u.institutionOrJob}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Financial Mini-Stats */}
                          <div className="grid grid-cols-3 gap-2 bg-slate-50/80 p-2 rounded-xl border border-slate-200/60 text-center shrink-0">
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold block">বর্তমান স্থিতি</span>
                              <span className="text-xs font-black text-emerald-800">
                                {formatMoney(u.currentBalance, '৳')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold block">মোট খরচ</span>
                              <span className="text-xs font-black text-rose-700">
                                {formatMoney(u.totalExpense, '৳')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-semibold block">লেনদেন</span>
                              <span className="text-xs font-black text-indigo-700">
                                {u.transactionCount} টি
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* User Action Buttons Toolbar */}
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] text-slate-400">
                            যুক্ত হয়েছেন: {new Date(u.createdAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* View Full Ledger */}
                            <button
                              onClick={() => handleOpenUserDetails(u.id)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                              title="ইউজারের সব হিসাব ও লেনদেন দেখুন"
                            >
                              <IconRenderer name="FileText" className="w-3 h-3" />
                              <span>হিসাব দেখুন</span>
                            </button>

                            {/* Reset Password */}
                            <button
                              onClick={() => {
                                setResetModalUserId(u.id);
                                setNewPasswordInput('');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                              title="ইউজারের জন্য নতুন পাসওয়ার্ড সেট করুন"
                            >
                              <IconRenderer name="Key" className="w-3 h-3" />
                              <span>পাসওয়ার্ড</span>
                            </button>

                            {/* Toggle Suspend */}
                            {u.email !== 'abufaisal9500@gmail.com' && (
                              <button
                                onClick={() => handleToggleUserStatus(u.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all ${
                                  u.status === 'suspended'
                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                <IconRenderer name={u.status === 'suspended' ? 'UserCheck' : 'UserX'} className="w-3 h-3" />
                                <span>{u.status === 'suspended' ? 'আনব্লক' : 'সাসপেন্ড'}</span>
                              </button>
                            )}

                            {/* Delete User */}
                            {u.email !== 'abufaisal9500@gmail.com' && (
                              <button
                                onClick={() => {
                                  setDeleteModalUserId(u.id);
                                  setDeleteConfirmEmail('');
                                }}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer transition-all"
                                title="ইউজার চিরতরে মুছে ফেলুন"
                              >
                                <IconRenderer name="Trash2" className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* TAB 3: SYSTEM ANNOUNCEMENT BROADCAST                      */}
            {/* ========================================================= */}
            {activeTab === 'announcement' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="fintech-card p-5 rounded-2xl border border-emerald-500/20 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <IconRenderer name="Megaphone" className="w-5 h-5 text-emerald-600" />
                      অ্যাপে লাইভ নোটিশ ব্রডকাস্ট করুন
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      এখানে নোটিশ লিখলে সমস্ত ইউজার তাদের অ্যাপে উপরের অংশে আকর্ষণীয় সতর্কবার্তা বা আপডেট দেখতে পাবে।
                    </p>
                  </div>

                  <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        নোটিশ বার্তা (বাংলা বা ইংরেজিতে)
                      </label>
                      <textarea
                        rows={3}
                        value={annMessage}
                        onChange={(e) => setAnnMessage(e.target.value)}
                        placeholder="যেমন: সম্মানিত গ্রাহক, মেসের নতুন রিকভারি সিকিউরিটি ফিচার যুক্ত করা হয়েছে..."
                        className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          নোটিশ ধরন (Notice Type)
                        </label>
                        <select
                          value={annType}
                          onChange={(e) => setAnnType(e.target.value as any)}
                          className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="info">তথ্যমূলক (Info - Blue/Green)</option>
                          <option value="warning">সতর্কতামূলক (Warning - Amber)</option>
                          <option value="urgent">জরুরি ঘোষণা (Urgent - Red)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          নোটিশ স্থিতি (Status)
                        </label>
                        <div className="flex items-center gap-3 pt-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={annActive}
                              onChange={(e) => setAnnActive(e.target.checked)}
                              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                            />
                            <span className="text-xs font-bold text-slate-800">
                              {annActive ? '✅ নোটিশ চালু আছে (Active)' : '❌ নোটিশ বন্ধ (Disabled)'}
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Notice Live Preview */}
                    {annMessage && (
                      <div className="p-3 rounded-xl border bg-slate-50 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          ইউজারদের অ্যাপে প্রিভিউ:
                        </span>
                        <div
                          className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                            annType === 'urgent'
                              ? 'bg-rose-500 text-white'
                              : annType === 'warning'
                              ? 'bg-amber-400 text-amber-950'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          <IconRenderer name="Bell" className="w-4 h-4 shrink-0" />
                          <span>{annMessage}</span>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSavingAnn}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                    >
                      <IconRenderer name="Send" className="w-4 h-4" />
                      <span>{isSavingAnn ? 'সেভ হচ্ছে...' : 'নোটিশ প্রকাশ ও আপডেট করুন'}</span>
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* ========================================================= */}
            {/* TAB 4: SYSTEM & DATABASE TOOLS                            */}
            {/* ========================================================= */}
            {activeTab === 'system' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="fintech-card p-5 rounded-2xl border border-emerald-500/20 shadow-sm space-y-4">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <IconRenderer name="Server" className="w-5 h-5 text-emerald-600" />
                      সিস্টেম ও ডেটাবেজ স্ট্যাটাস
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      সার্ভার ফাইল স্টোরেজ ও কোর এনভায়রনমেন্ট কনফিগারেশন
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-slate-400 font-semibold block text-[11px]">সার্ভার পোর্ট ও মোড</span>
                      <span className="font-mono font-bold text-slate-800">Port 3000 (Express + TypeScript)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-slate-400 font-semibold block text-[11px]">আইসোলেটেড ডেটা ডিরেক্টরি</span>
                      <span className="font-mono font-bold text-slate-800">/data/user_states/</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-slate-400 font-semibold block text-[11px]">নিরাপত্তা অথেনটিকেশন</span>
                      <span className="font-mono font-bold text-emerald-700">JWT + bcrypt (BIP-39 Vault)</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                      <span className="text-slate-400 font-semibold block text-[11px]">ডিফল্ট ইউজার ব্যালেন্স পলিসি</span>
                      <span className="font-mono font-bold text-emerald-700">Strict ৳0.00 Initial Slate</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">সম্পূর্ণ ডেটাবেজ এক্সপোর্ট</h4>
                      <p className="text-[11px] text-slate-500">সমস্ত ইউজারের হিসাব সারসংক্ষেপ ডাউনলোড করুন</p>
                    </div>
                    <button
                      onClick={handleExportUsersCsv}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <IconRenderer name="Download" className="w-3.5 h-3.5" />
                      <span>সব ডাটা CSV ডাউনলোড</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODAL 1: VIEW FULL USER DETAILS & TRANSACTIONS            */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedUserId && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-emerald-500/30 overflow-hidden text-slate-900"
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-emerald-950 text-white">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-lime-300 flex items-center justify-center">
                    <IconRenderer name="FileText" className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">ইউজারের বিস্তারিত হিসাব ও লেজার</h3>
                    <p className="text-[11px] text-emerald-300/80 font-mono">
                      {selectedUserDetails?.user?.email || 'লোড হচ্ছে...'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedUserId(null);
                    setSelectedUserDetails(null);
                  }}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white"
                >
                  <IconRenderer name="X" className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                {isLoadingDetails ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                    <div className="w-8 h-8 border-2 border-emerald-600/20 border-t-emerald-700 rounded-full animate-spin mb-3" />
                    <p className="text-xs font-semibold">হিসাবপত্র লোড হচ্ছে...</p>
                  </div>
                ) : selectedUserDetails ? (
                  <>
                    {/* User Profile Mini Block */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80 text-center text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">নাম</span>
                        <span className="font-bold text-slate-900">
                          {selectedUserDetails.user.nameBn || selectedUserDetails.user.name}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">মাসিক বাজেট</span>
                        <span className="font-bold text-slate-900">
                          {formatMoney(selectedUserDetails.user.monthlyBudget || 0, '৳')}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">নিবন্ধন সময়</span>
                        <span className="font-bold text-slate-900">
                          {new Date(selectedUserDetails.user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">সিকিউরিটি ব্যাকআপ</span>
                        <span className="font-bold text-emerald-700">
                          {selectedUserDetails.user.seedBackupEnabled ? 'সক্রিয় (Vault)' : 'নিষ্ক্রিয়'}
                        </span>
                      </div>
                    </div>

                    {/* Transactions List */}
                    <div>
                      <h4 className="text-xs font-black text-slate-900 mb-2 flex items-center justify-between">
                        <span>লেনদেন বিবরণী ({(selectedUserDetails.appState?.transactions || []).length} টি)</span>
                        <span className="text-[11px] font-normal text-slate-500">
                          চলতি মাস: {selectedUserDetails.appState?.activeMonthId}
                        </span>
                      </h4>

                      {(selectedUserDetails.appState?.transactions || []).length === 0 ? (
                        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                          <p className="text-xs font-bold text-slate-500">কোনো লেনদেন রেকর্ড নেই (শূন্য ব্যালেন্স)</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-60 overflow-y-auto">
                          {selectedUserDetails.appState.transactions.map((tx: any) => (
                            <div
                              key={tx.id}
                              className="p-2.5 rounded-xl border border-slate-100 bg-white flex items-center justify-between text-xs shadow-2xs"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{tx.note || tx.categoryId || 'লেনদেন'}</p>
                                <p className="text-[10px] text-slate-400">{tx.date} • {tx.paymentMethod}</p>
                              </div>
                              <span
                                className={`font-black ${
                                  tx.type === 'income' ? 'text-emerald-700' : 'text-rose-600'
                                }`}
                              >
                                {tx.type === 'income' ? '+' : '-'}
                                {formatMoney(tx.amount, '৳')}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 2: RESET USER PASSWORD                              */}
      {/* ========================================================= */}
      <AnimatePresence>
        {resetModalUserId && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-indigo-500/30 text-slate-900"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <IconRenderer name="Key" className="w-4 h-4 text-indigo-600" />
                  নতুন পাসওয়ার্ড সেট করুন
                </h3>
                <button
                  onClick={() => {
                    setResetModalUserId(null);
                    setNewPasswordInput('');
                  }}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <IconRenderer name="X" className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-500 mb-4">
                অ্যাডমিন হিসেবে সরাসরি ইউজারের জন্য নতুন লগইন পাসওয়ার্ড নির্ধারণ করুন।
              </p>

              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    নতুন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)
                  </label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    placeholder="যেমন: Faisal@2026"
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setResetModalUserId(null);
                      setNewPasswordInput('');
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    disabled={isResettingPassword || !newPasswordInput}
                    className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {isResettingPassword ? 'সেভ হচ্ছে...' : 'পাসওয়ার্ড সেভ করুন'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================= */}
      {/* MODAL 3: DELETE USER CONFIRMATION                         */}
      {/* ========================================================= */}
      <AnimatePresence>
        {deleteModalUserId && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-rose-500/30 text-slate-900"
            >
              <div className="flex items-center justify-between mb-3 text-rose-700">
                <h3 className="text-sm font-black flex items-center gap-2">
                  <IconRenderer name="AlertTriangle" className="w-4 h-4" />
                  ইউজার অ্যাকাউন্ট ডিলিট
                </h3>
                <button
                  onClick={() => setDeleteModalUserId(null)}
                  className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                >
                  <IconRenderer name="X" className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-600 mb-4">
                আপনি কি নিশ্চিত? এই ইউজারের সমস্ত হিসাব-নিকাশ, লেজার ও রেকর্ড সার্ভার থেকে চিরতরে মুছে যাবে।
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteModalUserId(null)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={isDeletingUser}
                  onClick={handleDeleteUser}
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-sm cursor-pointer"
                >
                  {isDeletingUser ? 'মুছে ফেলা হচ্ছে...' : 'হ্যাঁ, মুছে ফেলুন'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
