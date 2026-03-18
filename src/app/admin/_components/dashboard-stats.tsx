'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Package, Truck, CheckCircle, Users, Clock, TrendingUp, Package2, ChevronDown } from 'lucide-react';
import { getDashboardMetrics } from '@/app/admin/actions/dashboard.actions';
import { cn } from '@/lib/utils';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
}

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

function StatCard({ label, value, icon: Icon, variant = 'default' }: { label: string; value: string | number; icon: any; variant?: 'default' | 'warning' | 'success' }) {
    return (
        <div className={cn(
            "flex items-center gap-3 p-3 rounded-xl border bg-white/5",
            variant === 'warning' && "border-yellow-500/20 bg-yellow-500/5",
            variant === 'success' && "border-green-500/20 bg-green-500/5"
        )}>
            <div className={cn(
                "p-2 rounded-lg",
                variant === 'warning' ? "bg-yellow-500/10" : 
                variant === 'success' ? "bg-green-500/10" : 
                "bg-primary/10"
            )}>
                <Icon className={cn(
                    "h-4 w-4",
                    variant === 'warning' ? "text-yellow-500" :
                    variant === 'success' ? "text-green-500" :
                    "text-primary"
                )} />
            </div>
            <div>
                <p className="text-xl font-black tracking-tight">{value}</p>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{label}</p>
            </div>
        </div>
    );
}

function MetricSkeleton() {
    return (
        <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
                <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
                <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
            </div>
            <div className="h-16 bg-white/5 rounded-xl animate-pulse" />
        </div>
    );
}

export function DashboardStats() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [openSections, setOpenSections] = useState<string[]>(['orders']);

    useEffect(() => {
        async function loadMetrics() {
            try {
                const data = await getDashboardMetrics();
                setMetrics(data);
            } catch (error) {
                console.error('Error loading metrics:', error);
            } finally {
                setLoading(false);
            }
        }
        loadMetrics();
    }, []);

    const toggleSection = (section: string) => {
        setOpenSections(prev => 
            prev.includes(section) 
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    return (
        <Card className="glass border-border/50">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground/80">
                    Estadísticas
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {loading ? (
                    <MetricSkeleton />
                ) : metrics ? (
                    <Accordion type="multiple" defaultValue={['orders']} className="w-full">
                        {/* Pedidos */}
                        <AccordionItem value="orders" className="border-none">
                            <button
                                onClick={() => toggleSection('orders')}
                                className="flex items-center justify-between w-full py-2 px-1 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-black uppercase tracking-widest">Pedidos</span>
                                </div>
                                <ChevronDown className={cn(
                                    "h-4 w-4 text-muted-foreground transition-transform",
                                    openSections.includes('orders') && "rotate-180"
                                )} />
                            </button>
                            {openSections.includes('orders') && (
                                <AccordionContent className="pt-2 pb-0">
                                    <div className="grid grid-cols-2 gap-2">
                                        <StatCard 
                                            label="Pendientes" 
                                            value={metrics.orders.pending} 
                                            icon={Clock}
                                            variant={metrics.orders.pending > 0 ? 'warning' : 'default'}
                                        />
                                        <StatCard 
                                            label="En Tránsito" 
                                            value={metrics.orders.in_transit} 
                                            icon={Truck}
                                        />
                                        <StatCard 
                                            label="Entregados" 
                                            value={metrics.orders.delivered} 
                                            icon={CheckCircle}
                                            variant="success"
                                        />
                                        <StatCard 
                                            label="Unidades Totales" 
                                            value={metrics.orders.total_units.toLocaleString('es-AR')} 
                                            icon={Package2}
                                        />
                                    </div>
                                    <div className="mt-2">
                                        <StatCard 
                                            label="Promedio por Pedido" 
                                            value={formatCurrency(metrics.orders.average_order_value)} 
                                            icon={TrendingUp}
                                        />
                                    </div>
                                </AccordionContent>
                            )}
                        </AccordionItem>

                        {/* Clientes */}
                        <AccordionItem value="clients" className="border-none">
                            <button
                                onClick={() => toggleSection('clients')}
                                className="flex items-center justify-between w-full py-2 px-1 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-black uppercase tracking-widest">Clientes</span>
                                </div>
                                <ChevronDown className={cn(
                                    "h-4 w-4 text-muted-foreground transition-transform",
                                    openSections.includes('clients') && "rotate-180"
                                )} />
                            </button>
                            {openSections.includes('clients') && (
                                <AccordionContent className="pt-2 pb-0">
                                    <div className="grid grid-cols-2 gap-2">
                                        <StatCard 
                                            label="Activos" 
                                            value={metrics.clients.active} 
                                            icon={Users}
                                            variant="success"
                                        />
                                        <StatCard 
                                            label="Pendientes" 
                                            value={metrics.clients.pending} 
                                            icon={Clock}
                                            variant={metrics.clients.pending > 0 ? 'warning' : 'default'}
                                        />
                                    </div>
                                    <div className="mt-2">
                                        <StatCard 
                                            label="Nuevos Este Mes" 
                                            value={metrics.clients.new_this_month} 
                                            icon={TrendingUp}
                                        />
                                    </div>
                                </AccordionContent>
                            )}
                        </AccordionItem>

                        {/* Top Productos */}
                        <AccordionItem value="products" className="border-none">
                            <button
                                onClick={() => toggleSection('products')}
                                className="flex items-center justify-between w-full py-2 px-1 hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-black uppercase tracking-widest">Top 5 Productos</span>
                                </div>
                                <ChevronDown className={cn(
                                    "h-4 w-4 text-muted-foreground transition-transform",
                                    openSections.includes('products') && "rotate-180"
                                )} />
                            </button>
                            {openSections.includes('products') && (
                                <AccordionContent className="pt-2 pb-0">
                                    {metrics.top_products.length > 0 ? (
                                        <div className="space-y-1.5">
                                            {metrics.top_products.map((product, idx) => (
                                                <div 
                                                    key={product.name}
                                                    className="flex items-center justify-between p-2 rounded-lg bg-white/5"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-primary/60 w-4">
                                                            #{idx + 1}
                                                        </span>
                                                        <span className="text-xs font-medium truncate max-w-[180px]">
                                                            {product.name}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs font-black text-primary">
                                                        {product.total_quantity} u.
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center py-4">
                                            Sin datos aún
                                        </p>
                                    )}
                                </AccordionContent>
                            )}
                        </AccordionItem>
                    </Accordion>
                ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                        Error al cargar estadísticas
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
