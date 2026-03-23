
"use client";

import { BarChart3, ShoppingCart, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ClientStats } from "@/types";

interface ClientSummaryTabProps {
  stats: ClientStats | null;
  lastOrderDate: string | null;
  clientStatus: string;
}

export function ClientSummaryTab({ stats, lastOrderDate, clientStatus }: ClientSummaryTabProps) {
  const statCards = [
    {
      title: "Pedidos Totales",
      value: stats?.total_orders ?? 0,
      icon: ShoppingCart,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Total Gastado",
      value: stats?.total_spent ? `$${stats.total_spent.toLocaleString()}` : "$0",
      icon: TrendingUp,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Último Pedido",
      value: lastOrderDate || "Sin pedidos",
      icon: Clock,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className="glass border-white/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle className="text-lg">Estado del Cliente</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge 
            variant={clientStatus === 'active' ? 'default' : 'secondary'}
            className="text-sm px-3 py-1"
          >
            {clientStatus === 'active' ? 'Activo' : 
             clientStatus === 'pending_onboarding' ? 'Pendiente de Alta' : 
             clientStatus === 'pending_agreement' ? 'Pendiente de Convenio' : 'Archivado'}
          </Badge>
        </CardContent>
      </Card>
    </div>
  );
}
