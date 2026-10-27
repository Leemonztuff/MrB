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
NEXT_PUBLIC_APP_URL=http://localhost:9003
```

La clave `SUPABASE_SERVICE_ROLE_KEY` es secreta: no la compartas ni la incluyas en código del navegador.

Para invitar operarios, configura `NEXT_PUBLIC_APP_URL` con el origen público de la aplicación (por ejemplo, `https://pedidos.ejemplo.com`, sin una ruta). En Supabase, agrega `<origen>/auth/callback` a **Authentication → URL Configuration → Redirect URLs** y verifica que el proveedor de correo tenga habilitadas las invitaciones. En producción, usa la URL HTTPS real; no reutilices la URL local.

## Base de datos

**No ejecutes `src/lib/supabase/schema.sql` sobre una base existente.** El archivo contiene `DROP TABLE ... CASCADE` y elimina datos y objetos relacionados. Solo se puede usar para crear/reiniciar una base vacía cuando se haya confirmado la pérdida de datos.

Para una base ya utilizada, revisa el estado y aplica únicamente las migraciones incrementales necesarias de `src/lib/supabase/migrations/`, tras verificar el SQL, el entorno y contar con un respaldo. La asignación de promociones compra X y lleva Y por producto requiere aplicar `20261027_add_price_list_product_promotions.sql` antes de desplegar el código asociado. No apliques cambios remotos sin autorización. Consulta [la guía de base de datos](./docs/engineering/database.md).

Antes de habilitar operarios en una base existente, aplica `20261027_add_operator_role_and_delivery_confirmation.sql` y `20261027_add_operator_pin_unlock.sql`. El PIN se guarda como hash, se bloquea por 15 minutos tras cinco intentos fallidos y habilita la sesión del dispositivo durante un máximo de 12 horas; para iniciar sesión en un dispositivo nuevo sigue siendo necesaria la contraseña. El acceso a las tablas de PIN queda limitado al servidor. Revisa cada migración y el orden de dependencias antes de aplicarlas.

El operario configura o cambia su PIN en **Mi acceso**. Si lo olvida, un administrador puede restablecerlo desde **Configuración → Usuarios y operarios**; deberá crear uno nuevo al volver a entrar.

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
