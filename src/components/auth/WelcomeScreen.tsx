import React, { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';
import { ForgotPassword } from './ForgotPassword';
import { useAuth } from '../../contexts/AuthContext';
import { Sparkles, ShieldCheck } from 'lucide-react';

export const WelcomeScreen: React.FC = () => {
  const [view, setView] = useState<'welcome' | 'login' | 'register' | 'forgot_password'>('welcome');
  const { loginAsLocalUser } = useAuth();

  const handleLaunchDemo = () => {
    loginAsLocalUser('vikram@infrasync.io', 'Vikram Singhania', 'InfraSync Sites', 'admin');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center relative overflow-hidden font-sans">
      {/* Background styling to match InfraSync visual identity */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 z-0"></div>
      <div className="absolute w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[100px] -top-[400px] -left-[400px] z-0"></div>
      
      <div className="relative z-10 w-full max-w-md px-4 sm:px-0 flex flex-col items-center">
        
        {view === 'welcome' && (
          <div className="text-center animate-in fade-in slide-in-from-bottom-4 w-full">
            <div className="flex justify-center items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <span className="text-white font-bold text-2xl">I</span>
              </div>
              <h1 className="text-4xl font-extrabold text-white tracking-tight">InfraSync</h1>
            </div>
            
            <p className="text-slate-400 text-lg mb-8 max-w-sm mx-auto">
              Build. Manage. Deliver.<br />
              <span className="text-sm">Construction Management Made Simple</span>
            </p>
            
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={() => setView('login')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-900/20"
              >
                Log In
              </button>
              <button 
                onClick={() => setView('register')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 rounded-xl transition border border-slate-700 hover:border-slate-600"
              >
                Create Account
              </button>

              {/* Instant Offline / Demo Workspace Button */}
              <div className="pt-2">
                <button
                  onClick={handleLaunchDemo}
                  className="w-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 font-medium py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Explore Demo Workspace (Offline Ready)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'login' && (
          <Login 
            onRegisterClick={() => setView('register')} 
            onForgotPasswordClick={() => setView('forgot_password')} 
          />
        )}
        
        {view === 'register' && (
          <Register onBackToLogin={() => setView('login')} />
        )}
        
        {view === 'forgot_password' && (
          <ForgotPassword onBackToLogin={() => setView('login')} />
        )}

      </div>
    </div>
  );
};
