
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { hasUsers } from '@/app/actions/user.actions';

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createClient(request);

  const { pathname } = request.nextUrl;

  // Rutas públicas sin autenticación
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  const isOrderRoute = pathname.startsWith('/pedido');
  const isPortalRoute = pathname.startsWith('/portal') || pathname.startsWith('/portal-cliente');
  const isPublicRoute = ['/login', '/signup'].includes(pathname);

  // Estas rutas son siempre públicas
  if (isOnboardingRoute || isOrderRoute || isPortalRoute || isPublicRoute) {
    return response;
  }

  // Es crucial refrescar la sesión en cada petición del middleware
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 1. Lógica de Primer Arranque (Setup)
  const usersExist = await hasUsers();

  if (!usersExist) {
    if (pathname !== '/signup') {
      return NextResponse.redirect(new URL('/signup', request.url));
    }
    return response;
  }

  // 2. Lógica de Aplicación Normal
  
  if (pathname === '/signup') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si el usuario no está autenticado y la ruta no es pública, redirigir a login
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Si el usuario está autenticado y intenta acceder a la raíz, redirigir a admin
  if (pathname === '/') {
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
