# Biblia de Estilo y Sistema de Diseño UI (MrB)

Este documento es la **fuente canónica de diseño, componentes y lineamientos UX/UI** para la aplicación MrB. Cualquier desarrollador o agente de inteligencia artificial (IA) que cree, extienda o modifique pantallas y componentes debe seguir estrictamente estas definiciones para garantizar coherencia visual, jerarquía semántica y ergonomía táctil en móviles.

---

## 1. Filosofía y Dirección Visual

- **Personalidad de Marca**: Lujo industrial, contemporáneo, sobrio y enfocado en operaciones B2B ágiles (distribución de barbería, bebidas y productos boutique).
- **Esquema de Color Base**: Modo oscuro nativo (*dark mode first*). Los fondos son profundos, con capas de elevación mediante *glassmorphism* sutil y bordes traslúcidos.
- **Tipografía**: Century Gothic (`font-headline`, `font-body`) con contrastes fuertes de peso (desde `font-black` en mayúsculas condensadas hasta `text-muted-foreground` de lectura suave).

---

## 2. Paleta de Colores y Tokens

### 2.1 Colores Fundamentales (Tokens HSL)
Definidos en `src/app/globals.css` y mapeados en `tailwind.config.ts`:

| Token | HSL / Valor | Uso |
|---|---|---|
| `--primary` | `41 47% 57%` (`#c89f53`) | **Mr. Blonde Gold**: Acentos de marca, foco activo, llamadas a la acción principales genéricas |
| `--primary-foreground` | `0 0% 0%` (Dark) / `0 0% 8%` | Texto legible sobre fondo dorado primario |
| `--background` | `0 0% 7%` (Dark) / `0 0% 98%` | Fondo de la aplicación |
| `--card` / `--popover` | `0 0% 8%` (Dark) | Superficies elevadas y contenedores |
| `--border` | `0 0% 15%` (`white/10` - `white/15`) | Bordes sutiles de separación |
| `--muted` | `0 0% 12%` | Fondos de elementos inactivos o secundarios |
| `--muted-foreground` | `0 0% 65%` | Texto secundario, etiquetas, metadatos |
| `--destructive` | `0 84% 60%` | Errores, advertencias críticas y cancelaciones |

### 2.2 Paleta Semántica del Flujo Operativo (Workflow)
**REGLA OBLIGATORIA:** Las etapas de pedidos y sus botones de acción deben respetar unívocamente este código cromático en toda la aplicación (tabla, kanban, cards y mobile):

| Etapa / Acción | Tono Tailwind | Clases de Botón Recomendadas | Clases de Badge / Borde |
|---|---|---|---|
| **WhatsApp / Recepción** | `sky` (Azul cielo) | `bg-sky-700 hover:bg-sky-800 text-white` | `border-sky-500/30 bg-sky-500/10 text-sky-400` |
| **Preparación / Armado** | `violet` (Violeta) | `bg-violet-700 hover:bg-violet-800 text-white` | `border-violet-500/30 bg-violet-500/10 text-violet-400` |
| **Rótulos / Etiquetado** | `amber` (Ámbar) | `bg-amber-600 hover:bg-amber-700 text-white` | `border-amber-500/30 bg-amber-500/10 text-amber-400` |
| **Despacho / Tránsito** | `emerald` (Verde esmeralda) | `bg-emerald-700 hover:bg-emerald-800 text-white` | `border-emerald-500/30 bg-emerald-500/10 text-emerald-400` |
| **Entregado / Conformado**| `green` / `teal` | `bg-green-600 hover:bg-green-700 text-white` | `border-green-500/30 bg-green-500/10 text-green-400` |
| **Acción Secundaria / Ver**| `neutral / glass` | `border-white/15 bg-white/5 hover:bg-white/10 text-foreground` | `border-white/10 bg-white/5 text-muted-foreground` |
| **Demorado (+48h) / Alerta**| `red` (Rojo) | `bg-destructive text-destructive-foreground` | `border-red-500/40 bg-red-500/10 text-red-400` |

