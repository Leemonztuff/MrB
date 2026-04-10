import { getDashboardData } from "@/app/admin/actions/dashboard.actions";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "./_components/dashboard-stats";
import { PendingClients } from "./_components/pending-clients";
import { RecentOrders } from "./_components/recent-orders";
import Link from "next/link";
import { ArrowRight, Package, Users, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage() {
    const { pendingOrders, pendingClients } = await getDashboardData();

    return (
        <div className="grid flex-1 items-start gap-6 pb-10 md:gap-10">
            <PageHeader title="Dashboard" description="Un resumen de la actividad de tu negocio." />

            <DashboardStats />

            <div className="grid items-start gap-6 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    <Card className="glass border-white/5 border-t-primary/20 overflow-hidden">
                        <CardHeader className="pb-4 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black italic tracking-tighter">Pedidos Recientes</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">
                                    Pendientes de despacho y carga
                                </CardDescription>
                            </div>
                            <Button asChild variant="ghost" size="sm" className="text-xs font-black uppercase tracking-widest gap-1 text-primary hover:text-primary hover:bg-primary/10">
                                <Link href="/admin/orders">
                                    Ver todos
                                    <ArrowRight className="h-3 w-3 ml-1" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="px-3 pb-6 sm:px-6">
                            <RecentOrders orders={pendingOrders} />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card className="glass border-white/5 border-t-primary/20 overflow-hidden">
                        <CardHeader className="pb-4 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black italic tracking-tighter">Clientes Pendientes</CardTitle>
                                <CardDescription className="text-xs font-bold uppercase tracking-widest opacity-60">
                                    Esperando asignacion de acuerdo comercial
                                </CardDescription>
                            </div>
                            {pendingClients.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-xs font-black text-yellow-500">
                                        <Clock className="h-3 w-3" />
                                        {pendingClients.length}
                                    </span>
                                </div>
                            )}
                        </CardHeader>
                        <CardContent className="px-3 pb-6 sm:px-6">
                            <PendingClients clients={pendingClients} />
                        </CardContent>
                    </Card>
                    
                    {/* Quick Stats Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <Link href="/admin/orders" className="group">
                            <Card className="glass border-white/5 hover:border-primary/30 transition-all cursor-pointer h-full">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Package className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black">{pendingOrders.length}</p>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Pedidos Pendientes</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                        <Link href="/admin/clients?status=pending" className="group">
                            <Card className="glass border-white/5 hover:border-yellow-500/30 transition-all cursor-pointer h-full">
                                <CardContent className="p-4 flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-yellow-500/10">
                                        <Users className="h-4 w-4 text-yellow-500" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-black">{pendingClients.length}</p>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Clientes Nuevos</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
