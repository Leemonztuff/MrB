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

function verifyAndExtractSignedCookie(signedValue: string): { clientId: string; hadCuitAtLogin: boolean } | null {
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

        if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
            return null;
        }

        const [clientId, cuitFlag] = value.split('|');
        if (!clientId) return null;

        return {
            clientId,
            hadCuitAtLogin: cuitFlag === '1',
        };
    } catch (error) {
        console.error('Portal cookie secret misconfigured:', error);
        return null;
    }
}

export async function loginPortal(prevState: AuthState | null, formData: FormData): Promise<AuthState | null> {
    const identifierRaw = (formData.get('identifier') || formData.get('cuit')) as string;
    const token = formData.get('token') as string;

    if (!identifierRaw || !token) {
        return { error: { message: 'CUIT o DNI y token son requeridos.' } };
    }

    const cleanIdentifier = identifierRaw.replace(/[^0-9]/g, '');
    const isCuitLogin = cleanIdentifier.length === 11;
    const isDniLogin = cleanIdentifier.length >= 7 && cleanIdentifier.length <= 8;

    if (!isCuitLogin && !isDniLogin) {
        return { error: { message: 'Ingresa un CUIT (11 digitos) o DNI (7-8 digitos) valido.' } };
    }

    if (token.length !== 6) {
        return { error: { message: 'Token invalido. Debe tener 6 digitos.' } };
    }

    const supabase = await createClient();
    const identifierField = isCuitLogin ? 'cuit' : 'contact_dni';
    const { data: matchedClients, error } = await supabase
        .from('clients')
        .select('*')
        .eq(identifierField, cleanIdentifier)
        .limit(2);

    if (error) {
        console.error('Portal login error:', error);
        return { error: { message: 'Error al iniciar sesion. Intentalo de nuevo.' } };
    }

    if (!matchedClients || matchedClients.length === 0) {
        return {
            error: {
                message: isCuitLogin
                    ? 'No existe un cliente con ese CUIT.'
                    : 'No existe un cliente sin CUIT registrado para ese DNI.',
            },
        };
    }

    if (matchedClients.length > 1) {
        return { error: { message: 'Hay mas de un cliente para ese identificador. Contacta al administrador.' } };
    }

    const client = matchedClients[0];

    if (isDniLogin && client.cuit) {
        return { error: { message: 'Este cliente ya tiene CUIT. Ingresa con CUIT para acceder.' } };
    }

    if (!client.portal_token) {
        const tokenSource = (client.cuit || client.contact_dni || cleanIdentifier || '').replace(/[^0-9]/g, '');
        const newToken = tokenSource.slice(0, 6).padStart(6, '0');
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
        const cuitFlag = client.cuit ? '1' : '0';
        signedValue = signCookie(`${client.id}|${cuitFlag}`);
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

    const sessionData = verifyAndExtractSignedCookie(signedValue);
    if (!sessionData) {
        console.log('Failed to verify signed cookie:', signedValue);
        cookieStore.delete('portal_client_id');
        return null;
    }

    const supabase = await createClient();
    const { data: client, error } = await supabase
        .from('clients')
        .select('*, agreements:agreements(id, agreement_name, client_type)')
        .eq('id', sessionData.clientId)
        .maybeSingle();

    if (error) {
        console.error('Error fetching client:', error);
        return null;
    }

    // Force re-login when CUIT was missing at login time and then gets approved later.
    if (client?.cuit && !sessionData.hadCuitAtLogin) {
        cookieStore.delete('portal_client_id');
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
