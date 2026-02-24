import { createBrowserClient } from '@supabase/ssr'

// Define a function to create a Supabase client for client-side operations.
// This function initializes a new client on every call, which is the recommended
// pattern for client components. It can also be used in Server Actions that
// need to run with anonymous privileges.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
