export interface User {
  id: number;
  email: string;
  display_name: string;
  avatar?: string | null;
  timezone: string;
  theme: 'light' | 'dark';
  has_password?: boolean;
  email_notifications_enabled: boolean;
  study_reminder_enabled: boolean;
  study_reminder_time?: string | null;
  habit_reminder_enabled: boolean;
  habit_reminder_time?: string | null;
  goal_deadline_reminder_enabled: boolean;
  goal_deadline_reminder_days: number;
  date_joined?: string;
  last_login?: string | null;
  is_staff?: boolean;
  is_superuser?: boolean;
}

export interface PlatformStats {
  user_stats: {
    total_users: number;
    active_today: number;
    active_7d: number;
    active_30d: number;
    new_today: number;
    new_7d: number;
    new_30d: number;
  };
  engagement: {
    habits: {
      total_habits: number;
      active_habits: number;
      completions_today: number;
      completions_total: number;
    };
    study: {
      total_hours: number;
      total_sessions: number;
      today_hours: number;
    };
    sleep: {
      total_logs: number;
      avg_hours: number;
    };
    goals_and_plans: {
      total_goals: number;
      completed_goals: number;
      total_plans: number;
      total_plan_tasks: number;
      completed_plan_tasks: number;
    };
  };
  daily_trends: Array<{
    date: string;
    formatted_date: string;
    study_hours: number;
    habit_completions: number;
    sleep_logs: number;
    new_users: number;
  }>;
  recent_users: Array<{
    id: number;
    email: string;
    display_name: string;
    date_joined: string;
    last_login: string | null;
    is_active: boolean;
    is_staff: boolean;
    habits_count: number;
    study_hours: number;
  }>;
  generated_at: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  message?: string;
}

export interface Goal {
  id: number;
  title: string;
  description?: string;
  category: 'learning' | 'career' | 'health' | 'finance' | 'personal' | 'other' | string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'completed' | 'archived' | 'not_started' | 'in_progress' | 'paused';
  target_date?: string | null;
  deadline?: string | null;
  desired_outcome?: string;
  target_hours?: number;
  completed_hours?: number;
  progress?: number;
  progress_percentage?: number;
  milestones?: Milestone[];
  tasks?: GoalTask[];
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: number;
  goal: number;
  title: string;
  description?: string;
  order: number;
  is_completed: boolean;
  completed_at?: string | null;
  due_date?: string | null;
}

export interface GoalTask {
  id: number;
  goal: number;
  title: string;
  is_completed: boolean;
  order: number;
  due_date?: string | null;
}

export interface StudySubject {
  id: number;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  is_active: boolean;
  total_study_minutes?: number;
}

export interface StudySession {
  id: number;
  subject?: number | null;
  subject_name?: string;
  subject_color?: string;
  goal?: number | null;
  goal_title?: string;
  duration_minutes: number;
  started_at: string;
  ended_at?: string | null;
  session_type: 'pomodoro' | 'stopwatch' | 'manual';
  notes?: string;
}

export interface StudyGoal {
  id: number;
  target_daily_minutes: number;
  target_weekly_minutes: number;
  is_active: boolean;
}

export interface SleepLog {
  id: number;
  date: string; // YYYY-MM-DD
  duration_minutes?: number;
  total_sleep_minutes?: number;
  hours?: { hours: number; minutes: number };
  bedtime?: string; // HH:MM
  wake_time?: string; // HH:MM
  quality_rating?: number; // 1-5
  energy_level?: number; // 1-5
  note?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SleepStats {
  average_sleep_minutes: number;
  average_quality: number;
  average_energy: number;
  sleep_debt_minutes?: number;
  consistency_score: number;
  recent_logs: SleepLog[];
}

export interface Habit {
  id: number;
  name: string;
  description?: string;
  category: string;
  frequency: 'daily' | 'weekly' | 'custom';
  target_days_per_week: number;
  type: 'positive' | 'negative';
  color: string;
  icon?: string;
  current_streak: number;
  best_streak: number;
  completion_rate_30d: number;
  logs_today: boolean;
  today_completed: boolean;
  today_status: 'none' | 'partial' | 'done';
  logs?: HabitLog[];
  completions?: HabitLog[];
  created_at: string;
}

export interface HabitLog {
  id: number;
  habit: number;
  date: string;
  completion_date?: string;
  status: 'none' | 'partial' | 'done';
  completed: boolean;
  notes?: string;
}

export interface DailyPlan {
  id: number;
  date: string;
  notes?: string;
  productivity_rating?: number;
  tasks: DailyTask[];
}

export interface DailyTask {
  id: number;
  plan: number;
  title: string;
  description?: string;
  time_block_start?: string | null;
  time_block_end?: string | null;
  estimated_minutes?: number;
  actual_minutes?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  is_completed: boolean;
  order: number;
}

export interface MonthlyPlan {
  id: number;
  year: number;
  month: number;
  theme?: string;
  goals_summary?: string;
  key_milestones?: string;
  review_notes?: string;
}

export interface YearlyPlan {
  id: number;
  year: number;
  annual_theme?: string;
  vision_statement?: string;
  major_objectives?: string;
  mid_year_review?: string;
  end_year_review?: string;
}

export interface Note {
  id: number;
  title: string;
  content: string;
  category: 'idea' | 'learning' | 'task' | 'general';
  tags: string[];
  is_pinned: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'study_reminder' | 'habit_reminder' | 'goal_deadline' | 'system' | 'streak';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface DashboardSummary {
  today_study_minutes: number;
  study_goal_daily_minutes: number;
  today_sleep_minutes: number;
  today_habits_completed: number;
  today_habits_total: number;
  active_goals_count: number;
  productivity_score: number;
  recent_activities: {
    type: 'study' | 'habit' | 'sleep' | 'goal';
    title: string;
    description: string;
    timestamp: string;
  }[];
  study_trends_7d: {
    date: string;
    minutes: number;
    hours: number;
  }[];
  habits_today: Habit[];
  active_goals: Goal[];
  today_tasks: DailyTask[];
}

export interface ProductivityScore {
  score: number; // 0-100
  study_component: number;
  habit_component: number;
  sleep_component: number;
  goal_component: number;
  level: string; // 'Needs Focus' | 'Building Momentum' | 'Highly Productive' | 'Peak Flow'
}
