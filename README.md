# Blonde Orders - Sistema de Gestión de Pedidos

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js 15">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase" alt="Supabase">
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind">
  <img src="https://img.shields.io/badge/Google_Genkit-4285F4?style=for-the-badge&logo=google" alt="Genkit">
</p>

## Tabla de Contenidos

1. [Descripción del Proyecto](#descripción-del-proyecto)
2. [Características Principales](#características-principales)
3. [Arquitectura del Sistema](#arquitectura-del-sistema)
4. [Stack Tecnológico](#stack-tecnológico)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Getting Started](#getting-started)
7. [Configuración de Variables de Entorno](#configuración-de-variables-de-entorno)
8. [Configuración de Base de Datos](#configuración-de-base-de-datos)
9. [Scripts Disponibles](#scripts-disponibles)
10. [Testing](#testing)
11. [Seguridad](#seguridad)
12. [Despliegue](#despliegue)
13. [Contribución](#contribución)
14. [Licencia](#licencia)

---

## Descripción del Proyecto

**Blonde Orders** es un sistema moderno de gestión de pedidos B2B diseñado específicamente para proveedores de productos de belleza. El sistema permite a los administradores gestionar clientes, convenios, productos, precios y promociones, mientras que los clientes pueden realizar pedidos a través de un portal personalizado.

El proyecto está desarrollado con un enfoque en **simplicidad, logística profesional y experiencia de usuario premium**, utilizando una estética de "Lujo Oscuro" con efectos de cristal (glassmorphism).

---

## Características Principales

### 🔐 Sistema de Autenticación
- Autenticación segura con Supabase Auth
- Roles de usuario: Administrador (Super Admin) y Clientes
- Tokens JWT con validación en middleware
- Rate limiting para protección contra ataques

### 📊 Dashboard Logístico
- Vista completa de métricas de negocio
- Gestión de pedidos en estados: `armado` → `transito` → `entregado`
- Notificaciones en tiempo real de nuevos pedidos
- Seguimiento de clientes pendientes

### 👥 Gestión de Clientes
- Alta manual de clientes por el administrador
- Generación de enlaces de invitación para auto-gestión
- Estados: `pending_onboarding`, `pending_agreement`, `active`, `archived`
- Historial de cambios pendentes de aprobación

### 📋 Convenios y Precios
- Múltiples listas de precios por convenio
- Precios regulares y por volumen
- Promociones automáticas (2x1, descuentos)
- Condiciones de venta personalizadas

### 🖨️ Sistema de Rótulos
- Generación de etiquetas PDF para pedidos
- Numeración de bultos automática
- Códigos QR para confirmación de entrega
- Información de entrega y notas del pedido
- Descarga e impresión directa

### 🤖 Comandos de IA
- Creación de promociones mediante lenguaje natural
- Generación de listas de precios con Genkit
- Análisis de comportamiento de clientes
- Asistente virtual para tareas administrativas

### 📱 Portal de Cliente
- Catálogo de productos personalizado por convenio
- Carrito de compras con persistencia local
- Cálculo automático de promociones y descuentos
- Historial de pedidos
- Confirmación de recepción via QR

### 🎨 Interfaz de Usuario
- Diseño "Dark Luxury" con glassmorphism
- Totalmente responsive (móvil, tablet, desktop)
- Componentes accesibles (shadcn/ui)
- Tema claro/oscuro

### 📥📤 Importación y Exportación de Datos
- Importación masiva desde Excel (.xlsx) y CSV
- Exportación a Excel y CSV
- Plantillas descargables para cada tipo de dato
- Validación de datos antes de importar
- Reporte de errores detallado

---

## Arquitectura del Sistema

### Flujos Principales

#### 1. Registro de Administrador
```
/login → Verificar si existen usuarios → /signup (si no hay) → Crear cuenta → /login
```

#### 2. Autenticación de Admin
```
/login → Validar credenciales → Crear sesión JWT → Redirigir a /admin
```

#### 3. Creación de Cliente
- **Manual**: Admin crea cliente y asigna convenio
- **Por Invitación**: Admin genera enlace → Cliente completa onboarding → Queda activo

#### 4. Flujo de Pedido
```
Admin copia enlace de pedido → Cliente accede → Agrega productos → Envía → 
Genera mensaje WhatsApp → Admin recibe → Prepara → Imprime rótulos → Entrega
```

### Seguridad
- **Middleware**: Headers de seguridad, validación JWT, rate limiting
- **RLS (Row Level Security)**: Políticas de Supabase
- **CSRF**: Validación de origen en requests sensibles

---

## Stack Tecnológico

| Tecnología | Propósito |
|------------|-----------|
| **Next.js 15** | Framework React con App Router |
| **TypeScript** | Tipado estático |
| **Supabase** | Base de datos PostgreSQL + Auth |
| **Tailwind CSS** | Estilos utility-first |
| **shadcn/ui** | Componentes UI basados en Radix |
| **Zustand** | Estado global del cliente (carrito) |
| **React Hook Form + Zod** | Validación de formularios |
| **Google Genkit** | IA (análisis de clientes, comandos) |
| **Sonner** | Notificaciones toast |
| **Jest** | Testing unitario |

---

## Estructura del Proyecto

```
Mrblondeapp-main/
├── .github/
│   └── workflows/           # CI/CD con GitHub Actions
├── src/
│   ├── ai/                  # Configuración y flujos de Genkit
│   │   ├── flows/          # Flujos de IA
│   │   └── genkit.ts       # Inicialización
│   ├── app/                # Páginas de Next.js (App Router)
│   │   ├── (admin)/        # Rutas protegidas del admin
│   │   ├── (auth)/         # Login, signup
│   │   ├── actions/        # Server Actions
│   │   ├── admin/          # Panel de administración
│   │   ├── pedido/[id]/    # Portal público de pedidos
│   │   └── onboarding/[token]/ # Alta de clientes
│   ├── components/
│   │   ├── shared/         # Componentes compartidos
│   │   │   ├── empty-state.tsx
│   │   │   ├── page-header.tsx
│   │   │   ├── skeleton.tsx
│   │   │   └── skip-link.tsx
│   │   └── ui/             # Componentes shadcn/ui
│   ├── hooks/              # Custom hooks
│   │   ├── use-cart-store.ts   # Estado del carrito (Zustand)
│   │   ├── use-toast.ts        # Sistema de toasts legacy
│   │   └── use-sonner.ts       # Sistema de toasts (Sonner)
│   ├── lib/
│   │   ├── logic/          # Lógica de negocio
│   │   │   └── cart-calculations.ts
│   │   ├── supabase/       # Clientes de Supabase
│   │   │   ├── server.ts   # Cliente servidor
│   │   │   ├── client.ts   # Cliente cliente
│   │   │   ├── admin.ts    # Cliente admin (service role)
│   │   │   └── middleware.ts
│   │   ├── validations/    # Esquemas Zod
│   │   │   ├── client.schema.ts
│   │   │   └── product.schema.ts
│   │   ├── utils.ts        # Utilidades (cn, formatDate)
│   │   ├── formatters.ts   # Formatos de moneda/fecha
│   │   ├── logger.ts       # Sistema de logging
│   │   └── rate-limiter.ts # Rate limiting
│   └── types/              # Definiciones de TypeScript
│       └── index.ts
├── public/
├── .env.example            # Template de variables de entorno
├── .env.local             # Variables locales (no commitear)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
├── middleware.ts          # Middleware de seguridad
├── AGENTS.md              # Guía para agentes IA
├── ARCHITECTURE.md        # Documentación de arquitectura
├── INSTRUCCIONES.md       # Guía de configuración
└── README.md              # Este archivo
```

---

## Getting Started

### Requisitos Previos

- **Node.js** 20.x o superior
- **npm** 10.x o superior (o yarn/pnpm)
- **Cuenta de Supabase** (gratis para desarrollo)

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Leemonztuff/MrB.git
cd MrB

# 2. Instalar dependencias
npm install

# 3. Copiar archivo de ejemplo de variables
cp .env.example .env.local
```

---

## Configuración de Variables de Entorno

Edita el archivo `.env.local` con tus credenciales:

```env
# === Supabase ===
# URL de tu proyecto (Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co

# Clave pública anónima (Project Settings → API → anon key)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Clave de servicio (Settings → API → service_role)
# ⚠️ ¡No exponer en el cliente!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# === Aplicación ===
NEXT_PUBLIC_APP_URL=http://localhost:9003

# === Google Maps (Opcional) ===
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=tu-api-key
```

### Obtener Credenciales de Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com)
2. Ve a **Project Settings** → **API**
3. Copia la **Project URL**
4. Copia la **anon public key**
5. Ve a **Settings** → **API** (abajo) → **Service Role Key**

---

## Configuración de Base de Datos

### Opción 1: Script SQL Automático

El proyecto incluye un script SQL idempotente en `src/lib/supabase/schema.sql`:

1. Abre el **SQL Editor** en tu panel de Supabase
2. Copia el contenido de `src/lib/supabase/schema.sql`
3. Pega y ejecuta en el editor
4. El script creará todas las tablas, funciones y políticas necesarias

### Opción 2: Cargar Datos de Ejemplo

Si quieres datos de prueba:

1. Copia el contenido de `src/lib/supabase/seed.sql`
2. Ejecútalo en el SQL Editor

---

## Scripts Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar servidor de desarrollo (puerto 9003) |
| `npm run build` | Compilar para producción |
| `npm run start` | Iniciar servidor de producción |
| `npm run lint` | Verificar código con ESLint |
| `npx tsc --noEmit` | Verificar tipos TypeScript |
| `npm test` | Ejecutar tests unitarios |
| `npm test -- --watch` | Ejecutar tests en modo watch |

---

## Testing

```bash
# Ejecutar todos los tests
npm test

# Ejecutar en modo watch
npm test -- --watch

# Ejecutar con cobertura
npm test -- --coverage
```

### Configuración de Tests

- **Framework**: Jest
- **Ubicación**: `src/lib/__tests__/` (por crear)
- **Setup**: `jest.setup.ts` (por crear)

> **Nota**: Actualmente no existen tests. El proyecto está configurado para Jest pero falta implementación.

---

## Seguridad

### Middleware (`middleware.ts`)

El middleware implementa múltiples capas de seguridad:

- **Headers de Protección**:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy

- **Validación JWT**: Verificación de tokens en cada request

- **Rate Limiting**:
  - `authLimiter`: 10 requests/15min (rutas auth)
  - `apiLimiter`: 100 requests/1min (APIs)
  - `orderLimiter`: 20 requests/1min (pedidos)

### Base de Datos

- **RLS (Row Level Security)**: Políticas activas en todas las tablas
- **Service Role**: Solo usado en Server Actions autenticadas

---

## Despliegue

### Desarrollo Local

```bash
npm run dev
# App disponible en http://localhost:9003
```

### Producción

El proyecto incluye CI/CD con GitHub Actions (`.github/workflows/ci-cd.yml`):

#### Flujo de CI/CD

```
┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│   Push      │───▶│  Lint + Types   │───▶│   Tests     │
│             │    │  + Build        │    │  (Jest)     │
└─────────────┘    └─────────────────┘    └─────────────┘
                                               │
                                               ▼
┌─────────────┐    ┌─────────────────┐    ┌─────────────┐
│  Staging    │◀───│   Deploy        │◀───│   Build     │
│  (develop)  │    │   Vercel        │    │   OK        │
└─────────────┘    └─────────────────┘    └─────────────┘
                                               │
                                               ▼
┌─────────────┐    ┌─────────────────┐
│  Production │◀───│   Deploy        │
│  (main)     │    │   Vercel        │
└─────────────┘    └─────────────────┘
```

#### Ramas

- `main` → Deploy automático a **Producción**
- `develop` → Deploy automático a **Staging**
- PRs a `main` → CI completo

#### Variables de Secrets (GitHub)

Configura en Settings → Secrets and variables → Actions:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

---

## Contribución

1. Haz fork del proyecto
2. Crea una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'feat: nueva caracteristica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

### Convenciones de Commits

Usamos commit messages convencionales:

- `feat:` Nueva característica
- `fix:` Corrección de bug
- `docs:` Documentación
- `style:` Cambios de formato
- `refactor:` Refactorización
- `test:` Tests
- `chore:` Mantenimiento

---

## Licencia

Este proyecto es un **prototipo funcional** para **Mr. Blonde**.

Todos los derechos reservados © 2024 Mr. Blonde.

---

## Recursos Adicionales

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Genkit](https://genkit.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

<p align="center">
  <strong>Blonde Orders</strong> - Sistema de Gestión de Pedidos B2B
  <br>
  Desarrollado con ❤️ para Mr. Blonde
</p>
