
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { hasUsers } from '@/app/actions/user.actions';

// Define las rutas públicas que no requieren autenticación
const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createClient(request);

  // Es crucial refrescar la sesión en cada petición del middleware
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const { pathname } = request.nextUrl;

  // Rutas de Onboarding de Cliente
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  if (isOnboardingRoute) {
    return response;
  }

  // 1. Lógica de Primer Arranque (Setup)
  const usersExist = await hasUsers();

  if (!usersExist) {
    // Si no hay usuarios, la única página permitida es la de registro.
    if (pathname !== '/signup') {
      return NextResponse.redirect(new URL('/signup', request.url));
    }
    // Permite el acceso a la página de registro.
    return response;
  }

  // 2. Lógica de Aplicación Normal (Después del Setup)
  
  // Si ya existen usuarios, la página de registro ya no es accesible.
  if (pathname === '/signup') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const isPublicRoute = publicRoutes.includes(pathname);
  const isOrderRoute = pathname.startsWith('/pedido');

  // Las páginas de pedido son siempre públicas
  if (isOrderRoute) {
    return response;
  }

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
