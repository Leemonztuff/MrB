
"use server";

import { revalidatePath } from "next/cache";
import { handleAction, getSupabaseClientWithAuth } from "./_helpers";
import type { DashboardStats, Order, Client } from "@/types";
import type { ActionResponse } from "@/types";

// --- Consolidated Dashboard Actions ---

export async function getDashboardData(): Promise<ActionResponse<{
    stats: DashboardStats | null;
    pendingOrders: Order[];
    pendingClients: Client[];
}>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        
        const [statsResult, pendingOrdersResult, pendingClientsResult] = await Promise.all([
            supabase.from("dashboard_stats").select("*").single(),
            supabase.from("orders").select("id, client_id, agreement_id, created_at, total_amount, status, client_name_cache, notes").eq("status", "armado").order("created_at", { ascending: false }).limit(10),
            supabase.from("clients").select("*").eq("status", "pending_agreement").order("created_at", { ascending: false }),
        ]);

        if (pendingOrdersResult.error) throw pendingOrdersResult.error;
        if (pendingClientsResult.error) throw pendingClientsResult.error;

        const stats = statsResult.data;
        const pendingOrders = pendingOrdersResult.data ?? [];
        const pendingClients = pendingClientsResult.data ?? [];

        return {
            data: {
                stats,
                pendingOrders,
                pendingClients,
            }
        };
    }, ['/admin']);
}

export async function getNotificationData(): Promise<ActionResponse<{
    pending_orders_count: number;
    pending_clients_count: number;
    overdue_orders_count: number;
}>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data, error } = await supabase
            .rpc('get_notification_counts')
            .single();
        if (error) throw error;
        return data;
    });
}

// --- Individual Actions (still used elsewhere) ---

export async function getClientOrders(clientId: string): Promise<ActionResponse<Order[]>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { data, error } = await supabase
            .from("orders")
            .select("*")
            .eq("client_id", clientId)
            .order("created_at", { ascending: false });
        if (error) throw error;
        return data || [];
    });
}

export async function completeOrder(orderId: string): Promise<ActionResponse<null>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const { error } = await supabase
            .from('orders')
            .update({ status: 'entregado' })
            .eq('id', orderId);
        if (error) throw error;
        revalidatePath('/admin', 'layout');
        return null;
    }, ['/admin']);
}
