'use client';

import { useState, useTransition } from 'react';
import type { OperationalOrder } from '@/types';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { DataTableHeader } from '@/components/shared/data-table-header';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { ShippingLabelButton } from '../../_components/shipping-label-button';
import { ReprintLabelButton } from '../../_components/reprint-label-button';
import { OrderStatusBadge } from '../../_components/order-status-badge';
import { Input } from '@/components/ui/input';
import {
  Printer,
  CheckCircle2,
  Truck,
  AlertTriangle,
  MessageCircle,
  PackageCheck,
  ClipboardList,
  Clock,
  Loader2,
  CheckSquare,
  Square,
  RotateCcw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { markOrderWorkflowStep, updateOrderStatus } from '@/app/admin/actions/orders.actions';
import { useToast } from '@/hooks/use-toast';
import { getOrderDispatchBlocker } from '@/lib/order-workflow';
import { aggregateOrderItems } from '@/lib/curated-order';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type OrdersTableProps = {
  orders: OperationalOrder[];
  operatorMode?: boolean;
};

type ActiveAction = {
  id: string;
  action: 'whatsapp' | 'preparation' | 'dispatch';
};

export function OrdersTable({ orders, operatorMode = false }: OrdersTableProps) {
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<ActiveAction | null>(null);
  const { toast } = useToast();
  const [bundles, setBundles] = useState<Record<string, number>>({});
  const [orderNeedingLabel, setOrderNeedingLabel] = useState<OperationalOrder | null>(null);

  // Checklist interactivo de preparación en el modal de productos
  const [packedItems, setPackedItems] = useState<Record<string, boolean>>({});

  const togglePacked = (orderId: string, itemId: string) => {
    const key = `${orderId}-${itemId}`;
    setPackedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetPacked = (orderId: string, itemIds: string[]) => {
    setPackedItems((prev) => {
      const copy = { ...prev };
      itemIds.forEach((id) => delete copy[`${orderId}-${id}`]);
      return copy;
    });
  };

  const getBundles = (orderId: string) => bundles[orderId] || 1;
  const getProductLines = (order: OperationalOrder) => aggregateOrderItems(order.order_items);

  const handleBundlesChange = (orderId: string, value: number) => {
    setBundles((prev) => ({
      ...prev,
      [orderId]: Math.max(1, Math.min(20, value)),
    }));
  };

  const handleDispatch = (order: OperationalOrder) => {
    setPendingAction({ id: order.id, action: 'dispatch' });
    startTransition(async () => {
      try {
        const { error } = await updateOrderStatus(order.id, 'transito');
        if (error) {
          if (error.code === 'NOT_PRINTED') {
            setOrderNeedingLabel(order);
          } else {
            toast({
              title: 'No se pudo despachar el pedido',
              description: error.message,
              variant: 'destructive',
            });
          }
          return;
        }

        toast({
          title: 'Pedido despachado',
          description: `El pedido de ${order.client_name_cache} se marcó como despachado.`,
        });
      } finally {
        setPendingAction(null);
      }
    });
  };

  const handleWorkflowStep = (order: OperationalOrder, step: 'whatsapp' | 'preparation') => {
    setPendingAction({ id: order.id, action: step });
    startTransition(async () => {
      try {
        const { error } = await markOrderWorkflowStep(order.id, step);
        if (error) {
          toast({
            title: 'No se pudo actualizar el pedido',
            description: error.message,
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: step === 'whatsapp' ? 'Recepción confirmada' : 'Pedido preparado',
          description:
            step === 'whatsapp'
              ? 'Quedó registrada la verificación manual de recepción del mensaje.'
              : `El pedido de ${order.client_name_cache} quedó marcado como preparado.`,
        });
      } finally {
        setPendingAction(null);
      }
    });
  };

  if (!orders || orders.length === 0) {
    return (
      <div className="py-16 text-center text-muted-foreground italic">
        No se encontraron pedidos.
      </div>
    );
  }

  return (
    <>
      {/* ======================================================== */}
      {/* VISTA MÓVIL: Tarjetas Operativas Táctiles (md:hidden)     */}
      {/* ======================================================== */}
      <div className="space-y-4 p-3 sm:p-4 md:hidden">
        {orders.map((order) => {
          const blocker = getOrderDispatchBlocker(order);
          const isArmed = order.status === 'armado';
          const isOverdue =
            isArmed && Date.now() - new Date(order.created_at).getTime() > 48 * 60 * 60 * 1000;

          const isActionPending = (act: 'whatsapp' | 'preparation' | 'dispatch') =>
            isPending && pendingAction?.id === order.id && pendingAction.action === act;

          const productLines = getProductLines(order);
          const packedCount = productLines.filter(
            (item) => packedItems[`${order.id}-${item.id}`]
          ).length;
          const isAllPacked = productLines.length > 0 && packedCount === productLines.length;

          return (
            <div
              key={order.id}
              className={cn(
                'glass rounded-xl border p-4 transition-all',
                isOverdue
                  ? 'border-red-500/40 bg-red-500/[0.03]'
                  : 'border-white/10 hover:border-primary/30'
              )}
            >
              {/* Encabezado: Fecha, Alertas y Estado */}
              <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                  {formatDate(order.created_at)}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {isOverdue && (
                    <Badge
                      variant="outline"
                      className="border-red-500/40 bg-red-500/10 text-[10px] text-red-400 gap-1"
                    >
                      <Clock className="h-2.5 w-2.5" />
                      Demorado +48h
                    </Badge>
                  )}
                  <OrderStatusBadge status={order.status} />
                  {order.printed_at && (
                    <Badge
                      variant="outline"
                      className="border-green-500/30 bg-green-500/10 text-[10px] text-green-400"
                    >
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Rótulo
                    </Badge>
                  )}
                </div>
              </div>

              {/* Información del Cliente y Monto */}
              <div className="mt-3 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-headline font-black italic tracking-tight text-lg text-foreground">
                    {order.client_name_cache}
                  </h3>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                    #{order.id.slice(-6).toUpperCase()}
                  </span>
                </div>
                {!operatorMode && (
                  <div className="text-right shrink-0">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground/70">Total</p>
                    <p className="font-headline font-black text-primary text-base">
                      {order.total_amount == null ? '—' : formatCurrency(order.total_amount)}
                    </p>
                  </div>
                )}
              </div>

              {/* Indicador de Pasos del Workflow para pedidos en armado */}
              {isArmed && (
                <div className="mt-3 grid grid-cols-3 gap-1.5 rounded-lg bg-black/20 p-2 border border-white/5">
                  <div
                    className={cn(
                      'flex items-center gap-1 text-[11px] font-medium truncate',
                      order.whatsapp_confirmed_at
                        ? 'text-emerald-400'
                        : blocker === 'whatsapp'
                        ? 'text-sky-400 font-bold'
                        : 'text-muted-foreground'
                    )}
                  >
                    {order.whatsapp_confirmed_at ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <MessageCircle className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate">WhatsApp</span>
                  </div>

                  <div
                    className={cn(
                      'flex items-center gap-1 text-[11px] font-medium truncate',
                      order.prepared_at
                        ? 'text-emerald-400'
                        : blocker === 'preparation'
                        ? 'text-violet-400 font-bold'
                        : 'text-muted-foreground'
                    )}
                  >
                    {order.prepared_at ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <PackageCheck className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate">Preparado</span>
                  </div>

                  <div
                    className={cn(
                      'flex items-center gap-1 text-[11px] font-medium truncate',
                      order.printed_at
                        ? 'text-emerald-400'
                        : blocker === 'label'
                        ? 'text-amber-400 font-bold'
                        : 'text-muted-foreground'
                    )}
                  >
                    {order.printed_at ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                    ) : (
                      <Printer className="h-3.5 w-3.5 shrink-0" />
                    )}
                    <span className="truncate">Rótulo</span>
                  </div>
                </div>
              )}

              {/* Nota del pedido si existe */}
              {order.notes && (
                <p className="mt-2.5 rounded-md bg-white/5 px-2.5 py-1.5 text-xs text-muted-foreground border border-white/5">
                  <span className="font-semibold text-foreground/80">Nota:</span> {order.notes}
                </p>
              )}

              {/* Zona de Acciones Táctiles Móviles */}
              <div className="mt-4 space-y-2.5 border-t border-white/5 pt-3">
                {isArmed && (
                  <>
                    {/* Botón Acción Principal: WhatsApp */}
                    {!order.whatsapp_confirmed_at && (
                      <Button
                        size="sm"
                        onClick={() => handleWorkflowStep(order, 'whatsapp')}
                        disabled={isPending}
                        className="h-11 w-full gap-2 bg-sky-700 text-white hover:bg-sky-800 shadow-sm transition-all"
                      >
                        {isActionPending('whatsapp') ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MessageCircle className="h-4 w-4" />
                        )}
                        <span>
                          {isActionPending('whatsapp')
                            ? 'Confirmando recepción...'
                            : 'Confirmar recepción en WhatsApp'}
                        </span>
                      </Button>
                    )}

                    {/* Botón Acción Principal: Preparación */}
                    {order.whatsapp_confirmed_at && !order.prepared_at && (
                      <Button
                        size="sm"
                        onClick={() => handleWorkflowStep(order, 'preparation')}
                        disabled={isPending}
                        className="h-11 w-full gap-2 bg-violet-700 text-white hover:bg-violet-800 shadow-sm transition-all"
                      >
                        {isActionPending('preparation') ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <PackageCheck className="h-4 w-4" />
                        )}
                        <span>
                          {isActionPending('preparation')
                            ? 'Marcando como preparado...'
                            : 'Marcar como preparado'}
                        </span>
                      </Button>
                    )}

                    {/* Selector Stepper Táctil y Botón de Rótulo si está preparado */}
                    {order.prepared_at && !order.printed_at && (
                      <div className="flex items-center gap-2">
                        {/* Stepper Táctil (- / +) */}
                        <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-1 h-11 shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleBundlesChange(order.id, getBundles(order.id) - 1)}
                            disabled={getBundles(order.id) <= 1}
                            className="h-9 w-9 text-base font-bold hover:bg-white/10"
                            aria-label="Restar un bulto"
                          >
                            -
                          </Button>
                          <div className="flex flex-col items-center justify-center min-w-8 px-1">
                            <span className="text-xs font-black tabular-nums">
                              {getBundles(order.id)}
                            </span>
                            <span className="text-[8px] uppercase tracking-wider text-muted-foreground leading-none">
                              bulto{getBundles(order.id) > 1 ? 's' : ''}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleBundlesChange(order.id, getBundles(order.id) + 1)}
                            disabled={getBundles(order.id) >= 20}
                            className="h-9 w-9 text-base font-bold hover:bg-white/10"
                            aria-label="Sumar un bulto"
                          >
                            +
                          </Button>
                        </div>

                        <ShippingLabelButton
                          orders={[{ id: order.id, bundles: getBundles(order.id) }]}
                          className="h-11 flex-1 bg-amber-600 text-white hover:bg-amber-700 border-transparent shadow-sm"
                        />
                      </div>
                    )}

                    {/* Botón Acción Principal: Despacho */}
                    {blocker === null && (
                      <Button
                        size="sm"
                        onClick={() => handleDispatch(order)}
                        disabled={isPending}
                        className="h-11 w-full gap-2 bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm transition-all"
                      >
                        {isActionPending('dispatch') ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Truck className="h-4 w-4" />
                        )}
                        <span>
                          {isActionPending('dispatch') ? 'Despachando...' : 'Despachar pedido'}
                        </span>
                      </Button>
                    )}

                    {/* Acciones Secundarias: Ver Productos con Checklist */}
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 flex-1 gap-2 border-white/15 bg-white/5 hover:bg-white/10 text-xs"
                          >
                            <ClipboardList className="h-4 w-4" />
                            <span>Ver productos</span>
                            {packedCount > 0 && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'ml-1 text-[10px] px-1.5 py-0 border-transparent',
                                  isAllPacked
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-primary/20 text-primary'
                                )}
                              >
                                {packedCount}/{productLines.length}
                              </Badge>
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="flex items-center justify-between gap-2">
                              <span>Pedido #{order.id.slice(-6).toUpperCase()}</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs font-semibold',
                                  isAllPacked
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                    : 'border-white/10 text-muted-foreground'
                                )}
                              >
                                {isAllPacked
                                  ? '✓ Todo embalado'
                                  : `${packedCount} de ${productLines.length} listos`}
                              </Badge>
                            </DialogTitle>
                            <DialogDescription>
                              {order.client_name_cache} · {formatDate(order.created_at)}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-foreground">
                                Checklist de preparación
                              </h3>
                              {packedCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    resetPacked(
                                      order.id,
                                      productLines.map((i) => i.id)
                                    )
                                  }
                                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Reiniciar
                                </button>
                              )}
                            </div>

                            <ul className="divide-y divide-white/10 rounded-lg border border-white/10 overflow-hidden">
                              {productLines.map((item) => {
                                const isPacked = Boolean(
                                  packedItems[`${order.id}-${item.id}`]
                                );
                                return (
                                  <li
                                    key={item.id}
                                    onClick={() => togglePacked(order.id, item.id)}
                                    className={cn(
                                      'flex min-h-12 items-center justify-between gap-3 p-3 text-sm cursor-pointer select-none transition-colors',
                                      isPacked
                                        ? 'bg-emerald-500/10 text-muted-foreground line-through'
                                        : 'hover:bg-white/5 text-foreground'
                                    )}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {isPacked ? (
                                        <CheckSquare className="h-5 w-5 text-emerald-400 shrink-0" />
                                      ) : (
                                        <Square className="h-5 w-5 text-muted-foreground shrink-0" />
                                      )}
                                      <span className="truncate">{item.name}</span>
                                    </div>
                                    <span
                                      className={cn(
                                        'rounded-md px-2.5 py-1 font-bold tabular-nums text-xs shrink-0',
                                        isPacked
                                          ? 'bg-emerald-500/20 text-emerald-300 no-underline'
                                          : 'bg-muted text-foreground'
                                      )}
                                    >
                                      {item.quantity} u.
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>

                            {order.notes && (
                              <p className="rounded-lg bg-muted/50 p-3 text-sm border border-white/5">
                                <span className="font-semibold text-foreground">Nota: </span>
                                {order.notes}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground italic">
                              Incluye unidades promocionales. Tocá cada producto para tildarlo mientras armás la caja.
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Reimpresión si ya tiene rótulo */}
                      {order.printed_at && (
                        <div className="flex items-center gap-1">
                          <ShippingLabelButton
                            orders={[{ id: order.id, bundles: getBundles(order.id) }]}
                            compact
                            className="h-10 text-xs border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                          />
                        </div>
                      )}
                    </div>

                    {/* Mensaje de Ayuda si está bloqueado */}
                    {blocker !== null && (
                      <p className="text-[11px] text-center text-muted-foreground pt-1">
                        {blocker === 'whatsapp'
                          ? 'Confirmá la recepción en WhatsApp para habilitar la preparación.'
                          : blocker === 'preparation'
                          ? 'Marcá el pedido como preparado para habilitar el rótulo de envío.'
                          : 'Imprimí y confirmá el rótulo de envío para poder despachar.'}
                      </p>
                    )}
                  </>
                )}

                {/* Si no está armado (despachado o entregado) */}
                {!isArmed && (
                  <div className="flex items-center justify-between gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 flex-1 gap-2 border-white/15 bg-white/5 hover:bg-white/10 text-xs"
                        >
                          <ClipboardList className="h-4 w-4" />
                          Ver pedido
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Pedido #{order.id.slice(-6).toUpperCase()}</DialogTitle>
                          <DialogDescription>
                            {order.client_name_cache} · {formatDate(order.created_at)}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                          <h3 className="text-sm font-semibold">Productos y cantidades totales</h3>
                          <ul className="divide-y rounded-lg border px-3">
                            {productLines.map((item) => (
                              <li
                                key={item.id}
                                className="flex min-h-12 items-center justify-between gap-4 py-2 text-sm"
                              >
                                <span>{item.name}</span>
                                <span className="rounded-md bg-muted px-2 py-1 font-bold tabular-nums">
                                  {item.quantity}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <ReprintLabelButton orderId={order.id} bundles={1} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* VISTA ESCRITORIO: Tabla Completa con Feedback Visual      */}
      {/* ======================================================== */}
      <div className="hidden md:block w-full overflow-x-auto">
        <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <DataTableHeader className="whitespace-nowrap">Fecha</DataTableHeader>
              <DataTableHeader className="whitespace-nowrap">Cliente</DataTableHeader>
              {!operatorMode && <DataTableHeader className="whitespace-nowrap">Monto</DataTableHeader>}
              <DataTableHeader className="whitespace-nowrap">Estado</DataTableHeader>
              <DataTableHeader align="right" className="whitespace-nowrap">
                <span className="sr-only">Acciones</span>
              </DataTableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const blocker = getOrderDispatchBlocker(order);
              const isArmed = order.status === 'armado';
              const isOverdue =
                isArmed && Date.now() - new Date(order.created_at).getTime() > 48 * 60 * 60 * 1000;

              const isActionPending = (act: 'whatsapp' | 'preparation' | 'dispatch') =>
                isPending && pendingAction?.id === order.id && pendingAction.action === act;

              const productLines = getProductLines(order);
              const packedCount = productLines.filter(
                (item) => packedItems[`${order.id}-${item.id}`]
              ).length;
              const isAllPacked = productLines.length > 0 && packedCount === productLines.length;

              return (
                <TableRow
                  key={order.id}
                  className={cn(
                    'border-white/5 hover:bg-white/5 transition-colors group',
                    isOverdue && 'bg-red-500/[0.02]'
                  )}
                >
                  <TableCell className="pl-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    <div className="flex flex-col gap-1">
                      <span>{formatDate(order.created_at)}</span>
                      {isOverdue && (
                        <Badge
                          variant="outline"
                          className="border-red-500/40 bg-red-500/10 text-[9px] text-red-400 gap-1 w-fit px-1.5 py-0"
                        >
                          <Clock className="h-2.5 w-2.5" />
                          +48h
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-black italic tracking-tighter text-base group-hover:text-primary transition-colors">
                    {order.client_name_cache}
                  </TableCell>
                  {!operatorMode && (
                    <TableCell className="font-headline font-black text-primary/80">
                      {order.total_amount == null ? '—' : formatCurrency(order.total_amount)}
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={order.status} />
                      {order.printed_at && (
                        <Badge
                          variant="outline"
                          className="text-[10px] border-green-500/30 text-green-400 bg-green-500/10"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Rótulo confirmado
                        </Badge>
                      )}
                    </div>
                    {isArmed && (
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <p>
                          WhatsApp:{' '}
                          <span
                            className={cn(
                              'font-medium',
                              order.whatsapp_confirmed_at ? 'text-emerald-400' : 'text-sky-400'
                            )}
                          >
                            {order.whatsapp_confirmed_at ? 'recepción confirmada' : 'por confirmar'}
                          </span>
                        </p>
                        <p>
                          Preparación:{' '}
                          <span
                            className={cn(
                              'font-medium',
                              order.prepared_at ? 'text-emerald-400' : 'text-violet-400'
                            )}
                          >
                            {order.prepared_at ? 'pedido preparado' : 'pendiente'}
                          </span>
                        </p>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-4 sm:pr-6">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {/* Botón Ver pedido con Checklist */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2 whitespace-nowrap border-white/15 bg-white/5 hover:bg-white/10"
                          >
                            <ClipboardList className="h-4 w-4" />
                            <span>Ver pedido</span>
                            {packedCount > 0 && (
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-[10px] px-1 py-0 border-transparent',
                                  isAllPacked
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-primary/20 text-primary'
                                )}
                              >
                                {packedCount}/{productLines.length}
                              </Badge>
                            )}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[85dvh] overflow-y-auto sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle className="flex items-center justify-between gap-2">
                              <span>Pedido #{order.id.slice(-6).toUpperCase()}</span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  'text-xs font-semibold',
                                  isAllPacked
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                    : 'border-white/10 text-muted-foreground'
                                )}
                              >
                                {isAllPacked
                                  ? '✓ Todo embalado'
                                  : `${packedCount} de ${productLines.length} listos`}
                              </Badge>
                            </DialogTitle>
                            <DialogDescription>
                              {order.client_name_cache} · {formatDate(order.created_at)}
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-foreground">
                                Checklist de preparación
                              </h3>
                              {packedCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    resetPacked(
                                      order.id,
                                      productLines.map((i) => i.id)
                                    )
                                  }
                                  className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                  <RotateCcw className="h-3 w-3" />
                                  Reiniciar
                                </button>
                              )}
                            </div>

                            <ul className="divide-y divide-white/10 rounded-lg border border-white/10 overflow-hidden">
                              {productLines.map((item) => {
                                const isPacked = Boolean(
                                  packedItems[`${order.id}-${item.id}`]
                                );
                                return (
                                  <li
                                    key={item.id}
                                    onClick={() => togglePacked(order.id, item.id)}
                                    className={cn(
                                      'flex min-h-12 items-center justify-between gap-3 p-3 text-sm cursor-pointer select-none transition-colors',
                                      isPacked
                                        ? 'bg-emerald-500/10 text-muted-foreground line-through'
                                        : 'hover:bg-white/5 text-foreground'
                                    )}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      {isPacked ? (
                                        <CheckSquare className="h-5 w-5 text-emerald-400 shrink-0" />
                                      ) : (
                                        <Square className="h-5 w-5 text-muted-foreground shrink-0" />
                                      )}
                                      <span className="truncate">{item.name}</span>
                                    </div>
                                    <span
                                      className={cn(
                                        'rounded-md px-2.5 py-1 font-bold tabular-nums text-xs shrink-0',
                                        isPacked
                                          ? 'bg-emerald-500/20 text-emerald-300 no-underline'
                                          : 'bg-muted text-foreground'
                                      )}
                                    >
                                      {item.quantity} u.
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>

                            {order.notes && (
                              <p className="rounded-lg bg-muted/50 p-3 text-sm border border-white/5">
                                <span className="font-semibold text-foreground">Nota: </span>
                                {order.notes}
                              </p>
                            )}
                            <p className="text-[11px] text-muted-foreground italic">
                              Hacé clic en cada producto para tildarlo mientras armás la caja.
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {isArmed && (
                        <>
                          {/* Paso 1: WhatsApp */}
                          {!order.whatsapp_confirmed_at && (
                            <Button
                              size="sm"
                              onClick={() => handleWorkflowStep(order, 'whatsapp')}
                              disabled={isPending}
                              className="gap-2 h-9 whitespace-nowrap bg-sky-700 text-white hover:bg-sky-800 shadow-sm"
                            >
                              {isActionPending('whatsapp') ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MessageCircle className="h-4 w-4" />
                              )}
                              <span>
                                {isActionPending('whatsapp') ? 'Confirmando...' : 'Confirmar recepción'}
                              </span>
                            </Button>
                          )}

                          {/* Paso 2: Preparación */}
                          {order.whatsapp_confirmed_at && !order.prepared_at && (
                            <Button
                              size="sm"
                              onClick={() => handleWorkflowStep(order, 'preparation')}
                              disabled={isPending}
                              className="gap-2 h-9 whitespace-nowrap bg-violet-700 text-white hover:bg-violet-800 shadow-sm"
                            >
                              {isActionPending('preparation') ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <PackageCheck className="h-4 w-4" />
                              )}
                              <span>
                                {isActionPending('preparation') ? 'Marcando...' : 'Marcar preparado'}
                              </span>
                            </Button>
                          )}

                          {/* Selector de Bultos */}
                          <div className="flex items-center gap-1">
                            <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={getBundles(order.id)}
                              onChange={(e) =>
                                handleBundlesChange(order.id, parseInt(e.target.value) || 1)
                              }
                              className="h-8 w-12 text-center text-xs glass border-white/10 bg-white/5 font-bold"
                              aria-label={`Cantidad de bultos para ${order.client_name_cache}`}
                            />
                          </div>

                          {/* Paso 3: Rótulos */}
                          <ShippingLabelButton
                            orders={[{ id: order.id, bundles: getBundles(order.id) }]}
                            className={
                              order.prepared_at && !order.printed_at
                                ? 'bg-amber-600 text-white hover:bg-amber-700 border-transparent shadow-sm'
                                : 'border-white/10 hover:bg-white/5'
                            }
                          />

                          {/* Despachar */}
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleDispatch(order)}
                              disabled={isPending || blocker !== null}
                              className={cn(
                                'gap-2 h-9 whitespace-nowrap transition-all',
                                blocker === null
                                  ? 'bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm'
                                  : 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              {isActionPending('dispatch') ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Truck className="h-4 w-4" />
                              )}
                              <span>
                                {isActionPending('dispatch') ? 'Despachando...' : 'Despachar'}
                              </span>
                            </Button>
                            <p className="hidden xl:block max-w-44 text-right text-[10px] leading-tight text-muted-foreground">
                              {blocker === 'whatsapp'
                                ? 'Confirmá la recepción del pedido por WhatsApp.'
                                : blocker === 'preparation'
                                ? 'Marcá el pedido como preparado.'
                                : blocker === 'label'
                                ? 'El despacho requiere imprimir y confirmar el rótulo de envío.'
                                : 'El pedido cumple los requisitos para despachar.'}
                            </p>
                          </div>
                        </>
                      )}

                      {!isArmed && (
                        <ReprintLabelButton orderId={order.id} bundles={1} />
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Advertencia cuando falta rótulo */}
      <AlertDialog
        open={Boolean(orderNeedingLabel)}
        onOpenChange={(open) => !open && setOrderNeedingLabel(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Falta confirmar el rótulo de envío
            </AlertDialogTitle>
            <AlertDialogDescription>
              Para despachar el pedido de {orderNeedingLabel?.client_name_cache}, imprimí el
              rótulo y confirmá la impresión en la vista previa. Después volvé a esta lista y
              despachalo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ahora no</AlertDialogCancel>
            {orderNeedingLabel && (
              <ShippingLabelButton
                orders={[{ id: orderNeedingLabel.id, bundles: getBundles(orderNeedingLabel.id) }]}
                className="bg-amber-600 text-white hover:bg-amber-700"
                onClick={() => setOrderNeedingLabel(null)}
              />
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
