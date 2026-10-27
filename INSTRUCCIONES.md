# Configuración y uso local

## Requisitos

- Node.js compatible con Next.js 15 (se recomienda Node 20).
- npm.
- Un proyecto Supabase para ejecutar la aplicación con datos.

## Variables de entorno

Crea `.env.local` en la raíz y configura las credenciales de tu proyecto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

La clave `SUPABASE_SERVICE_ROLE_KEY` es secreta: no la compartas ni la incluyas en código del navegador.

## Base de datos

**No ejecutes `src/lib/supabase/schema.sql` sobre una base existente.** El archivo contiene `DROP TABLE ... CASCADE` y elimina datos y objetos relacionados. Solo se puede usar para crear/reiniciar una base vacía cuando se haya confirmado la pérdida de datos.

Para una base ya utilizada, revisa el estado y aplica únicamente las migraciones incrementales necesarias de `src/lib/supabase/migrations/`, tras verificar el SQL, el entorno y contar con un respaldo. La asignación de promociones compra X y lleva Y por producto requiere aplicar `20261027_add_price_list_product_promotions.sql` antes de desplegar el código asociado. No apliques cambios remotos sin autorización. Consulta [la guía de base de datos](./docs/engineering/database.md).

`src/lib/supabase/seed.sql` contiene datos de ejemplo; no lo ejecutes en producción sin revisar su contenido.

## Instalar y ejecutar

```bash
npm ci
npm run dev
```

Abre `http://localhost:9003`.

## Verificaciones

```bash
npm run lint
npm run typecheck
npm test
```

La aplicación guía la creación del primer administrador si el entorno aún no tiene uno.
