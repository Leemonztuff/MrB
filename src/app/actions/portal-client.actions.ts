'use server';

import { getPortalClient } from '@/app/actions/portal.actions';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionResponse } from '@/types';

export async function getPortalClientData(): Promise<ActionResponse<any>> {
    try {
        const client = await getPortalClient();
        if (!client) {
            return { success: false, error: { message: 'No autenticado' } };
        }

        const supabase = await createClient();
        
        const { data: pendingChanges } = await supabase
            .from('pending_changes')
            .select('*')
            .eq('client_id', client.id)
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        return {
            success: true,
            data: {
                client,
                pendingChanges: pendingChanges || [],
            },
        };
    } catch (error) {
        return { success: false, error: { message: 'Error al obtener datos' } };
    }
}

export async function updateClientProfile(data: {
    contact_name: string;
    email: string;
    address: string;
    delivery_window: string;
    instagram: string;
    contact_dni: string;
    fiscal_status: string;
}): Promise<ActionResponse> {
    try {
        const client = await getPortalClient();
        if (!client) {
            return { success: false, error: { message: 'No autenticado' } };
        }

        const supabase = await createClient();
        
        const fieldsToCheck = [
            { key: 'contact_name', label: 'nombre de contacto' },
            { key: 'email', label: 'email' },
            { key: 'address', label: 'dirección' },
            { key: 'delivery_window', label: 'ventana de entrega' },
            { key: 'instagram', label: 'instagram' },
            { key: 'contact_dni', label: 'DNI' },
            { key: 'fiscal_status', label: 'situación fiscal' },
        ];

        const currentData = client as any;
        
        for (const field of fieldsToCheck) {
            const newValue = data[field.key as keyof typeof data] || null;
            const oldValue = currentData[field.key];
            
            if (newValue !== oldValue) {
                const { error: insertError } = await supabase
                    .from('pending_changes')
                    .insert({
                        client_id: client.id,
                        change_type: field.key,
                        old_value: oldValue || null,
                        new_value: newValue,
                        status: 'pending',
                    });

                if (insertError) {
                    console.error('Error creating pending change:', insertError);
                    return { success: false, error: { message: `Error al crear solicitud de cambio para ${field.label}` } };
                }
            }
        }

        revalidatePath('/portal/profile');
        return { success: true };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: { message: 'Error al actualizar el perfil' } };
    }
}

export async function updatePortalToken(newToken: string): Promise<ActionResponse> {
    try {
        const client = await getPortalClient();
        if (!client) {
            return { success: false, error: { message: 'No autenticado' } };
        }

        const supabase = await createClient();
        
        const { error } = await supabase
            .from('clients')
            .update({ portal_token: newToken })
            .eq('id', client.id);

        if (error) {
            return { success: false, error: { message: 'Error al actualizar el token' } };
        }

        revalidatePath('/portal/profile');
        return { success: true };
    } catch (error) {
        console.error('Error updating token:', error);
        return { success: false, error: { message: 'Error al actualizar el token' } };
    }
}

export async function getClientOrders(): Promise<ActionResponse<any>> {
    try {
        const client = await getPortalClient();
        if (!client) {
            return { success: false, error: { message: 'No autenticado' } };
        }

        const supabase = await createClient();
        
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(*))')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, error: { message: 'Error al obtener pedidos' } };
        }

        return {
            success: true,
            data: { orders: orders || [], agreementId: client.agreement_id },
        };
    } catch (error) {
        console.error('Error getting orders:', error);
        return { success: false, error: { message: 'Error al obtener pedidos' } };
    }
}
