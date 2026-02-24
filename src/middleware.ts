'use server';

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

export const runtime = 'nodejs';

// Define las rutas públicas que no requieren autenticación
const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createClient(request);

  // Es crucial refrescar la sesión en cada petición del middleware
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Rutas públicas dinámicas (onboarding y pedidos)
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  const isOrderRoute = pathname.startsWith('/pedido');

  if (isOnboardingRoute || isOrderRoute) {
    return response;
  }

  const isPublicRoute = publicRoutes.includes(pathname);

  // Si el usuario no está autenticado y la ruta no es pública, redirigir a login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Si el usuario está autenticado y intenta acceder a una ruta pública (o a la raíz), redirigir a admin
  if (session && (isPublicRoute || pathname === '/')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  
  // Para todos los demás casos, permitir la petición.
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
