# Plan de Corrección: 44 Issues de Lógica de Negocio

**Fecha:** 24 de Junio, 2026
**Proyecto:** MrB (Blonde Orders)
**Estado:** Pendiente de revisión

---

## Resumen Ejecutivo

Se identificaron **44 issues** en la lógica de negocio, algoritmos y cálculos de la aplicación. Están clasificados por severidad:

| Severidad | Cantidad | Descripción |
|-----------|----------|-------------|
| **CRÍTICO** | 4 | Vulnerabilidades de seguridad, datos manipulables por el cliente |
| **ALTO** | 4 | Bugs que afectan integridad de datos y UX |
| **MEDIO** | 5 | Anti-patterns, código muerto, features incompletas |
| **BAJO** | 5 | Precisión de punto flotante, configuración hardcodeada |
| **UX/UI** | 6 | Nombres confusos, manejo de errores, display |
| **Performance** | 4 | Queries ineficientes, almacenamiento |
| **Query Patterns** | 3 | Construcción manual de IN clauses |
| **Validación** | 3 | Schemas incompletos |
| **Features** | 10 | Distribuidos en las categorías anteriores |

---

## Fase 1: Seguridad Crítica

### 1.1 — Validación server-side de pedidos

**Archivo:** `src/app/actions/user.actions.ts:123-175`
**Issue:** #14, #15
**Severidad:** CRÍTICO

**Problema actual:**
```typescript
// El total viene del cliente SIN validación
const { data: order, error: orderError } = await supabase
  .from('orders')
  .insert({
    total_amount: payload.total, // ← PELIGRO: valor del cliente
    ...
  });

// El precio unitario viene del cliente
const orderItems = payload.cart.map(item => ({
  price_per_unit: item.product.price, // ← PELIGRO: precio manipulable
}));
```

**Solución propuesta:**
1. Recalcular `total_amount` en el servidor usando precios de la DB
2. Buscar precios reales desde `price_list_items` por `product_id` + `agreement_id`
3. Usar `Math.round(value * 100) / 100` para evitar errores de punto flotante
4. Si hay discrepancia > $1 entre total del cliente y total calculado, rechazar el pedido
5. Registrar el intento de manipulación en log

**Implementación:**
```typescript
export async function submitOrder(payload: {
  cart: CartItem[];
  total: number; // Se ignora, se recalcula
  clientId: string;
  clientName: string;
  notes?: string;
}): Promise<ActionResponse<{ orderId: string }>> {
  return handleAction(async () => {
    const supabase = await createServerClient();
    
    // 1. Obtener cliente y agreement
    const finalClientId = payload.clientId === 'generic' || !payload.clientId ? null : payload.clientId;
    let agreementId = null;
    let priceListId = null;
    
    if (finalClientId) {
      const { data: client } = await supabase
        .from('clients')
        .select('agreement_id, agreements(price_lists(id))')
        .eq('id', finalClientId)
        .maybeSingle();
      agreementId = client?.agreement_id || null;
      priceListId = client?.agreements?.price_lists?.id || null;
    }

    // 2. Recalcular precios desde la DB
    let serverTotal = 0;
    const orderItems = [];
    
    for (const item of payload.cart) {
      let pricePerUnit = item.product.price; // fallback
      
      if (priceListId) {
        const { data: pli } = await supabase
          .from('price_list_items')
          .select('price')
          .eq('price_list_id', priceListId)
          .eq('product_id', item.product.id)
          .maybeSingle();
        
        if (pli) pricePerUnit = pli.price;
      }
      
      serverTotal += pricePerUnit * item.quantity;
      orderItems.push({
        product_id: item.product.id,
        quantity: item.quantity,
        price_per_unit: pricePerUnit,
      });
    }

    // 3. Validar total (tolerancia de $1 por redondeo)
    serverTotal = Math.round(serverTotal * 100) / 100;
    if (Math.abs(serverTotal - payload.total) > 1) {
      throw new Error("El total del pedido no coincide. Por favor, recarga la página e intenta de nuevo.");
    }

    // 4. Crear orden con total validado
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        client_id: finalClientId,
        agreement_id: agreementId,
        total_amount: serverTotal, // ← Total del servidor
        status: 'armado',
        client_name_cache: payload.clientName || "Cliente",
        notes: payload.notes || null,
      })
      .select()
      .single();

    if (orderError || !order) throw new Error("Error al guardar pedido.");

    // 5. Insertar items con precios del servidor
    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }));
    
    const { error: itemsError } = await supabase.from('order_items').insert(itemsWithOrderId);
    if (itemsError) throw itemsError;

    return { orderId: order.id };
  }, ['/admin']);
}
```

