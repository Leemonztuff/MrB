

import { getDashboardData } from "@/app/admin/actions/dashboard.actions";
import { PageHeader } from "@/components/shared/page-header";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { DashboardStats } from "./_components/dashboard-stats";
import { RecentOrders } from "./_components/recent-orders";
import { PendingClients } from "./_components/pending-clients";
import type { DashboardStats as Stats } from "@/types";

export default async function AdminDashboardPage() {
    const { stats, pendingOrders, pendingClients } = await getDashboardData();

    return (
        <div className="grid flex-1 items-start gap-6 md:gap-10 pb-10">
            <PageHeader
                title="Dashboard"
                description="Un resumen de la actividad de tu negocio."
            />

            <DashboardStats stats={stats as Stats} />

            <div className="grid gap-6 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 items-start">
                <div className="xl:col-span-2 space-y-6">
                    <Card className="glass border-white/5 border-t-primary/20 overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-black italic tracking-tighter">Pedidos Recientes</CardTitle>
                            <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
                                Pendientes de despacho y carga
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-2 sm:px-6 pb-6">
                            <RecentOrders orders={pendingOrders} />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card className="glass border-white/5 border-t-primary/20 overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-xl font-black italic tracking-tighter">Clientes Pendientes</CardTitle>
                            <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-60">
                                Esperando asignación de convenio
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-2 sm:px-6 pb-6">
                            <PendingClients clients={pendingClients} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
