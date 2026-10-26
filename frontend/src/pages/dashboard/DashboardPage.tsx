import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/useAuth';
import { dashboardApi, habitsApi, plansApi } from '../../api/endpoints';
import {
  Timer,
  Moon,
  CheckCircle2,
  Target,
  ArrowUpRight,
  Plus,
  Play,
  Calendar,
  Sparkles,
  Loader2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  today?: string;
  study_time_today_minutes?: number;
  study_trends_7d?: {
    date: string;
    day: string;
    minutes: number;
    hours: number;
  }[];
  sleep_today?: {
    duration_minutes: number;
    hours?: number | { hours: number; minutes: number };
    minutes?: number;
    note?: string;
  } | null;
  habits?: {
    total?: number;
    completed?: number;
    completed_today?: number;
    habits?: {
      id: number;
      name: string;
      description?: string;
      completed_today: boolean;
      current_streak: number;
    }[];
  };
  today_plan?: {
    id: number;
    title: string;
    progress: number;
    completed_count?: number;
    total_count?: number;
    items?: {
      id: number;
      title: string;
      is_completed: boolean;
    }[];
  } | null;
  active_goals?: {
    id: number;
    title: string;
    category?: string;
    progress: number;
    target_date?: string | null;
    days_remaining?: number | null;
  }[];
  nearest_deadline?: {
    id: number;
    title: string;
    target_date?: string;
    days_remaining?: number;
  } | null;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await dashboardApi.getSummary();
      setData(res as unknown as DashboardData);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggleHabit = async (habitId: number) => {
    if (!data) return;
    try {
      // Optimistic UI update
      setData((prev) => {
        if (!prev) return prev;
        const currentHabits = Array.isArray(prev.habits?.habits) ? prev.habits.habits : [];
        const updatedHabits = currentHabits.map((h) =>
          h.id === habitId ? { ...h, completed_today: !h.completed_today } : h
        );
        const completedCount = updatedHabits.filter((h) => h.completed_today).length;
        return {
          ...prev,
          habits: {
            ...prev.habits,
            total: prev.habits?.total ?? currentHabits.length,
            habits: updatedHabits,
            completed_today: completedCount,
            completed: completedCount,
          },
        };
      });
      await habitsApi.toggleToday(habitId);
    } catch {
      fetchDashboard();
    }
  };

  const handleTogglePlanItem = async (itemId: number, currentCompleted: boolean) => {
    if (!data || !data.today_plan) return;
    try {
      // Optimistic UI update
      setData((prev) => {
        if (!prev || !prev.today_plan) return prev;
        const currentItems = Array.isArray(prev.today_plan.items) ? prev.today_plan.items : [];
        const updatedItems = currentItems.map((i) =>
          i.id === itemId ? { ...i, is_completed: !currentCompleted } : i
        );
        const completedCount = updatedItems.filter((i) => i.is_completed).length;
        const totalCount = updatedItems.length;
        return {
          ...prev,
          today_plan: {
            ...prev.today_plan,
            items: updatedItems,
            completed_count: completedCount,
            total_count: totalCount,
            progress: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
          },
        };
      });
      await plansApi.updatePlanItem(itemId, { is_completed: !currentCompleted });
    } catch {
      fetchDashboard();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  // Format study hours & minutes
  const studyMins = data?.study_time_today_minutes || 0;
  const studyHours = Math.floor(studyMins / 60);
  const studyRemainingMins = studyMins % 60;

  // Format sleep
  const sleepDurationMins = data?.sleep_today?.duration_minutes || 0;
  const sleepHours = Math.floor(sleepDurationMins / 60);
  const sleepMins = sleepDurationMins % 60;

  // Safe extractions
  const habitItems = Array.isArray(data?.habits?.habits) ? data.habits.habits : [];
  const habitsTotal = data?.habits?.total ?? habitItems.length;
  const habitsCompletedToday = data?.habits?.completed_today ?? data?.habits?.completed ?? 0;
  const planItems = Array.isArray(data?.today_plan?.items) ? data.today_plan.items : [];
  const activeGoals = Array.isArray(data?.active_goals) ? data.active_goals : [];

  // Real 7-day study trend from database
  const chartData =
    data?.study_trends_7d && data.study_trends_7d.length > 0
      ? data.study_trends_7d.map((item) => ({
          day: item.day,
          date: item.date,
          hours: item.hours,
          minutes: item.minutes,
        }))
      : [
          { day: 'Mon', hours: 0, minutes: 0 },
          { day: 'Tue', hours: 0, minutes: 0 },
          { day: 'Wed', hours: 0, minutes: 0 },
          { day: 'Thu', hours: 0, minutes: 0 },
          { day: 'Fri', hours: 0, minutes: 0 },
          { day: 'Sat', hours: 0, minutes: 0 },
          { day: 'Sun', hours: 0, minutes: 0 },
        ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome & Date Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-surface-900 dark:text-white">
              Good day, {user?.display_name || 'Achiever'}
            </h1>
            <Sparkles className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary-500" />
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/study')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white shadow-md shadow-primary-500/20 active:scale-95 transition-all"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Start Timer</span>
          </button>
          <button
            onClick={() => navigate('/goals')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface-200 dark:bg-surface-800 text-surface-800 dark:text-surface-200 hover:bg-surface-300 dark:hover:bg-surface-700 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Study Card */}
        <div
          onClick={() => navigate('/study')}
          className="cursor-pointer group p-5 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-primary-500/50 transition-all hover:shadow-lg shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              Today&apos;s Study
            </span>
            <div className="w-10 h-10 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-500 flex items-center justify-center">
              <Timer className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-surface-900 dark:text-white">
              {studyHours}h {studyRemainingMins}m
            </span>
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 flex items-center justify-between">
            <span>Target: 2h 30m</span>
            <ArrowUpRight className="w-4 h-4 text-surface-400 group-hover:text-primary-500 transition-colors" />
          </p>
        </div>

        {/* Sleep Card */}
        <div
          onClick={() => navigate('/sleep')}
          className="cursor-pointer group p-5 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-indigo-500/50 transition-all hover:shadow-lg shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              Last Night Sleep
            </span>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-surface-900 dark:text-white">
              {sleepDurationMins > 0 ? `${sleepHours}h ${sleepMins}m` : 'Not logged'}
            </span>
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 flex items-center justify-between">
            <span>Quality: Optimal</span>
            <ArrowUpRight className="w-4 h-4 text-surface-400 group-hover:text-indigo-500 transition-colors" />
          </p>
        </div>

        {/* Habits Card */}
        <div
          onClick={() => navigate('/habits')}
          className="cursor-pointer group p-5 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-emerald-500/50 transition-all hover:shadow-lg shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              Habits Done
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-surface-900 dark:text-white">
              {habitsCompletedToday} / {habitsTotal}
            </span>
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 flex items-center justify-between">
            <span>
              {habitsTotal > 0
                ? `${Math.round((habitsCompletedToday / habitsTotal) * 100)}% complete`
                : 'No habits yet'}
            </span>
            <ArrowUpRight className="w-4 h-4 text-surface-400 group-hover:text-emerald-500 transition-colors" />
          </p>
        </div>

        {/* Active Goals Card */}
        <div
          onClick={() => navigate('/goals')}
          className="cursor-pointer group p-5 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 hover:border-amber-500/50 transition-all hover:shadow-lg shadow-sm"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              Active Goals
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-500 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-surface-900 dark:text-white">
              {activeGoals.length}
            </span>
          </div>
          <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 flex items-center justify-between">
            <span className="truncate">
              {data?.nearest_deadline
                ? `${data.nearest_deadline.days_remaining}d to deadline`
                : 'All on track'}
            </span>
            <ArrowUpRight className="w-4 h-4 text-surface-400 group-hover:text-amber-500 transition-colors" />
          </p>
        </div>
      </div>

      {/* Main Grid: Charts & Today's Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: 7-Day Study Hours Chart & Habit Quick Check */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chart Card */}
          <div className="p-6 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-surface-900 dark:text-white">
                  Study Hours (Last 7 Days)
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                  Consistent daily learning builds mastery
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
                Weekly Active
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis
                    dataKey="day"
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `${v}h`}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(99, 102, 241, 0.12)', radius: 8 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const p = payload[0].payload;
                        const h = Math.floor((p.minutes ?? p.hours * 60) / 60);
                        const m = Math.round((p.minutes ?? p.hours * 60) % 60);
                        return (
                          <div className="p-3 rounded-2xl bg-surface-900 dark:bg-surface-800 text-white shadow-xl border border-surface-700 text-xs space-y-1">
                            <p className="font-semibold text-surface-300">
                              {p.day} {p.date ? `(${p.date})` : ''}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-surface-400">Study Time:</span>
                              <span className="font-bold text-primary-400 text-sm">
                                {h}h {m}m ({p.hours}h)
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar
                    dataKey="hours"
                    fill="url(#primaryGradient)"
                    radius={[8, 8, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="primaryGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Habit Quick-Check List */}
          <div className="p-6 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-surface-900 dark:text-white">
                  Today&apos;s Habits
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
                  Click checkbox to complete for today
                </p>
              </div>
              <button
                onClick={() => navigate('/habits')}
                className="text-xs text-primary-500 hover:underline font-semibold"
              >
                View all habits →
              </button>
            </div>

            <div className="space-y-2">
              {habitItems.length === 0 ? (
                <p className="text-xs text-surface-400 py-4 text-center">
                  No habits set up yet. Create your first habit!
                </p>
              ) : (
                habitItems.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => handleToggleHabit(h.id)}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      h.completed_today
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50'
                        : 'bg-surface-100/60 dark:bg-surface-800/40 border-surface-200 dark:border-surface-700/60 hover:border-primary-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${
                          h.completed_today
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-surface-400 dark:border-surface-600'
                        }`}
                      >
                        {h.completed_today && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            h.completed_today
                              ? 'line-through text-surface-500 dark:text-surface-400'
                              : 'text-surface-900 dark:text-white'
                          }`}
                        >
                          {h.name}
                        </p>
                        {h.description && (
                          <p className="text-xs text-surface-400 truncate max-w-sm">
                            {h.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-amber-500 text-xs font-semibold">
                      <span>{h.current_streak}d streak</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Today's Plan & Active Goals */}
        <div className="space-y-6">
          {/* Today's Plan Checklist */}
          <div className="p-6 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-surface-900 dark:text-white">
                Today&apos;s Plan
              </h3>
              <button
                onClick={() => navigate('/plans')}
                className="text-xs text-primary-500 hover:underline font-semibold"
              >
                Full plan →
              </button>
            </div>

            <div className="space-y-2">
              {planItems.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-surface-400">No tasks planned for today.</p>
                  <button
                    onClick={() => navigate('/plans')}
                    className="mt-2 text-xs font-semibold text-primary-500 hover:underline"
                  >
                    + Add tasks to daily plan
                  </button>
                </div>
              ) : (
                planItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleTogglePlanItem(item.id, item.is_completed)}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800/60 transition-colors cursor-pointer"
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        item.is_completed
                          ? 'bg-primary-500 border-primary-500 text-white'
                          : 'border-surface-400 dark:border-surface-600'
                      }`}
                    >
                      {item.is_completed && <CheckCircle2 className="w-3 h-3" />}
                    </div>
                    <span
                      className={`text-xs ${
                        item.is_completed
                          ? 'line-through text-surface-400'
                          : 'text-surface-800 dark:text-surface-200 font-medium'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Goals Mini Cards */}
          <div className="p-6 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-surface-900 dark:text-white">
                Active Goals
              </h3>
              <button
                onClick={() => navigate('/goals')}
                className="text-xs text-primary-500 hover:underline font-semibold"
              >
                All goals →
              </button>
            </div>

            <div className="space-y-3">
              {activeGoals.length === 0 ? (
                <p className="text-xs text-surface-400 py-4 text-center">
                  No active goals. Set your target!
                </p>
              ) : (
                activeGoals.slice(0, 3).map((goal) => (
                  <div
                    key={goal.id}
                    onClick={() => navigate('/goals')}
                    className="p-3.5 rounded-2xl bg-surface-100/70 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700/60 hover:border-primary-500/40 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-bold text-surface-900 dark:text-white truncate max-w-[180px]">
                        {goal.title}
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
                        {goal.progress}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-surface-200 dark:bg-surface-700 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>

                    {goal.days_remaining !== null && goal.days_remaining !== undefined && (
                      <p className="text-[10px] text-surface-400 mt-2">
                        ⏳ {goal.days_remaining > 0 ? `${goal.days_remaining} days left` : 'Due today'}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
