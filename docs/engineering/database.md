# Base de datos y seguridad

## Esquema y migraciones

- `src/lib/supabase/schema.sql` es un script de reconstrucción, no una migración segura: elimina tablas, tipos y otros objetos con `DROP ... CASCADE`. Úsalo solo en una base vacía o cuando se haya aprobado explícitamente un reinicio con pérdida de datos.
- Para una base existente, agrega una migración incremental bajo `src/lib/supabase/migrations/`. No reescribas migraciones ya aplicadas ni uses el esquema de reconstrucción para desplegar un cambio.
- Antes de aplicar una migración manualmente, confirma el entorno, revisa el SQL completo, prepara un respaldo y comunica si se requiere acción operativa. No ejecutes SQL remoto sin autorización explícita.
- Actualiza los tipos y el código que dependan del esquema junto con la migración. Incluye pasos de aplicación y de reversión cuando sea razonable; si no es reversible, indícalo.
- `seed.sql` es para datos de ejemplo y no debe ejecutarse en producción sin revisar su contenido.

## Acceso

- Las credenciales públicas de Supabase solo habilitan operaciones permitidas por RLS; nunca uses la clave `service_role` desde componentes cliente.
- Las acciones administrativas verifican el rol `super_admin` en `app_metadata` con el helper compartido.
- Los flujos públicos que usan el cliente admin deben validar tokens, estado y entradas en el servidor. Limita la consulta a los datos necesarios para ese flujo.
- Revisa las políticas RLS y las migraciones relacionadas cada vez que cambies acceso, funciones `SECURITY DEFINER` o datos sensibles.
