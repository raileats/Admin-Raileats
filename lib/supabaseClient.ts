cat > lib/supabaseClient.ts <<'EOF'
/* lib/supabaseClient.ts - centralized Supabase client for client components */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables');
}

export const supabase: SupabaseClient = createClient(url, anon);
EOF
