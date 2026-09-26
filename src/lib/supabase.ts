import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey);
export const configuredSupabaseUrl = supabaseUrl || '';

if (!hasSupabaseConfig) {
  console.warn(
    "Supabase configuration error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. Add both variables to the project's .env file and restart the development server."
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder_anon_key'
);
