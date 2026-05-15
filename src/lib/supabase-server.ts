import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/db';

let cachedClient: SupabaseClient<Database> | null = null;

export function supabaseServer(): SupabaseClient<Database> {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY должны быть заданы');
  }

  cachedClient = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cachedClient;
}
