
"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClientWithAuth } from "./_helpers";
import type { DashboardStats, Order, OrderWithItems, Client } from "@/types";

// --- New Dashboard Data Types ---

export interface DashboardMetrics {
    orders: {
        pending: number;
        in_transit: number;
        delivered: number;
        total_units: number;
        average_order_value: number;
    };
    clients: {
        active: number;
        pending: number;
        new_this_month: number;
    };
    top_products: {
        name: string;
        total_quantity: number;
    }[];
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
    const supabase = await getSupabaseClientWithAuth();

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Orders stats
    const { count: pendingOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "armado");

    const { count: inTransitOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "transito");

    const { count: deliveredOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .eq("status", "entregado");

    // Order items for units and average
    const { data: orderItems } = await supabase
        .from("order_items")
        .select("quantity, price_per_unit, created_at, orders(total_amount)");

    const totalUnits = orderItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    
    const { data: allOrders } = await supabase
        .from("orders")
        .select("total_amount");

    const totalOrderValue = allOrders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;
    const orderCount = allOrders?.length || 0;
    const averageOrderValue = orderCount > 0 ? totalOrderValue / orderCount : 0;

    // Clients stats
    const { count: activeClients } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");

    const { count: pendingClients } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_agreement");

    const { count: newClientsThisMonth } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startOfMonth);

    // Top 5 products
    const { data: topProductsData } = await supabase
        .from("order_items")
        .select("quantity, products(name)");

    const productMap: Record<string, { name: string; quantity: number }> = {};
    topProductsData?.forEach((item: any) => {
        const name = item.products?.name || "Sin nombre";
        if (!productMap[name]) {
            productMap[name] = { name, quantity: 0 };
        }
        productMap[name].quantity += item.quantity || 0;
    });

    const topProducts = Object.values(productMap)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

    return {
        orders: {
            pending: pendingOrders || 0,
            in_transit: inTransitOrders || 0,
            delivered: deliveredOrders || 0,
            total_units: totalUnits,
            average_order_value: Math.round(averageOrderValue),
        },
        clients: {
            active: activeClients || 0,
            pending: pendingClients || 0,
            new_this_month: newClientsThisMonth || 0,
        },
        top_products: topProducts,
    };
}

// --- Legacy Dashboard Actions (kept for compatibility) ---

export async function getDashboardData() {
    const supabase = await getSupabaseClientWithAuth();

    const [statsResult, pendingOrdersResult, pendingClientsResult] = await Promise.all([
        supabase.from("dashboard_stats").select("*").single(),
        supabase.from("orders").select(`
            id, 
            client_id, 
            agreement_id, 
            created_at, 
            total_amount, 
            status, 
            client_name_cache, 
            notes,
            order_items(
                quantity,
                products(name)
            )
        `).eq("status", "armado").order("created_at", { ascending: false }).limit(10),
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
        pendingOrders: (pendingOrdersResult.data as any) ?? [],
        pendingClients: pendingClientsResult.data ?? [],
        error: statsError || pendingOrdersResult.error || pendingClientsResult.error,
    };
}


export async function getNotificationData(): Promise<{
    pending_orders_count: number;
    pending_clients_count: number;
    overdue_orders_count: number;
    pending_changes_count: number;
    error: any;
}> {
    const supabase = await getSupabaseClientWithAuth();
    const { data: rpcData, error } = await supabase
        .rpc('get_notification_counts')
        .single();

    const { count: pendingChangesCount } = await supabase
        .from('pending_changes')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

    if (error) {
        console.error("getNotificationData error:", error.message);
        return {
            pending_orders_count: 0,
            pending_clients_count: 0,
            overdue_orders_count: 0,
            pending_changes_count: 0,
            error
        };
    }

    const data = rpcData as { pending_orders_count?: number; pending_clients_count?: number; overdue_orders_count?: number } | null;

    return {
        pending_orders_count: data?.pending_orders_count || 0,
        pending_clients_count: data?.pending_clients_count || 0,
        overdue_orders_count: data?.overdue_orders_count || 0,
        pending_changes_count: pendingChangesCount || 0,
        error: null
    };
}

// --- Individual Actions (still used elsewhere) ---

export async function getClientOrders(clientId: string): Promise<OrderWithItems[]> {
    const supabase = await getSupabaseClientWithAuth();
    const { data, error } = await supabase
        .from("orders")
        .select(`
            *,
            order_items(
                quantity,
                products(name)
            )
        `)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("getClientOrders error:", error.message);
        return [];
    }
    return (data as any);
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
