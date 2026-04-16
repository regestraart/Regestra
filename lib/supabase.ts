
import { createClient } from '@supabase/supabase-js';

// Check for environment variables (Vite exposes these via import.meta.env, NOT process.env)
const envUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Check for local storage overrides (for manual dev setup)
const localUrl = typeof localStorage !== 'undefined' ? localStorage.getItem('SB_URL') : null;
const localKey = typeof localStorage !== 'undefined' ? localStorage.getItem('SB_KEY') : null;

// Prioritize local storage if present (allows overriding in dev), otherwise env
const supabaseUrl = localUrl || envUrl;
const supabaseAnonKey = localKey || envKey;

// Check if Supabase is properly configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));

if (!isSupabaseConfigured) {
  console.warn('Supabase URL or Anon Key is missing. The app will run in Mock Mode.');
}

// Initialize with real credentials if available, otherwise use placeholders to prevent crash.
// Calls to this client will fail if placeholders are used, so we guard usage with isSupabaseConfigured in services/db.ts.
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl! : 'https://placeholder.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey! : 'placeholder',
  {
    auth: {
      persistSession: true,          // Keep session in localStorage across tab closes
      autoRefreshToken: true,        // Let Supabase handle refresh automatically
      detectSessionInUrl: true,      // Needed for magic link / OAuth callbacks
      storageKey: 'rg-auth-token',   // Namespaced key — avoids conflicts
    },
  }
);

export const saveManualConfig = (url: string, key: string) => {
    localStorage.setItem('SB_URL', url);
    localStorage.setItem('SB_KEY', key);
    window.location.reload();
}

export const clearManualConfig = () => {
    localStorage.removeItem('SB_URL');
    localStorage.removeItem('SB_KEY');
    window.location.reload();
}
