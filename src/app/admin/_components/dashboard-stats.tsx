
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
            <Card className="glass overflow-hidden border-primary/10 group hover:border-primary/30 transition-all duration-500">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                    <DollarSign className="h-24 w-24 -mr-8 -mt-8 rotate-12" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                        Ingresos Totales
                    </CardTitle>
                    <div className="p-2 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                        <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black font-headline tracking-tighter bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                        {formatCurrency(stats.total_revenue)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-primary font-black uppercase tracking-widest">
                        <div className="h-1 w-1 rounded-full bg-primary animate-pulse" />
                        Histórico Acumulado
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Sales */}
            <Card className="glass overflow-hidden border-white/5 group hover:border-primary/20 transition-all duration-500">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                    <Package className="h-24 w-24 -mr-8 -mt-8 rotate-12" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                        Ventas (Mes)
                    </CardTitle>
                    <div className="p-2 bg-secondary rounded-lg group-hover:scale-110 transition-transform">
                        <Package className="h-4 w-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black font-headline tracking-tighter">
                        {formatCurrency(stats.month_revenue)}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase mt-2 font-bold tracking-widest">Mes en curso</p>
                </CardContent>
            </Card>

            {/* VIP Clients */}
            <Card className="glass overflow-hidden border-white/5 group hover:border-primary/20 transition-all duration-500">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                    <Users className="h-24 w-24 -mr-8 -mt-8 rotate-12" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                        Clientes VIP
                    </CardTitle>
                    <div className="p-2 bg-secondary rounded-lg group-hover:scale-110 transition-transform">
                        <Users className="h-4 w-4 text-primary" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-black font-headline tracking-tighter">
                        +{stats.active_clients}
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase mt-2 font-bold tracking-widest">Activos con convenio</p>
                </CardContent>
            </Card>

            {/* Overdue Orders */}
            <Card className={cn(
                "glass overflow-hidden border-white/5 group transition-all duration-500",
                stats.overdue_orders_count > 0
                    ? "border-destructive/30 bg-destructive/5 hover:border-destructive/50"
                    : "hover:border-primary/20"
            )}>
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                    <AlertCircle className="h-24 w-24 -mr-8 -mt-8 rotate-12" />
                </div>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">
                        Demorados
                    </CardTitle>
                    <div className={cn(
                        "p-2 rounded-lg group-hover:scale-110 transition-transform",
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
                    <p className="text-[10px] text-muted-foreground uppercase mt-2 font-bold tracking-widest">Pedidos &gt;48hs</p>
                </CardContent>
            </Card>
        </div>
    );
}
