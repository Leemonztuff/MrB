

import { getDashboardData } from "@/app/admin/actions/dashboard.actions";
import { PageHeader } from "@/components/shared/page-header";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/shared/glass-card";
import { PageContainer } from "@/components/shared/page-container";
import { DashboardStats } from "./_components/dashboard-stats";
import { RecentOrders } from "./_components/recent-orders";
import { PendingClients } from "./_components/pending-clients";
import type { DashboardStats as Stats } from "@/types";

export default async function AdminDashboardPage() {
    const { stats, pendingOrders, pendingClients } = await getDashboardData();

    return (
        <PageContainer gap="lg">
            <PageHeader
                title="Dashboard"
                description="Un resumen de la actividad de tu negocio."
            />

            <DashboardStats stats={stats as Stats} />

            <div className="grid gap-6 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 items-start">
                <div className="xl:col-span-2 space-y-6">
                    <GlassCard className="border-t-primary/20">
                        <GlassCardHeader className="pb-4">
                            <GlassCardTitle>Pedidos Recientes</GlassCardTitle>
                            <GlassCardDescription>
                                Pendientes de despacho y carga
                            </GlassCardDescription>
                        </GlassCardHeader>
                        <GlassCardContent className="px-3 sm:px-6 pb-6">
                            <RecentOrders orders={pendingOrders} />
                        </GlassCardContent>
                    </GlassCard>
                </div>
                <div className="space-y-6">
                    <GlassCard className="border-t-primary/20">
                        <GlassCardHeader className="pb-4">
                            <GlassCardTitle>Clientes Pendientes</GlassCardTitle>
                            <GlassCardDescription>
                                Esperando asignación de convenio
                            </GlassCardDescription>
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
