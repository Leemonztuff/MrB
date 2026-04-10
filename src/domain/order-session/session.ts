
import { createClient as createServerClient } from '@/lib/supabase/server';
import type { Client, Agreement } from '@/types';

export type SessionState = 'ONBOARDING' | 'PENDING_AGREEMENT' | 'ACTIVE_CATALOG' | 'INVALID';

export interface ResolvedSession {
    state: SessionState;
    client?: Client;
    agreement?: Agreement | Agreement[] | null;
    error?: string;
}

/**
 * Resolves the state of a portal session from an ID or Token.
 * This is the core logic for the "One-Link" flow.
 */
export async function resolveSessionState(id: string): Promise<ResolvedSession> {
    const supabase = await createServerClient();

    // 1. Try to find if it's an onboarding token
    const { data: onboardingClient } = await supabase
        .from('clients')
        .select('*, agreements(*)')
        .eq('onboarding_token', id)
        .maybeSingle();

    if (onboardingClient) {
        // Check expiration only if they haven't onboarded yet
        if (onboardingClient.status !== 'active' && onboardingClient.onboarding_expires_at && new Date(onboardingClient.onboarding_expires_at) < new Date()) {
            return { state: 'INVALID', error: 'El enlace de invitación ha expirado.' };
        }

        // If client is already active, they should use their portal token,
        // but for UX we can let them through to the catalog if they have an agreement.
        if (onboardingClient.status === 'active' && onboardingClient.agreement_id) {
            return {
                state: 'ACTIVE_CATALOG',
                client: onboardingClient,
                agreement: onboardingClient.agreements
            };
        }

        if (onboardingClient.status === 'pending_agreement') {
            return {
                state: 'PENDING_AGREEMENT',
                client: onboardingClient
            };
        }

        return {
            state: 'ONBOARDING',
            client: onboardingClient,
            agreement: onboardingClient.agreements
        };
    }

    // 2. Try to find if it's an agreement ID (legacy/direct access)
    const { data: agreement } = await supabase
        .from('agreements')
        .select('*')
        .eq('id', id)
        .maybeSingle();

    if (agreement) {
        // For direct agreement access, we try to find a generic/default client
        const { data: genericClient } = await supabase
            .from('clients')
            .select('*')
            .eq('agreement_id', id)
            .limit(1)
            .maybeSingle();

        return {
            state: 'ACTIVE_CATALOG',
            client: genericClient,
            agreement
        };
    }

    return { state: 'INVALID', error: 'Enlace no válido.' };
}
