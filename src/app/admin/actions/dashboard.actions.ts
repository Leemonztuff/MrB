
"use server";

import { revalidatePath } from "next/cache";
import { handleAction, getOrderOperationsContext, getSupabaseClientWithAuth } from "./_helpers";
import type { DashboardBoardOrder, DashboardPeriodMetrics, Order, Client } from "@/types";
import type { ActionResponse } from "@/types";

// --- Consolidated Dashboard Actions ---

type BoardOrderWithProductRelations = Omit<DashboardBoardOrder, "order_items"> & {
    order_items: {
        quantity: number;
        products: { id: string; name: string } | { id: string; name: string }[] | null;
    }[];
};

function normalizeBoardOrders(orders: BoardOrderWithProductRelations[]): DashboardBoardOrder[] {
    return orders.map(order => ({
        ...order,
        order_items: order.order_items.map(item => ({
            quantity: item.quantity,
            products: Array.isArray(item.products) ? item.products[0] ?? null : item.products,
        })),
    }));
}

export async function getDashboardData(periodDays: 7 | 30 | 90 = 30): Promise<ActionResponse<{
    pendingOrders: Order[];
    boardOrders: {
        whatsapp: DashboardBoardOrder[];
        preparation: DashboardBoardOrder[];
        labels: DashboardBoardOrder[];
        ready: DashboardBoardOrder[];
        dispatched: DashboardBoardOrder[];
        delivered: DashboardBoardOrder[];
    };
    pendingClients: Client[];
    workload: {
        pendingOrdersCount: number;
        pendingWhatsAppCount: number;
        pendingPreparationCount: number;
        unprintedOrdersCount: number;
        overdueOrdersCount: number;
        pendingClientsCount: number;
        dispatchedOrdersCount: number;
        deliveredOrdersCount: number;
    };
    periodMetrics: DashboardPeriodMetrics;
}>> {
    return handleAction(async () => {
        const supabase = await getSupabaseClientWithAuth();
        
        const [
            pendingOrdersResult,
            whatsappOrdersResult,
            preparationOrdersResult,
            labelOrdersResult,
            readyOrdersResult,
            dispatchedOrdersResult,
            deliveredOrdersResult,
            pendingOrdersCountResult,
            pendingWhatsAppCountResult,
            pendingPreparationCountResult,
            unprintedOrdersCountResult,
            overdueOrdersCountResult,
            pendingClientsResult,
            pendingClientsCountResult,
            dispatchedOrdersCountResult,
            deliveredOrdersCountResult,
            periodMetricsResult,
        ] = await Promise.all([
            supabase.from("orders").select("id, client_id, agreement_id, created_at, total_amount, status, client_name_cache, notes, printed_at, whatsapp_confirmed_at, prepared_at").eq("status", "armado").order("created_at", { ascending: false }).limit(10),
            supabase.from("orders").select("id, client_id, agreement_id, created_at, total_amount, status, client_name_cache, notes, printed_at, whatsapp_confirmed_at, prepared_at, delivered_at, customer_confirmed_at, order_items(quantity, products(id, name))").eq("status", "armado").is("whatsapp_confirmed_at", null).order("created_at", { ascending: true }).limit(8),
            supabase.from("orders").select("id, client_id, agreement_id, created_at, total_amount, status, client_name_cache, notes, printed_at, whatsapp_confirmed_at, prepared_at, delivered_at, customer_confirmed_at, order_items(quantity, products(id, name))").eq("status", "armado").not("whatsapp_confirmed_at", "is", null).is("prepared_at", null).order("created_at", { ascending: true }).limit(8),
            supabase.from("orders").select("id, client_id, agreement_id, created_at, total_amount, status, client_name_cache, notes, printed_at, whatsapp_confirmed_at, prepared_at, delivered_at, customer_confirmed_at, order_items(quantity, products(id, name))").eq("status", "armado").not("prepared_at", "is", null).is("printed_at", null).order("created_at", { ascending: true }).limit(8),
            supabase.from("orders").select("id, client_id, agreement_id, created_at, total_amount, status, client_name_cache, notes, printed_at, whatsapp_confirmed_at, prepared_at, delivered_at, customer_confirmed_at, order_items(quantity, products(id, name))").eq("status", "armado").not("whatsapp_confirmed_at", "is", null).not("prepared_at", "is", null).not("printed_at", "is", null).order("created_at", { ascending: true }).limit(8),
            supabase.from("orders").select("id, client_id, agreement_id, created_at, total_amount, status, client_name_cache, notes, printed_at, whatsapp_confirmed_at, prepared_at, delivered_at, customer_confirmed_at, order_items(quantity, products(id, name))").eq("status", "transito").order("created_at", { ascending: false }).limit(6),
            supabase.from("orders").select("id, client_id, agreement_id, created_at, total_amount, status, client_name_cache, notes, printed_at, whatsapp_confirmed_at, prepared_at, delivered_at, customer_confirmed_at, order_items(quantity, products(id, name))").eq("status", "entregado").order("delivered_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(6),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "armado"),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "armado").is("whatsapp_confirmed_at", null),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "armado").not("whatsapp_confirmed_at", "is", null).is("prepared_at", null),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "armado").not("prepared_at", "is", null).is("printed_at", null),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "armado").lt("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()),
            supabase.from("clients").select("*").eq("status", "pending_agreement").order("created_at", { ascending: false }).limit(8),
            supabase.from("clients").select("id", { count: "exact", head: true }).eq("status", "pending_agreement"),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "transito"),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "entregado"),
            supabase.rpc("get_dashboard_period_metrics", { p_period_days: periodDays }).single(),
        ]);

        if (pendingOrdersResult.error) throw pendingOrdersResult.error;
        if (whatsappOrdersResult.error) throw whatsappOrdersResult.error;
        if (preparationOrdersResult.error) throw preparationOrdersResult.error;
        if (labelOrdersResult.error) throw labelOrdersResult.error;
        if (readyOrdersResult.error) throw readyOrdersResult.error;
        if (dispatchedOrdersResult.error) throw dispatchedOrdersResult.error;
        if (deliveredOrdersResult.error) throw deliveredOrdersResult.error;
        if (pendingOrdersCountResult.error) throw pendingOrdersCountResult.error;
        if (pendingWhatsAppCountResult.error) throw pendingWhatsAppCountResult.error;
        if (pendingPreparationCountResult.error) throw pendingPreparationCountResult.error;
        if (unprintedOrdersCountResult.error) throw unprintedOrdersCountResult.error;
        if (overdueOrdersCountResult.error) throw overdueOrdersCountResult.error;
        if (pendingClientsResult.error) throw pendingClientsResult.error;
        if (pendingClientsCountResult.error) throw pendingClientsCountResult.error;
        if (dispatchedOrdersCountResult.error) throw dispatchedOrdersCountResult.error;
        if (deliveredOrdersCountResult.error) throw deliveredOrdersCountResult.error;
        if (periodMetricsResult.error) throw periodMetricsResult.error;

        const pendingOrders = pendingOrdersResult.data ?? [];
        const pendingClients = pendingClientsResult.data ?? [];
        const periodMetrics = periodMetricsResult.data as DashboardPeriodMetrics;

        return {
            pendingOrders,
            boardOrders: {
                whatsapp: normalizeBoardOrders(whatsappOrdersResult.data ?? []),
                preparation: normalizeBoardOrders(preparationOrdersResult.data ?? []),
                labels: normalizeBoardOrders(labelOrdersResult.data ?? []),
                ready: normalizeBoardOrders(readyOrdersResult.data ?? []),
                dispatched: normalizeBoardOrders(dispatchedOrdersResult.data ?? []),
                delivered: normalizeBoardOrders(deliveredOrdersResult.data ?? []),
            },
            pendingClients,
            workload: {
                pendingOrdersCount: pendingOrdersCountResult.count ?? 0,
                pendingWhatsAppCount: pendingWhatsAppCountResult.count ?? 0,
                pendingPreparationCount: pendingPreparationCountResult.count ?? 0,
                unprintedOrdersCount: unprintedOrdersCountResult.count ?? 0,
                overdueOrdersCount: overdueOrdersCountResult.count ?? 0,
                pendingClientsCount: pendingClientsCountResult.count ?? 0,
                dispatchedOrdersCount: dispatchedOrdersCountResult.count ?? 0,
                deliveredOrdersCount: deliveredOrdersCountResult.count ?? 0,
            },
            periodMetrics,
        };
    });
}

