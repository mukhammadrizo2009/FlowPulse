import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { authApi } from '../api/endpoints';
import { AuthContext } from './context';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('user');
      if (!cached || cached === 'undefined' || cached === 'null') {
        localStorage.removeItem('user');
        return null;
      }
      return JSON.parse(cached);
    } catch {
      localStorage.removeItem('user');
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark'; // default sleek dark mode
  });

  // Apply theme to html root class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Check current logged in user on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await authApi.getMe();
        if (currentUser && currentUser.id) {
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
          if (currentUser.theme && (currentUser.theme === 'light' || currentUser.theme === 'dark')) {
            setTheme(currentUser.theme);
          }
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch {
        // Not logged in or expired
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: { email: string; password?: string }) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(credentials);
      const userObj = res.user || (res as unknown as User);
      if (userObj && userObj.id) {
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email: string; password?: string; display_name: string }) => {
    setIsLoading(true);
    try {
      const res = await authApi.register(data);
      const userObj = res.user || (res as unknown as User);
      if (userObj && userObj.id) {
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('access_token');
    }
  };

  const updateUser = async (updates: Partial<User>) => {
    const updated = await authApi.updateProfile(updates);
    setUser(updated);
    localStorage.setItem('user', JSON.stringify(updated));
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (user) {
      authApi.updateProfile({ theme: next }).catch(() => {});
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        theme,
        login,
        register,
        logout,
        updateUser,
        toggleTheme,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
