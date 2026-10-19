-- ============================================================================
-- SEED de ejemplo para MrB
-- ----------------------------------------------------------------------------
-- Ejecutar DESPUES de schema.sql (schema.sql limpia las tablas).
-- Es idempotente: si lo corrés de nuevo no duplica datos.
--
-- Crea ejemplos de:
--   1. Productos
--   2. Listas de precios (con precios placeholder para cada producto)
--   3. Condiciones de venta
--   4. Promociones
--   5. Convenios ya armados (con su lista, condiciones y promociones)
--   6. Clientes de ejemplo (uno activo para el portal de pedidos y uno pendiente
--      de onboarding para probar ese flujo)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PRODUCTOS
-- ----------------------------------------------------------------------------
insert into products (name, description, category)
select v.name, v.description, v.category
from (values
    ('DesertStyle Pomada efecto mate 50 grs', 'Pomada efecto mate', 'Hairstyle'),
    ('Polvo Stardust 10grs', 'Polvo styling efecto mate', 'Hairstyle'),
    ('OldSchool 100 grs', 'Pomada de fijación media/alta y brillo medio', 'Hairstyle'),
    ('Liquid Pomade 120 ml', 'Pomada líquida para modelar cabello', 'Hairstyle'),
    ('Shampoo 2 en 1 para el crecimiento 200 cc', 'Shampoo + acondicionador 2 en 1', 'Hairstyle'),
    ('OldSchool 50 grs', 'Pomada de fijación media/alta y brillo medio', 'Hairstyle'),
    ('El Capitán aceite para barba 20 ml', 'Aceite para barba', 'FacialBeard'),
    ('Kit Premium para Barba N°1', 'Kit completo para barba', 'FacialBeard'),
    ('OG Dandy After Shave 100 grs', 'After shave tradicional', 'FacialBeard'),
    ('Caja Exhibidora Mr BLONDE', 'Exhibidor para puntos de venta', 'Merchandising'),
    ('Crystal gel de afeitar 250 grs', 'Gel de afeitar profesional', 'Professional'),
    ('Crème à Raser 400 grs', 'Crema de afeitado tradicional', 'Professional'),
    ('Capa Mr Blonde', 'Capa para barbería confeccionada en tela liviana', 'Merchandising')
) as v(name, description, category)
where not exists (select 1 from products p where p.name = v.name);

-- ----------------------------------------------------------------------------
-- 2. LISTAS DE PRECIOS
-- ----------------------------------------------------------------------------
insert into price_lists (name, prices_include_vat)
select v.name, v.prices_include_vat
from (values
    ('Lista Barbería', true),
    ('Lista Distribuidor', true)
) as v(name, prices_include_vat)
where not exists (select 1 from price_lists pl where pl.name = v.name);

-- ----------------------------------------------------------------------------
-- 3. PRECIOS POR LISTA (placeholder: 1000 / volumen 900, etc.)
-- ----------------------------------------------------------------------------
insert into price_list_items (price_list_id, product_id, price, volume_price)
select pl.id, p.id, 1000, 900
from price_lists pl
cross join products p
where pl.name = 'Lista Barbería'
on conflict (price_list_id, product_id) do nothing;

insert into price_list_items (price_list_id, product_id, price, volume_price)
select pl.id, p.id, 850, 750
from price_lists pl
cross join products p
where pl.name = 'Lista Distribuidor'
on conflict (price_list_id, product_id) do nothing;

-- ----------------------------------------------------------------------------
-- 4. CONDICIONES DE VENTA
-- ----------------------------------------------------------------------------
insert into sales_conditions (name, description, rules)
select v.name, v.description, v.rules
from (values
    ('30 días netos', 'Pago a 30 días desde la facturación', '{"type":"net_days","days":30}'::jsonb),
    ('Descuento pronto pago 10%', '10% de descuento por pago inmediato', '{"type":"discount","percentage":10}'::jsonb),
    ('3 cuotas sin interés', 'Financiación en 3 cuotas', '{"type":"installments","installments":3}'::jsonb),
    ('50% adelanto / resto 15 días', 'Mitad de anticipo y saldo a 15 días', '{"type":"split_payment","initial_percentage":50,"remaining_days":15}'::jsonb)
) as v(name, description, rules)
where not exists (select 1 from sales_conditions sc where sc.name = v.name);

