// Utilidades para detectar configuración faltante y evitar que la app
// se rompa o entre en bucles de redirección cuando faltan variables de entorno.

export const REQUIRED_ENV_VARS = [
    {
        key: 'NEXT_PUBLIC_SUPABASE_URL',
        label: 'URL de Supabase',
        hint: 'Settings → API → Project URL',
    },
    {
        key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        label: 'Anon Key (pública) de Supabase',
        hint: 'Settings → API → Project API keys → anon public',
    },
    {
        key: 'SUPABASE_SERVICE_ROLE_KEY',
        label: 'Service Role Key (secreta) de Supabase',
        hint: 'Settings → API → Project API keys → service_role secret',
    },
] as const;

export type RequiredEnvKey = (typeof REQUIRED_ENV_VARS)[number]['key'];

// Devuelve las variables de entorno obligatorias que no están definidas.
export function getMissingEnvVars(): RequiredEnvKey[] {
    const missing: RequiredEnvKey[] = [];
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    return missing;
}

// true cuando toda la configuración necesaria está presente.
export function isSupabaseConfigured(): boolean {
    return getMissingEnvVars().length === 0;
}
