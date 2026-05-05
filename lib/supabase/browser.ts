"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

let _client:
  | ReturnType<typeof createClient>
  | null = null;

/**
 * Lazily create Supabase client.
 * This prevents Next.js build-time failures when env vars aren't present yet.
 */
export function getSupabaseClient() {
  if (_client) return _client;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  _client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  return _client;
}

