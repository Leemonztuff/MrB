
"use client";

import type { DashboardStats as StatsType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, Package, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
}

export function DashboardStats({ stats }: { stats: StatsType }) {
    return (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <Card className="glass overflow-hidden border-primary/10">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                        Ingresos Totales
                    </CardTitle>
                    <div className="p-2 bg-primary/10 rounded-full">
                        <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold font-headline">{formatCurrency(stats.total_revenue)}</div>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-primary/80 uppercase font-bold">
                        <TrendingUp className="h-3 w-3" />
                        Histórico Acumulado
                    </div>
                </CardContent>
            </Card>

            <Card className="glass border-white/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                        Ventas (Mes)
                    </CardTitle>
                    <div className="p-2 bg-secondary rounded-full">
                        <Package className="h-4 w-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold font-headline">{formatCurrency(stats.month_revenue)}</div>
                    <p className="text-[10px] text-muted-foreground uppercase mt-1 font-bold">Mes en curso</p>
                </CardContent>
            </Card>

            <Card className="glass border-white/5">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                        Clientes VIP
                    </CardTitle>
                    <div className="p-2 bg-secondary rounded-full">
                        <Users className="h-4 w-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold font-headline">+{stats.active_clients}</div>
                    <p className="text-[10px] text-muted-foreground uppercase mt-1 font-bold">Activos con convenio</p>
                </CardContent>
            </Card>

            <Card className={cn(
                "glass border-white/5",
                stats.overdue_orders_count > 0 && "border-destructive/30 bg-destructive/5"
            )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                        Demorados
                    </CardTitle>
                    <div className={cn(
                        "p-2 rounded-full",
                        stats.overdue_orders_count > 0 ? "bg-destructive/20" : "bg-secondary"
                    )}>
                        <AlertCircle className={cn(
                            "h-4 w-4",
                            stats.overdue_orders_count > 0 ? "text-destructive" : "text-muted-foreground"
                        )} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className={cn(
                        "text-3xl font-bold font-headline",
                        stats.overdue_orders_count > 0 && "text-destructive"
                    )}>
                        {stats.overdue_orders_count}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase mt-1 font-bold">Pedidos &gt;48hs</p>
                </CardContent>
            </Card>
        </div>
    );
}
