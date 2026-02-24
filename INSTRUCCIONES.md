# Guía de Configuración y Uso

Este documento contiene las instrucciones para configurar y poner en marcha la aplicación.

## 1. Configuración de Variables de Entorno

Antes de nada, crea un archivo llamado `.env.local` en la raíz del proyecto. Copia el contenido del archivo `.env` (que está vacío) y rellénalo con las siguientes claves de tu proyecto de Supabase:

```bash
# Variables de Supabase (las encuentras en Project Settings > API)
NEXT_PUBLIC_SUPABASE_URL="tu-url-de-supabase"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key-publica"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key-secreta"

# Clave de Google Maps (opcional, para la funcionalidad de mapas)
# Encuéntrala en tu consola de Google Cloud Platform.
# NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="tu-api-key-de-google-maps"
```

## 2. Configuración de la Base de Datos

El paso más importante es configurar la base de datos para que coincida con la aplicación.

### a. Ejecutar el Script de Esquema

El script SQL en `src/lib/supabase/schema.sql` está diseñado para ser **idempotente**, lo que significa que puedes ejecutarlo de forma segura en cualquier momento, ya sea en una base de datos nueva o en una existente. Se encargará de limpiar y reconfigurar las tablas automáticamente.

1.  **Abre el archivo `src/lib/supabase/schema.sql`** en este proyecto.
2.  **Copia todo el contenido** de ese archivo.
3.  **Ve al "SQL Editor"** en tu panel de Supabase.
4.  **Pega el script** en el editor y haz clic en **"RUN"**.

Esto creará todas las tablas, vistas, funciones y políticas de seguridad necesarias.

### b. (Opcional) Cargar Datos de Ejemplo

Si quieres empezar con productos, precios y promociones de ejemplo, puedes ejecutar el script de "seed".

1.  **Abre el archivo `src/lib/supabase/seed.sql`**.
2.  **Copia todo el contenido**.
3.  **Pega el script** en el SQL Editor de Supabase y haz clic en **"RUN"**.

## 3. Iniciar la Aplicación

1.  **Instala las dependencias**: `npm install`
2.  **Inicia la aplicación** en modo de desarrollo: `npm run dev`.
3.  Abre tu navegador y ve a `http://localhost:9003`.

## 4. Crear el Usuario Administrador

La aplicación te guiará para crear el primer usuario administrador la primera vez que la ejecutes.

1.  Al visitar `http://localhost:9003`, serás redirigido a la página de registro (`/signup`).
2.  **Crea la cuenta** con tu email y una contraseña segura.
3.  Una vez creada, serás redirigido a `/login`, donde podrás iniciar sesión.

Con esto, tu aplicación estará lista para usarse.