---

### 1.2 — Transacción para creación de pedidos

**Archivo:** `src/app/actions/user.actions.ts:148-171`
**Issue:** #16
**Severidad:** ALTO

**Problema actual:**
- Se inserta la orden primero
- Si falla la inserción de items, queda una orden huérfana
- No hay rollback automático

**Solución propuesta:**
Crear una función SQL `create_order_with_items` que ejecute ambas inserciones atómicamente.

**Implementación SQL (schema.sql):**
```sql
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_client_id UUID,
  p_agreement_id UUID,
  p_total_amount DECIMAL,
  p_client_name_cache TEXT,
  p_notes TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_order JSONB;
  v_item JSONB;
BEGIN
  -- Insertar la orden
  INSERT INTO orders (client_id, agreement_id, total_amount, status, client_name_cache, notes)
  VALUES (p_client_id, p_agreement_id, p_total_amount, 'armado', p_client_name_cache, p_notes)
  RETURNING id INTO v_order_id;

  -- Insertar los items
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (order_id, product_id, quantity, price_per_unit)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price_per_unit')::DECIMAL
    );
  END LOOP;

  -- Retornar la orden creada
  SELECT to_jsonb(o.*) INTO v_order
  FROM orders o
  WHERE o.id = v_order_id;

  RETURN v_order;
END;
$$;
```

**Implementación en TypeScript:**
```typescript
// Reemplazar la inserción manual con:
const { data: order, error } = await supabase.rpc('create_order_with_items', {
  p_client_id: finalClientId,
  p_agreement_id: agreementId,
  p_total_amount: serverTotal,
  p_client_name_cache: payload.clientName || "Cliente",
  p_notes: payload.notes || null,
  p_items: JSON.stringify(orderItems),
});

if (error) throw new Error("Error al guardar pedido.");
return { orderId: order.id };
```

---

### 1.3 — Auth check con paréntesis explícitos

**Archivo:** `src/app/admin/actions/_helpers.ts:20`
**Issue:** #28
**Severidad:** ALTO

**Problema actual:**
```typescript
// Ambigüedad de precedencia || vs &&
if (!user || user.app_metadata?.role !== 'super_admin' && user.role !== 'authenticated')
```

JavaScript evalúa esto como:
```
!user || (user.app_metadata?.role !== 'super_admin' && user.role !== 'authenticated')
```

Esto significa que cualquier usuario con `role === 'authenticated'` pasa el check, sin importar `app_metadata.role`.

**Solución propuesta:**
```typescript
if (!user || (user.app_metadata?.role !== 'super_admin' && user.role !== 'authenticated')) {
  throw new Error("No tienes permisos de administrador para realizar esta acción.");
}
```

**Nota:** Si se quiere exigir `super_admin` explícitamente:
```typescript
if (!user || user.app_metadata?.role !== 'super_admin') {
  throw new Error("No tienes permisos de administrador para realizar esta acción.");
}
```

---

### 1.4 — Seguridad de `publicConfirmOrder`

**Archivo:** `src/app/admin/actions/orders.actions.ts:88-95`
**Issue:** #19
**Severidad:** CRÍTICO

**Problema actual:**
```typescript
// Cualquiera con el UUID puede marcar como entregado
export async function publicConfirmOrder(orderId: string): Promise<ActionResponse<null>> {
  return handleAction(async () => {
    const supabase = await createClient(); // Cliente anónimo
    const { error } = await supabase
      .from('orders')
      .update({ status: 'entregado' })
      .eq('id', orderId);
    if (error) throw error;
    return null;
  }, ['/admin', '/admin/orders']);
}
```

**Solución propuesta:**
1. Agregar campo `confirmation_token` a la tabla `orders`
2. Solo permitir confirmar si el pedido está en estado `transito`
3. Validar el token en el endpoint público

**Implementación SQL:**
```sql
-- Agregar columna a orders
ALTER TABLE orders ADD COLUMN confirmation_token UUID DEFAULT gen_random_uuid();

-- Crear índice para búsquedas rápidas
CREATE INDEX idx_orders_confirmation_token ON orders(confirmation_token);
```

