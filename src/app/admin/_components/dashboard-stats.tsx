'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem } from '@/components/ui/accordion';
import { CheckCircle, ChevronDown, Clock, Package, Package2, TrendingUp, Truck, Users } from 'lucide-react';
import { getDashboardMetrics } from '@/app/admin/actions/dashboard.actions';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);

interface DashboardMetrics {
    orders: {
        pending: number;
        in_transit: number;
        delivered: number;
        total_units: number;
        average_order_value: number;
    };
    clients: {
        active: number;
        pending: number;
        new_this_month: number;
    };
    top_products: {
        name: string;
        total_quantity: number;
    }[];
}

function StatCard({
    label,
    value,
    icon: Icon,
    variant = 'default',
}: {
    label: string;
    value: string | number;
    icon: any;
    variant?: 'default' | 'warning' | 'success';
}) {
    return (
        <div
            className={cn(
                'flex items-center gap-3 rounded-xl border bg-white/5 p-3 sm:p-4',
                variant === 'warning' && 'border-yellow-500/20 bg-yellow-500/5',
                variant === 'success' && 'border-green-500/20 bg-green-500/5'
            )}
        >
            <div
                className={cn(
                    'rounded-lg p-2 shrink-0',
                    variant === 'warning' ? 'bg-yellow-500/10' : variant === 'success' ? 'bg-green-500/10' : 'bg-primary/10'
                )}
            >
                <Icon
                    className={cn(
                        'h-4 w-4',
                        variant === 'warning' ? 'text-yellow-500' : variant === 'success' ? 'text-green-500' : 'text-primary'
                    )}
                />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-lg sm:text-xl font-black tracking-tight truncate">{value}</p>
                <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">{label}</p>
            </div>
        </div>
    );
}

function MetricSkeleton() {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <div className="h-16 animate-pulse rounded-xl bg-white/5" />
                <div className="h-16 animate-pulse rounded-xl bg-white/5" />
            </div>
            <div className="h-16 animate-pulse rounded-xl bg-white/5" />
        </div>
    );
}

export function DashboardStats() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [openSections, setOpenSections] = useState<string[]>(['orders']);

    const loadMetrics = async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        try {
            const data = await getDashboardMetrics();
            setMetrics(data);
            setLoadError(null);
        } catch (error) {
            console.error('Error loading metrics:', error);
            setLoadError('No se pudieron cargar las estadísticas.');
        } finally {
            if (isRefresh) {
                setRefreshing(false);
            } else {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        loadMetrics();
    }, []);

    const toggleSection = (section: string) => {
        setOpenSections((previous) =>
            previous.includes(section) ? previous.filter((item) => item !== section) : [...previous, section]
        );
    };

    return (
        <Card className="glass border-border/50">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">
                        Estadísticas
                    </CardTitle>
                    <button
                        type="button"
                        onClick={() => loadMetrics(true)}
                        disabled={loading || refreshing}
                        className="rounded-md border border-white/10 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {refreshing ? 'Actualizando...' : 'Actualizar'}
                    </button>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                {loading ? (
                    <MetricSkeleton />
                ) : loadError ? (
                    <div className="space-y-3 py-4 text-center">
                        <p className="text-xs text-destructive">{loadError}</p>
                        <button
                            type="button"
                            onClick={() => loadMetrics()}
                            className="rounded-md border border-destructive/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-destructive transition-colors hover:bg-destructive/10"
                        >
                            Reintentar
                        </button>
                    </div>
                ) : metrics ? (
                    <Accordion
                        type="multiple"
                        value={openSections}
                        onValueChange={setOpenSections}
                        className="w-full"
                    >
                        <AccordionItem value="orders" className="border-none">
                            <button
                                onClick={() => toggleSection('orders')}
                                className="flex w-full items-center justify-between rounded-lg px-1 py-2 transition-colors hover:bg-white/5"
                            >
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-black uppercase tracking-widest">Pedidos</span>
                                </div>
                                <ChevronDown
                                    className={cn(
                                        'h-4 w-4 text-muted-foreground transition-transform',
                                        openSections.includes('orders') && 'rotate-180'
                                    )}
                                />
                            </button>
                            {openSections.includes('orders') ? (
                                <AccordionContent className="pb-0 pt-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <StatCard label="Pendientes" value={metrics.orders.pending} icon={Clock} variant={metrics.orders.pending > 0 ? 'warning' : 'default'} />
                                        <StatCard label="En Transito" value={metrics.orders.in_transit} icon={Truck} />
                                        <StatCard label="Entregados" value={metrics.orders.delivered} icon={CheckCircle} variant="success" />
                                        <StatCard label="Unidades Totales" value={metrics.orders.total_units.toLocaleString('es-AR')} icon={Package2} />
                                    </div>
                                    <div className="mt-2">
                                        <StatCard label="Promedio por Pedido" value={formatCurrency(metrics.orders.average_order_value)} icon={TrendingUp} />
                                    </div>
                                </AccordionContent>
                            ) : null}
                        </AccordionItem>

                        <AccordionItem value="clients" className="border-none">
                            <button
                                onClick={() => toggleSection('clients')}
                                className="flex w-full items-center justify-between rounded-lg px-1 py-2 transition-colors hover:bg-white/5"
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-black uppercase tracking-widest">Clientes</span>
                                </div>
                                <ChevronDown
                                    className={cn(
                                        'h-4 w-4 text-muted-foreground transition-transform',
                                        openSections.includes('clients') && 'rotate-180'
                                    )}
                                />
                            </button>
                            {openSections.includes('clients') ? (
                                <AccordionContent className="pb-0 pt-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <StatCard label="Activos" value={metrics.clients.active} icon={Users} variant="success" />
                                        <StatCard label="Pendientes" value={metrics.clients.pending} icon={Clock} variant={metrics.clients.pending > 0 ? 'warning' : 'default'} />
                                    </div>
                                    <div className="mt-2">
                                        <StatCard label="Nuevos Este Mes" value={metrics.clients.new_this_month} icon={TrendingUp} />
                                    </div>
                                </AccordionContent>
                            ) : null}
                        </AccordionItem>

                        <AccordionItem value="products" className="border-none">
                            <button
                                onClick={() => toggleSection('products')}
                                className="flex w-full items-center justify-between rounded-lg px-1 py-2 transition-colors hover:bg-white/5"
                            >
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-black uppercase tracking-widest">Top 5 Productos</span>
                                </div>
                                <ChevronDown
                                    className={cn(
                                        'h-4 w-4 text-muted-foreground transition-transform',
                                        openSections.includes('products') && 'rotate-180'
                                    )}
                                />
                            </button>
                            {openSections.includes('products') ? (
                                <AccordionContent className="pb-0 pt-2">
                                    {metrics.top_products.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {metrics.top_products.map((product, index) => (
                                                <div key={`${product.name}-${index}`} className="flex items-center justify-between rounded-lg bg-white/5 p-2">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-4 text-[10px] font-black text-primary/60">#{index + 1}</span>
                                                        <span className="max-w-[180px] truncate text-xs font-medium">{product.name}</span>
                                                    </div>
                                                    <span className="text-xs font-black text-primary">{product.total_quantity} u.</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="py-4 text-center text-xs text-muted-foreground">Sin datos aun</p>
                                    )}
                                </AccordionContent>
                            ) : null}
                        </AccordionItem>
                    </Accordion>
                ) : (
                    <p className="py-4 text-center text-xs text-muted-foreground">Error al cargar estadísticas</p>
                )}
            </CardContent>
        </Card>
    );
}
