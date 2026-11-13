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
    clientInstance = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return clientInstance;
};

export const resetSupabaseClient = () => {
  clientInstance = null;
};

// ==========================================
// Authentication Helpers
// ==========================================

export const signUpWithEmail = async (email, password, fullName = '') => {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) throw error;
  return data;
};

export const signInWithEmail = async (email, password) => {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
};

export const signOutUser = async () => {
  const supabase = getSupabase();
  if (!supabase) return;

  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getAuthSession = async () => {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.warn('Error fetching auth session:', error);
    return null;
  }
  return session;
};

export const subscribeToAuthChanges = (callback) => {
  const supabase = getSupabase();
  if (!supabase) return { unsubscribe: () => {} };

  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return subscription;
};
