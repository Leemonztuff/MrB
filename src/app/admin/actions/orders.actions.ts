
'use server';

import { handleAction, getSupabaseClientWithAuth } from './_helpers';
import type { Order, OrderWithItems, ActionResponse } from '@/types';
import { createClient } from '@/lib/supabase/server';

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

export async function getOrderWithDetails(orderId: string): Promise<ActionResponse<OrderWithItems>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(quantity, price_per_unit, products(*)), clients(*)')
            .eq('id', orderId)
            .single();

        if (error) throw error;
        return data;
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
        const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
        if (error) throw error;
        return null;
    }, ['/admin', '/admin/orders']);
}

export async function getPublicOrderDetails(orderId: string): Promise<ActionResponse<OrderWithItems>> {
    return handleAction(async () => {
        const supabase = await createClient();
        const { data, error } = await supabase
            .from('orders')
            .select('*, order_items(quantity, products(name))')
            .eq('id', orderId)
            .single();
        if (error) throw error;
        return data;
    });
}

export async function publicConfirmOrder(orderId: string): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await createClient();
        const { error } = await supabase.from('orders').update({ status: 'entregado' }).eq('id', orderId);
        if (error) throw error;
        return null;
    }, ['/admin', '/admin/orders']);
}

export async function bulkUpdateOrderStatus(orderIds: string[], status: 'armado' | 'transito' | 'entregado'): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { error } = await supabase
            .from('orders')
            .update({ status })
            .in('id', orderIds);

        if (error) throw error;
        return null;
    }, ['/admin', '/admin/orders']);
}
