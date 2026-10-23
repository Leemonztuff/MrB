
'use server';

import { handleAction, getSupabaseClientWithAuth } from './_helpers';
import type { Order, OrderWithItems, ActionResponse } from '@/types';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getOrderDispatchBlocker, type OrderDispatchBlocker } from '@/lib/order-workflow';

// Los flujos públicos corren del lado del servidor, por lo que usan el cliente
// con service_role (bypassa RLS). El service_role NUNCA se expone al navegador.
function requireAdmin() {
    if (!supabaseAdmin) throw new Error("Configuración del servidor incompleta.");
    return supabaseAdmin;
}

function dispatchPrerequisiteError(blocker: OrderDispatchBlocker, count = 1) {
    const plural = count > 1;
    const quantity = plural ? `${count} pedidos` : 'El pedido';
    const requirement = {
        whatsapp: plural
            ? 'no tienen confirmada la recepción del mensaje de WhatsApp'
            : 'no tiene confirmada la recepción del mensaje de WhatsApp',
        preparation: plural ? 'no están marcados como preparados' : 'no está marcado como preparado',
        label: plural
            ? 'no tienen confirmada la impresión del rótulo de envío'
            : 'no tiene confirmada la impresión del rótulo de envío',
    }[blocker];
    const nextStep = {
        whatsapp: 'confirmá manualmente que recibiste el pedido por WhatsApp',
        preparation: 'marcá el pedido como preparado',
        label: 'imprimí el rótulo y confirmá la impresión desde la vista previa',
    }[blocker];
    const error = new Error(`${quantity} ${requirement}; ${nextStep} antes de despachar.`) as Error & { code?: string };
    error.code = {
        whatsapp: 'WHATSAPP_NOT_CONFIRMED',
        preparation: 'ORDER_NOT_PREPARED',
        label: 'NOT_PRINTED',
    }[blocker];
    return error;
}

function orderNotPendingError(count = 1) {
    const message = count > 1
        ? `No se pudieron validar ${count} pedidos pendientes. Actualizá la vista e intentá nuevamente.`
        : 'El pedido ya no está pendiente. Actualizá la vista antes de continuar.';
    const error = new Error(message) as Error & { code?: string };
    error.code = 'ORDER_NOT_PENDING';
    return error;
}

export async function getOrders(filters?: {
    status?: string;
    query?: string;
    overdue?: boolean;
    unprinted?: boolean;
    workflow?: 'whatsapp' | 'preparation';
}): Promise<ActionResponse<Order[]>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        let queryBuilder = supabase.from('orders').select('*').order('created_at', { ascending: false });

        if (filters?.status && filters.status !== 'all') {
            queryBuilder = queryBuilder.eq('status', filters.status);
        }
        if (filters?.query) {
            queryBuilder = queryBuilder.ilike('client_name_cache', `%${filters.query}%`);
        }
        if (filters?.overdue) {
            const overdueBefore = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
            queryBuilder = queryBuilder.lt('created_at', overdueBefore);
        }
        if (filters?.unprinted) {
            queryBuilder = queryBuilder.not('prepared_at', 'is', null).is('printed_at', null);
        }
        if (filters?.workflow === 'whatsapp') {
            queryBuilder = queryBuilder.is('whatsapp_confirmed_at', null);
        }
        if (filters?.workflow === 'preparation') {
            queryBuilder = queryBuilder.not('whatsapp_confirmed_at', 'is', null).is('prepared_at', null);
        }

        const { data, error } = await queryBuilder;
        if (error) throw error;
        return data || [];
    });
}

export async function getOrderWithDetails(orderId: string): Promise<ActionResponse<OrderWithItems & { hasDiscrepancy?: boolean; calculatedTotal?: number }>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(quantity, price_per_unit, products(*)), clients(*)')
            .eq('id', orderId)
            .single();

        if (error) throw error;

        const calculatedTotal = data.order_items?.reduce(
            (sum: number, item: any) => sum + (item.quantity * item.price_per_unit), 0
        ) ?? 0;

        return {
            ...data,
            hasDiscrepancy: Math.abs(data.total_amount - calculatedTotal) > 0.01,
            calculatedTotal,
        };
    });
}

