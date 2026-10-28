# Reglas de negocio e invariantes

Este documento describe reglas que deben mantenerse consistentes en todas las superficies de la aplicación. Si una regla cambia, actualiza este documento y sus pruebas relacionadas.

## Pedidos y despacho

- Los estados del pedido son `armado`, `transito` y `entregado`.
- Antes de despachar (`transito`) deben estar confirmados, en ese orden operativo, la recepción del pedido por WhatsApp, su preparación y la impresión del rótulo. La regla compartida está en `src/lib/order-workflow.ts` y también se aplica en la base de datos.
- El mensaje de WhatsApp lo envía el operador desde el flujo externo; abrir o preparar un enlace no prueba que el mensaje se haya enviado. La confirmación del hito es manual.
- Imprimir una orden de preparación no equivale a imprimir el rótulo de envío ni completa el hito del rótulo.
- La impresión acumulada acomoda dos órdenes por hoja A4 apaisada, cada una en un panel A5.
- La orden de preparación muestra por producto el total de unidades a armar, incluyendo unidades promocionales, sin desglosar ni agregar ruido con cantidades promocionales separadas. `src/lib/curated-order.ts` consolida las líneas del mismo producto.

## Precios, cantidades y promociones

- `src/lib/logic/cart-calculations.ts` es la lógica compartida para precios por volumen, promociones, descuentos e IVA. Reutilízala en lugar de implementar cálculos paralelos.
- Las promociones `buy_x_get_y_free` habilitadas para un convenio se aplican solo a los productos asociados a esa promoción en la lista de precios del convenio. Varias promociones pueden asociarse a un producto; sus bonificaciones se acumulan. La asignación por lista/producto prevalece sobre el alcance legado por producto/categoría de la promoción.
- El servidor valida los datos recibidos y recalcula los importes con los datos comerciales vigentes; los valores enviados por el navegador no son fuente de verdad.
- El umbral de precio por volumen se lee de `app_settings.volume_threshold`; si falta o es inválido, se usa 150. La UI no debe mostrar un valor fijo distinto al configurado.
- Los productos de una lista con precio menor o igual a cero no se muestran en el catálogo público ni se aceptan en pedidos. El administrador debe corregir el precio antes de venderlos.
- Las unidades de regalo de una promoción `buy_x_get_y_free` se agregan a la cantidad física que debe preparar el operador. No deben confundirse con un descuento monetario ni duplicarse en el total de preparación.
- Mantén la validación de cantidades y productos también en el servidor; la validación visual del formulario no es suficiente.

## Convenios y acceso del cliente

- Los precios, promociones y condiciones aplicables al cliente derivan del convenio asignado. Si se modifica su carga o presentación, conserva esa relación y prueba listas de precios, promociones y condiciones conjuntamente.
- Un convenio no se puede eliminar mientras tenga clientes asignados. Primero se reasignan o desactivan esos clientes para evitar pedidos sin lista de precios.
- Las páginas de pedido y onboarding son flujos públicos identificados por token. No reemplaces ni expongas tokens en logs, mensajes o respuestas que no los necesiten.
- Los permisos administrativos deben validarse en el servidor; ocultar botones en la interfaz no autoriza una acción.
