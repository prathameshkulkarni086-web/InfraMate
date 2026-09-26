import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, hasSupabaseConfig } from '../lib/supabase';
import { safeStorage } from '../lib/safeStorage';

export interface Profile {
  id: string;
  full_name: string;
  company_name: string;
  phone: string;
  role: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
}

export interface LocalAuthUser {
  id: string;
  email: string;
  name: string;
  company?: string;
  role?: string;
  createdAt: string;
}

const DEFAULT_LOCAL_USER: LocalAuthUser = {
  id: "usr-admin-1",
  email: "vikram@inframate.io",
  name: "Vikram Singhania",
  company: "InfraMate Sites",
  role: "admin",
  createdAt: "2026-01-10",
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAuthenticated: boolean;
  isPasswordRecovery: boolean;
  schemaMissing: boolean;
  isLocalMode: boolean;
  loginAsLocalUser: (email: string, name: string, company?: string, role?: string) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  isAuthenticated: false,
  isPasswordRecovery: false,
  schemaMissing: false,
  isLocalMode: false,
  loginAsLocalUser: () => {},
  refreshProfile: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(hasSupabaseConfig);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [schemaMissing, setSchemaMissing] = useState(false);
  const [localUser, setLocalUser] = useState<LocalAuthUser | null>(() => {
    try {
      const saved = safeStorage.getItem('infrasync_local_auth_user');
      if (saved) return JSON.parse(saved);
      // If no Supabase config exists, auto-initialize default local user so app loads immediately
      if (!hasSupabaseConfig) {
        safeStorage.setItem('infrasync_local_auth_user', JSON.stringify(DEFAULT_LOCAL_USER));
        return DEFAULT_LOCAL_USER;
      }
      return null;
    } catch {
      return !hasSupabaseConfig ? DEFAULT_LOCAL_USER : null;
    }
  });

  useEffect(() => {
    // If Supabase is not configured, remain in local workspace mode immediately without network latency
    if (!hasSupabaseConfig) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Initial session fetch from Supabase with safe 2.5s network timeout for flaky mobile iOS connections
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise<{ data: { session: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { session: null } }), 2500)
    );

    Promise.race([sessionPromise, timeoutPromise])
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        setSession(session);
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Supabase getSession connection error (operating in offline/local ready mode):', err);
        setLoading(false);
      });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }
        
        setSession(session);
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loginAsLocalUser = (email: string, name: string, company?: string, role?: string) => {
    const id = `usr-local-${Math.random().toString(36).substring(2, 9)}`;
    const localData: LocalAuthUser = {
      id,
      email: email.trim().toLowerCase(),
      name: name.trim() || 'Workspace User',
      company: company?.trim() || 'InfraMate Sites',
      role: role || 'admin',
      createdAt: new Date().toISOString(),
    };
    try {
      safeStorage.setItem('infrasync_local_auth_user', JSON.stringify(localData));
    } catch (e) {
      console.error('Failed to store local user in storage', e);
    }
    setLocalUser(localData);
    setLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    try {
      setLoading(true);
      setSchemaMissing(false);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST205') {
          setSchemaMissing(true);
        } else if (error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }
      }
      if (data) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching profile', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signOut = async () => {
    try {
      safeStorage.removeItem('infrasync_local_auth_user');
      setLocalUser(null);
      if (hasSupabaseConfig) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Supabase signOut error:', err);
    } finally {
      setSession(null);
      setUser(null);
      setProfile(null);
      safeStorage.removeItem('infrasync_state');
      safeStorage.removeItem('infrasync_active_session');
    }
  };

  // Derive active user and profile from either Supabase or Local Auth
  const activeUser: User | null = user || (localUser ? ({
    id: localUser.id,
    email: localUser.email,
    user_metadata: {
      full_name: localUser.name,
      company_name: localUser.company || '',
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: localUser.createdAt,
  } as unknown as User) : null);

  const activeProfile: Profile | null = profile || (localUser ? {
    id: localUser.id,
    full_name: localUser.name,
    company_name: localUser.company || '',
    phone: '+91 98201 54321',
    role: localUser.role || 'admin',
    avatar_url: '',
    created_at: localUser.createdAt,
    updated_at: localUser.createdAt,
  } : null);

  const isLocalMode = !session && !!localUser;
  const isAuthenticated = !!session || !!localUser;

  return (
    <AuthContext.Provider
      value={{
        session,
        user: activeUser,
        profile: activeProfile,
        loading,
        isAuthenticated,
        isPasswordRecovery,
        schemaMissing,
        isLocalMode,
        loginAsLocalUser,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