export async function getOrdersBatch(ids: string[]): Promise<ActionResponse<OrderWithItems[]>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(quantity, price_per_unit, products(*)), clients(*)')
            .in('id', ids);

        if (error) throw error;
        return data || [];
    });
}

export async function updateOrderStatus(orderId: string, status: 'armado' | 'transito' | 'entregado'): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();

        if (status === 'transito') {
            const { data: order, error: fetchError } = await supabase
                .from('orders')
                .select('status, whatsapp_confirmed_at, prepared_at, printed_at')
                .eq('id', orderId)
                .single();
            if (fetchError) throw fetchError;
            if (order.status !== 'armado') throw orderNotPendingError();
            const blocker = getOrderDispatchBlocker(order);
            if (blocker) throw dispatchPrerequisiteError(blocker);
        }

        if (status === 'transito') {
            const { data: updated, error } = await supabase
                .from('orders')
                .update({ status })
                .eq('id', orderId)
                .eq('status', 'armado')
                .select('id')
                .maybeSingle();
            if (error) throw error;
            if (!updated) throw orderNotPendingError();
        } else {
            const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
            if (error) throw error;
        }
        return null;
    }, ['/admin', '/admin/orders']);
}

export async function markOrderWorkflowStep(
    orderId: string,
    step: 'whatsapp' | 'preparation'
): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('status, whatsapp_confirmed_at, prepared_at')
            .eq('id', orderId)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!order) throw new Error('Pedido no encontrado.');
        if (order.status !== 'armado') throw orderNotPendingError();

        if (step === 'whatsapp' && order.whatsapp_confirmed_at) return null;
        if (step === 'preparation' && order.prepared_at) return null;
        if (step === 'preparation' && !order.whatsapp_confirmed_at) {
            throw dispatchPrerequisiteError('whatsapp');
        }

        const timestamp = new Date().toISOString();
        const update = step === 'whatsapp'
            ? supabase
                .from('orders')
                .update({ whatsapp_confirmed_at: timestamp })
                .eq('id', orderId)
                .eq('status', 'armado')
                .is('whatsapp_confirmed_at', null)
            : supabase
                .from('orders')
                .update({ prepared_at: timestamp })
                .eq('id', orderId)
                .eq('status', 'armado')
                .not('whatsapp_confirmed_at', 'is', null)
                .is('prepared_at', null);
        const { data: updated, error: updateError } = await update.select('id').maybeSingle();
        if (updateError) throw updateError;
        if (!updated) {
            const { data: current, error: currentError } = await supabase
                .from('orders')
                .select('status, whatsapp_confirmed_at, prepared_at')
                .eq('id', orderId)
                .maybeSingle();
            if (currentError) throw currentError;
            if (current?.status === 'armado' && (step === 'whatsapp'
                ? current.whatsapp_confirmed_at
                : current.prepared_at)) return null;
            if (current?.status !== 'armado') throw orderNotPendingError();
            if (step === 'preparation' && !current?.whatsapp_confirmed_at) {
                throw dispatchPrerequisiteError('whatsapp');
            }
            throw new Error('No se pudo guardar la etapa del pedido. Actualizá la vista e intentá nuevamente.');
        }

        return null;
    }, ['/admin', '/admin/orders']);
}

export async function getPublicOrderDetails(orderId: string): Promise<ActionResponse<OrderWithItems>> {
    return handleAction(async () => {
        const supabase = requireAdmin();
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(quantity, products(name))')
            .eq('id', orderId)
            .single();
        if (error) throw error;
        return data;
    });
}

