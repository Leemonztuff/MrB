
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';
import { hasUsers } from '@/app/actions/user.actions';
import { authLimiter, apiLimiter, getClientIdentifier } from '@/lib/rate-limiter';

const isDev = process.env.NODE_ENV === 'development';

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createClient(request);

  const { pathname } = request.nextUrl;
  const clientId = getClientIdentifier(request);

  // ============================================
  // SEGURIDAD: Headers de protección
  // ============================================
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // ============================================
  // SEGURIDAD: Rate Limiting
  // ============================================
  if (!isDev) {
    const isAuthRoute = pathname === '/login' || pathname === '/signup';
    const isApiRoute = pathname.startsWith('/api/');
    const isOrderRoute = pathname.startsWith('/pedido');

    let limiter = apiLimiter;
    if (isAuthRoute) limiter = authLimiter;
    if (isOrderRoute) limiter = authLimiter;

    const { allowed, remaining, resetIn } = limiter.check(clientId, pathname);

    response.headers.set('X-RateLimit-Limit', String(limiter.config.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(remaining));
    response.headers.set('X-RateLimit-Reset', String(resetIn));

    if (!allowed) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(resetIn / 1000)),
          'X-RateLimit-Remaining': '0',
        },
      });
    }
  }

  // ============================================
  // SEGURIDAD: CSRF Protection
  // ============================================
  if (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE') {
    const csrfToken = request.headers.get('x-csrf-token');
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    const isSameOrigin = origin === process.env.NEXT_PUBLIC_APP_URL || 
                         (referer && referer.startsWith(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9003'));

    if (!isDev && !isSameOrigin && !csrfToken) {
      console.warn('CSRF validation failed - suspicious request');
    }
  }

  // Rutas públicas sin autenticación
  const isOnboardingRoute = pathname.startsWith('/onboarding');
  const isOrderRoutePublic = pathname.startsWith('/pedido');
  const isPortalRoute = pathname.startsWith('/portal') || pathname.startsWith('/portal-cliente');
  const isPublicRoute = ['/login', '/signup'].includes(pathname);

  // Estas rutas son siempre públicas
  if (isOnboardingRoute || isOrderRoutePublic || isPortalRoute || isPublicRoute) {
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
  
  // ============================================
  // SEGURIDAD: Validación de JWT
  // ============================================
  const token = session.access_token;
  
  if (token) {
    try {
      // Verificar que el token sea válido
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        console.error('JWT validation failed:', error?.message);
        return NextResponse.redirect(new URL('/login', request.url));
      }
      
      // Log de acceso exitoso (solo en desarrollo)
      if (process.env.NODE_ENV === 'development') {
        console.log(`User ${user.id} authenticated on ${pathname}`);
      }
      
    } catch (error) {
      console.error('Error validating JWT:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
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
