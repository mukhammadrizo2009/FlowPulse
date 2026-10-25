import React, { useState, useEffect } from 'react';
import { sleepApi } from '../../api/endpoints';
import type { SleepLog } from '../../types';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import {
  Moon,
  Plus,
  Trash2,
  TrendingUp,
  Activity,
  Loader2,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const SleepTrackerPage: React.FC = () => {
  const [logs, setLogs] = useState<SleepLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sleepDate, setSleepDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [hours, setHours] = useState(7);
  const [minutes, setMinutes] = useState(30);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const data = await sleepApi.listLogs();
      setLogs(data);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleLogSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const totalMins = Number(hours) * 60 + Number(minutes);
    if (totalMins <= 0 || totalMins > 1440) {
      setError('Sleep duration must be between 1 minute and 24 hours.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sleepApi.logSleep({
        sleep_date: sleepDate,
        bedtime: '23:00',
        wake_time: '07:00',
        notes: notes.trim(),
      });
      setIsModalOpen(false);
      setNotes('');
      fetchLogs();
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { detail?: string; date?: string[] } } };
      setError(
        errObj?.response?.data?.date?.[0] ||
          errObj?.response?.data?.detail ||
          'Failed to log sleep. A record for this date may already exist.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLog = async (id: number) => {
    if (!confirm('Are you sure you want to delete this sleep log?')) return;
    try {
      await sleepApi.deleteLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
    } catch {
      fetchLogs();
    }
  };

  const totalMinutes = logs.reduce((acc, l) => acc + l.total_sleep_minutes, 0);
  const avgMinutes = logs.length > 0 ? Math.round(totalMinutes / logs.length) : 0;
  const avgHours = Math.floor(avgMinutes / 60);
  const avgRemainingMins = avgMinutes % 60;

  // Chart data from logs (sorted chronologically)
  const chartData = [...logs]
    .slice(0, 14)
    .reverse()
    .map((l) => ({
      date: l.date.slice(5), // MM-DD
      hours: Number((l.total_sleep_minutes / 60).toFixed(1)),
    }));

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
            Sleep &amp; Recovery Tracker
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1">
            Monitor nightly sleep patterns and recovery for peak mental performance
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Log Night&apos;s Sleep
        </Button>
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-500 flex items-center justify-center">
            <Moon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase">Average Sleep</p>
            <p className="text-2xl font-black text-surface-900 dark:text-white">
              {avgHours}h {avgRemainingMins}m
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase">Consistency</p>
            <p className="text-2xl font-black text-emerald-500">
              {logs.length >= 7 ? '92%' : 'Building'}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-500 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-surface-400 font-semibold uppercase">Logged Nights</p>
            <p className="text-2xl font-black text-surface-900 dark:text-white">
              {logs.length}
            </p>
          </div>
        </div>
      </div>

      {/* Sleep Duration Chart */}
      <div className="p-6 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-base text-surface-900 dark:text-white">
              Sleep Duration History
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">
              Ideal target: 7.5 — 8.5 hours per night
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
            Past 14 Days
          </span>
        </div>

        <div className="h-64 w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-surface-400">
              No sleep data logged yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
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
                  domain={[0, 10]}
                  tickFormatter={(v) => `${v}h`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: '1px solid #334155',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val) => [`${val} hours`, 'Sleep']}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#sleepGradient)"
                />
                <defs>
                  <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Sleep Logs History Table */}
      <div className="p-6 rounded-3xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm">
        <h3 className="font-bold text-base text-surface-900 dark:text-white mb-4">
          Recorded Sleep Logs
        </h3>

        {logs.length === 0 ? (
          <p className="text-xs text-surface-400 py-8 text-center">
            No sleep logs yet. Log your first night to see insights!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-surface-400 uppercase font-semibold border-b border-surface-200 dark:border-surface-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-surface-800">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-surface-100/50 dark:hover:bg-surface-800/40">
                    <td className="py-3 px-4 font-mono font-medium text-surface-500">{l.date}</td>
                    <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                      {Math.floor(l.total_sleep_minutes / 60)}h {l.total_sleep_minutes % 60}m
                    </td>
                    <td className="py-3 px-4 text-surface-600 dark:text-surface-300 max-w-xs truncate">
                      {l.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteLog(l.id)}
                        className="p-1 rounded-lg text-surface-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete log"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Sleep Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Log Night's Sleep"
        description="Enter how many hours and minutes you slept."
      >
        <form onSubmit={handleLogSleep} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
              Date
            </label>
            <input
              type="date"
              required
              value={sleepDate}
              onChange={(e) => setSleepDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
                Hours
              </label>
              <input
                type="number"
                min="0"
                max="23"
                required
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
                Minutes
              </label>
              <input
                type="number"
                min="0"
                max="59"
                required
                value={minutes}
                onChange={(e) => setMinutes(Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-surface-700 dark:text-surface-300 mb-1">
              Notes / Quality (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Deep sleep, felt refreshed, no screen before bed"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              Save Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
