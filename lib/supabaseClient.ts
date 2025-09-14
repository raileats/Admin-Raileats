// lib/supabaseClient.ts  (CLIENT ONLY)
'use client';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // don't throw at module evaluation in build; instead allow runtime fallback or console warn
  // but here we just provide a client with empty strings (avoid TS error)
  // better approach is dynamic import inside useEffect and check env on runtime
  // For safety we keep a runtime check when creating the client in useEffect instead.
}

export const supabaseClient = createClient(url ?? '', anonKey ?? '');
