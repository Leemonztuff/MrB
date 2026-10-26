"use client";

import Link from "next/link";
import type { DashboardPeriodMetrics } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, ArrowRight, Clock3, MessageCircle, Package, PackageCheck, Printer, RefreshCw, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type WorkloadMetrics = {
    pendingOrdersCount: number;
    pendingWhatsAppCount: number;
    pendingPreparationCount: number;
    unprintedOrdersCount: number;
    overdueOrdersCount: number;
    pendingClientsCount: number;
}

type OperationalTone = "neutral" | "blue" | "violet" | "amber" | "red" | "teal";

const operationalToneStyles: Record<OperationalTone, { active: string; idle: string }> = {
    neutral: {
        active: "border-border bg-card",
        idle: "border-border/60 bg-card/50",
    },
    blue: {
        active: "border-sky-500/40 bg-sky-500/5",
        idle: "border-sky-500/20 bg-sky-500/[0.02]",
    },
    violet: {
        active: "border-violet-500/40 bg-violet-500/5",
        idle: "border-violet-500/20 bg-violet-500/[0.02]",
    },
    amber: {
        active: "border-amber-500/40 bg-amber-500/5",
        idle: "border-amber-500/20 bg-amber-500/[0.02]",
    },
    red: {
        active: "border-red-500/40 bg-red-500/5",
        idle: "border-red-500/20 bg-red-500/[0.02]",
    },
    teal: {
        active: "border-teal-500/40 bg-teal-500/5",
        idle: "border-teal-500/20 bg-teal-500/[0.02]",
    },
};

const operationalIconStyles: Record<OperationalTone, string> = {
    neutral: "text-muted-foreground",
    blue: "text-sky-700 dark:text-sky-300",
    violet: "text-violet-700 dark:text-violet-300",
    amber: "text-amber-700 dark:text-amber-300",
    red: "text-red-700 dark:text-red-300",
    teal: "text-teal-700 dark:text-teal-300",
};

