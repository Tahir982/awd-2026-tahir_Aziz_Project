import { createBrowserClient } from "@supabase/ssr";

// Used in Client Components ("use client"). Relies on the public anon key,
// which is safe to expose — Row Level Security policies do the real
// authorization work on every query.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
