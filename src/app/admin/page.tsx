

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
        <div className="grid flex-1 items-start gap-4 md:gap-8">
            <PageHeader
                title="Dashboard"
                description="Un resumen de la actividad de tu negocio."
            />
            
            <DashboardStats stats={stats as Stats} />

            <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <div className="xl:col-span-2 space-y-4">
                  <Card>
                      <CardHeader>
                          <CardTitle>Pedidos Recientes</CardTitle>
                          <CardDescription>
                              Pedidos pendientes de cargar en el sistema de gestión.
                          </CardDescription>
                      </CardHeader>
                      <CardContent>
                          <RecentOrders orders={pendingOrders} />
                      </CardContent>
                  </Card>
                </div>
                <div className="space-y-4">
                  <Card>
                      <CardHeader>
                          <CardTitle>Clientes Pendientes</CardTitle>
                          <CardDescription>
                              Clientes que completaron el alta y esperan un convenio.
                          </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <PendingClients clients={pendingClients} />
                      </CardContent>
                  </Card>
                </div>
            </div>
        </div>
    );
}
