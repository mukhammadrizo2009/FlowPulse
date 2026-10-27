import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../store/useAuth';
import { Button } from '../../components/ui/Button';
import { ArrowRight, Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ email: email.trim(), password });
      navigate('/');
    } catch (err: unknown) {
      const errObj = err as { response?: { data?: { detail?: string } } };
      setError(
        errObj?.response?.data?.detail || 'Invalid email or password. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-surface-100 dark:bg-surface-950 text-surface-900 dark:text-surface-100 relative overflow-hidden transition-colors">
      {/* Subtle minimalist ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/10 dark:bg-primary-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 shadow-md shadow-primary-500/25 text-white font-extrabold text-lg mb-4 select-none">
            FP
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-surface-900 dark:text-white">
            Welcome to FlowPulse
          </h1>
          <p className="text-xs sm:text-sm text-surface-500 dark:text-surface-400 mt-1">
            Sign in to access your personal dashboard and habits
          </p>
        </div>

        {/* Minimalist Card */}
        <div className="bg-surface-50/95 dark:bg-surface-900/90 backdrop-blur-md border border-surface-200/80 dark:border-surface-800 rounded-2xl p-6 sm:p-8 shadow-xl shadow-surface-950/5 dark:shadow-surface-950/30">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 text-xs font-medium animate-fadeIn">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-surface-100 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700/80 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-700 dark:text-surface-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl bg-surface-100 dark:bg-surface-800/80 border border-surface-200 dark:border-surface-700/80 text-surface-900 dark:text-white placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 p-1 rounded-md transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full py-2.5 mt-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white font-semibold shadow-md shadow-primary-500/20"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Footer link */}
          <div className="mt-6 pt-5 border-t border-surface-200/70 dark:border-surface-800/80 text-center">
            <p className="text-xs text-surface-500 dark:text-surface-400">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="font-semibold text-primary-600 dark:text-primary-400 hover:underline"
              >
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Minimalist Security Badge */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-[11px] text-surface-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Secure multi-user session &amp; isolated storage</span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
