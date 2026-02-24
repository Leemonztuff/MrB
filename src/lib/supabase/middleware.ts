import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// This function is responsible for creating a Supabase client that can be
// used in Next.js Middleware. It handles reading and writing cookies
// to manage the user's session.
export async function createClient(request: NextRequest) {
  // We need to create a response object to be able to read and set cookies.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create a Supabase client with a custom cookie handler.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // A getter function to retrieve a cookie by name.
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        // A setter function to set a cookie.
        set(name: string, value: string, options: CookieOptions) {
          // If the cookie is set, update the request and response cookies.
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        // A remover function to delete a cookie.
        remove(name: string, options: CookieOptions) {
          // If the cookie is removed, update the request and response cookies.
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // It's crucial to refresh the session in middleware to ensure it's
  // kept up-to-date.
  await supabase.auth.getUser()

  return { supabase, response }
}
