# Blonde Orders (Mr. Blonde)

Sistema moderno de gestión de pedidos B2B diseñado para proveedores de productos de belleza. Enfocado en simplicidad, logística profesional y una experiencia de usuario premium.

## 🌟 Características Principales
- **Dashboard Logístico Pro**: Gestión de pedidos en estados `armado`, `transito` y `entregado`.
- **Rótulos Inteligentes**: Generación de etiquetas PDF con numeración de bultos y códigos QR.
- **Portal de Cliente**: Los clientes pueden confirmar la recepción del pedido escaneando el QR del rótulo.
- **Comandos de IA**: Creación de promociones y listas de precios mediante lenguaje natural.
- **UI Modernizada**: Estética de "Lujo Oscuro" con efectos de cristal (glassmorphism).

## Capturas de pantalla

<table>
  <tr>
    <td width="50%">
      <img src="./docs/screenshots/dashboard.png" alt="Centro de operaciones con prioridades y estados de pedidos" width="100%">
      <p align="center"><strong>Centro de operaciones</strong></p>
    </td>
    <td width="50%">
      <img src="./docs/screenshots/orders.png" alt="Historial de pedidos y estados de despacho" width="100%">
      <p align="center"><strong>Historial de pedidos</strong></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="./docs/screenshots/products.png" alt="Catálogo de productos agrupado por categorías" width="100%">
      <p align="center"><strong>Productos</strong></p>
    </td>
    <td width="50%">
      <img src="./docs/screenshots/client-detail.png" alt="Detalle de cliente con historial y condiciones comerciales; datos identificatorios ocultos" width="100%">
      <p align="center"><strong>Gestión de clientes</strong></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="./docs/screenshots/commercial-settings.png" alt="Gestión comercial de listas de precios, promociones y condiciones" width="100%">
      <p align="center"><strong>Gestión comercial</strong></p>
    </td>
    <td width="50%">
      <img src="./docs/screenshots/customer-catalog.png" alt="Catálogo de productos del portal de pedidos con el resumen del convenio" width="100%">
      <p align="center"><strong>Portal de pedidos</strong></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="./docs/screenshots/customer-cart.png" alt="Carrito de pedidos con promociones y acción para continuar por WhatsApp" width="100%">
      <p align="center"><strong>Carrito y promociones</strong></p>
    </td>
    <td width="50%">
      <img src="./docs/screenshots/curated-orders.png" alt="Vista previa de órdenes de preparación acumuladas para imprimir en formato A5" width="100%">
      <p align="center"><strong>Órdenes de preparación</strong></p>
    </td>
  </tr>
  <tr>
    <td width="50%">
      <img src="./docs/screenshots/shipping-labels.png" alt="Gestión e impresión de rótulos de envío; datos del destinatario y código QR ocultos" width="100%">
      <p align="center"><strong>Rótulos de envío</strong></p>
    </td>
    <td width="50%"></td>
  </tr>
</table>

## 🛠️ Stack Tecnológico
- **Framework**: Next.js 15 (App Router)
- **Base de Datos & Auth**: Supabase
- **Estilos**: Tailwind CSS + shadcn/ui
- **Estado**: Zustand (Carrito de compras)

## Configuración local
Para instrucciones detalladas de instalación, entorno y base de datos, consulta [INSTRUCCIONES.md](./INSTRUCCIONES.md). **No ejecutes el esquema de reconstrucción sobre una base existente.**

## Desarrollo con agentes
Las reglas canónicas para agentes están en [AGENTS.md](./AGENTS.md). También consulta [arquitectura](./ARCHITECTURE.md), [reglas de negocio](./docs/engineering/business-rules.md) y [base de datos y seguridad](./docs/engineering/database.md).

Para validar cambios localmente: `npm run lint`, `npm run typecheck` y `npm test`.

## 📄 Licencia
Este proyecto es un prototipo funcional para Mr. Blonde.