export async function getLabelData(ids: string[]): Promise<ActionResponse<OrderWithItems[]>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(quantity, price_per_unit, products(*)), clients(*)')
            .in('id', ids);

        if (error) throw error;
        return data || [];
    });
}

export async function publicConfirmOrder(orderId: string, token?: string): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = requireAdmin();

        const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('id, status, confirmation_token')
            .eq('id', orderId)
            .maybeSingle();

        if (fetchError || !order) {
            throw new Error("Pedido no encontrado.");
        }

        if (token && order.confirmation_token && order.confirmation_token !== token) {
            throw new Error("Token de confirmación inválido.");
        }

        if (order.status !== 'transito') {
            throw new Error("Este pedido aún no fue despachado.");
        }

        const { error } = await supabase
            .from('orders')
            .update({ status: 'entregado' })
            .eq('id', orderId);
        if (error) throw error;
        return null;
    }, ['/admin', '/admin/orders']);
}

export async function bulkUpdateOrderStatus(orderIds: string[], status: 'armado' | 'transito' | 'entregado'): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();

        if (status === 'transito') {
            const uniqueOrderIds = [...new Set(orderIds)];
            if (uniqueOrderIds.length === 0) throw new Error('Seleccioná al menos un pedido para despachar.');
            const { data: orders, error: fetchError } = await supabase
                .from('orders')
                .select('id, status, whatsapp_confirmed_at, prepared_at, printed_at')
                .in('id', uniqueOrderIds);
            if (fetchError) throw fetchError;
            const foundIds = new Set((orders ?? []).map(order => order.id));
            const missingCount = uniqueOrderIds.filter(id => !foundIds.has(id)).length;
            if (missingCount > 0) throw orderNotPendingError(missingCount);
            const notPendingCount = (orders ?? []).filter(order => order.status !== 'armado').length;
            if (notPendingCount > 0) throw orderNotPendingError(notPendingCount);

            const blockers = (orders ?? []).map(getOrderDispatchBlocker);
            for (const blocker of ['whatsapp', 'preparation', 'label'] as const) {
                const blockedCount = blockers.filter(item => item === blocker).length;
                if (blockedCount > 0) throw dispatchPrerequisiteError(blocker, blockedCount);
            }

            const { data: updatedOrders, error: updateError } = await supabase
                .from('orders')
                .update({ status })
                .in('id', uniqueOrderIds)
                .eq('status', 'armado')
                .select('id');
            if (updateError) throw updateError;
            if ((updatedOrders ?? []).length !== uniqueOrderIds.length) {
                throw orderNotPendingError(uniqueOrderIds.length - (updatedOrders ?? []).length);
            }
            return null;
        }

        const { error } = await supabase
            .from('orders')
            .update({ status })
            .in('id', orderIds);

        if (error) throw error;
        return null;
    }, ['/admin', '/admin/orders']);
}

export async function markOrdersAsPrinted(orderIds: string[]): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const uniqueOrderIds = [...new Set(orderIds)];
        if (uniqueOrderIds.length === 0) {
            throw new Error("No hay pedidos para confirmar.");
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update({ printed_at: new Date().toISOString() })
            .in('id', uniqueOrderIds)
            .eq('status', 'armado')
            .is('printed_at', null);

        if (updateError) throw updateError;

        const { data: orders, error: verifyError } = await supabase
            .from('orders')
            .select('id, printed_at')
            .in('id', uniqueOrderIds);

        if (verifyError) throw verifyError;

        const printedOrderIds = new Set((orders ?? [])
            .filter(order => order.printed_at)
            .map(order => order.id));
        const unconfirmedCount = uniqueOrderIds.filter(id => !printedOrderIds.has(id)).length;
        if (unconfirmedCount > 0) {
            throw new Error(
                `No se pudo confirmar la impresión de ${unconfirmedCount} pedido(s). Actualiza la vista y vuelve a intentarlo.`
            );
        }

        return null;
    }, ['/admin', '/admin/orders']);
}