-- ----------------------------------------------------------------------------
-- 5. PROMOCIONES
-- ----------------------------------------------------------------------------
insert into promotions (name, description, rules)
select v.name, v.description, v.rules
from (values
    ('2x1 en Pomadas', 'Llevá 2 unidades de la categoría y pagá 1', '{"type":"buy_x_get_y_free","buy":2,"get":1,"category_names":["Hairstyle"]}'::jsonb),
    ('Envío gratis desde 10 unidades', 'Sin costo de envío en pedidos de 10 o más unidades', '{"type":"free_shipping","min_units":10}'::jsonb),
    ('10% off en compras + $50.000', 'Descuento por volumen de compra', '{"type":"min_amount_discount","min_amount":50000,"percentage":10}'::jsonb)
) as v(name, description, rules)
where not exists (select 1 from promotions pr where pr.name = v.name);

-- ----------------------------------------------------------------------------
-- 6. CONVENIOS (ya armados)
-- ----------------------------------------------------------------------------
insert into agreements (agreement_name, client_type, price_list_id, payment_type)
select 'Barbería Estándar', 'barberia', pl.id, 'remito'
from price_lists pl
where pl.name = 'Lista Barbería'
  and not exists (select 1 from agreements a where a.agreement_name = 'Barbería Estándar');

insert into agreements (agreement_name, client_type, price_list_id, payment_type)
select 'Distribuidor Mayorista', 'distribuidor', pl.id, 'proforma'
from price_lists pl
where pl.name = 'Lista Distribuidor'
  and not exists (select 1 from agreements a where a.agreement_name = 'Distribuidor Mayorista');

-- ----------------------------------------------------------------------------
-- 7. RELACIONES CONVENIO <-> PROMOCIONES
-- ----------------------------------------------------------------------------
insert into agreement_promotions (agreement_id, promotion_id)
select a.id, pr.id
from agreements a
cross join promotions pr
where a.agreement_name = 'Barbería Estándar'
  and pr.name in ('2x1 en Pomadas', 'Envío gratis desde 10 unidades')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 8. RELACIONES CONVENIO <-> CONDICIONES DE VENTA
-- ----------------------------------------------------------------------------
insert into agreement_sales_conditions (agreement_id, sales_condition_id)
select a.id, sc.id
from agreements a
cross join sales_conditions sc
where a.agreement_name = 'Barbería Estándar'
  and sc.name in ('30 días netos', 'Descuento pronto pago 10%')
on conflict do nothing;

-- ----------------------------------------------------------------------------
-- 9. CLIENTES DE EJEMPLO
-- ----------------------------------------------------------------------------
-- Cliente ACTIVO (ya con convenio) -> sirve para probar el portal de pedidos:
--   https://TU-DOMINIO/pedido/<id-del-cliente>
insert into clients (contact_name, email, cuit, status, address, delivery_window, agreement_id, onboarding_token)
select
    'Barbería Demo',
    'demo@mrblonde.test',
    '20-12345678-9',
    'active',
    'Av. Siempre Viva 742, CABA',
    'Lunes a Viernes 9 a 18 hs',
    a.id,
    '11111111-1111-1111-1111-111111111111'
from agreements a
where a.agreement_name = 'Barbería Estándar'
on conflict (email) do nothing;

-- Cliente PENDIENTE DE ONBOARDING -> sirve para probar el formulario de alta:
--   https://TU-DOMINIO/onboarding/22222222-2222-2222-2222-222222222222
insert into clients (contact_name, email, cuit, status, onboarding_token)
select
    'Cliente Onboarding Demo',
    'onboarding@mrblonde.test',
    '20-98765432-1',
    'pending_onboarding',
    '22222222-2222-2222-2222-222222222222'
on conflict (email) do nothing;
