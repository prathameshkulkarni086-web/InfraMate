import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        setError(`Password reset failed: ${error.message}`);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(`An unexpected error occurred: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 p-8 text-center text-white">
        <div className="mx-auto w-12 h-12 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center mb-6">
          <Mail className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Check your email</h2>
        <p className="text-slate-400 mb-8 text-sm">
          If an account exists for <span className="font-semibold text-slate-200">{email}</span>, 
          you will receive a password reset link shortly.
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
    <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-8 animate-in fade-in slide-in-from-bottom-4">
      <button 
        onClick={onBackToLogin}
        className="text-slate-400 hover:text-white transition flex items-center gap-1 text-xs mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to login
      </button>
      
      <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
      <p className="text-slate-400 text-sm mb-6">Enter your email address and we'll send you a link to reset your password.</p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleReset} className="space-y-4">
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition flex items-center justify-center gap-2 mt-4"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Send Reset Link
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
