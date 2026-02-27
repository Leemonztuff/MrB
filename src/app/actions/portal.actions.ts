'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { unformatCuit } from '@/lib/formatters';
import type { AuthState } from '@/types';
import { createHash } from 'crypto';

const COOKIE_SECRET = process.env.COOKIE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'fallback-secret-change-me';

function signCookie(value: string): string {
    const hmac = createHash('sha256');
    hmac.update(value + COOKIE_SECRET);
    return `${value}.${hmac.digest('hex').slice(0, 16)}`;
}

function verifyAndExtractSignedCookie(signedValue: string): string | null {
    const parts = signedValue.split('.');
    if (parts.length !== 2) return null;
    
    const [value, signature] = parts;
    const expectedSignature = createHash('sha256')
        .update(value + COOKIE_SECRET)
        .digest('hex')
        .slice(0, 16);
    
    return signature === expectedSignature ? value : null;
}

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
        .maybeSingle();

    if (error) {
        console.error('Portal login error:', error);
        return { error: { message: 'Error al iniciar sesión. Intentalo de nuevo.' } };
    }

    if (!client) {
        return { error: { message: 'No existe un cliente con ese CUIT.' } };
    }

    if (!client.portal_token) {
        const newToken = cleanCuit.slice(0, 6);
        const { error: updateError } = await supabase
            .from('clients')
            .update({ portal_token: newToken })
            .eq('id', client.id);
        
        if (updateError) {
            console.error('Error generating token:', updateError);
            return { error: { message: 'Error al configurar el token. Intentalo de nuevo.' } };
        }
        
        client.portal_token = newToken;
    }

    if (client.portal_token !== token) {
        return { error: { message: 'Token incorrecto.' } };
    }

    if (!['active', 'pending_agreement'].includes(client.status)) {
        return { error: { message: `Tu cuenta está en estado: ${client.status}. Contactá al administrador.` } };
    }

    const cookieStore = await cookies();
    const signedValue = signCookie(client.id);
    cookieStore.set('portal_client_id', signedValue, {
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
    redirect('/portal-cliente/login');
}

export async function getPortalClient() {
    const cookieStore = await cookies();
    const signedValue = cookieStore.get('portal_client_id')?.value;
    
    if (!signedValue) {
        console.log('No portal_client_id cookie found');
        return null;
    }

    const clientId = verifyAndExtractSignedCookie(signedValue);
    if (!clientId) {
        console.log('Failed to verify signed cookie:', signedValue);
        cookieStore.delete('portal_client_id');
        return null;
    }

    const supabase = await createClient();
    const { data: client, error } = await supabase
        .from('clients')
        .select('*, agreements(*)')
        .eq('id', clientId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching client:', error);
        return null;
    }

    return client;
}

export async function requirePortalAuth() {
    const client = await getPortalClient();
    if (!client) {
        redirect('/portal-cliente/login');
    }
    return client;
}
