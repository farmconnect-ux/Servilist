import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env?.VITE_SUPABASE_URL;
const publishableKey = import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Browser Supabase client. Null when the build has no Supabase settings, in
 * which case the app runs as a local demo on localStorage.
 */
export const supabase: SupabaseClient | null =
  url && publishableKey ? createClient(url, publishableKey) : null;
