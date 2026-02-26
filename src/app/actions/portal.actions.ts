'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { unformatCuit } from '@/lib/formatters';
import type { AuthState } from '@/types';

export async function loginPortal(prevState: AuthState | null, formData: FormData): Promise<AuthState | null> {
    const cuit = formData.get('cuit') as string;
    const token = formData.get('token') as string;

    if (!cuit || !token) {
        return { error: { message: 'CUIT y token son requeridos.' } };
    }

    const cleanCuit = unformatCuit(cuit);
    
    if (cleanCuit.length !== 11) {
        return { error: { message: 'CUIT inválido. Debe tener 11 dígitos.' } };
    }

    if (token.length !== 6) {
        return { error: { message: 'Token inválido. Debe tener 6 dígitos.' } };
    }

    const supabase = await createClient();
    
    const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('cuit', cleanCuit)
        .eq('portal_token', token)
        .maybeSingle();

    if (error || !client) {
        return { error: { message: 'CUIT o token incorrectos.' } };
    }

    if (client.status !== 'active') {
        return { error: { message: 'Tu cuenta no está activa. Contactá al administrador.' } };
    }

    const cookieStore = await cookies();
    cookieStore.set('portal_client_id', client.id, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
    });

    redirect('/portal');
}

export async function logoutPortal() {
    const cookieStore = await cookies();
    cookieStore.delete('portal_client_id');
    redirect('/portal/login');
}

export async function getPortalClient() {
    const cookieStore = await cookies();
    const clientId = cookieStore.get('portal_client_id')?.value;
    if (!clientId) return null;

    const supabase = await createClient();
    const { data: client } = await supabase
        .from('clients')
        .select('*, agreements(*)')
        .eq('id', clientId)
        .maybeSingle();

    return client;
}

export async function requirePortalAuth() {
    const client = await getPortalClient();
    if (!client) {
        redirect('/portal/login');
    }
    return client;
}
