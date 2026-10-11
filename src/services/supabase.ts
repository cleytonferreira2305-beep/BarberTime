import { createClient, SupabaseClient } from '@supabase/supabase-js';

const getEnvVar = (key: string): string => {
  if (typeof window !== 'undefined' && (window as any).__ENV__?.[key]) {
    return (window as any).__ENV__[key];
  }
  return (import.meta.env[key] as string) || '';
};

// Check local storage for custom Supabase credentials configured via the in-app modal
const getStoredSupabaseConfig = () => {
  if (typeof window === 'undefined') return { url: '', key: '' };
  try {
    const url = localStorage.getItem('barbertime_supabase_url') || getEnvVar('VITE_SUPABASE_URL');
    const key = localStorage.getItem('barbertime_supabase_anon_key') || getEnvVar('VITE_SUPABASE_ANON_KEY');
    return { url, key };
  } catch {
    return { url: '', key: '' };
  }
};

const isValidHttpUrl = (stringUrl: string): boolean => {
  if (!stringUrl || typeof stringUrl !== 'string') return false;
  const trimmed = stringUrl.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) return false;
  if (trimmed.includes('your-project') || trimmed.includes('MY_SUPABASE_URL')) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getStoredSupabaseConfig();
  if (!url || !key) return false;
  if (key.includes('your-anon-key') || key.includes('MY_')) return false;
  return isValidHttpUrl(url);
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { url, key } = getStoredSupabaseConfig();

  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    // Graceful fallback to persistent local db if connection fails
    return null;
  }
};

export const saveCustomSupabaseConfig = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('barbertime_supabase_url', url.trim());
    localStorage.setItem('barbertime_supabase_anon_key', key.trim());
    cachedClient = null;
  }
};

export const clearCustomSupabaseConfig = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('barbertime_supabase_url');
    localStorage.removeItem('barbertime_supabase_anon_key');
    cachedClient = null;
  }
};
