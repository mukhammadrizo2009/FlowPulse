import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../store/useAuth';
import { statisticsApi } from '../../api/endpoints';
import type { PlatformStats } from '../../types';
import {
  Users,
  UserCheck,
  UserPlus,
  Activity,
  ShieldCheck,
  TrendingUp,
  Clock,
  Moon,
  Calendar,
  Flame,
  RefreshCw,
  Search,
  ArrowUpRight,
  ShieldAlert,
  BookOpen,
  Target,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Button } from '../../components/ui/Button';

export const PlatformAnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<PlatformStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [chartView, setChartView] = useState<'activity' | 'growth'>('activity');

  const isAdmin = Boolean(
    user?.is_staff || user?.is_superuser || user?.email === 'meliqulovich@gmail.com'
  );

  const fetchStats = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const res = await statisticsApi.getPlatformStats();
      setData(res);
    } catch (err) {
      console.error('Failed to load platform stats', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Filter recent users by search query
  const filteredUsers = useMemo(() => {
    if (!data?.recent_users) return [];
    if (!searchTerm.trim()) return data.recent_users;
    const q = searchTerm.toLowerCase();
    return data.recent_users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.display_name.toLowerCase().includes(q)
    );
  }, [data?.recent_users, searchTerm]);

  // Non-admin Access Denied Guard
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-2">
          Ruxsat Cheklangan
        </h2>
        <p className="text-surface-600 dark:text-surface-400 max-w-md mb-6">
          Ushbu sahifa faqat FlowPulse tizimi administratorlari uchun mo'ljallangan. Platforma statistikasini ko'rish uchun admin hisob bilan kiring.
        </p>
        <Button onClick={() => (window.location.href = '/')}>
          Bosh Sahifaga Qaytish
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-primary-500/20 border-t-primary-500 animate-spin" />
          <ShieldCheck className="w-6 h-6 text-primary-500 absolute inset-0 m-auto" />
        </div>
        <p className="mt-4 text-sm text-surface-500 font-medium">
          Platforma ko'rsatkichlari yuklanmoqda...
        </p>
      </div>
    );
  }

  const userStats = data?.user_stats;
  const engagement = data?.engagement;
  const trends = data?.daily_trends || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface-900 via-surface-900 to-indigo-950 p-6 sm:p-8 text-white border border-surface-800 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Administrator Nazorat Paneli
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              FlowPulse Platforma Statistikasi
            </h1>
            <p className="text-surface-300 text-sm mt-1 max-w-xl">
              Foydalanuvchilar soni, kunlik faollik, odatlar, o'rganish soatlari va tizimning to'liq metrikalari jonli ko'rinishda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchStats(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-white text-sm font-semibold transition-all backdrop-blur-md hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Yangilash
            </button>
            <div className="text-right hidden sm:block">
              <div className="text-xs text-surface-400">Oxirgi sinxronizatsiya</div>
              <div className="text-xs font-mono text-surface-200">
                {data?.generated_at ? new Date(data.generated_at).toLocaleTimeString() : 'Hozir'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Users */}
        <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm relative overflow-hidden group hover:border-primary-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
              Jami Foydalanuvchilar
            </span>
            <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-500 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-surface-900 dark:text-white tracking-tight">
            {userStats?.total_users || 0}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
            <UserPlus className="w-3.5 h-3.5" />
            <span>+{userStats?.new_7d || 0} yangi bu hafta</span>
          </div>
        </div>

        {/* Active Users Today */}
        <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
              Faol Foydalanuvchilar (Bugun)
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-surface-900 dark:text-white tracking-tight">
            {userStats?.active_today || 0}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-surface-500 dark:text-surface-400">
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Oxirgi 24 soat ichida faol</span>
          </div>
        </div>

        {/* Active 7 Days */}
        <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
              7 Kunlik Faol Userlar
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-surface-900 dark:text-white tracking-tight">
            {userStats?.active_7d || 0}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-500 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Haftalik faol auditoriya</span>
          </div>
        </div>

        {/* Active 30 Days */}
        <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
              30 Kunlik Faol Userlar
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-surface-900 dark:text-white tracking-tight">
            {userStats?.active_30d || 0}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Oylik umumiy qamrov</span>
          </div>
        </div>
      </div>

      {/* Interactive Activity Trend Chart */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-500" />
              So'nggi 14 Kunlik Platforma Dinamikasi
            </h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
              O'rganish soatlari, odatlarning bajarilishi va yangi foydalanuvchilar oqimi
            </p>
          </div>

          <div className="flex items-center bg-surface-100 dark:bg-surface-800 p-1 rounded-xl">
            <button
              onClick={() => setChartView('activity')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                chartView === 'activity'
                  ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm'
                  : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
              }`}
            >
              Faollik (Soat / Odatlar)
            </button>
            <button
              onClick={() => setChartView('growth')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                chartView === 'growth'
                  ? 'bg-white dark:bg-surface-700 text-surface-900 dark:text-white shadow-sm'
                  : 'text-surface-500 hover:text-surface-800 dark:hover:text-surface-200'
              }`}
            >
              Yangi Foydalanuvchilar
            </button>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'activity' ? (
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="habitGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="formatted_date" stroke="#888888" fontSize={12} tickLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="study_hours"
                  name="O'rganish (soat)"
                  stroke="#6366f1"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#studyGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="habit_completions"
                  name="Bajarilgan odatlar"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#habitGradient)"
                />
              </AreaChart>
            ) : (
              <BarChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="formatted_date" stroke="#888888" fontSize={12} tickLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend />
                <Bar
                  dataKey="new_users"
                  name="Yangi foydalanuvchilar"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                />
                <Bar
                  dataKey="sleep_logs"
                  name="Uyqu yozuvlari"
                  fill="#a855f7"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Engagement Modules Summary (4 Detailed Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Habits Module */}
        <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-surface-900 dark:text-white text-sm">Odatlar Moduli</h3>
              <p className="text-xs text-surface-500">Kunlik odatlar intizomi</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-surface-200 dark:border-surface-800 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-surface-500">Jami odatlar:</span>
              <span className="font-bold text-surface-900 dark:text-white">{engagement?.habits.total_habits || 0} ta</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-surface-500">Faol odatlar:</span>
              <span className="font-bold text-emerald-500">{engagement?.habits.active_habits || 0} ta</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-surface-500">Bugungi bajarilish:</span>
              <span className="font-bold text-surface-900 dark:text-white">{engagement?.habits.completions_today || 0} marta</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-surface-500">Umumiy bajarilish:</span>
              <span className="font-bold text-surface-900 dark:text-white">{engagement?.habits.completions_total || 0} marta</span>
            </div>
          </div>
        </div>

        {/* Study Module */}
        <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-surface-900 dark:text-white text-sm">O'rganish & Dars</h3>
              <p className="text-xs text-surface-500">Fokus va ta'lim soatlari</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-surface-200 dark:border-surface-800 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-surface-500">Jami soat:</span>
              <span className="font-bold text-indigo-500">{engagement?.study.total_hours || 0} soat</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-surface-500">Dars sessiyalari:</span>
              <span className="font-bold text-surface-900 dark:text-white">{engagement?.study.total_sessions || 0} ta</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-surface-500">Bugungi soat:</span>
              <span className="font-bold text-surface-900 dark:text-white">{engagement?.study.today_hours || 0} soat</span>
            </div>
          </div>
        </div>

        {/* Sleep Module */}
        <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-surface-900 dark:text-white text-sm">Uyqu Tizimi</h3>
              <p className="text-xs text-surface-500">Tiklanish va dam olish</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-surface-200 dark:border-surface-800 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-surface-500">Jami yozuvlar:</span>
              <span className="font-bold text-surface-900 dark:text-white">{engagement?.sleep.total_logs || 0} ta</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-surface-500">O'rtacha uyqu:</span>
              <span className="font-bold text-purple-500">{engagement?.sleep.avg_hours || 0} soat/kun</span>
            </div>
          </div>
        </div>

        {/* Goals & Plans Module */}
        <div className="p-6 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-surface-900 dark:text-white text-sm">Maqsadlar & Rejalar</h3>
              <p className="text-xs text-surface-500">Muvaffaqiyatlar va vazifalar</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-surface-200 dark:border-surface-800 text-xs">
            <div className="flex justify-between py-1">
              <span className="text-surface-500">Jami maqsadlar:</span>
              <span className="font-bold text-surface-900 dark:text-white">{engagement?.goals_and_plans.total_goals || 0} ta</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-surface-500">Erishilgan maqsadlar:</span>
              <span className="font-bold text-emerald-500">{engagement?.goals_and_plans.completed_goals || 0} ta</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-surface-500">Tuzilgan rejalar:</span>
              <span className="font-bold text-surface-900 dark:text-white">{engagement?.goals_and_plans.total_plans || 0} ta</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-surface-500">Bajarilgan topshiriqlar:</span>
              <span className="font-bold text-amber-500">{engagement?.goals_and_plans.completed_plan_tasks || 0} ta</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Users Table */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-500" />
              Foydalanuvchilar Ro'yxati va Faolligi ({filteredUsers.length})
            </h2>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1">
              Platformaga a'zo bo'lgan foydalanuvchilar, ularning roli, oxirgi kirishi va faoliyati
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Email yoki ism bo'yicha qidirish..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-surface-200 dark:border-surface-800 text-surface-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Foydalanuvchi</th>
                <th className="py-3 px-4">Roli</th>
                <th className="py-3 px-4">Holati</th>
                <th className="py-3 px-4">Qo'shilgan Sana</th>
                <th className="py-3 px-4">Oxirgi Kirish</th>
                <th className="py-3 px-4 text-right">Odatlar / O'rganish</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100 dark:divide-surface-800/60">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-surface-400">
                    Hech qanday foydalanuvchi topilmadi
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const getInitials = (name?: string, email?: string) => {
                    if (name && name.trim()) {
                      const parts = name.trim().split(/\s+/);
                      if (parts.length >= 2) {
                        return (parts[0][0] + parts[1][0]).toUpperCase();
                      }
                      return parts[0].slice(0, 2).toUpperCase();
                    }
                    return (email ? email.slice(0, 2) : 'FP').toUpperCase();
                  };
                  const isUserAdmin = u.is_staff || u.email === 'meliqulovich@gmail.com';

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-surface-100/50 dark:hover:bg-surface-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm shrink-0 select-none">
                            {getInitials(u.display_name, u.email)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-surface-900 dark:text-white truncate">
                              {u.display_name || u.email.split('@')[0]}
                            </div>
                            <div className="text-surface-400 text-[11px] font-mono truncate">{u.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isUserAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-200/60 dark:bg-surface-800 text-surface-600 dark:text-surface-300">
                            Foydalanuvchi
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-500 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Faol
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-surface-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-surface-400" />
                            Nofaol
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-surface-600 dark:text-surface-300">
                        {new Date(u.date_joined).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-surface-600 dark:text-surface-300">
                        {u.last_login ? (
                          <div className="flex items-center gap-1 text-[11px]">
                            <Clock className="w-3 h-3 text-surface-400" />
                            {new Date(u.last_login).toLocaleString()}
                          </div>
                        ) : (
                          <span className="text-surface-400 italic">Hali kirmagan</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium">
                        <span className="text-emerald-500">{u.habits_count} odat</span>
                        <span className="mx-1.5 text-surface-300 dark:text-surface-700">|</span>
                        <span className="text-indigo-500">{u.study_hours} soat</span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlatformAnalyticsPage;