**Implementación en TypeScript:**
```typescript
export async function publicConfirmOrder(
  orderId: string,
  token: string
): Promise<ActionResponse<null>> {
  return handleAction(async () => {
    const supabase = await createClient();
    
    // 1. Buscar el pedido con el token
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, confirmation_token')
      .eq('id', orderId)
      .eq('confirmation_token', token)
      .maybeSingle();
    
    if (fetchError || !order) {
      throw new Error("Pedido no encontrado o token inválido.");
    }
    
    // 2. Solo permitir confirmar si está en tránsito
    if (order.status !== 'transito') {
      throw new Error("Este pedido no puede ser confirmado en su estado actual.");
    }
    
    // 3. Actualizar estado
    const { error } = await supabase
      .from('orders')
      .update({ status: 'entregado' })
      .eq('id', orderId);
    
    if (error) throw error;
    return null;
  }, ['/admin', '/admin/orders']);
}
```

**Actualizar API route:**
```typescript
// src/app/api/pedido/confirmar/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(`${origin}/pedido/confirmar/${id}?error=missing_token`);
  }

  try {
    await publicConfirmOrder(id, token);
  } catch (error) {
    console.error("Error en auto-confirmación vía API:", error);
    return NextResponse.redirect(`${origin}/pedido/confirmar/${id}?error=invalid`);
  }

  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/pedido/confirmar/${id}`);
}
```

---

## Fase 2: Carrito y Persistencia

### 2.1 — Persistir promociones en localStorage

**Archivo:** `src/hooks/use-cart-store.ts:148-169`
**Issue:** #10
**Severidad:** ALTO

**Problema actual:**
```typescript
partialize: (state) =>
  Object.fromEntries(
    Object.entries(state).filter(([key]) => 
      !['promotions', 'appliedPromotions', 'bonusInfo'].includes(key)
    )
  ),
onRehydrateStorage: () => (state, error) => {
  if (state) {
    // Promos se pierden, se pasan []
    const { ... } = calculateCartTotals(state.items, state.pricesIncludeVat, [], state.vatPercentage);
    state.promotions = [];
    state.appliedPromotions = [];
    state.bonusInfo = {};
  }
}
```

**Solución propuesta:**
```typescript
partialize: (state) =>
  Object.fromEntries(
    Object.entries(state).filter(([key]) => 
      !['appliedPromotions', 'bonusInfo'].includes(key)
    )
  ),
onRehydrateStorage: () => (state, error) => {
  if (state) {
    // Usar las promociones persistidas para recalcular
    const { ... } = calculateCartTotals(
      state.items, 
      state.pricesIncludeVat, 
      state.promotions || [], // ← Usar promociones persistidas
      state.vatPercentage
    );
    // appliedPromotions y bonusInfo se recalculan automáticamente
  }
}
```

---

### 2.2 — Validar `addItem` quantity

**Archivo:** `src/hooks/use-cart-store.ts:83-101`
**Issue:** #11
**Severidad:** MEDIO

**Problema actual:**
```typescript
addItem: (product: ProductWithPrice, quantity: number = 1) => {
  // No valida que quantity sea positivo
  updatedItems = items.map((item) =>
    item.product.id === product.id
      ? { ...item, quantity: Math.max(0, item.quantity + quantity) }
      : item
  );
}
```

**Solución propuesta:**
```typescript
addItem: (product: ProductWithPrice, quantity: number = 1) => {
  if (quantity < 1) return; // ← Agregar validación
  
  const { items, pricesIncludeVat, promotions, vatPercentage } = get();
  // ... resto de la lógica
}
```

---

### 2.3 — Reset completo en `clearCart`

**Archivo:** `src/hooks/use-cart-store.ts:144-146`
**Issue:** #12
**Severidad:** MEDIO

**Problema actual:**
```typescript
clearCart: () => {
  set({ 
    items: [], totalItems: 0, subtotal: 0, subtotalWithDiscount: 0,
    discountApplied: 0, vatAmount: 0, totalPrice: 0,
    isVolumePricingActive: false, appliedPromotions: [], bonusInfo: {}
    // Faltan: promotions, clientId, pricesIncludeVat, vatPercentage
  });
}
```

**Solución propuesta:**
```typescript
clearCart: () => {
  set({
    items: [],
    totalItems: 0,
    subtotal: 0,
    subtotalWithDiscount: 0,
    discountApplied: 0,
    vatAmount: 0,
    totalPrice: 0,
    isVolumePricingActive: false,
    appliedPromotions: [],
    bonusInfo: {},
    promotions: [],
    clientId: null,
  });
}
```

---

## Fase 3: Lógica de Promociones

### 3.1 — Scope de `buy_x_get_y_free`

**Archivo:** `src/lib/logic/cart-calculations.ts:26-41`
**Issue:** #2
**Severidad:** MEDIO

**Problema actual:**
```typescript
case 'buy_x_get_y_free':
  items.forEach(item => {
    // No verifica product_ids ni category_names
    if (item.quantity >= promo.rules.buy) {
      // Aplica a TODOS los items
    }
  });
