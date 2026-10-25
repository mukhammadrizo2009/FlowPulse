import apiClient from './client';
import type {
  User,
  AuthResponse,
  Goal,
  GoalTask,
  StudySession,
  SleepLog,
  SleepStats,
  Habit,
  HabitLog,
  DailyPlan,
  DailyTask,
  Note,
  NotificationItem,
  DashboardSummary
} from '../types';

// ================= AUTH =================
export const authApi = {
  login: async (credentials: { email: string; password?: string }) => {
    const { data } = await apiClient.post<AuthResponse>('/auth/login/', credentials);
    if (data.token) {
      localStorage.setItem('access_token', data.token);
    }
    return data;
  },

  register: async (userData: { email: string; password?: string; display_name: string }) => {
    const { data } = await apiClient.post<AuthResponse>('/auth/register/', userData);
    if (data.token) {
      localStorage.setItem('access_token', data.token);
    }
    return data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout/');
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  },

  getMe: async () => {
    const { data } = await apiClient.get<User>('/auth/me/');
    return data;
  },

  updateProfile: async (updates: Partial<User>) => {
    const { data } = await apiClient.patch<User>('/auth/me/', updates);
    return data;
  },

  changePassword: async (payload: { old_password?: string; new_password?: string }) => {
    const { data } = await apiClient.post('/auth/change-password/', payload);
    return data;
  },
};

function extractResults<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && 'results' in data && Array.isArray((data as { results: unknown }).results)) {
    return (data as { results: T[] }).results;
  }
  return [];
}

// ================= DASHBOARD =================
export const dashboardApi = {
  getSummary: async () => {
    const { data } = await apiClient.get<DashboardSummary>('/dashboard/');
    return data;
  },
};

// ================= GOALS =================
export const goalsApi = {
  list: async (params?: { category?: string; status?: string; priority?: string }) => {
    const { data } = await apiClient.get<Goal[] | { results: Goal[] }>('/goals/', { params });
    return extractResults<Goal>(data);
  },

  get: async (id: number) => {
    const { data } = await apiClient.get<Goal>(`/goals/${id}/`);
    return data;
  },

  create: async (goal: Partial<Goal>) => {
    const { data } = await apiClient.post<Goal>('/goals/', goal);
    return data;
  },

  update: async (id: number, goal: Partial<Goal>) => {
    const { data } = await apiClient.patch<Goal>(`/goals/${id}/`, goal);
    return data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/goals/${id}/`);
  },

  addTask: async (task: Partial<GoalTask>) => {
    const { data } = await apiClient.post<GoalTask>('/tasks/', task);
    return data;
  },

  updateTask: async (id: number, updates: Partial<GoalTask>) => {
    const { data } = await apiClient.patch<GoalTask>(`/tasks/${id}/`, updates);
    return data;
  },

  deleteTask: async (id: number) => {
    await apiClient.delete(`/tasks/${id}/`);
  },
};

// ================= STUDY =================
export const studyApi = {
  listRecords: async () => {
    const { data } = await apiClient.get<StudySession[] | { results: StudySession[] }>('/study-records/');
    return extractResults<StudySession>(data);
  },

  createRecord: async (record: {
    subject?: string;
    duration_minutes: number;
    study_date: string;
    notes?: string;
    goal?: number | null;
  }) => {
    const { data } = await apiClient.post<StudySession>('/study-records/', record);
    return data;
  },

  deleteRecord: async (id: number) => {
    await apiClient.delete(`/study-records/${id}/`);
  },

  getStats: async () => {
    const { data } = await apiClient.get('/statistics/study-time/');
    return data;
  },
};

// ================= SLEEP =================
export const sleepApi = {
  listLogs: async () => {
    const { data } = await apiClient.get<SleepLog[] | { results: SleepLog[] }>('/sleep-records/');
    return extractResults<SleepLog>(data);
  },

  logSleep: async (log: {
    sleep_date: string;
    bedtime: string;
    wake_time: string;
    sleep_quality?: number;
    notes?: string;
  }) => {
    const { data } = await apiClient.post<SleepLog>('/sleep-records/', log);
    return data;
  },

  deleteLog: async (id: number) => {
    await apiClient.delete(`/sleep-records/${id}/`);
  },

  getStats: async () => {
    const { data } = await apiClient.get<SleepStats>('/statistics/sleep/');
    return data;
  },
};

// ================= HABITS =================
export const habitsApi = {
  list: async (params?: { include_inactive?: boolean }) => {
    const { data } = await apiClient.get<Habit[] | { results: Habit[] }>('/habits/', { params });
    return extractResults<Habit>(data);
  },

  create: async (habit: Partial<Habit>) => {
    const { data } = await apiClient.post<Habit>('/habits/', habit);
    return data;
  },

  update: async (id: number, habit: Partial<Habit>) => {
    const { data } = await apiClient.patch<Habit>(`/habits/${id}/`, habit);
    return data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/habits/${id}/`);
  },

  toggleToday: async (id: number) => {
    const { data } = await apiClient.post<{ completed: boolean }>(`/habits/${id}/toggle-today/`);
    return data;
  },

  logCompletion: async (id: number, dateStr: string) => {
    const { data } = await apiClient.post<HabitLog>(`/habits/${id}/completions/`, {
      completion_date: dateStr,
    });
    return data;
  },

  deleteCompletion: async (id: number, completionId: number) => {
    await apiClient.delete(`/habits/${id}/completions/${completionId}/`);
  },

  getStats: async () => {
    const { data } = await apiClient.get('/statistics/habits/');
    return data;
  },
};

