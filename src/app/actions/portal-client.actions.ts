'use server';

import { revalidatePath } from 'next/cache';
import { getPortalClient } from '@/app/actions/portal.actions';
import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';

export async function getPortalClientData(): Promise<ActionResponse<any>> {
    try {
        const client = await getPortalClient();
        if (!client) {
            return { success: false, error: { message: 'No autenticado', code: 'UNAUTHORIZED' } };
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
        return { success: false, error: { message: 'Error al obtener datos', code: 'INTERNAL_ERROR' } };
    }
}

export async function updateClientProfile(data: {
    contact_name: string;
    email: string;
    cuit?: string;
    address: string;
    delivery_window: string;
    instagram: string;
    contact_dni: string;
    fiscal_status: string;
}): Promise<ActionResponse> {
    try {
        const client = await getPortalClient();
        if (!client) {
            return { success: false, error: { message: 'No autenticado', code: 'UNAUTHORIZED' } };
        }

        const supabase = await createClient();

        const normalizedCuit = (data.cuit || '').replace(/[^0-9]/g, '');
        if (normalizedCuit && normalizedCuit.length !== 11) {
            return {
                success: false,
                error: {
                    message: 'El CUIT debe tener 11 dígitos.',
                    code: 'INVALID_CUIT',
                },
            };
        }

        const fieldsToCheck = [
            { key: 'contact_name', label: 'nombre de contacto' },
            { key: 'email', label: 'email' },
            { key: 'cuit', label: 'CUIT' },
            { key: 'address', label: 'direccion' },
            { key: 'delivery_window', label: 'ventana de entrega' },
            { key: 'instagram', label: 'instagram' },
            { key: 'contact_dni', label: 'DNI' },
            { key: 'fiscal_status', label: 'situacion fiscal' },
        ];

        const currentData = client as any;
        const pendingTypes = fieldsToCheck.map((field) => field.key);
        const { data: existingPendingRows, error: pendingFetchError } = await supabase
            .from('pending_changes')
            .select('id, change_type, new_value')
            .eq('client_id', client.id)
            .eq('status', 'pending')
            .in('change_type', pendingTypes)
            .order('created_at', { ascending: false });

        if (pendingFetchError) {
            console.error('Error fetching pending changes:', pendingFetchError);
            return {
                success: false,
                error: {
                    message: 'No se pudieron validar los cambios pendientes actuales.',
                    code: 'PENDING_CHANGE_FETCH_FAILED',
                },
            };
        }

        const pendingByType = (existingPendingRows || []).reduce((acc: Record<string, any>, row: any) => {
            if (!acc[row.change_type]) {
                acc[row.change_type] = row;
            }
            return acc;
        }, {});

        for (const field of fieldsToCheck) {
            const rawNewValue = field.key === 'cuit'
                ? normalizedCuit
                : data[field.key as keyof typeof data];
            const newValue = rawNewValue || null;
            const oldValue = currentData[field.key];

            if (newValue !== oldValue) {
                const existingPending = pendingByType[field.key];
                if (existingPending) {
                    if ((existingPending.new_value ?? null) === newValue) {
                        continue;
                    }

                    const { error: updatePendingError } = await supabase
                        .from('pending_changes')
                        .update({
                            old_value: oldValue || null,
                            new_value: newValue,
                        })
                        .eq('id', existingPending.id);

                    if (updatePendingError) {
                        console.error('Error updating pending change:', updatePendingError);
                        return {
                            success: false,
                            error: {
                                message: `Error al actualizar solicitud de cambio para ${field.label}`,
                                code: 'PENDING_CHANGE_UPDATE_FAILED',
                            },
                        };
                    }
                } else {
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
                        return {
                            success: false,
                            error: {
                                message: `Error al crear solicitud de cambio para ${field.label}`,
                                code: 'PENDING_CHANGE_CREATE_FAILED',
                            },
                        };
                    }
                }
            }
        }

        revalidatePath('/portal/profile');
        return { success: true };
    } catch (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: { message: 'Error al actualizar el perfil', code: 'INTERNAL_ERROR' } };
    }
}

export async function updatePortalToken(newToken: string): Promise<ActionResponse> {
    try {
        const client = await getPortalClient();
        if (!client) {
            return { success: false, error: { message: 'No autenticado', code: 'UNAUTHORIZED' } };
        }

        const supabase = await createClient();

        const { error } = await supabase
            .from('clients')
            .update({ portal_token: newToken })
            .eq('id', client.id);

        if (error) {
            return { success: false, error: { message: 'Error al actualizar el token', code: 'TOKEN_UPDATE_FAILED' } };
        }

        revalidatePath('/portal/profile');
        return { success: true };
    } catch (error) {
        console.error('Error updating token:', error);
        return { success: false, error: { message: 'Error al actualizar el token', code: 'INTERNAL_ERROR' } };
    }
}

export async function getClientOrders(): Promise<ActionResponse<any>> {
    try {
        const client = await getPortalClient();
        if (!client) {
            return { success: false, error: { message: 'No autenticado', code: 'UNAUTHORIZED' } };
        }

        const supabase = await createClient();

        const { data: orders, error } = await supabase
            .from('orders')
            .select('*, order_items(*, products(*))')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false });

        if (error) {
            return { success: false, error: { message: 'Error al obtener pedidos', code: 'ORDERS_FETCH_FAILED' } };
        }

        return {
            success: true,
            data: { orders: orders || [], agreementId: client.agreement_id },
        };
    } catch (error) {
        console.error('Error getting orders:', error);
        return { success: false, error: { message: 'Error al obtener pedidos', code: 'INTERNAL_ERROR' } };
    }
}
