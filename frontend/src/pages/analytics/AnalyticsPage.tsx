import React, { useState, useEffect } from 'react';
import { statisticsApi } from '../../api/endpoints';
import { Button } from '../../components/ui/Button';
import {
  Download,
  Flame,
  Moon,
  Timer,
  Target,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface StatsOverview {
  study_last_30_days_minutes: number;
  average_sleep_minutes: number;
  sleep_records_last_30_days: number;
  active_habits: number;
  habits_completed_today: number;
  goals: {
    total: number;
    completed: number;
    active: number;
  };
}

export const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    statisticsApi
      .getOverview()
      .then((data) => setStats(data as StatsOverview))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleExportData = () => {
    const exportObj = {
      exported_at: new Date().toISOString(),
      stats_overview: stats,
    };
    const blob = new Blob([JSON.stringify(exportObj, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowpulse_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  const studyHours = stats ? Math.floor(stats.study_last_30_days_minutes / 60) : 0;
  const studyMins = stats ? stats.study_last_30_days_minutes % 60 : 0;

  const sleepHours = stats ? Math.floor(stats.average_sleep_minutes / 60) : 0;
  const sleepMins = stats ? stats.average_sleep_minutes % 60 : 0;

  // Pie chart data for Goals
  const goalPieData = [
    { name: 'Completed', value: stats?.goals?.completed || 0, color: '#10b981' },
    { name: 'In Progress', value: stats?.goals?.active || 0, color: '#4f46e5' },
  ];

  // Historical simulated weekly aggregate data
  const monthlyTrends = [
    { week: 'Week 1', study: 14.5, sleep: 7.6 },
    { week: 'Week 2', study: 18.2, sleep: 7.8 },
    { week: 'Week 3', study: 16.0, sleep: 7.4 },
    { week: 'Week 4', study: 21.5, sleep: 8.0 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-surface-900 dark:text-white">
            Analytics &amp; Productivity Score
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1">
            Data-driven insights into your focus, habits, and physical recovery
          </p>
        </div>

        <Button
          onClick={handleExportData}
          variant="secondary"
          leftIcon={<Download className="w-4 h-4" />}
        >
          Export Data (JSON)
        </Button>
      </div>

      {/* Productivity Score Hero Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-primary-950/40 via-surface-900 to-indigo-950/40 border border-primary-500/30 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-400">
                Composite Productivity Index
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs border border-emerald-500/30">
                Peak Flow State
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              88 / 100 Flow Score
            </h2>
            <p className="text-xs sm:text-sm text-surface-300 max-w-xl mt-2 leading-relaxed">
              Your consistency is in the top tier. Strong daily study volume (+25h/week),
              consistent 7.8h sleep recovery, and an unbroken 10-day deep work habit streak.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-black text-primary-400">92%</div>
              <div className="text-[11px] text-surface-400 uppercase font-semibold mt-0.5">
                Habit Rate
              </div>
            </div>
            <div className="w-px h-10 bg-surface-800" />
            <div className="text-center">
              <div className="text-2xl font-black text-emerald-400">7.7h</div>
              <div className="text-[11px] text-surface-400 uppercase font-semibold mt-0.5">
                Avg Sleep
              </div>
            </div>
            <div className="w-px h-10 bg-surface-800" />
            <div className="text-center">
              <div className="text-2xl font-black text-amber-400">{studyHours}h</div>
              <div className="text-[11px] text-surface-400 uppercase font-semibold mt-0.5">
                Study 30d
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950 text-sky-500 flex items-center justify-center">
            <Timer className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase">Study (30 Days)</p>
            <p className="text-2xl font-black text-surface-900 dark:text-white">
              {studyHours}h {studyMins}m
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase">Average Sleep</p>
            <p className="text-2xl font-black text-surface-900 dark:text-white">
              {sleepHours}h {sleepMins}m
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase">Habits Today</p>
            <p className="text-2xl font-black text-emerald-500">
              {stats?.habits_completed_today || 0} / {stats?.active_habits || 0}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-500 flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase">Goals Completed</p>
            <p className="text-2xl font-black text-surface-900 dark:text-white">
              {stats?.goals?.completed || 0} / {stats?.goals?.total || 0}
            </p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Study Progression Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-surface-900 dark:text-white">
                Weekly Study Time vs Recovery
              </h3>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                Hours spent in deep work per week
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-500">
              <TrendingUp className="w-4 h-4" />
              <span>+18% this month</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}h`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`${val} hrs`, 'Study Volume']}
                />
                <Bar dataKey="study" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Goals Status Breakdown Pie */}
        <div className="p-6 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-surface-900 dark:text-white mb-1">
              Goals Completion Status
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Total active and completed milestones
            </p>
          </div>

          <div className="h-48 w-full my-auto flex items-center justify-center">
            {stats?.goals.total === 0 ? (
              <p className="text-xs text-surface-400">No goals added yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={goalPieData}
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {goalPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '12px',
                      border: '1px solid #334155',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 border-t border-surface-200 dark:border-surface-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-surface-700 dark:text-surface-300 font-medium">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              <span className="text-surface-700 dark:text-surface-300 font-medium">In Progress</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
