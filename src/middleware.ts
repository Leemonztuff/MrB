import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { isSupabaseConfigured } from '@/lib/env';
import { OPERATOR_UNLOCK_COOKIE, verifyOperatorUnlockToken } from '@/lib/operator-pin-token';

export const runtime = 'nodejs';

const publicRoutes = ['/login', '/signup', '/auth/callback'];

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

  if (pathname === '/operator/unlock') {
    if (session?.user.app_metadata?.role !== 'operario') {
      return NextResponse.redirect(new URL(session ? '/admin' : '/login', request.url));
    }
    return response;
  }

  const isPublicRoute = publicRoutes.includes(pathname);

  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (session && pathname.startsWith('/admin')) {
    const role = session.user.app_metadata?.role;
    if (role !== 'super_admin' && role !== 'operario') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const isOperatorRoute = pathname === '/admin'
      || pathname === '/admin/orders'
      || pathname.startsWith('/admin/imprimir/rotulos')
      || pathname === '/admin/operator-settings';
    if (role === 'operario' && !isOperatorRoute) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (
      role === 'operario'
      && !verifyOperatorUnlockToken(
        request.cookies.get(OPERATOR_UNLOCK_COOKIE)?.value,
        session.user.id,
        process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
      )
    ) {
      return NextResponse.redirect(new URL('/operator/unlock', request.url));
    }
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
