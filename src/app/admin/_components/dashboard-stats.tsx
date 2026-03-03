
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
            {/* Total Revenue */}
            <Card className="glass border-white/5 bg-white/[0.02] group hover:border-primary/30 transition-all duration-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                        Ingresos Totales
                    </CardTitle>
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black font-headline tracking-tighter">
                        {formatCurrency(stats.total_revenue)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-primary/60 font-bold uppercase tracking-widest">
                        Histórico Acumulado
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Sales */}
            <Card className="glass border-white/5 bg-white/[0.02] group hover:border-primary/20 transition-all duration-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                        Ventas (Mes)
                    </CardTitle>
                    <div className="p-2 bg-secondary rounded-lg">
                        <Package className="h-4 w-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black font-headline tracking-tighter">
                        {formatCurrency(stats.month_revenue)}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase mt-2 font-bold tracking-widest opacity-60">Mes en curso</p>
                </CardContent>
            </Card>

            {/* VIP Clients */}
            <Card className="glass border-white/5 bg-white/[0.02] group hover:border-primary/20 transition-all duration-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                        Clientes VIP
                    </CardTitle>
                    <div className="p-2 bg-secondary rounded-lg">
                        <Users className="h-4 w-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black font-headline tracking-tighter">
                        +{stats.active_clients}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase mt-2 font-bold tracking-widest opacity-60">Activos con convenio</p>
                </CardContent>
            </Card>

            {/* Overdue Orders */}
            <Card className={cn(
                "glass bg-white/[0.02] group transition-all duration-500",
                stats.overdue_orders_count > 0
                    ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50"
                    : "border-white/5 hover:border-primary/20"
            )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                        Demorados
                    </CardTitle>
                    <div className={cn(
                        "p-2 rounded-lg",
                        stats.overdue_orders_count > 0 ? "bg-destructive/10" : "bg-secondary"
                    )}>
                        <AlertCircle className={cn(
                            "h-4 w-4",
                            stats.overdue_orders_count > 0 ? "text-destructive" : "text-primary"
                        )} />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className={cn(
                        "text-3xl font-black font-headline tracking-tighter",
                        stats.overdue_orders_count > 0 && "text-destructive"
                    )}>
                        {stats.overdue_orders_count}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase mt-2 font-bold tracking-widest opacity-60">Pedidos &gt;48hs</p>
                </CardContent>
            </Card>
        </div>
    );
}