```

**Solución propuesta:**
```typescript
case 'buy_x_get_y_free':
  items.forEach(item => {
    // Verificar scope del producto
    const hasNoScope = !promo.rules.product_ids && !promo.rules.category_names;
    const appliesToProduct = promo.rules.product_ids?.includes(item.product.id);
    const appliesToCategory = promo.rules.category_names?.includes(item.product.category);
    
    if (!hasNoScope && !appliesToProduct && !appliesToCategory) return;
    
    if (item.quantity >= promo.rules.buy) {
      const times = Math.floor(item.quantity / promo.rules.buy);
      const bonusQuantity = times * promo.rules.get;
      if (bonusQuantity > 0) {
        bonusInfo[item.product.id] = {
          productName: item.product.name,
          bonusQuantity: bonusQuantity
        };
        if (!appliedPromotions.find(p => p.id === promo.id)) {
          appliedPromotions.push(promo);
        }
      }
    }
  });
  break;
```

---

### 3.2 — Descuento de items bonus

**Archivo:** `src/lib/logic/cart-calculations.ts`
**Issue:** #25
**Severidad:** ALTO

**Problema actual:**
- Los items bonus se muestran en UI pero no se descuentan del total
- El cliente paga full precio por todo

**Solución propuesta:**
Calcular el valor de los items bonus y restarlo del subtotal.

```typescript
export const calculateCartTotals = (...) => {
  // ... cálculo de subtotal existente
  
  const { appliedPromotions, bonusInfo, discountPercentage } = calculatePromotions(items, subtotal, promotions);
  
  // Calcular descuento por items bonus
  let bonusDiscount = 0;
  Object.entries(bonusInfo).forEach(([productId, info]) => {
    const item = items.find(i => i.product.id === productId);
    if (item) {
      const unitPrice = isVolumePricingActive && item.product.volume_price < item.product.price
        ? item.product.volume_price
        : item.product.price;
      const priceWithoutVat = pricesIncludeVat ? unitPrice / (1 + vatRate) : unitPrice;
      bonusDiscount += priceWithoutVat * info.bonusQuantity;
    }
  });
  
  // Aplicar descuento por porcentaje
  const percentageDiscount = subtotal * (discountPercentage / 100);
  const totalDiscount = percentageDiscount + bonusDiscount;
  const subtotalWithDiscount = subtotal - totalDiscount;
  const vatAmount = subtotalWithDiscount * vatRate;
  const totalPrice = subtotalWithDiscount + vatAmount;
  
  return {
    totalItems,
    subtotal,
    subtotalWithDiscount,
    discountApplied: totalDiscount,
    bonusDiscount,
    percentageDiscount,
    vatAmount,
    totalPrice,
    isVolumePricingActive,
    appliedPromotions,
    bonusInfo
  };
};
```

---

### 3.3 — `free_shipping` informativo

**Archivo:** `src/lib/logic/cart-calculations.ts:43-48`
**Issue:** #26
**Severidad:** BAJO

**Problema actual:**
- `free_shipping` se detecta pero no tiene efecto en cálculos
- No hay costos de envío en el sistema

**Solución propuesta:**
- Mantener como informativo (documentar que es solo para UI/WhatsApp)
- Agregar comentario en el código
- Considerar agregar campo `has_shipping_cost` a `app_settings` en el futuro

---

## Fase 4: Middleware y Auth

### 4.1 — Eliminar `'use server'` del middleware

**Archivo:** `src/middleware.ts:1`
**Issue:** #29
**Severidad:** MEDIO

**Problema actual:**
```typescript
'use server'; // ← Inválido en Edge runtime
import { type NextRequest, NextResponse } from 'next/server';
```

**Solución propuesta:**
Eliminar la línea `'use server';` completamente.

---

### 4.2 — Agregar lógica de primer uso

**Archivo:** `src/middleware.ts`
**Issue:** #30
**Severidad:** MEDIO

**Problema actual:**
- AGENTS.md describe que "On first run, all routes redirect to `/signup`"
- El middleware no tiene esta lógica

**Solución propuesta:**
```typescript
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/middleware';

