import React, { useState, useEffect } from 'react';
import { plansApi } from '../../api/endpoints';
import type { DailyPlan, DailyTask } from '../../types';
import { Button } from '../../components/ui/Button';
import {
  CalendarDays,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Repeat,
} from 'lucide-react';

export const PlansPage: React.FC = () => {
  const [periodType, setPeriodType] = useState<'daily' | 'monthly' | 'yearly'>('daily');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const dateStr = currentDate.toISOString().split('T')[0];

  const fetchPlan = async () => {
    setIsLoading(true);
    try {
      const plans = await plansApi.listPlans({
        plan_type: periodType,
        ...(periodType === 'daily' ? { date: dateStr } : {}),
      });
      if (plans && plans.length > 0) {
        const first = plans[0];
        const rawTasks = Array.isArray(first.tasks)
          ? first.tasks
          : Array.isArray((first as unknown as { items?: DailyTask[] }).items)
          ? (first as unknown as { items: DailyTask[] }).items
          : [];
        setPlan({ ...first, tasks: rawTasks });
      } else {
        // Create an empty plan for this period
        const newPlan = await plansApi.createPlan({
          date: dateStr,
          title: `${periodType.charAt(0).toUpperCase() + periodType.slice(1)} Plan — ${dateStr}`,
          tasks: [],
        } as unknown as Partial<DailyPlan>);
        const rawTasks = Array.isArray(newPlan.tasks)
          ? newPlan.tasks
          : Array.isArray((newPlan as unknown as { items?: DailyTask[] }).items)
          ? (newPlan as unknown as { items: DailyTask[] }).items
          : [];
        setPlan({ ...newPlan, tasks: rawTasks });
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, [periodType, dateStr]);

  const handleToggleTask = async (taskId: number, currentCompleted: boolean) => {
    try {
      await plansApi.updatePlanItem(taskId, { is_completed: !currentCompleted });
      // Optimistic update
      setPlan((prev) => {
        if (!prev) return prev;
        const currentTasks = Array.isArray(prev.tasks)
          ? prev.tasks
          : Array.isArray((prev as unknown as { items?: DailyTask[] }).items)
          ? (prev as unknown as { items: DailyTask[] }).items
          : [];
        const updated = currentTasks.map((t) =>
          t.id === taskId ? { ...t, is_completed: !currentCompleted } : t
        );
        return {
          ...prev,
          tasks: updated,
          items: updated,
        } as unknown as DailyPlan;
      });
    } catch {
      fetchPlan();
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !plan) return;

    setIsAdding(true);
    try {
      const createdItem = await plansApi.addPlanItem({
        plan: plan.id,
        title: newItemTitle.trim(),
        is_completed: false,
      });
      setPlan((prev) => {
        if (!prev) return prev;
        const currentTasks = Array.isArray(prev.tasks)
          ? prev.tasks
          : Array.isArray((prev as unknown as { items?: DailyTask[] }).items)
          ? (prev as unknown as { items: DailyTask[] }).items
          : [];
        const updated = [...currentTasks, createdItem];
        return {
          ...prev,
          tasks: updated,
          items: updated,
        } as unknown as DailyPlan;
      });
      setNewItemTitle('');
    } catch {
      fetchPlan();
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteItem = async (taskId: number) => {
    try {
      await plansApi.deletePlanItem(taskId);
      setPlan((prev) => {
        if (!prev) return prev;
        const currentTasks = Array.isArray(prev.tasks)
          ? prev.tasks
          : Array.isArray((prev as unknown as { items?: DailyTask[] }).items)
          ? (prev as unknown as { items: DailyTask[] }).items
          : [];
        const updated = currentTasks.filter((t) => t.id !== taskId);
        return {
          ...prev,
          tasks: updated,
          items: updated,
        } as unknown as DailyPlan;
      });
    } catch {
      fetchPlan();
    }
  };

  const handlePrevDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const handleNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const tasksList: DailyTask[] = Array.isArray(plan?.tasks)
    ? plan.tasks
    : Array.isArray((plan as unknown as { items?: DailyTask[] })?.items)
    ? (plan as unknown as { items: DailyTask[] }).items
    : [];
  const completedCount = tasksList.filter((t) => t.is_completed).length;
  const totalCount = tasksList.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-surface-900 dark:text-white">
            Plans &amp; Schedules
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1">
            Structure your days, months, and years with focused intent
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center p-1 rounded-xl bg-surface-200 dark:bg-surface-800 text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setPeriodType('daily')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              periodType === 'daily'
                ? 'bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm'
                : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            Daily Plan
          </button>
          <button
            onClick={() => setPeriodType('monthly')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              periodType === 'monthly'
                ? 'bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm'
                : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            Monthly Themes
          </button>
          <button
            onClick={() => setPeriodType('yearly')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              periodType === 'yearly'
                ? 'bg-surface-50 dark:bg-surface-900 text-surface-900 dark:text-white shadow-sm'
                : 'text-surface-500 hover:text-surface-900 dark:hover:text-white'
            }`}
          >
            Yearly Vision
          </button>
        </div>
      </div>

      {/* Date Navigation Bar (for Daily mode) */}
      {periodType === 'daily' && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-surface-600 dark:text-surface-300" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1 rounded-xl text-xs font-semibold bg-surface-200/70 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-300"
            >
              Today
            </button>
            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-800 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-surface-600 dark:text-surface-300" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-500" />
            <span className="font-bold text-sm text-surface-900 dark:text-white">
              {currentDate.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
          </div>

          <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400">
            {completedCount} / {totalCount} done ({progressPercent}%)
          </div>
        </div>
      )}

      {/* Main Plan Card */}
      <div className="p-6 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
        {isLoading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-surface-900 dark:text-white">
                {plan?.notes ||
                  (periodType === 'daily'
                    ? "Today's Agenda & Action Items"
                    : periodType === 'monthly'
                    ? 'Month Focus & Milestones'
                    : 'Annual Vision & Objectives')}
              </h3>
            </div>

            {/* Task list */}
            <div className="space-y-2 mb-6">
              {tasksList.length === 0 ? (
                <div className="text-center py-10">
                  <CalendarDays className="w-10 h-10 text-surface-400 mx-auto mb-2" />
                  <p className="text-xs text-surface-400">
                    No items in this plan yet. Add your priorities below!
                  </p>
                </div>
              ) : (
                tasksList.map((task: DailyTask) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-surface-100/60 dark:bg-surface-800/40 border border-surface-200 dark:border-surface-700/60 hover:border-primary-400 transition-all group"
                  >
                    <div
                      onClick={() => handleToggleTask(task.id, task.is_completed)}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center transition-colors ${
                          task.is_completed ? 'text-primary-500' : 'text-surface-400'
                        }`}
                      >
                        {task.is_completed ? (
                          <CheckCircle2 className="w-5 h-5 text-primary-500" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </div>
                      <span
                        className={`text-sm font-medium ${
                          task.is_completed
                            ? 'line-through text-surface-400'
                            : 'text-surface-900 dark:text-white'
                        }`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteItem(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-surface-400 hover:text-rose-500 transition-opacity"
                      title="Delete item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add task form */}
            <form onSubmit={handleAddItem} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={
                  periodType === 'daily'
                    ? 'Add task for today (e.g. Finish Chapter 4)...'
                    : 'Add objective or milestone...'
                }
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button type="submit" isLoading={isAdding} leftIcon={<Plus className="w-4 h-4" />}>
                Add Item
              </Button>
            </form>
          </div>
        )}
      </div>

      {/* Strategy Tip Box */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-primary-950/20 via-surface-900 to-indigo-950/20 border border-primary-500/20 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-primary-600/20 text-primary-400 flex items-center justify-center shrink-0">
          <Repeat className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-sm text-surface-900 dark:text-white">
            Daily Execution Tip: The Rule of 3
          </h4>
          <p className="text-xs text-surface-400 mt-1 leading-relaxed">
            Every morning, identify the **3 most consequential tasks** that would make today a win,
            regardless of what else happens. Complete those first before checking email or messages.
          </p>
        </div>
      </div>
    </div>
  );
};
