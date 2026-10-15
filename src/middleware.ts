import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { isSupabaseConfigured } from '@/lib/env';

export const runtime = 'nodejs';

const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fallback: si falta configuración de Supabase, mostrar la página de setup
  // en lugar de crear un cliente que arrojaría un error (y en vez de entrar
  // en bucles de redirección).
  if (!isSupabaseConfigured()) {
    if (pathname === '/setup') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/setup', request.url));
  }

  // Si ya está configurado, /setup no tiene utilidad: mandamos al inicio.
  if (pathname === '/setup') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const { supabase, response } = await createClient(request);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (pathname.startsWith('/onboarding') || pathname.startsWith('/pedido')) {
    return response;
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