const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createClient(request);
  const { pathname } = request.nextUrl;

  // Rutas de Onboarding y Pedidos son siempre públicas
  if (pathname.startsWith('/onboarding') || pathname.startsWith('/pedido')) {
    return response;
  }

  // Verificar si hay usuarios en el sistema
  const { data: { session } } = await supabase.auth.getSession();
  
  // Primera vez: no hay usuarios -> solo permitir /signup
  if (!session) {
    // Intentar verificar si hay usuarios (con fallback)
    let hasUsers = true;
    try {
      const { count } = await supabase.auth.admin.listUsers({ perPage: 1 });
      hasUsers = (count ?? 0) > 0;
    } catch {
      // En caso de error, asumir que hay usuarios
      hasUsers = true;
    }

    if (!hasUsers && pathname !== '/signup') {
      return NextResponse.redirect(new URL('/signup', request.url));
    }
    if (hasUsers && pathname === '/signup') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  const isPublicRoute = publicRoutes.includes(pathname);

  // Si no está autenticado y la ruta no es pública, redirigir a login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Si está autenticado y accede a ruta pública, redirigir a admin
  if (session && (isPublicRoute || pathname === '/')) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Nota:** Esta lógica requiere que `supabase.auth.admin.listUsers` esté disponible en el middleware. Si no está soportado, alternativa: hacer fetch a una API route que verifique.

---

## Fase 5: Cálculos y Precisión

### 5.1 — Redondeo en cálculos de IVA

**Archivo:** `src/lib/logic/cart-calculations.ts:85-88`
**Issue:** #5
**Severidad:** BAJO

**Problema actual:**
```typescript
const singleItemSubtotal = basePrice / (1 + vatRate);
subtotal += singleItemSubtotal * item.quantity;
// Acumula errores de punto flotante
```

**Solución propuesta:**
```typescript
// Helper para redondear a 2 decimales
const roundCurrency = (value: number): number => Math.round(value * 100) / 100;

// En calculateCartTotals:
items.forEach(item => {
  const basePrice = (isVolumePricingActive && item.product.volume_price != null && item.product.volume_price < item.product.price)
    ? item.product.volume_price
    : item.product.price;

  if (pricesIncludeVat) {
    const singleItemSubtotal = roundCurrency(basePrice / (1 + vatRate));
    subtotal += roundCurrency(singleItemSubtotal * item.quantity);
  } else {
    subtotal += roundCurrency(basePrice * item.quantity);
  }
});

subtotal = roundCurrency(subtotal);
```

---

### 5.2 — Volume threshold configurable

**Archivo:** `src/lib/logic/cart-calculations.ts:11`
**Issue:** #7
**Severidad:** BAJO

**Problema actual:**
```typescript
export const VOLUME_THRESHOLD = 150; // Hardcoded
```

**Solución propuesta:**
1. Agregar `volume_threshold` a `app_settings`
2. Leer desde DB y pasar como parámetro

```typescript
export const DEFAULT_VOLUME_THRESHOLD = 150;

export const calculateCartTotals = (
  items: CartItemType[],
  pricesIncludeVat: boolean,
  promotions: Promotion[],
  vatPercentage: number,
  volumeThreshold: number = DEFAULT_VOLUME_THRESHOLD // ← Nuevo parámetro
) => {
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);
  const isVolumePricingActive = totalItems >= volumeThreshold;
  // ...
};
```

---

### 5.3 — Validar `volume_price > 0`

**Archivo:** `src/lib/logic/cart-calculations.ts:81`
**Issue:** #8
**Severidad:** BAJO

**Problema actual:**
```typescript
const basePrice = (isVolumePricingActive && item.product.volume_price != null && item.product.volume_price < item.product.price)
  ? item.product.volume_price
  : item.product.price;
// Si volume_price es 0, se usa 0 (items gratis)
```

**Solución propuesta:**
```typescript
const basePrice = (
  isVolumePricingActive && 
  item.product.volume_price != null && 
  item.product.volume_price > 0 && // ← Agregar validación
  item.product.volume_price < item.product.price
)
  ? item.product.volume_price
  : item.product.price;
```

---

## Fase 6: Features Incompletas y Dead Code

### 6.1 — Feature de lista base

**Archivo:** `src/app/admin/actions/pricelists.actions.ts:51`
**Issue:** #24
**Severidad:** MEDIO

**Problema actual:**
```typescript
type UpsertPriceListPayload = { 
  name: string, 
  prices_include_vat: boolean, 
  id?: string, 
  base_price_list_id?: string, // ← Nunca se usa
  discount_percentage?: number  // ← Nunca se usa
};
```

**Solución propuesta:**
Eliminar los campos no implementados:
```typescript
type UpsertPriceListPayload = { 
  name: string, 
  prices_include_vat: boolean, 
  id?: string
};
```

**Alternativa:** Implementar la feature completa (copiar precios con descuento). Esto requiere:
- Lógica en el server action para copiar items de la lista base
- Aplicar descuento porcentual
- UI para seleccionar lista base

---

### 6.2 — Validación de precios

**Archivo:** `src/app/admin/actions/pricelists.actions.ts:90-104`
**Issue:** #34
**Severidad:** MEDIO

**Problema actual:**
```typescript
export async function assignProductsToPriceList(payload: {
  price_list_id: string;
  products: { product_id: string; price: number, volume_price: number | null }[];
  // No hay validación con Zod
})
```

**Solución propuesta:**
Crear schema de validación:
```typescript
// src/lib/validations/pricelist.schema.ts
import { z } from "zod";

export const priceListItemSchema = z.object({
  product_id: z.string().uuid(),
  price: z.number().positive("El precio debe ser mayor a 0"),
  volume_price: z.number().positive("El precio volumen debe ser mayor a 0").nullable(),
});

export const assignProductsSchema = z.object({
  price_list_id: z.string().uuid(),
  products: z.array(priceListItemSchema).min(1, "Debe asignar al menos un producto"),
});
```

---

### 6.3 — CUIT validation en admin schema

**Archivo:** `src/lib/validations/client.schema.ts:9`
**Issue:** #35
**Severidad:** BAJO

**Problema actual:**
```typescript
cuit: z.string().optional().nullable(), // Acepta cualquier string
```

**Solución propuesta:**
```typescript
cuit: z.string()
  .regex(/^\d{11}$/, "CUIT debe tener 11 dígitos")
  .optional()
  .nullable(),
```

**Nota:** El CUIT argentino tiene formato XX-XXXXXXXX-X (11 dígitos). Se puede usar regex más específico:
```typescript
cuit: z.string()
  .regex(/^\d{2}-?\d{8}-?\d{1}$/, "Formato de CUIT inválido (ej: 20-12345678-3)")
  .optional()
  .nullable(),
```

---

### 6.4 — Inventario/stock

**Archivo:** Múltiples
**Issue:** #40
**Severidad:** BAJO (Feature futura)

**Problema actual:**
- No hay gestión de stock
- Un producto se puede pedir infinitamente

**Solución propuesta:**
1. Agregar campo `stock` a `products`
2. Validar stock al crear pedido
3. Decrementar stock al confirmar

**Implementación SQL:**
```sql
ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0;
```

**Implementación en TypeScript:**
```typescript
// En submitOrder, antes de crear la orden:
for (const item of payload.cart) {
  const { data: product } = await supabase
    .from('products')
    .select('stock')
    .eq('id', item.product.id)
    .single();
  
  if (product && product.stock < item.quantity) {
    throw new Error(`Stock insuficiente para ${item.product.name}. Disponible: ${product.stock}`);
  }
}

// Después de crear la orden, decrementar stock:
for (const item of orderItems) {
  await supabase.rpc('decrement_stock', {
    p_product_id: item.product_id,
    p_quantity: item.quantity
  });
}
```

---

## Fase 7: Patrones de Query

### 7.1 — Reemplazar `IN` clause manual

**Archivos:**
- `src/app/admin/actions/agreements.actions.ts:100-101`
- `src/app/admin/actions/agreements.actions.ts:153-154`
- `src/app/admin/actions/pricelists.actions.ts:78-79`

**Issue:** #32, #33
**Severidad:** MEDIO

**Problema actual:**
```typescript
query.not('id', 'in', `(${assignedIds.join(',')})`);
// Frágil si hay IDs malformados
```

**Solución propuesta:**
```typescript
// Supabase soporta arrays directamente
query.not('id', 'in', assignedIds);
```

**Ejemplo completo:**
```typescript
// Antes:
const assignedIds = assigned.map(p => p.promotion_id);
const query = supabase.from('promotions').select('*').order('name');
if (assignedIds.length > 0) {
  query.not('id', 'in', `(${assignedIds.join(',')})`);
}

// Después:
const assignedIds = assigned.map(p => p.promotion_id);
const query = supabase.from('promotions').select('*').order('name');
if (assignedIds.length > 0) {
  query.not('id', 'in', assignedIds); // ← Supabase maneja el array
}
```

---

## Fase 8: Performance

### 8.1 — Optimizar `hasUsers()`

**Archivo:** `src/app/actions/user.actions.ts:13-22`
**Issue:** #42
**Severidad:** BAJO

**Problema actual:**
```typescript
const { data } = await supabaseAdmin.auth.admin.listUsers();
return (data?.users?.length ?? 0) > 0;
// Lista TODOS los usuarios solo para verificar si existe al menos uno
```

**Solución propuesta:**
```typescript
const { data } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
return (data?.users?.length ?? 0) > 0;
```

---

### 8.2 — Caché de `dashboard_stats`

**Archivo:** `src/app/admin/actions/dashboard.actions.ts`
**Issue:** #41
**Severidad:** BAJO

**Problema actual:**
- Vista SQL ejecuta 9 subqueries en cada acceso

**Solución propuesta:**
1. Asegurar que `revalidatePath('/admin')` se ejecute en todas las acciones que modifican datos
2. Considerar usar `revalidateTag` para caché más granular
3. Si es lento, crear materialized view:
```sql
CREATE MATERIALIZED VIEW dashboard_stats_cache AS
SELECT ... FROM ...;

-- Refrescar periódicamente o con triggers
```

---

### 8.3 — Límite de localStorage

**Archivo:** `src/hooks/use-cart-store.ts`
**Issue:** #44
**Severidad:** BAJO

**Problema actual:**
- Cart completo con descriptions, images, etc. se serializa a localStorage
- Límite de ~5MB

**Solución propuesta:**
1. Solo persistir datos esenciales:
```typescript
partialize: (state) => ({
  items: state.items.map(item => ({
    product: {
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      volume_price: item.product.volume_price,
      category: item.product.category,
      image_url: item.product.image_url, // Mantener para UI
    },
    quantity: item.quantity,
  })),
  // ... otros campos
})
```

2. Agregar validación de tamaño:
```typescript
onRehydrateStorage: () => (state, error) => {
  if (state) {
    const storageSize = JSON.stringify(state).length;
    if (storageSize > 4 * 1024 * 1024) { // 4MB
      console.warn('Cart storage approaching limit');
    }
  }
}
```

---

## Fase 9: UI/UX y Mensajes

### 9.1 — Nombres de variables confusos

**Issue:** #6
**Severidad:** BAJO

**Problema:**
- `vatAmount` es el IVA calculado sobre el precio con descuento, no el IVA original

**Solución:**
- Renombrar a `calculatedVat` o agregar comentario explicativo
- O agregar `originalVat` para comparación

---

### 9.2 — `clientId === 'generic'` fallback

**Archivo:** `src/app/actions/user.actions.ts:133`
**Issue:** #17
**Severidad:** BAJO

**Problema:**
```typescript
const finalClientId = payload.clientId === 'generic' || !payload.clientId ? null : payload.clientId;
```

**Solución:**
```typescript
const finalClientId = (!payload.clientId || payload.clientId === 'generic') ? null : payload.clientId;
// O mejor: nunca enviar 'generic' desde el cliente
```

---

### 9.3 — Error handling en API route

**Archivo:** `src/app/api/pedido/confirmar/[id]/route.ts:15-18`
**Issue:** #21
**Severidad:** MEDIO

**Problema:**
```typescript
} catch (error) {
  console.error("Error en auto-confirmación vía API:", error);
  // Silencia el error y redirige a éxito
}
```

**Solución:**
```typescript
} catch (error) {
  console.error("Error en auto-confirmación vía API:", error);
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/pedido/confirmar/${id}?error=confirmation_failed`);
}
```

---

### 9.4 — Email uniqueness check

**Archivo:** `src/app/admin/actions/clients.actions.ts`
**Issue:** #37
**Severidad:** BAJO

**Problema:**
- DB tiene UNIQUE en email, pero no se verifica antes de insertar
- Error de DB confuso si hay duplicado

**Solución:**
```typescript
// En upsertClient, antes de insertar:
if (!id && finalPayload.email) {
  const { data: existing } = await supabase
    .from('clients')
    .select('id')
    .eq('email', finalPayload.email)
    .maybeSingle();
  
  if (existing) {
    throw new Error(`Ya existe un cliente con el email ${finalPayload.email}`);
  }
}
```

---

### 9.5 — Reconciliación de totales al leer pedidos

**Archivo:** Múltiples (getOrderWithDetails, getClientOrdersWithDetails)
**Issue:** #38
**Severidad:** BAJO

**Problema:**
- Se muestra `total_amount` de la tabla `orders`
- No se verifica contra `SUM(quantity * price_per_unit)`

**Solución:**
```typescript
// En getOrderWithDetails:
const { data: calculatedTotal } = await supabase
  .from('order_items')
  .select('quantity, price_per_unit')
  .eq('order_id', orderId);

