
"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClientWithAuth } from "./_helpers";
import type { DashboardStats, Order, Client } from "@/types";

// --- Consolidated Dashboard Actions ---

export async function getDashboardData() {
    const supabase = await getSupabaseClientWithAuth();
    
    const [statsResult, pendingOrdersResult, pendingClientsResult] = await Promise.all([
        supabase.from("dashboard_stats").select("*").single(),
        supabase.from("orders").select("id, client_id, agreement_id, created_at, total_amount, status, client_name_cache, notes").eq("status", "armado").order("created_at", { ascending: false }).limit(10),
        supabase.from("clients").select("*").eq("status", "pending_agreement").order("created_at", { ascending: false }),
    ]);

    const statsError = statsResult.error;
    const stats = statsResult.data;

    if (statsError || !stats) {
        console.error("getDashboardData (stats) error:", statsError?.message);
    }
    
    return {
        stats: stats ?? { 
            total_revenue: 0, 
            month_revenue: 0, 
            active_clients: 0, 
            overdue_orders_count: 0,
            total_clients: 0,
            total_pricelists: 0,
            total_promotions: 0,
            total_sales_conditions: 0,
            pending_orders_count: 0
        },
        pendingOrders: pendingOrdersResult.data ?? [],
        pendingClients: pendingClientsResult.data ?? [],
        error: statsError || pendingOrdersResult.error || pendingClientsResult.error,
    };
}


export async function getNotificationData(): Promise<{
    pending_orders_count: number;
    pending_clients_count: number;
    overdue_orders_count: number;
    error: any;
}> {
    const supabase = await getSupabaseClientWithAuth();
    const { data, error } = await supabase
        .rpc('get_notification_counts')
        .single();
    
    if (error) {
        console.error("getNotificationData error:", error.message);
        return {
            pending_orders_count: 0,
            pending_clients_count: 0,
            overdue_orders_count: 0,
            error
        };
    }
    
    return { ...data, error: null };
}

// --- Individual Actions (still used elsewhere) ---

export async function getClientOrders(clientId: string): Promise<Order[]> {
    const supabase = await getSupabaseClientWithAuth();
    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("getClientOrders error:", error.message);
        return [];
    }
    return data;
}

export async function completeOrder(orderId: string, orderTotal: number) {
    const supabase = await getSupabaseClientWithAuth();
    
    const { error: orderUpdateError } = await supabase
        .from('orders')
        .update({ status: 'entregado' })
        .eq('id', orderId);

    if (orderUpdateError) {
        console.error("completeOrder error:", orderUpdateError.message);
        return { error: orderUpdateError };
    }

    revalidatePath('/admin');
    return { error: null };
}
