
"use client";

import { useTransition, useState, useEffect } from "react";
import type { Order } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StickyNote, Truck, Clock, AlertTriangle, Info, CheckCircle2, X, MessageCircle, PackageCheck, CircleCheck, Printer } from "lucide-react";
import { markOrderWorkflowStep, updateOrderStatus, bulkUpdateOrderStatus } from "@/app/admin/actions/orders.actions";
import { useToast } from "@/hooks/use-toast";
import { OrderNoteWidget } from "./order-note-widget";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ShippingLabelButton } from "./shipping-label-button";
import { CuratedOrderButton } from "./curated-order-button";
import { formatDistanceToNow } from "date-fns";
import { openPrintPage } from "@/lib/print-helpers";
import { es } from "date-fns/locale";
import { formatCurrency } from "@/lib/formatters";
import { getOrderDispatchBlocker } from "@/lib/order-workflow";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type NoteInfo = {
    clientName: string;
    note: string;
}

type BatchDispatchResult = {
    type: 'success' | 'error';
    message: string;
}

const workflowSteps = [
    { id: 'whatsapp', label: 'Recepción', icon: MessageCircle, tone: 'blue' },
    { id: 'preparation', label: 'Preparación', icon: PackageCheck, tone: 'violet' },
    { id: 'label', label: 'Rótulo', icon: Printer, tone: 'amber' },
] as const;

const workflowStepStyles = {
    blue: {
        active: 'border-sky-500/40 bg-sky-500/10 text-sky-800 dark:text-sky-300',
        icon: 'text-sky-700 dark:text-sky-300',
    },
    violet: {
        active: 'border-violet-500/40 bg-violet-500/10 text-violet-800 dark:text-violet-300',
        icon: 'text-violet-700 dark:text-violet-300',
    },
    amber: {
        active: 'border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-300',
        icon: 'text-amber-700 dark:text-amber-300',
    },
} as const;

