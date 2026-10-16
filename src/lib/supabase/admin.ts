import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Este cliente de Supabase utiliza la SERVICE_ROLE_KEY, que le otorga
// acceso completo a tu base de datos, saltándose cualquier política de RLS.
// DEBE usarse únicamente en el lado del servidor y NUNCA exponerse al cliente.
// Lo usaremos para tareas administrativas como contar el total de usuarios.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdminSingleton: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient | null {
    if (supabaseAdminSingleton) {
        return supabaseAdminSingleton;
    }

    if (!supabaseUrl || !serviceRoleKey) {
        // Fallback: no lanzamos error para no romper la app ni el build.
        // El middleware redirige a /setup cuando falta configuración, y los
        // llamadores ya manejan el caso `null`.
        console.error('Supabase admin client not configured. Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
        return null;
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
