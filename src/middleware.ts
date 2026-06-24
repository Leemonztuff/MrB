import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export const runtime = 'nodejs';

const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createClient(request);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/onboarding') || pathname.startsWith('/pedido')) {
    return response;
  }

  if (!session) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && pathname !== '/signup') {
      return NextResponse.redirect(new URL('/signup', request.url));
    }
    if (user && pathname === '/signup') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  const isPublicRoute = publicRoutes.includes(pathname);

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (session && (isPublicRoute || pathname === '/')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
