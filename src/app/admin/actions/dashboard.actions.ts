
"use server";

import { revalidatePath } from "next/cache";
import { handleAction, getSupabaseClientWithAuth } from "./_helpers";
import type { DashboardPeriodMetrics, Order, Client } from "@/types";
import type { ActionResponse } from "@/types";

// --- Consolidated Dashboard Actions ---

export async function getDashboardData(periodDays: 7 | 30 | 90 = 30): Promise<ActionResponse<{
    pendingOrders: Order[];
    pendingClients: Client[];
    workload: {
        pendingOrdersCount: number;
        pendingWhatsAppCount: number;
        pendingPreparationCount: number;
        unprintedOrdersCount: number;
        overdueOrdersCount: number;
        pendingClientsCount: number;
    };
    periodMetrics: DashboardPeriodMetrics;
}>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        
        const [
            pendingOrdersResult,
            pendingOrdersCountResult,
            pendingWhatsAppCountResult,
            pendingPreparationCountResult,
            unprintedOrdersCountResult,
            overdueOrdersCountResult,
            pendingClientsResult,
            pendingClientsCountResult,
            periodMetricsResult,
        ] = await Promise.all([
            supabase.from("orders").select("id, client_id, agreement_id, created_at, total_amount, status, client_name_cache, notes, printed_at, whatsapp_confirmed_at, prepared_at").eq("status", "armado").order("created_at", { ascending: false }).limit(10),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "armado"),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "armado").is("whatsapp_confirmed_at", null),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "armado").not("whatsapp_confirmed_at", "is", null).is("prepared_at", null),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "armado").not("prepared_at", "is", null).is("printed_at", null),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "armado").lt("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()),
            supabase.from("clients").select("*").eq("status", "pending_agreement").order("created_at", { ascending: false }).limit(8),
            supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "pending_agreement"),
            supabase.rpc("get_dashboard_period_metrics", { p_period_days: periodDays }).single(),
        ]);

        if (pendingOrdersResult.error) throw pendingOrdersResult.error;
        if (pendingOrdersCountResult.error) throw pendingOrdersCountResult.error;
        if (pendingWhatsAppCountResult.error) throw pendingWhatsAppCountResult.error;
        if (pendingPreparationCountResult.error) throw pendingPreparationCountResult.error;
        if (unprintedOrdersCountResult.error) throw unprintedOrdersCountResult.error;
        if (overdueOrdersCountResult.error) throw overdueOrdersCountResult.error;
        if (pendingClientsResult.error) throw pendingClientsResult.error;
        if (pendingClientsCountResult.error) throw pendingClientsCountResult.error;
        if (periodMetricsResult.error) throw periodMetricsResult.error;

        const pendingOrders = pendingOrdersResult.data ?? [];
        const pendingClients = pendingClientsResult.data ?? [];
        const periodMetrics = periodMetricsResult.data as DashboardPeriodMetrics;

        return {
            pendingOrders,
            pendingClients,
            workload: {
                pendingOrdersCount: pendingOrdersCountResult.count ?? 0,
                pendingWhatsAppCount: pendingWhatsAppCountResult.count ?? 0,
                pendingPreparationCount: pendingPreparationCountResult.count ?? 0,
                unprintedOrdersCount: unprintedOrdersCountResult.count ?? 0,
                overdueOrdersCount: overdueOrdersCountResult.count ?? 0,
                pendingClientsCount: pendingClientsCountResult.count ?? 0,
            },
            periodMetrics,
        };
    });
}

export async function getNotificationData(): Promise<ActionResponse<{
    pending_orders_count: number;
    pending_clients_count: number;
    overdue_orders_count: number;
    oldest_pending_order_at: string | null;
}>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        const [{ data, error }, { data: oldestOrder, error: oldestOrderError }] = await Promise.all([
            supabase.rpc('get_notification_counts').single(),
            supabase
                .from('orders')
                .select('created_at')
                .eq('status', 'armado')
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle(),
        ]);
        if (error) throw error;
        if (oldestOrderError) throw oldestOrderError;

        const counts = data as {
            pending_orders_count: number;
            pending_clients_count: number;
            overdue_orders_count: number;
        };

        return {
            ...counts,
            oldest_pending_order_at: oldestOrder?.created_at ?? null,
        };
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
