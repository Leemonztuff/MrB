"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseClientWithAuth } from "./_helpers";
import type { ClientStats, OrderWithItems } from "@/types";

export type NotificationItem = {
    id: string;
    type: "new_order" | "overdue_order" | "new_client" | "pending_changes";
    title: string;
    description: string;
    clientName?: string;
    amount?: number;
    itemCount?: number;
    createdAt: string;
    href: string;
};

export async function getNotificationItems(): Promise<NotificationItem[]> {
    const supabase = await getSupabaseClientWithAuth();
    const notifications: NotificationItem[] = [];
    const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

    const [pendingOrdersResult, overdueOrdersResult, newClientsResult, pendingChangesResult] = await Promise.all([
        supabase
            .from("orders")
            .select("id, client_name_cache, total_amount, created_at, order_items(count)")
            .eq("status", "armado")
            .gte("created_at", twoDaysAgo)
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("orders")
            .select("id, client_name_cache, total_amount, created_at, order_items(count)")
            .eq("status", "armado")
            .lt("created_at", twoDaysAgo)
            .order("created_at", { ascending: true })
            .limit(3),
        supabase
            .from("clients")
            .select("id, contact_name, email, created_at")
            .eq("status", "pending_agreement")
            .order("created_at", { ascending: false })
            .limit(5),
        supabase
            .from("pending_changes")
            .select("id, client_id, change_type, new_value, created_at, clients(contact_name)")
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(5),
    ]);

    pendingOrdersResult.data?.forEach((order: any) => {
        notifications.push({
            id: `order-${order.id}`,
            type: "new_order",
            title: "Nuevo Pedido",
            description: `${order.order_items?.[0]?.count || 0} productos`,
            clientName: order.client_name_cache,
            amount: order.total_amount,
            createdAt: order.created_at,
            href: `/admin/orders?query=${encodeURIComponent(order.id)}`,
        });
    });

    overdueOrdersResult.data?.forEach((order: any) => {
        notifications.push({
            id: `overdue-${order.id}`,
            type: "overdue_order",
            title: "Pedido Vencido",
            description: "Sin atender hace mas de 48hs",
            clientName: order.client_name_cache,
            amount: order.total_amount,
            createdAt: order.created_at,
            href: `/admin/orders?query=${encodeURIComponent(order.id)}&status=armado`,
        });
    });

    newClientsResult.data?.forEach((client: any) => {
        notifications.push({
            id: `client-${client.id}`,
            type: "new_client",
            title: "Nuevo Cliente",
            description: client.email || "Sin email",
            clientName: client.contact_name,
            createdAt: client.created_at,
            href: `/admin/clients/${client.id}`,
        });
    });

    pendingChangesResult.data?.forEach((change: any) => {
        const changeLabels: Record<string, string> = {
            contact_name: "Nombre",
            email: "Email",
            phone: "Telefono",
            cuit: "CUIT",
            address: "Direccion",
            instagram: "Instagram",
            delivery_window: "Ventana de entrega",
            contact_dni: "DNI",
            fiscal_status: "Situacion fiscal",
        };

        notifications.push({
            id: `change-${change.id}`,
            type: "pending_changes",
            title: `Cambio en ${changeLabels[change.change_type] || change.change_type}`,
            description: change.new_value || "",
            clientName: change.clients?.contact_name,
            createdAt: change.created_at,
            href: `/admin/clients/${change.client_id}`,
        });
    });

    return notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

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

    // Usar RPC para optimizar - una sola query en lugar de 9
    const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_dashboard_metrics')
        .single();

    if (rpcError) {
        console.error('getDashboardMetrics RPC error:', rpcError.message);
        throw new Error(`Error al obtener métricas: ${rpcError.message}`);
    }

    // Revalidate para caching (60 segundos)
    revalidatePath('/admin');

    const metrics = rpcData as {
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
    };

    return {
        orders: metrics.orders || {
            pending: 0,
            in_transit: 0,
            delivered: 0,
            total_units: 0,
            average_order_value: 0
        },
        clients: metrics.clients || {
            active: 0,
            pending: 0,
            new_this_month: 0
        },
        top_products: metrics.top_products || []
    };
}

export async function getDashboardData() {
    const supabase = await getSupabaseClientWithAuth();

    const [statsResult, pendingOrdersResult, pendingClientsResult] = await Promise.all([
        supabase.from("dashboard_stats").select("*").single(),
        supabase
            .from("orders")
            .select(`
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
            `)
            .eq("status", "armado")
            .order("created_at", { ascending: false })
            .limit(10),
        supabase.from("clients").select("*").eq("status", "pending_agreement").order("created_at", { ascending: false }).limit(20),
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
            pending_orders_count: 0,
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

    // Usar RPC optimizado + caching
    const { data: rpcData, error } = await supabase.rpc("get_notification_counts").single();

    const { count: pendingChangesCount } = await supabase
        .from("pending_changes")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending");

    // Revalidate para caching (60 segundos)
    revalidatePath('/admin');

    if (error) {
        console.error("getNotificationData error:", error.message);
        return {
            pending_orders_count: 0,
            pending_clients_count: 0,
            overdue_orders_count: 0,
            pending_changes_count: 0,
            error,
        };
    }

    const data = rpcData as { pending_orders_count?: number; pending_clients_count?: number; overdue_orders_count?: number } | null;

    return {
        pending_orders_count: data?.pending_orders_count || 0,
        pending_clients_count: data?.pending_clients_count || 0,
        overdue_orders_count: data?.overdue_orders_count || 0,
        pending_changes_count: pendingChangesCount || 0,
        error: null,
    };
}

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

    return data as any;
}

export async function completeOrder(orderId: string, orderTotal: number) {
    const supabase = await getSupabaseClientWithAuth();

    const { error: orderUpdateError } = await supabase
        .from("orders")
        .update({ status: "entregado" })
        .eq("id", orderId);

    if (orderUpdateError) {
        console.error("completeOrder error:", orderUpdateError.message);
        return { error: orderUpdateError };
    }

    revalidatePath("/admin");
    return { error: null };
}