---

## 3. Principios de Adaptabilidad Mobile-First

El panel administrativo y operativo de MrB se utiliza activamente desde teléfonos en el depósito y la ruta de entrega. La interfaz debe cumplir:

1. **Patrón Dual (Desktop Table vs. Mobile Cards)**:
   - **Desktop (`md:block`)**: Tablas de datos compactas y organizadas con acciones alineadas a la derecha.
   - **Móvil (`md:hidden`)**: Tarjetas operativas individuales (`Card`), sin necesidad de scroll horizontal. La información se distribuye verticalmente priorizando legibilidad y velocidad de toque.
2. **Dimensiones Táctiles (Touch Targets)**:
   - Todo botón interactivo en móvil debe tener un alto mínimo de **`h-11` (44px)** o **`h-12` (48px)** para pulsar sin dificultad con una sola mano.
   - Espaciado mínimo entre zonas táctiles contiguas: `gap-2` (8px).
3. **Jerarquía Visual de Acciones en Móvil**:
   - **Botón Primario Destacado**: La acción correspondiente al paso pendiente (ej. "Confirmar recepción", "Marcar preparado", "Imprimir rótulo" o "Despachar") debe ser el botón más visible y ocupar ancho completo o prioritario.
   - **Botones Secundarios**: Acciones de apoyo ("Ver pedido", cambiar cantidad de bultos) se ubican ordenadamente abajo o al costado sin competir en jerarquía.

---

## 4. Componentes y Patrones UI

### 4.1 Botones (`Button`)
- **Acciones Primarias de Workflow**: Utilizan sus colores semánticos respectivos (`bg-sky-700`, `bg-violet-700`, `bg-amber-600`, `bg-emerald-700`).
- **Acciones Globales de Marca**: Utilizan `variant="default"` (`bg-primary text-primary-foreground font-semibold`).
- **Acciones Secundarias / Consulta**: Utilizan `variant="outline"` con estilo glass (`glass border-white/10 hover:bg-white/5`).
- **Iconografía**: Siempre acompañada de un ícono de Lucide React con tamaño `h-4 w-4` y espaciado `gap-2`.

### 4.2 Badges de Estado
- `armado`: "En gestión" (`bg-secondary/20 text-secondary border-secondary/20`).
- `transito`: "Despachado" (`bg-primary/20 text-primary border-primary/20`).
- `entregado`: "Conformado" (`bg-green-500/10 text-green-500 border-green-500/20`).
- `Rótulo confirmado`: Badge verde sutil (`border-green-500/30 text-green-400 bg-green-500/10`).

### 4.3 Cards y Contenedores (`GlassCard`)
- Usar la clase utilitaria `.glass` (`bg-card/80 backdrop-blur-md border border-border shadow-2xl`).
- Esquinas redondeadas usando tokens del tema (`rounded-xl` o `rounded-2xl`).

---

## 5. Reglas de Oro para Agentes de IA

1. **Nunca forzar scroll horizontal como única experiencia móvil en vistas operativas.** Siempre proveer el layout dual `md:hidden` (tarjetas) y `hidden md:block` (tabla).
2. **No inventar colores arbitrarios para acciones de pedidos.** Si es WhatsApp usa `sky`, si es preparación usa `violet`, si es rótulo usa `amber`, si es despacho usa `emerald`.
3. **Reutilizar siempre `getOrderDispatchBlocker(order)`** de `src/lib/order-workflow.ts` para determinar qué acción está pendiente o bloqueada.
4. **Respetar la confirmación manual de WhatsApp:** La UI no debe asumir que el mensaje se envió solo por abrir un enlace.
5. **Idioma:** Todas las interfaces y textos dirigidos al usuario deben redactarse en **español rioplatense neutro**, manteniendo los nombres de campos y botones ya existentes.

