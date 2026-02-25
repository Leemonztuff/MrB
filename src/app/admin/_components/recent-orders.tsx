
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
                <div className="sticky top-0 z-30 mb-6 glass p-4 rounded-xl flex flex-wrap items-center justify-between border-primary/20 shadow-2xl animate-in fade-in slide-in-from-top-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-black">
                            {selectedOrderList.length}
                        </div>
                        <p className="font-black italic text-sm tracking-tight text-foreground/90 uppercase">Preparación de Despacho Masivo</p>
                    </div>
                    <div className="shrink-0">
                        <ShippingLabelButton orders={selectedOrderList} />
                    </div>
                </div>
            )}

            <div className="grid gap-3">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        className="group relative glass hover:bg-white/5 transition-all duration-300 p-4 rounded-xl border-white/5 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Checkbox
                                checked={!!selectedOrders[order.id]}
                                onCheckedChange={() => toggleSelection(order.id)}
                                className="border-primary/50 data-[state=checked]:bg-primary"
                            />

                            <div className="relative shrink-0">
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
                                    <p className="font-headline text-lg truncate leading-tight">{order.client_name_cache}</p>
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
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-muted-foreground font-black tracking-widest uppercase">
                                        #{order.id.slice(-6)}
                                    </span>
                                    <span className="text-[10px] text-primary/70 font-bold uppercase tracking-wider">
                                        {formatDistanceToNow(new Date(order.created_at), { locale: es, addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 sm:ml-auto shrink-0 pt-4 sm:pt-0 border-t sm:border-none border-white/5">
                            <div className="flex flex-col items-end gap-1">
                                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Bultos</p>
                                <div className="flex items-center gap-2 bg-secondary/30 px-2 py-1 rounded-lg border border-white/5 focus-within:border-primary/30 transition-colors">
                                    <Input
                                        type="number"
                                        min="1"
                                        className="h-6 w-10 bg-transparent border-none text-sm text-center font-black p-0 focus-visible:ring-0"
                                        value={orderBundles[order.id] || 1}
                                        onChange={(e) => updateBundleCount(order.id, parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-1 min-w-[100px]">
                                <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 text-right">Monto Total</p>
                                <p className="text-xl font-headline font-black text-primary leading-none">{formatCurrency(order.total_amount)}</p>
                            </div>

                            <Button
                                variant="default"
                                size="lg"
                                className="h-12 w-12 sm:w-auto sm:h-12 px-0 sm:px-6 gap-2 font-black shadow-lg shadow-primary/10 active:scale-95 transition-all group/btn bg-primary hover:bg-primary/90"
                                onClick={() => handleUpdateStatus(order.id, 'transito')}
                                disabled={isPending}
                            >
                                <Truck className="h-5 w-5 sm:h-4 sm:w-4 group-hover/btn:translate-x-1 transition-transform" />
                                <span className="hidden sm:inline italic">Despachar</span>
                                <ChevronRight className="hidden sm:inline h-4 w-4 opacity-50" />
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
