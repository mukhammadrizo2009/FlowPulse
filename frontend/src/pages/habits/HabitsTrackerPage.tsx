import React, { useState, useEffect } from 'react';
import { habitsApi } from '../../api/endpoints';
import type { Habit } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  CheckSquare,
  Plus,
  Flame,
  Trash2,
  Check,
  Minus,
  Loader2,
  Trophy,
} from 'lucide-react';

export const HabitsTrackerPage: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // optimistic local state: habitId -> status
  const [localStatus, setLocalStatus] = useState<Record<string, 'none' | 'partial' | 'done'>>({});

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [habitName, setHabitName] = useState('');
  const [habitDesc, setHabitDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchHabits = async () => {
    try {
      const data = await habitsApi.list();
      setHabits(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  // Compute past 7 days dates for matrix
  const today = new Date();
  const past7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    return {
      dateStr: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: d.getDate(),
      isToday: i === 6,
    };
  });

  const handleToggleCompletion = async (habitId: number, dateStr: string, isToday: boolean) => {
    if (!isToday) {
      // For past days just log completion (toggle existing)
      try {
        await habitsApi.logCompletion(habitId, dateStr);
        fetchHabits();
      } catch {
        fetchHabits();
      }
      return;
    }

    // For today: cycle none → partial → done → none optimistically
    const key = `${habitId}_today`;
    const current = localStatus[key] ?? habits.find((h) => h.id === habitId)?.today_status ?? 'none';
    const next = current === 'none' ? 'partial' : current === 'partial' ? 'done' : 'none';

    // Optimistic update
    setLocalStatus((prev) => ({ ...prev, [key]: next }));

    try {
      await habitsApi.setStatusToday(habitId, next);
      fetchHabits();
    } catch {
      // Revert on error
      setLocalStatus((prev) => ({ ...prev, [key]: current }));
    }
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    setIsSubmitting(true);
    try {
      await habitsApi.create({
        name: habitName.trim(),
        description: habitDesc.trim(),
      });
      setIsModalOpen(false);
      setHabitName('');
      setHabitDesc('');
      fetchHabits();
    } catch {
      // ignore
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHabit = async (id: number) => {
    if (!confirm('Are you sure you want to delete this habit?')) return;
    try {
      await habitsApi.delete(id);
      setHabits((prev) => prev.filter((h) => h.id !== id));
    } catch {
      fetchHabits();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-surface-900 dark:text-white">
            Daily Habit Tracker
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1">
            Build unshakeable discipline with daily streaks &amp; weekly consistency
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Habit
        </Button>
      </div>

      {/* Habit Weekly Matrix */}
      <div className="p-6 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary-500" />
            <h3 className="font-bold text-base text-surface-900 dark:text-white">
              7-Day Consistency Grid
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-surface-400 font-medium">
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-4 rounded-md bg-surface-200 dark:bg-surface-700" />
              None
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-flex w-4 h-4 rounded-md bg-amber-400 items-center justify-center">
                <Minus className="w-2.5 h-2.5 text-white stroke-[3]" />
              </span>
              Partial
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-flex w-4 h-4 rounded-md bg-emerald-500 items-center justify-center">
                <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
              </span>
              Done
            </span>
          </div>
        </div>

        {habits.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-xs text-surface-400">No habits added yet.</p>
            <Button
              className="mt-3"
              size="sm"
              onClick={() => setIsModalOpen(true)}
            >
              + Create First Habit
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-200 dark:border-surface-800 text-xs text-surface-400 font-semibold">
                  <th className="py-3 px-4 min-w-[200px]">Habit</th>
                  <th className="py-3 px-4 text-center">Streak</th>
                  {past7Days.map((d) => (
                    <th
                      key={d.dateStr}
                      className={`py-3 px-2 text-center min-w-[50px] ${
                        d.isToday ? 'text-primary-500 font-bold' : ''
                      }`}
                    >
                      <span className="block text-[10px] uppercase">{d.dayName}</span>
                      <span className="text-xs">{d.dayNumber}</span>
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800 text-sm">
                {habits.map((h) => {
                  return (
                    <tr
                      key={h.id}
                      className="hover:bg-surface-100/50 dark:hover:bg-surface-800/40 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <p className="font-bold text-surface-900 dark:text-white text-xs sm:text-sm">
                          {h.name}
                        </p>
                        {h.description && (
                          <p className="text-xs text-surface-400 truncate max-w-xs mt-0.5">
                            {h.description}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-xs font-bold shadow-sm">
                          <Flame className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{h.current_streak}d</span>
                        </div>
                      </td>

                      {past7Days.map((d) => {
                        const key = `${h.id}_today`;
                        // Use local optimistic state for today, else check completions
                        let cellStatus: 'none' | 'partial' | 'done';
                        if (d.isToday) {
                          cellStatus = localStatus[key] ?? h.today_status ?? 'none';
                        } else {
                          // Check completions array for past days
                          const completionForDay = (h.completions ?? []).find(
                            (c) => (c.completion_date ?? c.date) === d.dateStr
                          );
                          cellStatus = completionForDay?.status ?? 'none';
                        }

                        return (
                          <td key={d.dateStr} className="py-4 px-2 text-center">
                            <button
                              onClick={() => handleToggleCompletion(h.id, d.dateStr, d.isToday)}
                              title={
                                cellStatus === 'none' ? 'Click to mark partial'
                                : cellStatus === 'partial' ? 'Click to mark done'
                                : 'Click to clear'
                              }
                              className={`w-7 h-7 mx-auto rounded-xl flex items-center justify-center transition-all duration-200 ${
                                cellStatus === 'done'
                                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25 scale-105'
                                  : cellStatus === 'partial'
                                  ? 'bg-amber-400 text-white shadow-md shadow-amber-400/25'
                                  : 'bg-surface-200/60 dark:bg-surface-800/80 hover:bg-surface-300 dark:hover:bg-surface-700 text-surface-400'
                              }`}
                            >
                              {cellStatus === 'done' && <Check className="w-4 h-4 stroke-[3]" />}
                              {cellStatus === 'partial' && <Minus className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                          </td>
                        );
                      })}

                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleDeleteHabit(h.id)}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete habit"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Habit Insights Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-500 flex items-center justify-center shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-surface-900 dark:text-white">
              The Two-Day Rule
            </h4>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 leading-relaxed">
              Never miss twice in a row. Missing one day is an accident; missing two is the start
              of a new habit of skipping. Keep your streak alive today!
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950 text-primary-500 flex items-center justify-center shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-surface-900 dark:text-white">
              Habit Stacking
            </h4>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-1 leading-relaxed">
              Pair your new habit immediately after an existing anchor habit (e.g. &ldquo;After I finish my morning coffee, I will write 200 words of notes&rdquo;).
            </p>
          </div>
        </div>
      </div>

      {/* Add Habit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Habit"
        description="Choose a specific, actionable behavior to build into your daily routine."
      >
        <form onSubmit={handleCreateHabit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
              Habit Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Read 20 pages of technical books"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
              Description or Trigger
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Right after morning coffee, with zero phone notifications"
              value={habitDesc}
              onChange={(e) => setHabitDesc(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Create Habit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
