import { createClient } from '@supabase/supabase-js';

// Pre-configured in-code credentials for PaisaPilot Supabase database
const CODE_SUPABASE_URL = 'https://qiasbifrkoogetqacfio.supabase.co';
const CODE_SUPABASE_KEY = 'sb_publishable_zFm5_e381HPy9b4X1BxD2w_ULTaDaEJ';

export const getSupabaseConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  let url = (envUrl || CODE_SUPABASE_URL || '').trim();
  const key = (envKey || CODE_SUPABASE_KEY || '').trim();

  // Normalize URL: remove trailing /rest/v1 or trailing slashes
  if (url.endsWith('/rest/v1/')) {
    url = url.slice(0, -9);
  } else if (url.endsWith('/rest/v1')) {
    url = url.slice(0, -8);
  }
  url = url.replace(/\/+$/, '');

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
