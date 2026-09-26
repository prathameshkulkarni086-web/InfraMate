import React, { useState } from 'react';
import { supabase, configuredSupabaseUrl } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Building2, Mail, Lock, ArrowRight, User, Briefcase, AlertCircle, WifiOff, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface RegisterProps {
  onBackToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onBackToLogin }) => {
  const { loginAsLocalUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionError, setConnectionError] = useState<{ message: string; host: string } | null>(null);
  const [success, setSuccess] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const handleContinueLocally = () => {
    if (!email || !fullName) {
      setError("Please provide at least your Full Name and Email Address.");
      return;
    }
    loginAsLocalUser(email, fullName, companyName || 'My Construction Co.', 'admin');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConnectionError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Password mismatch: Your passwords do not match.");
      return;
    }
    
    if (!acceptedTerms) {
      setError("Please accept the terms and privacy policy to continue.");
      return;
    }

    if (password.length < 6) {
      setError("Weak password: Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            company_name: companyName.trim(),
          }
        }
      });

      if (signUpError) {
        const errorMsg = signUpError.message || '';
        if (errorMsg.includes('already registered')) {
          setError('Existing email: An account with this email address already exists.');
        } else if (
          errorMsg.includes('Failed to fetch') ||
          errorMsg.includes('NetworkError') ||
          errorMsg.includes('Failed to') ||
          errorMsg.includes('fetch')
        ) {
          // Cloud Supabase server is unreachable (DNS resolution failure, paused project, or offline)
          setConnectionError({
            message: errorMsg,
            host: configuredSupabaseUrl || 'configured Supabase URL',
          });
        } else {
          setError(`Registration failed: ${errorMsg}`);
        }
      } else {
        setSuccess(true);
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

  if (success) {
    return (
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 p-8 text-center text-white">
        <div className="mx-auto w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Check your inbox</h2>
        <p className="text-slate-400 mb-8 text-sm">
          We've sent a verification link to <span className="font-semibold text-slate-200">{email}</span>. 
          Please verify your email address to complete your registration.
        </p>
        <button
          onClick={onBackToLogin}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-2.5 rounded-xl transition"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-center mb-5">
        <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
          <Building2 className="w-8 h-8 text-orange-500" />
        </div>
      </div>
      
      <h2 className="text-2xl font-bold text-center text-white mb-1.5">Create Account</h2>
      <p className="text-center text-slate-400 text-sm mb-5">Join InfraSync and manage your sites.</p>

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
                Could not connect to Supabase at <span className="font-mono text-amber-200 break-all">{connectionError.host}</span>. The Supabase project may be paused, deleted, or the domain has not propagated.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleContinueLocally}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-semibold py-2.5 px-3 rounded-lg transition flex items-center justify-center gap-2 shadow-md shadow-amber-500/20"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Enter via Local Workspace as {fullName || 'Admin'}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 pt-1">
                Your projects, inventory, equipment, and workforce will be fully functional and saved locally on your device.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && !connectionError && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              placeholder="John Doe"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Company Name</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              placeholder="Acme Construction"
            />
          </div>
        </div>

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

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-300">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                placeholder="••••••••"
              />
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2 pt-1">
          <input
            type="checkbox"
            id="terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1 bg-slate-800 border-slate-700 rounded text-blue-500 focus:ring-blue-500"
          />
          <label htmlFor="terms" className="text-xs text-slate-400 cursor-pointer">
            I agree to the Terms of Service and Privacy Policy.
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2 mt-2 shadow-md shadow-blue-600/20"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Create Account
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Direct Offline/Local Option for Quick Access */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={handleContinueLocally}
            className="text-xs text-slate-400 hover:text-amber-400 transition inline-flex items-center gap-1.5 py-1"
          >
            <span>⚡ Prefer testing offline?</span>
            <span className="font-semibold underline underline-offset-2">Use Local Workspace Mode</span>
          </button>
        </div>
      </form>

      <div className="mt-5 text-center text-xs text-slate-400">
        Already have an account?{' '}
        <button onClick={onBackToLogin} className="text-blue-400 hover:text-blue-300 font-semibold transition">
          Log In
        </button>
      </div>
    </div>
  );
};
