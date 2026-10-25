import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/useAuth';
import {
  Sun,
  Moon,
  Bell,
  Plus,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  Clock,
  Menu,
} from 'lucide-react';
import { notificationsApi } from '../../api/endpoints';
import type { NotificationItem } from '../../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenQuickNote: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenQuickNote }) => {
  const { user, logout, theme, toggleTheme } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (user) {
      notificationsApi
        .list()
        .then((data) => {
          setNotifications(Array.isArray(data) ? data : []);
        })
        .catch(() => {});
    }
  }, [user]);

  const notifList = Array.isArray(notifications) ? notifications : [];
  const unreadCount = notifList.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications((prev) =>
        (Array.isArray(prev) ? prev : []).map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        )
      );
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-surface-200 dark:border-surface-800 bg-surface-50/80 dark:bg-surface-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      {/* Left section: mobile hamburger & breadcrumb/app title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center shadow-md shadow-primary-500/20 text-white font-bold text-sm">
            FP
          </div>
          <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-surface-900 to-surface-700 dark:from-white dark:to-surface-300 bg-clip-text text-transparent hidden sm:inline-block">
            FlowPulse
          </span>
        </div>
      </div>

      {/* Right section: Quick actions, notifications, theme switch, profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Note Button */}
        <button
          onClick={onOpenQuickNote}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/60 border border-primary-200/50 dark:border-primary-800/50 transition-all active:scale-95 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Quick Note</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400" />
          ) : (
            <Moon className="w-5 h-5 text-surface-600" />
          )}
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-xl text-surface-600 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-surface-50 dark:ring-surface-950 animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <div
              className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-surface-200 dark:border-surface-800">
                <span className="font-semibold text-sm text-surface-900 dark:text-white">
                  Notifications
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-600 dark:text-primary-400 font-medium">
                  {unreadCount} unread
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-surface-100 dark:divide-surface-800/60 mt-1">
                {notifList.length === 0 ? (
                  <div className="py-6 text-center text-xs text-surface-400">
                    No notifications yet
                  </div>
                ) : (
                  notifList.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      className={`py-3 px-1 flex items-start gap-3 transition-colors ${
                        notif.is_read ? 'opacity-60' : 'opacity-100'
                      }`}
                    >
                      <div className="mt-0.5 text-primary-500">
                        {notif.type === 'study_reminder' ? (
                          <Clock className="w-4 h-4 text-sky-400" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-surface-900 dark:text-white truncate">
                          {notif.title}
                        </p>
                        <p className="text-xs text-surface-500 dark:text-surface-400 line-clamp-2 mt-0.5">
                          {notif.message}
                        </p>
                      </div>
                      {!notif.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notif.id)}
                          className="text-[10px] text-primary-500 hover:underline shrink-0"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs shadow-inner">
              {user?.display_name ? user.display_name.charAt(0).toUpperCase() : 'U'}
            </div>
          </button>

          {isProfileOpen && (
            <div
              className="absolute right-0 mt-2 w-56 rounded-2xl bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95"
              onClick={() => setIsProfileOpen(false)}
            >
              <div className="px-3 py-2 border-b border-surface-200 dark:border-surface-800">
                <p className="text-xs font-semibold text-surface-900 dark:text-white truncate">
                  {user?.display_name || 'User'}
                </p>
                <p className="text-[11px] text-surface-400 truncate">{user?.email}</p>
              </div>

              <div className="py-1">
                <a
                  href="/settings"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
                >
                  <UserIcon className="w-4 h-4 text-surface-400" />
                  Account Settings
                </a>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