export async function getOperatorDashboardData(): Promise<ActionResponse<{
    boardOrders: {
        whatsapp: DashboardBoardOrder[];
        preparation: DashboardBoardOrder[];
        labels: DashboardBoardOrder[];
        ready: DashboardBoardOrder[];
        dispatched: DashboardBoardOrder[];
        delivered: DashboardBoardOrder[];
    };
    workload: {
        pendingOrdersCount: number;
        pendingWhatsAppCount: number;
        pendingPreparationCount: number;
        unprintedOrdersCount: number;
        dispatchedOrdersCount: number;
        deliveredOrdersCount: number;
    };
}>> {
    return handleAction(async () => {
        const { supabase } = await getOrderOperationsContext();
        const boardFields = "id, created_at, status, client_name_cache, notes, printed_at, whatsapp_confirmed_at, prepared_at, delivered_at, customer_confirmed_at, order_items(quantity, products(id, name))";
        const [
            whatsapp,
            preparation,
            labels,
            ready,
            dispatched,
            delivered,
            pendingCount,
            whatsappCount,
            preparationCount,
            labelsCount,
            dispatchedCount,
            deliveredCount,
        ] = await Promise.all([
            supabase.from("orders").select(boardFields).eq("status", "armado").is("whatsapp_confirmed_at", null).order("created_at", { ascending: true }).limit(12),
            supabase.from("orders").select(boardFields).eq("status", "armado").not("whatsapp_confirmed_at", "is", null).is("prepared_at", null).order("created_at", { ascending: true }).limit(12),
            supabase.from("orders").select(boardFields).eq("status", "armado").not("prepared_at", "is", null).is("printed_at", null).order("created_at", { ascending: true }).limit(12),
            supabase.from("orders").select(boardFields).eq("status", "armado").not("whatsapp_confirmed_at", "is", null).not("prepared_at", "is", null).not("printed_at", "is", null).order("created_at", { ascending: true }).limit(12),
            supabase.from("orders").select(boardFields).eq("status", "transito").order("created_at", { ascending: true }).limit(12),
            supabase.from("orders").select(boardFields).eq("status", "entregado").order("delivered_at", { ascending: false, nullsFirst: false }).order("created_at", { ascending: false }).limit(8),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "armado"),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "armado").is("whatsapp_confirmed_at", null),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "armado").not("whatsapp_confirmed_at", "is", null).is("prepared_at", null),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "armado").not("prepared_at", "is", null).is("printed_at", null),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "transito"),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "entregado"),
        ]);
        for (const result of [whatsapp, preparation, labels, ready, dispatched, delivered]) {
            if (result.error) throw result.error;
        }
        for (const result of [pendingCount, whatsappCount, preparationCount, labelsCount, dispatchedCount, deliveredCount]) {
            if (result.error) throw result.error;
        }

        return {
            boardOrders: {
                whatsapp: normalizeBoardOrders(whatsapp.data ?? []),
                preparation: normalizeBoardOrders(preparation.data ?? []),
                labels: normalizeBoardOrders(labels.data ?? []),
                ready: normalizeBoardOrders(ready.data ?? []),
                dispatched: normalizeBoardOrders(dispatched.data ?? []),
                delivered: normalizeBoardOrders(delivered.data ?? []),
            },
            workload: {
                pendingOrdersCount: pendingCount.count ?? 0,
                pendingWhatsAppCount: whatsappCount.count ?? 0,
                pendingPreparationCount: preparationCount.count ?? 0,
                unprintedOrdersCount: labelsCount.count ?? 0,
                dispatchedOrdersCount: dispatchedCount.count ?? 0,
                deliveredOrdersCount: deliveredCount.count ?? 0,
            },
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
