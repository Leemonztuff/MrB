'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronDown, Clock, Package, RefreshCw, ShoppingCart } from 'lucide-react';
import { PortalPageHeader } from '@/components/shared/portal-page-header';
import { PortalListSkeleton } from '@/components/shared/portal-skeleton';
import { PortalEmptyState } from '@/components/shared/portal-empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/formatters';

interface OrderItem {
    id: string;
    quantity: number;
    price_per_unit: number;
    product_id?: string;
    products?: {
        name: string;
        category: string | null;
        image_url: string | null;
    } | null;
}

interface Order {
    id: string;
    created_at: string;
    total_amount: number;
    status: 'armado' | 'transito' | 'entregado';
    notes: string | null;
    order_items: OrderItem[];
}

interface OrdersData {
    orders: Order[];
    agreementId: string | null;
}

const statusConfig: Record<string, { label: string; color: string; dotColor: string }> = {
    armado: { label: 'En Armado', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', dotColor: 'bg-yellow-500' },
    transito: { label: 'En Transito', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', dotColor: 'bg-blue-500' },
    entregado: { label: 'Entregado', color: 'bg-green-500/10 text-green-500 border-green-500/20', dotColor: 'bg-green-500' },
};

export default function PortalOrdersPage() {
    const router = useRouter();
    const [ordersData, setOrdersData] = useState<OrdersData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        try {
            const response = await fetch('/api/portal/orders');
            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(data?.error || 'No se pudieron cargar los pedidos.');
            }

            setOrdersData(data);
            setError(null);
        } catch (loadError) {
            console.error('Error loading orders:', loadError);
            setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los pedidos.');
        } finally {
            setIsLoading(false);
        }
    }

    function repeatOrder(e: React.MouseEvent, order: Order) {
        e.stopPropagation();
        if (!ordersData?.agreementId) return;
        router.push(`/portal/catalogo?repeat_order=${order.id}`);
    }

    const orders = ordersData?.orders || [];

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <PortalPageHeader
                icon={Package}
                title="Mis Pedidos"
                description="Historial y seguimiento"
            />

            {isLoading ? (
                <PortalListSkeleton items={3} />
            ) : error ? (
                <PortalEmptyState
                    icon={Package}
                    title="No pudimos cargar tus pedidos"
                    description={error}
                />
            ) : orders.length === 0 ? (
                <PortalEmptyState
                    icon={Package}
                    title="Sin pedidos todavia"
                    description="Cuando realices tu primer pedido, aparecera aca con todo su detalle."
                />
            ) : (
                <div className="space-y-3">
                    {orders.map((order, idx) => {
                        const expanded = expandedId === order.id;
                        const status = statusConfig[order.status] || statusConfig.armado;

                        return (
                            <div
                                key={order.id}
                                className={cn(
                                    'glass-card overflow-hidden transition-all fade-in-up',
                                    `animation-delay-${Math.min((idx + 1) * 100, 500)}`
                                )}
                                style={{ animationFillMode: 'both' }}
                            >
                                <button
                                    type="button"
                                    onClick={() => setExpandedId(expanded ? null : order.id)}
                                    className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: es })}
                                            </p>
                                        </div>
                                        <div className="flex items-baseline gap-3">
                                            <p className="text-lg font-black italic tracking-tight text-foreground">
                                                {formatCurrency(order.total_amount)}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge variant="outline" className={cn('text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border', status.color)}>
                                            <span className={cn('w-1.5 h-1.5 rounded-full mr-1.5 inline-block', status.dotColor)} />
                                            {status.label}
                                        </Badge>

                                        {ordersData?.agreementId && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 rounded-lg text-primary hover:bg-primary/10 hover:text-primary transition-all"
                                                onClick={(e) => repeatOrder(e, order)}
                                                title="Repetir Pedido"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        )}

                                        <ChevronDown
                                            className={cn(
                                                'h-4 w-4 text-muted-foreground transition-transform duration-200',
                                                expanded && 'rotate-180'
                                            )}
                                        />
                                    </div>
                                </button>

                                {expanded && (
                                    <div className="px-4 pb-4 pt-0 border-t border-border/30 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="pt-4 space-y-3">
                                            {order.order_items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                                                    <div className="h-10 w-10 rounded-lg border border-white/10 overflow-hidden bg-black/20 shrink-0">
                                                        {item.products?.image_url ? (
                                                            <img
                                                                src={item.products.image_url}
                                                                alt={item.products.name}
                                                                className="h-full w-full object-cover transition-opacity duration-200"
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center">
                                                                <ShoppingCart className="h-3 w-3 opacity-20" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-black italic tracking-tight truncate uppercase">
                                                            {item.products?.name || 'Producto'}
                                                        </p>
                                                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                                                            {item.quantity} x {formatCurrency(item.price_per_unit)}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm font-black italic text-foreground shrink-0">
                                                        {formatCurrency(item.price_per_unit * item.quantity)}
                                                    </p>
                                                </div>
                                            ))}

                                            {order.notes && (
                                                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-0.5">Notas</p>
                                                    <p className="text-xs italic text-muted-foreground">"{order.notes}"</p>
                                                </div>
                                            )}

                                            {ordersData?.agreementId && (
                                                <Button
                                                    onClick={(e) => repeatOrder(e, order)}
                                                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 rounded-xl group/btn transition-all"
                                                >
                                                    <RefreshCw className="h-4 w-4 mr-2 group-hover/btn:rotate-180 transition-transform duration-500" />
                                                    Repetir este Pedido
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
