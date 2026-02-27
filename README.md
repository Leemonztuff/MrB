# Blonde Orders (Mr. Blonde)

Sistema moderno de gestión de pedidos B2B diseñado para proveedores de productos de belleza. Enfocado en simplicidad, logística profesional y una experiencia de usuario premium.

## 🌟 Características Principales
- **Dashboard Logístico Pro**: Gestión de pedidos en estados `armado`, `transito` y `entregado`.
- **Rótulos Inteligentes**: Generación de etiquetas PDF con numeración de bultos y códigos QR.
- **Portal de Cliente**: Los clientes pueden confirmar la recepción del pedido escaneando el QR del rótulo.
- **Comandos de IA**: Creación de promociones y listas de precios mediante lenguaje natural.
- **UI Modernizada**: Estética de "Lujo Oscuro" con efectos de cristal (glassmorphism).

## 🛠️ Stack Tecnológico
- **Framework**: Next.js 15 (App Router)
- **Base de Datos & Auth**: Supabase
- **Estilos**: Tailwind CSS + shadcn/ui
- **IA**: Google Genkit (Gemini 2.0)
- **Estado**: Zustand (Carrito de compras)
- **Testing**: Jest + React Testing Library
- **Monitoring**: Sentry

## 🚀 Getting Started

### Requisitos Previos
- Node.js 20+
- npm o yarn
- Cuenta de Supabase

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Leemonztuff/MrB.git
cd MrB

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase
```

### Configurar Base de Datos
1. Crear proyecto en [Supabase](https://supabase.com)
2. Ejecutar el script SQL en `INSTRUCCIONES.md`
3. Configurar las variables en `.env.local`

### Desarrollo
```bash
npm run dev
```
La app estará disponible en `http://localhost:9003`

## 🧪 Testing

```bash
npm test              # Ejecutar tests
npm run test:watch   # Modo watch
npm run test:coverage # Con cobertura
```

## 📋 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Iniciar servidor de desarrollo |
| `npm run build` | Compilar para producción |
| `npm run start` | Iniciar servidor de producción |
| `npm run lint` | Verificar código |
| `npm test` | Ejecutar tests |

## 🔒 Seguridad

- **Rate Limiting**: Protección contra ataques de fuerza bruta
- **JWT Validation**: Verificación de tokens en cada request
- **CSRF Protection**: Validación de origen en requests sensibles
- **Security Headers**: X-Frame-Options, X-Content-Type, etc.

## 📦 Despliegue

El proyecto incluye CI/CD con GitHub Actions. Hacer push a:
- `develop` → Deploy automático a Staging
- `main` → Deploy automático a Producción

## 📄 Licencia
Este proyecto es un prototipo funcional para Mr. Blonde.