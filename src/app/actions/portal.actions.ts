'use server';

import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { unformatCuit } from '@/lib/formatters';
import { createClient } from '@/lib/supabase/server';
import type { AuthState } from '@/types';

const COOKIE_SECRET = process.env.COOKIE_SECRET?.trim();
const LEGACY_COOKIE_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

function getCookieSecret(): string {
    if (COOKIE_SECRET) {
        return COOKIE_SECRET;
    }

    if (LEGACY_COOKIE_SECRET) {
        return LEGACY_COOKIE_SECRET;
    }

    if (process.env.NODE_ENV !== 'production') {
        return 'dev-cookie-secret';
    }

    throw new Error('COOKIE_SECRET no configurado en produccion.');
}

function createCookieSignature(value: string, secret: string): string {
    return createHmac('sha256', secret).update(value).digest('hex');
}

function signCookie(value: string): string {
    const secret = getCookieSecret();
    const signature = createCookieSignature(value, secret);
    return `${value}.${signature}`;
}

function verifyAndExtractSignedCookie(signedValue: string): string | null {
    const parts = signedValue.split('.');
    if (parts.length !== 2) return null;

    const [value, signature] = parts;

    try {
        const secret = getCookieSecret();
        const expectedSignature = createCookieSignature(value, secret);
        const signatureBuffer = Buffer.from(signature, 'hex');
        const expectedBuffer = Buffer.from(expectedSignature, 'hex');

        if (signatureBuffer.length !== expectedBuffer.length) {
            return null;
        }

        return timingSafeEqual(signatureBuffer, expectedBuffer) ? value : null;
    } catch (error) {
        console.error('Portal cookie secret misconfigured:', error);
        return null;
    }
}

export async function loginPortal(prevState: AuthState | null, formData: FormData): Promise<AuthState | null> {
    const cuit = formData.get('cuit') as string;
    const token = formData.get('token') as string;

    if (!cuit || !token) {
        return { error: { message: 'CUIT y token son requeridos.' } };
    }

    const cleanCuit = unformatCuit(cuit);

    if (cleanCuit.length !== 11) {
        return { error: { message: 'CUIT invalido. Debe tener 11 digitos.' } };
    }

    if (token.length !== 6) {
        return { error: { message: 'Token invalido. Debe tener 6 digitos.' } };
    }

    const supabase = await createClient();

    const { data: client, error } = await supabase
        .from('clients')
        .select('*')
        .eq('cuit', cleanCuit)
        .maybeSingle();

    if (error) {
        console.error('Portal login error:', error);
        return { error: { message: 'Error al iniciar sesion. Intentalo de nuevo.' } };
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
        return { error: { message: `Tu cuenta esta en estado: ${client.status}. Contacta al administrador.` } };
    }

    const cookieStore = await cookies();
    let signedValue: string;

    try {
        signedValue = signCookie(client.id);
    } catch (error) {
        console.error('Portal login cookie setup failed:', error);
        return { error: { message: 'Error de configuracion del portal. Contacta al administrador.' } };
    }

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
    redirect('/portal/login');
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
        .select('*, agreements:agreements(id, agreement_name)')
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
        redirect('/portal/login');
    }
    return client;
}
