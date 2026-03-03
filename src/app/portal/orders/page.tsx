'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared/empty-state';
import { ShoppingCart } from 'lucide-react';
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

const statusLabels: Record<string, string> = {
    armado: 'En Armado',
    transito: 'En Tránsito',
    entregado: 'Entregado',
};

const statusColors: Record<string, string> = {
    armado: 'bg-yellow-500',
    transito: 'bg-blue-500',
    entregado: 'bg-green-500',
};

export default function PortalOrdersPage() {
    const router = useRouter();
    const [ordersData, setOrdersData] = useState<OrdersData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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

    function repeatOrder(order: Order) {
        if (!ordersData?.agreementId) {
            return;
        }

        router.push(`/pedido/${ordersData.agreementId}?repeat_order=${order.id}`);
    }

    if (isLoading) {
        return <div className="flex items-center justify-center h-64">Cargando...</div>;
    }

    const orders = ordersData?.orders || [];

    if (orders.length === 0) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold">Mis Pedidos</h2>
                    <p className="text-muted-foreground">Historial de tus pedidos</p>
                </div>
                <EmptyState
                    icon={ShoppingCart}
                    title="No tienes pedidos todavía"
                    description="Cuando realices tu primer pedido, aparecerá aquí."
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold">Mis Pedidos</h2>
                <p className="text-muted-foreground">Historial de tus pedidos ({orders.length})</p>
            </div>

            <div className="space-y-4">
                {orders.map((order) => (
                    <Card key={order.id} className="glass-card group border-white/5 overflow-hidden hover:border-primary/20 transition-all hover:shadow-primary/5">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-mono text-sm text-muted-foreground">
                                        {format(new Date(order.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                                    </p>
                                </div>
                                <Badge className={statusColors[order.status]}>
                                    {statusLabels[order.status]}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-lg font-semibold">
                                        {formatCurrency(order.total_amount)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {order.order_items.length} producto{order.order_items.length !== 1 ? 's' : ''}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                                >
                                    {selectedOrder?.id === order.id ? 'Ocultar' : 'Ver Detalle'}
                                </Button>
                            </div>

                            {selectedOrder?.id === order.id && (
                                <div className="mt-6 pt-6 border-t border-white/5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Productos en el pedido</h4>
                                        <Badge variant="outline" className="text-[10px] font-bold border-white/5">
                                            {order.order_items.length} Items
                                        </Badge>
                                    </div>
                                    <div className="grid gap-3">
                                        {order.order_items.map((item) => (
                                            <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                                                <div className="h-12 w-12 rounded-lg border border-white/10 overflow-hidden bg-black/20 shrink-0">
                                                    {item.products?.image_url ? (
                                                        <img
                                                            src={item.products.image_url}
                                                            alt={item.products.name}
                                                            className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center">
                                                            <ShoppingCart className="h-4 w-4 opacity-20" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black italic tracking-tight truncate uppercase">{item.products?.name || 'Producto'}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                        {item.products?.category || 'Sin categoría'}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black italic">{formatCurrency(item.price_per_unit * item.quantity)}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                                                        {item.quantity} x {formatCurrency(item.price_per_unit)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {order.notes && (
                                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Notas del Pedido</p>
                                            <p className="text-xs italic text-muted-foreground">"{order.notes}"</p>
                                        </div>
                                    )}

                                    {ordersData?.agreementId && (
                                        <div className="pt-2">
                                            <Button
                                                onClick={() => repeatOrder(order)}
                                                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest shadow-lg shadow-primary/20 rounded-xl group/btn"
                                            >
                                                <span>Repetir este Pedido</span>
                                                <ShoppingCart className="h-4 w-4 ml-2 group-hover/btn:scale-110 transition-transform" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
