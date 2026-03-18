'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ShoppingCart, Package, ChevronDown, RefreshCw, Clock, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
    transito: { label: 'En Tránsito', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', dotColor: 'bg-blue-500' },
    entregado: { label: 'Entregado', color: 'bg-green-500/10 text-green-500 border-green-500/20', dotColor: 'bg-green-500' },
};

function OrderSkeleton() {
    return (
        <div className="glass-card p-4 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="space-y-2">
                    <div className="h-3 w-28 bg-muted/50 rounded" />
                    <div className="h-5 w-20 bg-muted/50 rounded" />
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-6 w-20 bg-muted/50 rounded-full" />
                    <div className="h-8 w-8 bg-muted/50 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export default function PortalOrdersPage() {
    const router = useRouter();
    const [ordersData, setOrdersData] = useState<OrdersData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        loadOrders();
    }, []);

    async function loadOrders() {
        try {
            const response = await fetch('/api/portal/orders');
            if (response.ok) {
                const data = await response.json();
                setOrdersData(data);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
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
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <Package className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                        Mis Pedidos
                    </h2>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                        Historial y seguimiento
                    </p>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="space-y-3">
                    <OrderSkeleton />
                    <OrderSkeleton />
                    <OrderSkeleton />
                </div>
            ) : orders.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                        <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-black italic text-lg tracking-tight uppercase mb-2">
                        Sin pedidos todavía
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Cuando realices tu primer pedido, aparecerá acá con todo su detalle.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {orders.map((order, idx) => {
                        const expanded = expandedId === order.id;
                        const status = statusConfig[order.status] || statusConfig.armado;

                        return (
                            <div
                                key={order.id}
                                className={cn(
                                    "glass-card overflow-hidden transition-all fade-in-up",
                                    `animation-delay-${Math.min((idx + 1) * 100, 500)}`
                                )}
                                style={{ animationFillMode: 'both' }}
                            >
                                {/* Summary Row */}
                                <button
                                    type="button"
                                    onClick={() => setExpandedId(expanded ? null : order.id)}
                                    className="w-full p-4 flex items-center gap-4 text-left hover:bg-white/5 transition-colors"
                                >
                                    {/* Date & Amount */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                {format(new Date(order.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
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

                                    {/* Status + Repeat + Chevron */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border", status.color)}>
                                            <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5 inline-block", status.dotColor)} />
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

                                        <ChevronDown className={cn(
                                            "h-4 w-4 text-muted-foreground transition-transform duration-200",
                                            expanded && "rotate-180"
                                        )} />
                                    </div>
                                </button>

                                {/* Expanded Detail */}
                                {expanded && (
                                    <div className="px-4 pb-4 pt-0 border-t border-border/30 animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="pt-4 space-y-3">
                                            {/* Product List */}
                                            {order.order_items.map((item) => (
                                                <div key={item.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                                                    <div className="h-10 w-10 rounded-lg border border-white/10 overflow-hidden bg-black/20 shrink-0">
                                                        {item.products?.image_url ? (
                                                            <img
                                                                src={item.products.image_url}
                                                                alt={item.products.name}
                                                                className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center">
                                                                <ShoppingCart className="h-3 w-3 opacity-20" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-black italic tracking-tight truncate uppercase">{item.products?.name || 'Producto'}</p>
                                                        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">
                                                            {item.quantity} × {formatCurrency(item.price_per_unit)}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm font-black italic text-foreground shrink-0">
                                                        {formatCurrency(item.price_per_unit * item.quantity)}
                                                    </p>
                                                </div>
                                            ))}

                                            {/* Notes */}
                                            {order.notes && (
                                                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-primary mb-0.5">Notas</p>
                                                    <p className="text-xs italic text-muted-foreground">"{order.notes}"</p>
                                                </div>
                                            )}

                                            {/* Repetir Pedido - also in expanded for emphasis */}
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
