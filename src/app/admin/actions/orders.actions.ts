
'use server';

import { handleAction, getSupabaseClientWithAuth } from './_helpers';
import type { Order, OrderWithItems, ActionResponse } from '@/types';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Los flujos públicos corren del lado del servidor, por lo que usan el cliente
// con service_role (bypassa RLS). El service_role NUNCA se expone al navegador.
function requireAdmin() {
    if (!supabaseAdmin) throw new Error("Configuración del servidor incompleta.");
    return supabaseAdmin;
}

// Un pedido solo puede despacharse (armado -> transito) si su rótulo fue impreso.
function notPrintedError(count = 1) {
    const message = count > 1
        ? `${count} pedidos no tienen rótulo impreso y no pueden despacharse.`
        : "El pedido no tiene rótulo impreso y no puede despacharse.";
    const error = new Error(message) as Error & { code?: string };
    error.code = 'NOT_PRINTED';
    return error;
}

export async function getOrders(filters?: { status?: string; query?: string }): Promise<ActionResponse<Order[]>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        let queryBuilder = supabase.from('orders').select('*').order('created_at', { ascending: false });

        if (filters?.status && filters.status !== 'all') {
            queryBuilder = queryBuilder.eq('status', filters.status);
        }
        if (filters?.query) {
            queryBuilder = queryBuilder.ilike('client_name_cache', `%${filters.query}%`);
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
            .select('*, order_items(quantity, price_per_unit, is_bonus, products(*)), clients(*)')
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
                .select('printed_at')
                .eq('id', orderId)
                .single();
            if (fetchError) throw fetchError;
            if (!order?.printed_at) throw notPrintedError();
        }

        const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
        if (error) throw error;
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
            const { data: orders, error: fetchError } = await supabase
                .from('orders')
                .select('id, printed_at')
                .in('id', orderIds);
            if (fetchError) throw fetchError;
            const unprinted = (orders ?? []).filter(o => !o.printed_at);
            if (unprinted.length > 0) throw notPrintedError(unprinted.length);
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
        const { error } = await supabase
            .from('orders')
            .update({ printed_at: new Date().toISOString() })
            .in('id', orderIds)
            .is('printed_at', null);

        if (error) throw error;
        return null;
    }, ['/admin', '/admin/orders']);
}