export function RecentOrders({ orders: initialOrders = [] }: { orders: Order[] }) {
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [orders, setOrders] = useState(initialOrders);

    const [activeNote, setActiveNote] = useState<NoteInfo | null>(null);
    const [selectedOrders, setSelectedOrders] = useState<Record<string, boolean>>({})
    const [orderBundles, setOrderBundles] = useState<Record<string, number>>({});
    const [showUnprintedWarning, setShowUnprintedWarning] = useState(false);
    const [pendingSelections, setPendingSelections] = useState<{ id: string; bundles: number }[]>([]);
    const [batchDispatchResult, setBatchDispatchResult] = useState<BatchDispatchResult | null>(null);
    const [actionFeedback, setActionFeedback] = useState<BatchDispatchResult | null>(null);

    useEffect(() => {
        setOrders(initialOrders);
    }, [initialOrders]);

    const toSelections = (ids: string[]) => ids.map(id => ({ id, bundles: orderBundles[id] || 1 }));

    const handleWorkflowStep = (orderId: string, step: 'whatsapp' | 'preparation') => {
        startTransition(async () => {
            const { error } = await markOrderWorkflowStep(orderId, step);
            if (error) {
                setActionFeedback({ type: 'error', message: error.message });
                toast({ title: "No se pudo actualizar el pedido", description: error.message, variant: "destructive" });
                return;
            }

            const timestamp = new Date().toISOString();
            const updatedOrders = orders.map(order => order.id !== orderId
                ? order
                : step === 'whatsapp'
                    ? { ...order, whatsapp_confirmed_at: timestamp }
                    : { ...order, prepared_at: timestamp });
            setOrders(updatedOrders);
            const updatedOrder = updatedOrders.find(order => order.id === orderId);
            const nextStep = updatedOrder ? getOrderDispatchBlocker(updatedOrder) : null;
            const nextStepMessage = nextStep === 'preparation'
                ? 'Siguiente paso: marcar el pedido como preparado.'
                : 'Siguiente paso: imprimir y confirmar el rótulo de envío.';
            const successMessage = step === 'whatsapp'
                ? `Recepción confirmada. ${nextStepMessage}`
                : `Pedido preparado. ${nextStepMessage}`;
            setActionFeedback({ type: 'success', message: successMessage });
            toast({
                title: step === 'whatsapp' ? "Recepción confirmada" : "Pedido preparado",
                description: successMessage,
            });
        });
    };

    const handleUpdateStatus = (orderId: string, nextStatus: 'transito' | 'entregado') => {
        startTransition(async () => {
            const { error } = await updateOrderStatus(orderId, nextStatus);
            if (error) {
                if (error.code === 'NOT_PRINTED') {
                    setPendingSelections([{ id: orderId, bundles: orderBundles[orderId] || 1 }]);
                    setShowUnprintedWarning(true);
                } else {
                    setActionFeedback({ type: 'error', message: error.message });
                    toast({ title: "Error", description: error.message || "No se pudo actualizar el estado.", variant: "destructive" });
                }
            } else {
                setOrders(current => current.filter(o => o.id !== orderId));
                setActionFeedback({ type: 'success', message: `Pedido #${orderId.slice(-6).toUpperCase()} despachado correctamente.` });
                toast({ title: "Estado Actualizado", description: `El pedido está ahora marcado como ${nextStatus === 'transito' ? 'despachado' : 'conformado'}.` });
            }
        });
    }

    const handlePrintLabel = (orderId: string) => {
        let opened = false;
        try {
            opened = openPrintPage([{ id: orderId, bundles: orderBundles[orderId] || 1 }]);
        } catch (error) {
            console.error("No se pudo abrir la vista del rótulo:", error);
            toast({
                title: "No se pudo preparar el rótulo",
                description: "Ocurrió un error al abrir la vista de impresión. Volvé a intentarlo.",
                variant: "destructive",
            });
            return;
        }

        if (!opened) {
            toast({
                title: "No se abrió la vista del rótulo",
                description: "Permití las ventanas emergentes para este sitio y volvé a intentarlo.",
                variant: "destructive",
            });
            return;
        }

        toast({
            title: "Vista de rótulos abierta",
            description: "Imprimí y confirmá el rótulo allí. Al volver, el centro de operaciones actualizará el paso.",
        });
    };

    const confirmBatchDispatch = () => {
        executeDispatch(selectedOrderList.map(o => o.id));
    }

    const executeDispatch = (orderIds: string[]) => {
        setBatchDispatchResult(null);
        startTransition(async () => {
            const { error } = await bulkUpdateOrderStatus(orderIds, 'transito');
            if (error) {
                if (error.code === 'NOT_PRINTED') {
                    setPendingSelections(toSelections(orderIds));
                    setShowUnprintedWarning(true);
                } else {
                    setBatchDispatchResult({
                        type: 'error',
                        message: error.message || "No se pudieron despachar los pedidos. Intenta nuevamente.",
                    });
                    toast({ title: "Error", description: error.message || "No se pudieron despachar los pedidos.", variant: "destructive" });
                }
            } else {
                setOrders(current => current.filter(o => !orderIds.includes(o.id)));
                setSelectedOrders({});
                setBatchDispatchResult({
                    type: 'success',
                    message: `${orderIds.length} ${orderIds.length === 1 ? 'pedido fue despachado' : 'pedidos fueron despachados'} correctamente.`,
                });
                toast({
                    title: "Despacho Confirmado",
                    description: `${orderIds.length} pedidos han sido marcados como despachados.`
                });
            }
        });
        setShowUnprintedWarning(false);
    }

    const selectedOrderList = Object.entries(selectedOrders)
        .filter(([_, isSelected]) => isSelected)
        .map(([id, _]) => ({ id, bundles: orderBundles[id] || 1 }));
    const selectedWorkflowBlocker = selectedOrderList
        .map(selection => orders.find(order => order.id === selection.id))
        .filter((order): order is Order => Boolean(order))
        .map(getOrderDispatchBlocker)
        .find((blocker): blocker is NonNullable<typeof blocker> => blocker !== null) ?? null;

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
            {actionFeedback && (
                <div
                    role={actionFeedback.type === 'error' ? 'alert' : 'status'}
                    className={`flex items-start justify-between gap-3 rounded-xl border p-3 ${
                        actionFeedback.type === 'error'
                            ? 'border-destructive/30 bg-destructive/5 text-destructive'
                            : 'border-emerald-600/30 bg-emerald-600/5 text-foreground'
                    }`}
                >
                    <div className="flex items-start gap-2 text-sm">
                        {actionFeedback.type === 'error'
                            ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            : <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />}
                        <p>{actionFeedback.message}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label="Cerrar resultado de la acción"
                        onClick={() => setActionFeedback(null)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            {batchDispatchResult && (
                <div
                    role={batchDispatchResult.type === 'error' ? 'alert' : 'status'}
                    className={`flex items-start justify-between gap-3 rounded-xl border p-4 ${
                        batchDispatchResult.type === 'error'
                            ? 'border-destructive/30 bg-destructive/5 text-destructive'
                            : 'border-green-600/30 bg-green-600/5 text-foreground'
                    }`}
                >
                    <div className="flex items-start gap-2 text-sm">
                        {batchDispatchResult.type === 'error'
                            ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                            : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />}
                        <p>{batchDispatchResult.message}</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label="Cerrar resultado del despacho masivo"
                        onClick={() => setBatchDispatchResult(null)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}
            {selectedOrderList.length > 0 && (
                <div className="sticky top-0 z-30 mb-6 glass p-4 rounded-xl flex flex-wrap items-center justify-between border-primary/20 shadow-2xl animate-in fade-in slide-in-from-top-4 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-black">
                            {selectedOrderList.length}
                        </div>
                        <p className="font-black italic text-sm tracking-tight text-foreground/90 uppercase">Despacho de pedidos seleccionados</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <ShippingLabelButton orders={selectedOrderList} />
                        <CuratedOrderButton
                            initialOrderIds={selectedOrderList.map(order => order.id)}
                            availableOrders={orders}
                        />
                        <Button
                            onClick={confirmBatchDispatch}
                            disabled={isPending || selectedWorkflowBlocker !== null}
                            className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-900/20 h-9"
                        >
                            <Truck className="h-4 w-4" />
                            Confirmar Despacho
                        </Button>
                    </div>
                    <p className="flex basis-full items-center gap-2 text-xs text-muted-foreground">
                        <Info className="h-4 w-4 shrink-0 text-primary" />
                        {selectedWorkflowBlocker === 'whatsapp'
                            ? "Confirmá la recepción del pedido por WhatsApp antes de prepararlo."
                            : selectedWorkflowBlocker === 'preparation'
                                ? "Marcá como preparado cada pedido seleccionado antes de despacharlo."
                                : selectedWorkflowBlocker === 'label'
                                    ? "Imprimí y confirmá el rótulo de cada pedido seleccionado antes de despacharlo."
                                    : "El despacho requiere recepción verificada, pedido preparado y rótulo de envío impreso. La orden de preparación no reemplaza al rótulo."}
                    </p>
                </div>
            )}

            {orders.length === 0 ? (
                <div className="rounded-xl border border-emerald-600/20 bg-emerald-600/5 px-4 py-8 text-center">
                    <CircleCheck className="mx-auto h-8 w-8 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    <p className="mt-3 font-semibold">No hay pedidos pendientes</p>
                    <p className="mt-1 text-sm text-muted-foreground">La cola de preparación y despacho está al día.</p>
                </div>
            ) : <div className="grid gap-3">
                {orders.map((order) => {
                    const blocker = getOrderDispatchBlocker(order);
                    const overdue = Date.now() - new Date(order.created_at).getTime() > 48 * 60 * 60 * 1000;
                    return (
                    <div
                        key={order.id}
                        className={`group relative glass hover:bg-white/5 transition-all duration-300 p-4 rounded-xl flex flex-col xl:flex-row xl:items-center gap-4 ${
                            overdue ? 'border-red-500/40 bg-red-500/[0.03]' : 'border-white/5'
                        }`}
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
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-muted-foreground font-black tracking-widest uppercase">
                                        #{order.id.slice(-6)}
                                    </span>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${overdue ? 'text-red-700 dark:text-red-300' : 'text-muted-foreground'}`}>
                                        {formatDistanceToNow(new Date(order.created_at), { locale: es, addSuffix: true })}
                                    </span>
                                    {overdue && (
                                        <Badge variant="outline" className="border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300">
                                            Demorado +48 h
                                        </Badge>
                                    )}
                                </div>
                                <div className="mt-3 grid max-w-xl grid-cols-3 gap-2" aria-label="Progreso del pedido">
                                    {workflowSteps.map((workflowStep) => {
                                        const complete = workflowStep.id === 'whatsapp'
                                            ? Boolean(order.whatsapp_confirmed_at)
                                            : workflowStep.id === 'preparation'
                                                ? Boolean(order.prepared_at)
                                                : Boolean(order.printed_at);
                                        const current = !complete && blocker === workflowStep.id;
                                        const Icon = complete ? CircleCheck : workflowStep.icon;
                                        const style = workflowStepStyles[workflowStep.tone];
                                        return (
                                            <div
                                                key={workflowStep.id}
                                                aria-current={current ? 'step' : undefined}
                                                className={`flex min-w-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[10px] sm:text-xs ${
                                                    complete
                                                        ? 'border-emerald-600/30 bg-emerald-600/5 text-emerald-800 dark:text-emerald-300'
                                                        : current
                                                            ? style.active
                                                            : 'border-border/60 bg-muted/30 text-muted-foreground'
                                                }`}
                                            >
                                                <Icon className={`h-3.5 w-3.5 shrink-0 ${
                                                    complete ? 'text-emerald-700 dark:text-emerald-300' : current ? style.icon : ''
                                                }`} aria-hidden="true" />
                                                <span className="min-w-0 truncate font-semibold">{workflowStep.label}</span>
                                                <span className="sr-only">{complete ? 'completado' : current ? 'siguiente paso' : 'pendiente'}</span>
                                            </div>
                                        );
                                    })}
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

                            <div className="flex flex-col items-stretch gap-1.5 sm:items-end">
                                <div className="flex flex-wrap justify-end gap-2">
                                    {blocker === 'whatsapp' && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleWorkflowStep(order.id, 'whatsapp')}
                                            disabled={isPending}
                                            className="h-10 gap-2 bg-sky-700 text-white hover:bg-sky-800"
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                            Confirmar recepción
                                        </Button>
                                    )}
                                    {blocker === 'preparation' && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleWorkflowStep(order.id, 'preparation')}
                                            disabled={isPending}
                                            className="h-10 gap-2 bg-violet-700 text-white hover:bg-violet-800"
                                        >
                                            <PackageCheck className="h-4 w-4" />
                                            Marcar preparado
                                        </Button>
                                    )}
                                    {blocker === 'label' && (
                                        <Button
                                            size="sm"
                                            onClick={() => handlePrintLabel(order.id)}
                                            className="h-10 gap-2 bg-amber-600 text-white hover:bg-amber-700"
                                        >
                                            <Printer className="h-4 w-4" />
                                            Imprimir rótulo
                                        </Button>
                                    )}
                                    {blocker === null && (
                                        <Button
                                            size="sm"
                                            onClick={() => handleUpdateStatus(order.id, 'transito')}
                                            disabled={isPending}
                                            className="h-10 gap-2 bg-emerald-700 text-white hover:bg-emerald-800"
                                        >
                                            <Truck className="h-4 w-4" />
                                            Despachar
                                        </Button>
                                    )}
                                </div>
                                <div className="flex items-center justify-end gap-1.5">
                                    <CuratedOrderButton
                                        initialOrderIds={[order.id]}
                                        availableOrders={orders}
                                        iconOnly
                                    />
                                </div>
                                <p className="max-w-64 text-right text-xs leading-tight text-muted-foreground">
                                    {blocker === 'whatsapp'
                                        ? "Verificá manualmente que recibiste el pedido por WhatsApp."
                                        : blocker === 'preparation'
                                            ? "La recepción está confirmada. Ahora prepará el pedido."
                                            : blocker === 'label'
                                                ? "El pedido está preparado. Confirmá el rótulo desde su vista de impresión."
                                                : "Los tres pasos están completos. Ya podés despachar."}
                                </p>
                            </div>
                        </div>
                    </div>
                    );
                })}
            </div>
            }

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

            <Dialog open={showUnprintedWarning} onOpenChange={setShowUnprintedWarning}>
                <DialogContent className="glass border-white/10">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-500">
                            <AlertTriangle className="h-5 w-5" />
                            Rótulo sin imprimir
                        </DialogTitle>
                        <DialogDescription>
                            Los pedidos deben imprimirse antes de despacharse. Genera e imprime los
                            rótulos y luego vuelve a confirmar el despacho.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col sm:flex-row gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowUnprintedWarning(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={() => {
                                openPrintPage(pendingSelections);
                                setShowUnprintedWarning(false);
                            }}
                            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <Printer className="h-4 w-4" />
                            Imprimir rótulos
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
