import React, { useState } from 'react';
import { supabase, configuredSupabaseUrl } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, Mail, Lock, ArrowRight, Eye, EyeOff, WifiOff, ShieldCheck, UserCheck } from 'lucide-react';

interface LoginProps {
  onRegisterClick: () => void;
  onForgotPasswordClick: () => void;
}

export const Login: React.FC<LoginProps> = ({ onRegisterClick, onForgotPasswordClick }) => {
  const { loginAsLocalUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<{ message: string; host: string } | null>(null);

  const handleLocalLogin = (customEmail?: string, customName?: string, customRole?: string) => {
    loginAsLocalUser(
      customEmail || email || 'admin@inframate.io',
      customName || (email ? email.split('@')[0] : 'Vikram Singhania'),
      'InfraMate Sites',
      customRole || 'admin'
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConnectionError(null);
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        const errorMsg = signInError.message || '';
        if (errorMsg.includes('Invalid login credentials')) {
          setError('Login failed: The email or password is incorrect. Please verify your credentials and try again.');
        } else if (errorMsg.includes('Email not confirmed')) {
          setError('Login failed: Your email address has not been verified. Please check your inbox for the verification email.');
        } else if (
          errorMsg.includes('Failed to fetch') ||
          errorMsg.includes('NetworkError') ||
          errorMsg.includes('fetch')
        ) {
          setConnectionError({
            message: errorMsg,
            host: configuredSupabaseUrl || 'configured Supabase URL',
          });
        } else {
          setError(`Login failed: ${errorMsg}`);
        }
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (
        msg.includes('Failed to fetch') ||
        msg.includes('NetworkError') ||
        msg.includes('fetch')
      ) {
        setConnectionError({
          message: msg,
          host: configuredSupabaseUrl || 'configured Supabase URL',
        });
      } else {
        setError(`An unexpected error occurred: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-center mb-5">
        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <Building2 className="w-8 h-8 text-blue-500" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-center text-white mb-1.5">Welcome Back</h2>
      <p className="text-center text-slate-400 text-sm mb-5">Log in to your InfraMate workspace.</p>

      {/* Connection Unreachable Fallback Banner */}
      {connectionError && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs mb-5 text-left animate-in fade-in zoom-in-95">
          <div className="flex items-start gap-2.5">
            <WifiOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <div className="font-semibold text-amber-300 text-sm">
                Cloud Database Unreachable
              </div>
              <p className="text-slate-300 leading-relaxed">
                Unable to reach Supabase server at <span className="font-mono text-amber-200 break-all">{connectionError.host}</span>. The instance may be paused or offline.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleLocalLogin()}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-semibold py-2.5 px-3 rounded-lg transition flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Continue to Local Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && !connectionError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              placeholder="you@company.com"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <button 
              type="button" 
              onClick={onForgotPasswordClick}
              className="text-xs text-blue-400 hover:text-blue-300 transition"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-10 pr-10 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2 mt-4 shadow-md shadow-blue-600/20"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Log In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Quick Demo Login Preset */}
      <div className="mt-5 pt-4 border-t border-slate-800 text-center">
        <div className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold mb-2">
          Or Quick Test Account
        </div>
        <button
          type="button"
          onClick={() => handleLocalLogin('vikram@inframate.io', 'Vikram Singhania', 'admin')}
          className="w-full bg-slate-800 hover:bg-slate-700/80 text-slate-200 text-xs font-medium py-2 px-3 rounded-lg transition border border-slate-700 flex items-center justify-center gap-2"
        >
          <UserCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>Sign In as Demo Admin (Vikram Singhania)</span>
        </button>
      </div>

      <div className="mt-5 text-center text-xs text-slate-400">
        Don't have an account yet?{' '}
        <button onClick={onRegisterClick} className="text-orange-400 hover:text-orange-300 font-semibold transition">
          Create Account
        </button>
      </div>
    </div>
  );
};
