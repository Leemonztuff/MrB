

import { getCurrentAppRole } from "@/app/admin/actions/_helpers";
import { getDashboardData, getOperatorDashboardData } from "@/app/admin/actions/dashboard.actions";
import { PageHeader } from "@/components/shared/page-header";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/shared/glass-card";
import { PageContainer } from "@/components/shared/page-container";
import { ErrorDisplay } from "@/components/shared/error-display";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DashboardStats } from "./_components/dashboard-stats";
import { RecentOrders } from "./_components/recent-orders";
import { PendingClients } from "./_components/pending-clients";
import { OrdersKanbanBoard } from "./_components/orders-kanban-board";

export default async function AdminDashboardPage({
    searchParams,
}: {
    searchParams?: Promise<{ period?: string }>;
}) {
    const role = await getCurrentAppRole();
    if (role === "operario") {
        const { data: operatorData, error: operatorError } = await getOperatorDashboardData();
        if (operatorError) {
            return <ErrorDisplay message={operatorError.message} />;
        }

        return (
            <PageContainer gap="lg">
                <PageHeader
                    title="Pedidos para gestionar"
                    description="Revisá cada pedido y avanzá sus pasos desde el celular o la computadora."
                />
                <OrdersKanbanBoard
                    orders={operatorData?.boardOrders ?? {
                        whatsapp: [],
                        preparation: [],
                        labels: [],
                        ready: [],
                        dispatched: [],
                        delivered: [],
                    }}
                    workload={operatorData?.workload ?? {
                        pendingOrdersCount: 0,
                        pendingWhatsAppCount: 0,
                        pendingPreparationCount: 0,
                        unprintedOrdersCount: 0,
                        dispatchedOrdersCount: 0,
                        deliveredOrdersCount: 0,
                    }}
                    showAmounts={false}
                />
            </PageContainer>
        );
    }

    const params = await searchParams;
    const periodDays: 7 | 30 | 90 = params?.period === "7"
        ? 7
        : params?.period === "90"
            ? 90
            : 30;
    const { data, error } = await getDashboardData(periodDays);

    if (error) {
        return <ErrorDisplay message={error.message} />;
    }

    const pendingOrders = data?.pendingOrders ?? [];
    const pendingClients = data?.pendingClients ?? [];
    const workload = data?.workload ?? {
        pendingOrdersCount: 0,
        pendingWhatsAppCount: 0,
        pendingPreparationCount: 0,
        unprintedOrdersCount: 0,
        overdueOrdersCount: 0,
        pendingClientsCount: 0,
        dispatchedOrdersCount: 0,
        deliveredOrdersCount: 0,
    };
    const periodMetrics = data?.periodMetrics ?? {
        current_order_amount: 0,
        previous_order_amount: 0,
        current_order_count: 0,
        previous_order_count: 0,
        current_client_count: 0,
    };
    const updatedAt = new Intl.DateTimeFormat("es-AR", {
        dateStyle: "short",
        timeStyle: "short",
        timeZone: "America/Argentina/Buenos_Aires",
    }).format(new Date());

    return (
        <PageContainer gap="lg">
            <PageHeader
                title="Centro de operaciones"
                description="Prioridades de pedidos, clientes y actividad comercial."
            />

            <DashboardStats workload={workload} periodMetrics={periodMetrics} periodDays={periodDays} updatedAt={updatedAt} />

            <OrdersKanbanBoard
                orders={data?.boardOrders ?? {
                    whatsapp: [],
                    preparation: [],
                    labels: [],
                    ready: [],
                    dispatched: [],
                    delivered: [],
                }}
                workload={workload}
                showAmounts
            />

            <div className="grid gap-6 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 items-start">
                <div className="space-y-6 xl:col-span-2">
                    <details className="group">
                        <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-xl border border-border/70 bg-card/60 px-4 py-3 font-semibold transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                            <span>Acciones por lote y pedidos recientes</span>
                            <span className="text-xs font-medium text-muted-foreground">
                                {pendingOrders.length} recientes · {workload.pendingOrdersCount} pendientes
                            </span>
                        </summary>
                        <GlassCard className="mt-3 border-t-primary/20">
                            <GlassCardHeader className="pb-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="grid gap-1.5">
                                        <GlassCardTitle>Herramientas de operación</GlassCardTitle>
                                        <GlassCardDescription>
                                            Selección múltiple, órdenes de preparación y despacho por lote.
                                        </GlassCardDescription>
                                    </div>
                                    {workload.pendingOrdersCount > pendingOrders.length && (
                                        <Button asChild variant="outline" size="sm">
                                            <Link href="/admin/orders?status=armado">Ver todos</Link>
                                        </Button>
                                    )}
                                </div>
                            </GlassCardHeader>
                            <GlassCardContent className="px-3 pb-6 sm:px-6">
                                <RecentOrders orders={pendingOrders} />
                            </GlassCardContent>
                        </GlassCard>
                    </details>
                </div>
                <div className="space-y-6">
                    <GlassCard className="border-t-primary/20">
                        <GlassCardHeader className="pb-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="grid gap-1.5">
                                    <GlassCardTitle>Clientes por activar</GlassCardTitle>
                                    <GlassCardDescription>
                                        {workload.pendingClientsCount} {workload.pendingClientsCount === 1 ? "cliente espera" : "clientes esperan"} asignación de convenio.
                                    </GlassCardDescription>
                                </div>
                                {workload.pendingClientsCount > pendingClients.length && (
                                    <Button asChild variant="outline" size="sm">
                                        <Link href="/admin/clients?status=pending_agreement">Ver todos</Link>
                                    </Button>
                                )}
                            </div>
                        </GlassCardHeader>
                        <GlassCardContent className="px-3 sm:px-6 pb-6">
                            <PendingClients clients={pendingClients} />
                        </GlassCardContent>
                    </GlassCard>
                </div>
            </div>
        </PageContainer>
    );
}
