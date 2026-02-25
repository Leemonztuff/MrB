
"use client";

import { useTransition, useState } from "react";
import type { Order } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StickyNote, ChevronRight, Package, Truck, Clock } from "lucide-react";
import { updateOrderStatus } from "@/app/admin/actions/orders.actions";
import { useToast } from "@/hooks/use-toast";
import { OrderNoteWidget } from "./order-note-widget";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ShippingLabelButton } from "./shipping-label-button";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
}

type NoteInfo = {
    clientName: string;
    note: string;
}

export function RecentOrders({ orders: initialOrders }: { orders: Order[] }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [orders, setOrders] = useState(initialOrders);

    const [activeNote, setActiveNote] = useState<NoteInfo | null>(null);
    const [selectedOrders, setSelectedOrders] = useState<Record<string, boolean>>({});
    const [orderBundles, setOrderBundles] = useState<Record<string, number>>({});

    const handleUpdateStatus = (orderId: string, nextStatus: 'transito' | 'entregado') => {
        startTransition(async () => {
            const { error } = await updateOrderStatus(orderId, nextStatus);
            if (error) {
                toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
            } else {
                setOrders(current => current.filter(o => o.id !== orderId));
                toast({ title: "Estado Actualizado", description: `El pedido está ahora marcado como ${nextStatus === 'transito' ? 'despachado' : 'conformado'}.` });
            }
        });
    }

    const toggleSelection = (orderId: string) => {
        setSelectedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
        if (!orderBundles[orderId]) {
            setOrderBundles(prev => ({ ...prev, [orderId]: 1 }));
        }
    };

    const updateBundleCount = (orderId: string, count: number) => {
        setOrderBundles(prev => ({ ...prev, [orderId]: Math.max(1, count) }));
    };

    const selectedOrderList = Object.entries(selectedOrders)
        .filter(([_, isSelected]) => isSelected)
        .map(([id, _]) => ({ id, bundles: orderBundles[id] || 1 }));

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl bg-card/30">
                <div className="p-4 bg-muted rounded-full mb-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground font-medium">No hay pedidos pendientes de despacho.</p>
                <p className="text-sm text-muted-foreground/60">Los pedidos "Armados" aparecerán aquí para su despacho.</p>
            </div>
        )
    }

    return (
        <div className="relative space-y-4">
            {selectedOrderList.length > 0 && (
                <div className="sticky top-0 z-20 glass p-4 rounded-xl flex items-center justify-between border-primary/20 shadow-2xl animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
                            {selectedOrderList.length}
                        </div>
                        <p className="font-bold text-sm">Preparación de Despacho Masivo</p>
                    </div>
                    <ShippingLabelButton orders={selectedOrderList} />
                </div>
            )}

            <div className="grid gap-3">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        className="group relative glass hover:bg-white/5 transition-all duration-300 p-4 rounded-xl border-white/5 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                        <div className="flex items-center gap-4">
                            <Checkbox
                                checked={!!selectedOrders[order.id]}
                                onCheckedChange={() => toggleSelection(order.id)}
                                className="border-primary/50 data-[state=checked]:bg-primary"
                            />

                            <div className="relative">
                                <Avatar className="h-12 w-12 border-2 border-white/10 group-hover:border-primary/50 transition-colors">
                                    <AvatarImage src={`https://avatar.vercel.sh/${order.client_id || 'generic'}.png`} alt="Avatar" />
                                    <AvatarFallback className="bg-secondary text-primary font-bold">{order.client_name_cache.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 p-1 bg-background rounded-full border border-white/10">
                                    <Clock className="h-3 w-3 text-primary" />
                                </div>
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-headline text-lg truncate">{order.client_name_cache}</p>
                                    {order.notes && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-primary animate-pulse hover:bg-primary/10"
                                            onClick={() => setActiveNote({ note: order.notes!, clientName: order.client_name_cache })}
                                        >
                                            <StickyNote className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                                    <span>#{order.id.slice(-6)}</span>
                                    <span>•</span>
                                    <span>Hace {formatDistanceToNow(new Date(order.created_at), { locale: es, addSuffix: true })}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:ml-auto w-full sm:w-auto mt-2 sm:mt-0 border-t sm:border-none pt-4 sm:pt-0">
                            <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-lg border border-white/5">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Bultos:</p>
                                    <Input
                                        type="number"
                                        min="1"
                                        className="h-8 w-14 bg-transparent border-none text-sm text-center font-bold p-0 focus-visible:ring-0"
                                        value={orderBundles[order.id] || 1}
                                        onChange={(e) => updateBundleCount(order.id, parseInt(e.target.value))}
                                    />
                                </div>

                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground sm:hidden">Total:</p>
                                    <p className="text-xl font-headline text-primary">{formatCurrency(order.total_amount)}</p>
                                </div>
                            </div>

                            <Button
                                variant="default"
                                size="lg"
                                className="w-full sm:w-auto h-12 sm:h-10 px-6 gap-2 font-bold shadow-lg shadow-primary/10 active:scale-95 transition-transform"
                                onClick={() => handleUpdateStatus(order.id, 'transito')}
                                disabled={isPending}
                            >
                                <Truck className="h-5 w-5 sm:h-4 sm:w-4" />
                                Despachar
                                <ChevronRight className="ml-auto h-5 w-5 sm:h-4 sm:w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {activeNote && (
                <div className="fixed bottom-6 right-6 z-50">
                    <OrderNoteWidget
                        clientName={activeNote.clientName}
                        note={activeNote.note}
                        onClose={() => setActiveNote(null)}
                        isMinimized={false}
                    />
                </div>
            )}
        </div>
    );
}