const expectedTotal = calculatedTotal?.reduce(
  (sum, item) => sum + (item.quantity * item.price_per_unit), 0
) ?? 0;

// Agregar flag de discrepancia
return {
  ...order,
  hasDiscrepancy: Math.abs(order.total_amount - expectedTotal) > 0.01,
  calculatedTotal: expectedTotal,
};
```

---

## Orden de Ejecución

| Paso | Fase | Archivos Afectados | Dependencias | Tiempo Est. |
|------|------|-------------------|--------------|-------------|
| 1 | 1.3 | `_helpers.ts` | Ninguna | 5 min |
| 2 | 4.1 | `src/middleware.ts` | Ninguna | 2 min |
| 3 | 4.2 | `src/middleware.ts` | DB query | 20 min |
| 4 | 1.1 + 1.2 | `user.actions.ts` + schema.sql | Requiere DB | 45 min |
| 5 | 1.4 | `orders.actions.ts` + schema.sql | Requiere DB | 30 min |
| 6 | 2.1 + 2.2 + 2.3 | `use-cart-store.ts` | Ninguna | 15 min |
| 7 | 3.1 + 3.2 | `cart-calculations.ts` | Ninguna | 30 min |
| 8 | 5.1 + 5.2 + 5.3 | `cart-calculations.ts` | Ninguna | 15 min |
| 9 | 7.1 | `agreements.actions.ts`, `pricelists.actions.ts` | Ninguna | 10 min |
| 10 | 6.1 + 6.2 + 6.3 | `pricelists.actions.ts`, schemas | Ninguna | 20 min |
| 11 | 8.1 + 8.2 + 8.3 | `user.actions.ts`, `use-cart-store.ts` | Ninguna | 15 min |
| 12 | 9.x | Varios | Ninguna | 20 min |

**Tiempo total estimado:** ~3.5 horas

---

## Cambios en schema.sql Requeridos

```sql
-- 1. Agregar confirmation_token a orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS confirmation_token UUID DEFAULT gen_random_uuid();
CREATE INDEX IF NOT EXISTS idx_orders_confirmation_token ON orders(confirmation_token);

