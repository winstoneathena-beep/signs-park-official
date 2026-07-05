import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client for the shared Parkwell instance — the same database
 * behind Team Hub and the portal (one database, one login; see
 * parkwell-scoping ARCHITECTURE.md §3.1). This replaces the
 * localStorage-only persistence: real auth and a real orders table
 * hang off this client in the hardening pass.
 *
 * Local dev runs against the parkwell-portal local stack
 * (`supabase start` in that repo, API on http://127.0.0.1:54471).
 */
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
