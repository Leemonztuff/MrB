# Arquitectura y Mapa del Proyecto: Blonde Orders

Este documento sirve como guía de referencia para la estructura, lógica y flujos de datos de la aplicación "Blonde Orders". Su propósito es mantener la coherencia y la lógica durante el desarrollo.

## 1. Stack Tecnológico

- **Framework**: Next.js (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos y Auth**: Supabase
- **UI**: Tailwind CSS, shadcn/ui, Radix UI
- **Gestión de Estado (Cliente)**: Zustand
- **Validación de Formularios**: React Hook Form, Zod
- **Funcionalidad IA**: Genkit (Google AI)

## 2. Mapa de Directorios Clave

```
/
├── src/
│   ├── ai/                 # Lógica de Inteligencia Artificial (Genkit)
│   │   ├── flows/          # Flujos de Genkit (e.g., análisis de clientes, parser de comandos)
│   │   └── genkit.ts       # Configuración e inicialización de Genkit
│   │
│   ├── app/                # Rutas y lógica principal (Next.js App Router)
│   │   ├── (admin)/        # Rutas protegidas del panel de administración
│   │   │   ├── admin/
│   │   │   │   ├── actions/      # Server Actions específicas del admin (separadas por entidad)
│   │   │   │   ├── agreements/   # Gestión de convenios (crear, editar, asignar)
│   │   │   │   ├── clients/      # CRUD de clientes
│   │   │   │   ├── products/     # CRUD de productos
│   │   │   │   └── commercial-settings/ # Pestañas para Listas de precios, Promociones, etc.
│   │   │   └── layout.tsx      # Layout principal del panel de admin (navegación, notificaciones)
│   │   │
│   │   ├── (auth)/         # Rutas de autenticación
│   │   │   ├── login/      # Página de login con email/contraseña
│   │   │   └── signup/     # Página de registro del primer admin
│   │   │
│   │   ├── pedido/[id]/    # Página PÚBLICA para que los clientes realicen pedidos
│   │   │
│   │   ├── onboarding/[token]/ # Página PÚBLICA para que clientes completen su alta
│   │   │
│   │   ├── actions/        # Server Actions (lógica de backend general y de usuario)
│   │   │   ├── user.actions.ts  # Acciones de usuario (auth, pedidos, onboarding)
│   │   │   └── settings.actions.ts # Acciones para la configuración de la app
│   │   │
│   │   ├── globals.css     # Estilos globales y variables de tema (Tailwind)
│   │   └── layout.tsx      # Layout raíz de la aplicación
│   │
│   ├── components/         # Componentes de UI reutilizables
│   │   ├── shared/         # Componentes genéricos (e.g., PageHeader, EmptyState)
│   │   └── ui/             # Componentes de shadcn/ui (Button, Card, etc.)
│   │
│   ├── hooks/              # Hooks de React personalizados
│   │   └── use-cart-store.ts # Lógica del carrito de compras con Zustand
│   │
│   ├── lib/                # Utilidades y configuración
│   │   ├── supabase/       # Clientes de Supabase (client, server, admin, middleware)
│   │   └── utils.ts        # Funciones de utilidad (e.g., cn, formatDate)
│   │
│   └── types/              # Definiciones de tipos de TypeScript
│       └── index.ts        # Tipos principales (Product, Agreement, etc.)
│
├── middleware.ts         # Middleware para gestionar el enrutamiento y la autenticación
│
└── INSTRUCCIONES.md      # Guía de configuración con el script SQL de la DB
```

## 3. Flujos Lógicos Principales

### a. Flujo de Primer Uso (Registro de Administrador)

1.  **Acceso a `/login`**: El usuario visita la página de login por primera vez.
2.  **Verificación en la Página**: La `Server Component` de `/login/page.tsx` llama a la `Server Action` `hasUsers()` de `user.actions.ts`.
3.  **`hasUsers()`**: Esta función usa el cliente de Supabase con `SERVICE_ROLE_KEY` (`supabaseAdmin`) para comprobar si existe algún usuario en la tabla `auth.users`. Es la única función que requiere estos privilegios.
4.  **Redirección Condicional**:
    -   Si `hasUsers()` devuelve `false`, la página de login redirige inmediatamente a `/signup`.
    -   Si `hasUsers()` devuelve `true`, la página de login se renderiza normalmente.
5.  **Acceso a `/signup`**: De manera similar, la página de `/signup` también llama a `hasUsers()`. Si devuelve `true`, redirige a `/login` para impedir nuevos registros.
6.  **Registro**: El formulario en `/signup` llama a la `Server Action` `signupSuperAdmin`. Esta acción crea el primer usuario administrador con el email y contraseña proporcionados.
7.  **Redirección Post-Registro**: Tras el éxito, redirige a `/login` para que el administrador inicie sesión por primera vez.

### b. Flujo de Autenticación de Administrador

1.  **Acceso a `/login`**: El administrador accede a la página de login e introduce su email y contraseña.
2.  **Acción de Login**: El formulario llama a la `Server Action` `login()`.
3.  **Validación y Sesión**: `login()` verifica las credenciales usando `signInWithPassword` de Supabase para establecer una sesión.
4.  **Redirección a Admin**: Con una sesión válida, el `middleware` redirige al usuario a `/admin`. Las rutas dentro de `/admin` están protegidas y requieren una sesión activa.

### c. Flujo de Creación de Cliente

Existen dos maneras de crear un cliente:

**1. Creación Manual (por el Admin):**
1.  El admin va a la sección "Clientes" y hace clic en "Agregar Cliente".
2.  Elige la opción "Crear Manualmente".
3.  Se abre un formulario completo donde el admin introduce todos los datos del cliente (nombre, CUIT, dirección, etc.) y puede asignarle un convenio existente.
4.  Al enviar, la `server action` `upsertClient` crea el cliente en la base de datos con estado "active" (si se asignó convenio) o "pending_agreement" (si no).

**2. Creación por Invitación (auto-gestionado por el cliente):**
1.  El admin va a la sección "Clientes" y hace clic en "Agregar Cliente".
2.  Elige la opción "Generar Enlace de Invitación".
3.  Puede (opcionalmente) pre-asignar un convenio.
4.  La `server action` `createClientForInvitation` crea un cliente con estado `pending_onboarding` y devuelve un token único.
5.  El admin copia el enlace `/onboarding/[token]` y se lo envía al cliente.
6.  El cliente abre el enlace, ve un formulario de alta y completa sus datos.
7.  Al enviar, la `server action` `submitOnboardingForm` actualiza los datos del cliente y cambia su estado a `active` o `pending_agreement`.

### d. Flujo de Envío de Pedido del Cliente

1.  **Admin Genera Link**: En el panel de admin (`/admin/agreements`), el admin copia el enlace único para un convenio. Este enlace contiene el ID del convenio (e.g., `/pedido/uuid-del-convenio`).
2.  **Cliente Accede al Link**: El cliente abre el enlace. La página `/pedido/[id]/page.tsx` se renderiza en el servidor.
3.  **Obtención de Datos**: La página llama a la `Server Action` `getOrderPageData(id)`. Esta acción consulta la base de datos para obtener los detalles del convenio, los productos asignados con sus precios específicos y las promociones aplicables.
4.  **Renderizado de la Página**: La página se muestra al cliente con los productos agrupados por categoría.
5.  **Interacción del Cliente**:
    -   El cliente añade o quita productos. El estado del carrito se gestiona en el cliente con `useCartStore` (Zustand) para una experiencia instantánea.
    -   El `store` del carrito recalcula automáticamente las promociones (ej. 2x1) y descuentos por volumen o monto mínimo.
6.  **Finalización del Pedido**:
    -   El cliente revisa el `OrderSummary`.
    -   Al hacer clic en "Enviar", la `server action` `submitOrder` guarda el pedido en la base de datos.
    -   Luego, la función `formatWhatsAppMessage` construye un texto pre-formateado y abre la URL de WhatsApp para enviar el pedido al número de la empresa.

## 4. Seguridad y Producción

### Middleware de Seguridad
El archivo `middleware.ts` implementa múltiples capas de seguridad:

- **Headers de Protección**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Validación JWT**: Verificación de tokens en cada request
- **Rate Limiting**: Límites por IP para prevenir ataques de fuerza bruta
- **CSRF Protection**: Validación de origen en requests POST/PUT/DELETE

### Rate Limiting
Located in `src/lib/rate-limiter.ts`:

- `authLimiter`: 10 requests/15min para rutas de autenticación
- `apiLimiter`: 100 requests/1min para APIs
- `orderLimiter`: 20 requests/1min para pedidos

### Error Handling
- **Error Boundary**: Componente en `src/components/error-boundary.tsx`
- **Global Error**: Página en `src/app/global-error.tsx`
- **Logger**: Sistema de logging estructurado en `src/lib/logger.ts`
- **404 Personalizado**: Página en `src/app/not-found.tsx`

### Monitoring
- **Health Check**: Endpoint en `/api/health` para verificación de estado
- **Sentry Integration**: Error tracking configurado en `sentry.client.config.ts`
- **Logging**: Sistema estructurado con niveles (debug, info, warn, error)

## 5. Testing

### Configuración Jest
- **Config**: `jest.config.js`
- **Setup**: `jest.setup.ts`
- **Tests**: Ubicados en `src/lib/__tests__/`

### Ejecución de Tests
```bash
npm test              # Ejecutar tests
npm run test:watch   # Modo watch
npm run test:coverage # Con cobertura
```

## 6. CI/CD

### Pipeline GitHub Actions
Ubicado en `.github/workflows/ci-cd.yml`:

1. **Lint & Type Check**: ESLint y TypeScript
2. **Unit Tests**: Jest con cobertura
3. **Build**: Compilación Next.js
4. **Deploy**: Staging (develop) y Production (main)

### Secrets Requeridos
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_TOKEN` (para deploy)
- `SENTRY_ORG` y `SENTRY_PROJECT` (para sourcemaps)

## 7. Variables de Entorno

Ver `.env.example` para las variables requeridas:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

## 8. Optimizaciones de Performance

- **Images**: Formatos AVIF/WebP configurados en `next.config.ts`
- **Fonts**: Display swap, preload, fallback configurados
- **Code Splitting**: Dynamic imports para componentes pesados
- **Suspense**: Loading states en rutas del admin
