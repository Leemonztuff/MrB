
'use server';

import { handleAction, getSupabaseClientWithAuth } from './_helpers';
import type { Order, OrderWithItems, ActionResponse } from '@/types';
import { createClient } from '@/lib/supabase/server';

export async function getOrders(filters?: { 
    status?: string; 
    query?: string;
    page?: number;
    limit?: number;
}): Promise<ActionResponse<{ orders: Order[]; total: number; page: number; totalPages: number }>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const page = filters?.page || 1;
        const limit = Math.min(filters?.limit || 50, 100);
        const offset = (page - 1) * limit;

        let queryBuilder = supabase.from('orders').select('*', { count: 'exact' }).order('created_at', { ascending: false });

        if (filters?.status && filters.status !== 'all') {
            queryBuilder = queryBuilder.eq('status', filters.status);
        }
        if (filters?.query) {
            queryBuilder = queryBuilder.ilike('client_name_cache', `%${filters.query}%`);
        }

        const { data, error, count } = await queryBuilder.range(offset, offset + limit - 1);
        if (error) throw error;
        
        const total = count || 0;
        const totalPages = Math.ceil(total / limit);
        
        return { 
            orders: data || [], 
            total, 
            page, 
            totalPages 
        };
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
