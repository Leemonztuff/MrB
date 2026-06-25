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
- **Estado**: Zustand (Carrito de compras)

## 📦 Configuración Local
Para instrucciones detalladas sobre cómo correr este proyecto en tu PC, consulta el archivo [INSTRUCCIONES.md](./INSTRUCCIONES.md).

1. `npm install`
2. Configurar `.env.local`
3. Ejecutar `src/lib/supabase/schema.sql` en Supabase.
4. `npm run dev`

## 📄 Licencia
Este proyecto es un prototipo funcional para Mr. Blonde.