// ================= PLANS =================
export const plansApi = {
  listPlans: async (params?: { plan_type?: string; period_type?: string; date?: string }) => {
    const { data } = await apiClient.get<DailyPlan[] | { results: DailyPlan[] }>('/plans/', { params });
    return extractResults<DailyPlan>(data);
  },

  createPlan: async (plan: Partial<DailyPlan>) => {
    const { data } = await apiClient.post<DailyPlan>('/plans/', plan);
    return data;
  },

  getPlan: async (id: number) => {
    const { data } = await apiClient.get<DailyPlan>(`/plans/${id}/`);
    return data;
  },

  addPlanItem: async (item: Partial<DailyTask>) => {
    const { data } = await apiClient.post<DailyTask>('/plan-items/', item);
    return data;
  },

  updatePlanItem: async (id: number, item: Partial<DailyTask>) => {
    const { data } = await apiClient.patch<DailyTask>(`/plan-items/${id}/`, item);
    return data;
  },

  deletePlanItem: async (id: number) => {
    await apiClient.delete(`/plan-items/${id}/`);
  },
};

// ================= NOTES =================
export const notesApi = {
  list: async (params?: { search?: string; tag?: string }) => {
    const { data } = await apiClient.get<Note[] | { results: Note[] }>('/notes/', { params });
    return extractResults<Note>(data);
  },

  create: async (note: { title: string; content?: string; tags?: string; is_pinned?: boolean }) => {
    const { data } = await apiClient.post<Note>('/notes/', note);
    return data;
  },

  update: async (id: number, note: Partial<Note>) => {
    const { data } = await apiClient.patch<Note>(`/notes/${id}/`, note);
    return data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/notes/${id}/`);
  },
};

// ================= NOTIFICATIONS =================
export const notificationsApi = {
  list: async () => {
    const { data } = await apiClient.get<NotificationItem[] | { results: NotificationItem[] }>('/notifications/');
    return extractResults<NotificationItem>(data);
  },

  markAsRead: async (id: number) => {
    const { data } = await apiClient.post(`/notifications/${id}/mark_as_read/`);
    return data;
  },

  delete: async (id: number) => {
    await apiClient.delete(`/notifications/${id}/`);
  },
};

// ================= STATISTICS & OVERVIEW =================
export const statisticsApi = {
  getOverview: async () => {
    const { data } = await apiClient.get('/statistics/overview/');
    return data;
  },
  getGoalsStats: async () => {
    const { data } = await apiClient.get('/statistics/goals/');
    return data;
  },
};