const formatComparison = (current: number, previous: number) => {
    if (previous === 0) {
        return current === 0 ? "Sin actividad en ambos períodos" : "Sin actividad en el período anterior";
    }

    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? "+" : ""}${change.toLocaleString("es-AR", { maximumFractionDigits: 1 })}% respecto al período anterior`;
};

export function DashboardStats({
    workload,
    periodMetrics,
    periodDays,
    updatedAt,
}: {
    workload: WorkloadMetrics;
    periodMetrics: DashboardPeriodMetrics;
    periodDays: 7 | 30 | 90;
    updatedAt: string;
}) {
    const router = useRouter();
    const [isRefreshing, startRefresh] = useTransition();
    const operationalCards = [
        {
            title: "Pedidos pendientes",
            value: workload.pendingOrdersCount,
            description: "Por preparar o despachar",
            href: "/admin/orders?status=armado",
            icon: Package,
            tone: "neutral" as const,
        },
        {
            title: "Recepción por confirmar",
            value: workload.pendingWhatsAppCount,
            description: "Mensajes de pedido aún no verificados",
            href: "/admin/orders?status=armado&workflow=whatsapp",
            icon: MessageCircle,
            tone: "blue" as const,
        },
        {
            title: "Pedidos por preparar",
            value: workload.pendingPreparationCount,
            description: "Recepción confirmada; falta preparar",
            href: "/admin/orders?status=armado&workflow=preparation",
            icon: PackageCheck,
            tone: "violet" as const,
        },
        {
            title: "Rótulos por confirmar",
            value: workload.unprintedOrdersCount,
            description: "Pedidos preparados sin rótulo confirmado",
            href: "/admin/orders?status=armado&labels=pending",
            icon: Printer,
            tone: "amber" as const,
        },
        {
            title: "Pedidos demorados",
            value: workload.overdueOrdersCount,
            description: "Pendientes hace más de 48 horas",
            href: "/admin/orders?status=armado&overdue=true",
            icon: Clock3,
            tone: "red" as const,
        },
        {
            title: "Clientes pendientes",
            value: workload.pendingClientsCount,
            description: "Esperan asignación de convenio",
            href: "/admin/clients?status=pending_agreement",
            icon: Users,
            tone: "teal" as const,
        },
    ];

    const amountChange = periodMetrics.previous_order_amount > 0
        ? ((periodMetrics.current_order_amount - periodMetrics.previous_order_amount) / periodMetrics.previous_order_amount) * 100
        : null;
    const currentAverage = periodMetrics.current_order_count > 0
        ? periodMetrics.current_order_amount / periodMetrics.current_order_count
        : 0;

    return (
        <div className="grid gap-6">
            <section aria-labelledby="operational-overview-title" className="grid gap-3">
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <div>
                        <h2 id="operational-overview-title" className="text-lg font-bold">Requiere atención</h2>
                        <p className="text-sm text-muted-foreground">Cada color identifica la tarea pendiente y abre su lista filtrada.</p>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isRefreshing}
                        onClick={() => startRefresh(() => router.refresh())}
                        className="gap-2"
                    >
                        <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                        {isRefreshing ? "Actualizando..." : "Actualizar"}
                    </Button>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
                    {operationalCards.map(({ title, value, description, href, icon: Icon, tone }) => (
                        <Link
                            key={title}
                            href={href}
                            className="group rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={`${title}: ${value}. ${description}`}
                        >
                            <Card className={cn(
                                "h-full glass transition-colors group-hover:brightness-105",
                                operationalToneStyles[tone][value > 0 ? "active" : "idle"]
                            )}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-xs font-semibold text-foreground">{title}</CardTitle>
                                    <Icon className={cn("h-4 w-4", operationalIconStyles[tone])} aria-hidden="true" />
                                </CardHeader>
                                <CardContent>
                                    <p className={cn("text-3xl font-black tabular-nums", value > 0 && operationalIconStyles[tone])}>{value}</p>
                                    <div className="mt-1 flex items-end justify-between gap-2">
                                        <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
                                        <ArrowRight className="mb-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden="true" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            <section aria-labelledby="commercial-overview-title" className="rounded-xl border border-border bg-card/60 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 id="commercial-overview-title" className="text-lg font-bold">Actividad comercial</h2>
                        <p className="text-sm text-muted-foreground">Importes de pedidos registrados; no representan pagos recibidos.</p>
                    </div>
                    <div aria-label="Período de actividad" className="flex rounded-lg bg-muted p-1">
                        {([7, 30, 90] as const).map(days => (
                            <Link
                                key={days}
                                href={`/admin?period=${days}`}
                                aria-current={periodDays === days ? "page" : undefined}
                                className={cn(
                                    "flex min-h-10 items-center rounded-md px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    periodDays === days
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {days} días
                            </Link>
                        ))}
                    </div>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                    Datos consultados: <time>{updatedAt}</time>
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric
                        label={`Importe · últimos ${periodDays} días`}
                        value={formatCurrency(periodMetrics.current_order_amount)}
                        comparison={formatComparison(periodMetrics.current_order_amount, periodMetrics.previous_order_amount)}
                        trend={amountChange}
                    />
                    <Metric
                        label="Pedidos registrados"
                        value={periodMetrics.current_order_count.toLocaleString("es-AR")}
                        comparison={`${periodMetrics.previous_order_count.toLocaleString("es-AR")} en los ${periodDays} días anteriores`}
                    />
                    <Metric
                        label="Promedio por pedido"
                        value={formatCurrency(currentAverage)}
                        comparison={periodMetrics.current_order_count > 0 ? "Importe del período dividido por pedidos" : "Sin pedidos en este período"}
                    />
                    <Metric
                        label="Clientes con pedidos"
                        value={periodMetrics.current_client_count.toLocaleString("es-AR")}
                        comparison={`Clientes únicos en los últimos ${periodDays} días`}
                    />
                </div>
            </section>
        </div>
    );
}

function Metric({
    label,
    value,
    comparison,
    trend,
}: {
    label: string;
    value: string;
    comparison: string;
    trend?: number | null;
}) {
    const TrendIcon = trend !== undefined && trend !== null && trend >= 0 ? ArrowUpRight : ArrowDownRight;

    return (
        <div className="min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">{label}</p>
            <p className="mt-1 break-words text-2xl font-black tracking-tight text-foreground">{value}</p>
            <p className="mt-1 flex items-start gap-1 text-xs leading-relaxed text-muted-foreground">
                {trend !== undefined && trend !== null && (
                    <TrendIcon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", trend >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive")} aria-hidden="true" />
                )}
                <span>{comparison}</span>
            </p>
        </div>
    );
}
