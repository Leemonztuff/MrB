
"use client";

import { useTransition, useState } from "react";
import type { OrderWithItems } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StickyNote, ChevronRight, Package, Truck, Clock, ShoppingBasket } from "lucide-react";
import { updateOrderStatus, bulkUpdateOrderStatus } from "@/app/admin/actions/orders.actions";
import { useToast } from "@/hooks/use-toast";
import { OrderNoteWidget } from "./order-note-widget";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ShippingLabelButton } from "./shipping-label-button";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Printer, ShoppingBag, Eye } from "lucide-react";
import { formatDate } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
}

type NoteInfo = {
    clientName: string;
    note: string;
}

export function RecentOrders({ orders: initialOrders }: { orders: OrderWithItems[] }) {
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

    const confirmBatchDispatch = () => {
        const orderIds = selectedOrderList.map(o => o.id);
        startTransition(async () => {
            const { error } = await bulkUpdateOrderStatus(orderIds, 'transito');
            if (error) {
                toast({ title: "Error", description: "No se pudieron despachar los pedidos.", variant: "destructive" });
            } else {
                setOrders(current => current.filter(o => !orderIds.includes(o.id)));
                setSelectedOrders({});
                toast({
                    title: "Despacho Confirmado",
                    description: `${orderIds.length} pedidos han sido marcados como despachados.`
                });
            }
        });
    }

    const selectedOrderList = Object.entries(selectedOrders)
        .filter(([_, isSelected]) => isSelected)
        .map(([id, _]) => ({ id, bundles: orderBundles[id] || 1 }));

    const toggleSelection = (orderId: string) => {
        setSelectedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
        if (!orderBundles[orderId]) {
            setOrderBundles(prev => ({ ...prev, [orderId]: 1 }));
        }
    };

    const updateBundleCount = (orderId: string, count: number) => {
        setOrderBundles(prev => ({ ...prev, [orderId]: Math.max(1, count) }));
    };

    return (
        <div className="relative space-y-4">
            {selectedOrderList.length > 0 && (
                <div className="sticky top-0 z-30 mb-6 glass p-4 rounded-xl flex flex-wrap items-center justify-between border-primary/20 shadow-2xl animate-in fade-in slide-in-from-top-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-black">
                            {selectedOrderList.length}
                        </div>
                        <p className="font-black italic text-sm tracking-tight text-foreground/90 uppercase">Gestión de Despacho Masivo</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShippingLabelButton orders={selectedOrderList} />
                        <Button
                            onClick={confirmBatchDispatch}
                            disabled={isPending}
                            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 h-9"
                        >
                            <Truck className="h-4 w-4" />
                            Confirmar Despacho
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid gap-3">
                {orders.map((order) => (
                    <div
                        key={order.id}
                        className="group relative glass hover:bg-white/5 transition-all duration-300 p-4 rounded-xl border-white/5 flex flex-col xl:flex-row xl:items-center gap-4"
                    >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <Checkbox
                                checked={!!selectedOrders[order.id]}
                                onCheckedChange={() => toggleSelection(order.id)}
                                className="border-primary/50 data-[state=checked]:bg-primary"
                            />

                            <div className="relative shrink-0">
                                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 border-2 border-white/10 group-hover:border-primary/50 transition-colors">
                                    <AvatarImage src={`https://avatar.vercel.sh/${order.client_id || 'generic'}.png`} alt="Avatar" />
                                    <AvatarFallback className="bg-secondary text-primary font-bold text-xs sm:text-base">{order.client_name_cache.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 p-0.5 sm:p-1 bg-background rounded-full border border-white/10 text-primary">
                                    <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                </div>
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="font-headline text-base sm:text-lg truncate leading-tight">{order.client_name_cache}</p>
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
                                <div className="flex flex-col gap-1 mt-1">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-muted-foreground font-black tracking-widest uppercase">
                                            #{order.id.slice(-6)}
                                        </span>
                                        <span className="text-[10px] text-primary/70 font-bold uppercase tracking-wider">
                                            {formatDistanceToNow(new Date(order.created_at), { locale: es, addSuffix: true })}
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-2 max-w-md">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 px-2 gap-1.5 text-[10px] sm:text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border border-white/5 rounded-lg"
                                                >
                                                    <ShoppingBag className="h-3 w-3" />
                                                    <span>{order.order_items?.length || 0} productos</span>
                                                    <Eye className="h-2.5 w-2.5 ml-0.5 opacity-50" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="glass flex max-h-[min(85dvh,720px)] flex-col overflow-hidden border-white/10 p-0 sm:max-w-md">
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2 border-b border-white/10 px-6 py-5 font-headline italic">
                                                        <ShoppingBag className="h-5 w-5 text-primary" />
                                                        Detalle del Pedido #{order.id.slice(-6).toUpperCase()}
                                                    </DialogTitle>
                                                </DialogHeader>
                                                <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
                                                    <div className="mt-4 flex items-center justify-between rounded-xl border border-white/5 bg-white/5 p-3">
                                                        <div className="space-y-0.5">
                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Cliente</p>
                                                            <p className="text-sm font-medium">{order.client_name_cache}</p>
                                                        </div>
                                                        <div className="text-right space-y-0.5">
                                                            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Fecha</p>
                                                            <p className="text-sm font-medium">{formatDate(order.created_at)}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex min-h-0 flex-1 flex-col space-y-2">
                                                        <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest ml-1">Contenido</p>
                                                        <ScrollArea className="min-h-0 flex-1 w-full pr-4">
                                                            <div className="grid gap-2">
                                                                {order.order_items?.map((item, idx) => (
                                                                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                                        <div className="flex items-center gap-3">
                                                                            <Badge variant="secondary" className="bg-primary/20 text-primary h-6 w-6 flex items-center justify-center p-0 font-black">
                                                                                {item.quantity}
                                                                            </Badge>
                                                                            <span className="text-xs">{item.products?.name}</span>
                                                                        </div>
                                                                        <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap">
                                                                            {formatCurrency((item.price_per_unit || 0) * item.quantity)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </ScrollArea>
                                                    </div>

                                                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                                                        <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Total del Pedido</span>
                                                        <span className="text-xl font-headline font-black text-primary">
                                                            {formatCurrency(order.total_amount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 xl:ml-auto shrink-0 pt-3 xl:pt-0 border-t xl:border-none border-white/5 min-w-0">
                            <div className="flex flex-col items-end gap-0.5">
                                <p className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">Bultos</p>
                                <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-0.5 rounded-lg border border-white/5 focus-within:border-primary/30 transition-colors">
                                    <Input
                                        type="number"
                                        min="1"
                                        className="h-6 w-8 sm:w-10 bg-transparent border-none text-[10px] sm:text-xs text-center font-black p-0 focus-visible:ring-0"
                                        value={orderBundles[order.id] || 1}
                                        onChange={(e) => updateBundleCount(order.id, parseInt(e.target.value))}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-0.5 min-w-[70px] sm:min-w-[90px]">
                                <p className="text-[8px] sm:text-[10px] uppercase font-black tracking-widest text-muted-foreground/60 text-right">Monto</p>
                                <p className="text-sm sm:text-base font-headline font-black text-primary leading-none truncate w-full text-right">{formatCurrency(order.total_amount)}</p>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-9 w-9 sm:h-10 sm:w-10 glass border-white/10 hover:bg-white/5 rounded-xl transition-all"
                                    title="Generar Rótulo"
                                    onClick={() => {
                                        const data = JSON.stringify([{ id: order.id, bundles: orderBundles[order.id] || 1 }]);
                                        window.open(`/admin/imprimir/rotulos?data=${encodeURIComponent(data)}`, '_blank');
                                    }}
                                >
                                    <Printer className="h-4 w-4" />
                                </Button>

                                <Button
                                    variant="default"
                                    size="sm"
                                    className="h-9 sm:h-10 px-3 sm:px-4 gap-2 font-black shadow-lg shadow-primary/10 active:scale-95 transition-all group/btn bg-primary hover:bg-primary/90 rounded-xl shrink-0"
                                    onClick={() => handleUpdateStatus(order.id, 'transito')}
                                    disabled={isPending}
                                >
                                    <Truck className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform shrink-0" />
                                    <span className="hidden sm:inline italic">Despachar</span>
                                </Button>
                            </div>
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
