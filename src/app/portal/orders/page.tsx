'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground mb-4">No tenés pedidos realizados</p>
                        <p className="text-sm text-muted-foreground/60">Hacé tu primer pedido a través del enlace que te proporcionó el administrador</p>
                    </CardContent>
                </Card>
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
                    <Card key={order.id} className="glass hover:border-primary/30 transition-colors">
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
                                <div className="mt-4 pt-4 border-t border-white/10">
                                    <h4 className="font-medium mb-2">Productos:</h4>
                                    <ul className="space-y-1">
                                        {order.order_items.map((item) => (
                                            <li key={item.id} className="flex justify-between text-sm">
                                                <span>
                                                    {item.products?.name || 'Producto'}
                                                </span>
                                                <span className="text-muted-foreground">
                                                    x{item.quantity} = {formatCurrency(item.price_per_unit * item.quantity)}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                    {order.notes && (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                            <p className="text-sm text-muted-foreground">
                                                <span className="font-medium">Notas:</span> {order.notes}
                                            </p>
                                        </div>
                                    )}
                                    {ordersData?.agreementId && (
                                        <div className="mt-4">
                                            <Button onClick={() => repeatOrder(order)} className="w-full">
                                                Repetir Pedido
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
