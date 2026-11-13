import { createClient } from '@supabase/supabase-js';

// Retrieve credentials either from environment variables or custom user settings in localStorage
export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const storedUrl = localStorage.getItem('paisapilot_supabase_url');
  const storedKey = localStorage.getItem('paisapilot_supabase_key');

  const url = storedUrl || envUrl || '';
  const key = storedKey || envKey || '';

  const isValid = Boolean(url && key && url.startsWith('http') && !url.includes('your-project-id'));

  return { url, key, isConfigured: isValid };
};

let clientInstance = null;

export const getSupabase = () => {
  const { url, key, isConfigured } = getSupabaseConfig();
  if (!isConfigured) return null;

  if (!clientInstance) {
    clientInstance = createClient(url, key);
  }
  return clientInstance;
};

export const resetSupabaseClient = () => {
  clientInstance = null;
};
