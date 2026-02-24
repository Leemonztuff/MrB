import { createClient } from '@supabase/supabase-js';

// Este cliente de Supabase utiliza la SERVICE_ROLE_KEY, que le otorga
// acceso completo a tu base de datos, saltándose cualquier política de RLS.
// DEBE usarse únicamente en el lado del servidor y NUNCA exponerse al cliente.
// Lo usaremos para tareas administrativas como contar el total de usuarios.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdminSingleton: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
    if (supabaseAdminSingleton) {
        return supabaseAdminSingleton;
    }

    if (!supabaseUrl || !serviceRoleKey) {
        // En producción (Vercel), si las variables no están, la app no debe funcionar.
        // En desarrollo, esto alerta al desarrollador de que falta configuración.
        if (process.env.NODE_ENV === 'production') {
             console.error('Supabase admin client not configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
             return null;
        }
        throw new Error('Supabase admin client not configured. Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your .env.local file.');
    }

    supabaseAdminSingleton = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    });
    
    return supabaseAdminSingleton;
}

export const supabaseAdmin = getSupabaseAdmin();