-- 2. Agregar stock a products (opcional, feature futura)
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;

-- 3. Agregar volume_threshold a app_settings (opcional)
INSERT INTO app_settings (key, value) VALUES ('volume_threshold', '150')
ON CONFLICT (key) DO NOTHING;

-- 4. Función para crear orden con items (transacción)
CREATE OR REPLACE FUNCTION create_order_with_items(
  p_client_id UUID,
  p_agreement_id UUID,
  p_total_amount DECIMAL,
  p_client_name_cache TEXT,
  p_notes TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_order JSONB;
  v_item JSONB;
BEGIN
  INSERT INTO orders (client_id, agreement_id, total_amount, status, client_name_cache, notes)
  VALUES (p_client_id, p_agreement_id, p_total_amount, 'armado', p_client_name_cache, p_notes)
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    INSERT INTO order_items (order_id, product_id, quantity, price_per_unit)
    VALUES (
      v_order_id,
      (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INTEGER,
      (v_item->>'price_per_unit')::DECIMAL
    );
  END LOOP;

  SELECT to_jsonb(o.*) INTO v_order FROM orders o WHERE o.id = v_order_id;
  RETURN v_order;
END;
$$;

-- 5. Función para decrementar stock (opcional)
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products SET stock = stock - p_quantity WHERE id = p_product_id AND stock >= p_quantity;
END;
$$;
```

---

## Notas para el Equipo

1. **Fase 1.2 y 1.4** requieren ejecutar SQL en Supabase antes de implementar el código
2. **Fase 6.4 (stock)** es opcional y puede implementarse en una iteración futura
3. **Fase 3.2 (bonus discount)** cambia el comportamiento del carrito - verificar con el equipo de negocio
4. **Fase 4.2 (middleware)** puede requerir ajustes según la configuración de Supabase en Edge Runtime
5. Todos los cambios son **backward-compatible** - no rompen la funcionalidad existente

---

## Criterios de Aceptación

- [ ] Los totales de pedidos se calculan server-side
- [ ] Las órdenes se crean atómicamente (rollback si falla)
- [ ] El auth check funciona correctamente
- [ ] Las promociones se persisten al refrescar
- [ ] El middleware redirige correctamente en primer uso
- [ ] Los cálculos de IVA son precisos (sin errores de punto flotante)
- [ ] Las queries usan patrones seguros de Supabase
- [ ] Los schemas de validación están completos
