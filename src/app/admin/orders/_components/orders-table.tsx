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
  Circle,
  Clock,
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

export function OrdersTable({ orders, operatorMode = false }: OrdersTableProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [bundles, setBundles] = useState<Record<string, number>>({});
  const [orderNeedingLabel, setOrderNeedingLabel] = useState<OperationalOrder | null>(null);

  const getBundles = (orderId: string) => bundles[orderId] || 1;
  const getProductLines = (order: OperationalOrder) => aggregateOrderItems(order.order_items);

  const handleBundlesChange = (orderId: string, value: number) => {
    setBundles((prev) => ({
      ...prev,
      [orderId]: Math.max(1, Math.min(20, value)),
    }));
  };

  const handleDispatch = (order: OperationalOrder) => {
    startTransition(async () => {
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
    });
  };

  const handleWorkflowStep = (order: OperationalOrder, step: 'whatsapp' | 'preparation') => {
    startTransition(async () => {
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

          return (
            <div
              key={order.id}
              className="glass rounded-xl border border-white/10 p-4 transition-all hover:border-primary/30"
            >
              {/* Encabezado: Fecha y Estado */}
              <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">
                  {formatDate(order.created_at)}
                </span>
                <div className="flex items-center gap-1.5 flex-wrap justify-end">
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
                  {/* Paso 1: WhatsApp */}
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

                  {/* Paso 2: Preparación */}
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

                  {/* Paso 3: Rótulo */}
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

              {/* Zona de Botones Táctiles Móviles */}
              <div className="mt-4 space-y-2.5 border-t border-white/5 pt-3">
                {isArmed && (
                  <>
                    {/* Botón de Acción Principal Destacada según el Paso Pendiente */}
                    {!order.whatsapp_confirmed_at && (
                      <Button
                        size="sm"
                        onClick={() => handleWorkflowStep(order, 'whatsapp')}
                        disabled={isPending}
                        className="h-11 w-full gap-2 bg-sky-700 text-white hover:bg-sky-800 shadow-sm transition-all"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Confirmar recepción en WhatsApp
                      </Button>
                    )}

                    {order.whatsapp_confirmed_at && !order.prepared_at && (
                      <Button
                        size="sm"
                        onClick={() => handleWorkflowStep(order, 'preparation')}
                        disabled={isPending}
                        className="h-11 w-full gap-2 bg-violet-700 text-white hover:bg-violet-800 shadow-sm transition-all"
                      >
                        <PackageCheck className="h-4 w-4" />
                        Marcar como preparado
                      </Button>
                    )}

                    {order.prepared_at && !order.printed_at && (
                      <div className="flex items-center gap-2">
                        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 h-11">
                          <Printer className="h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={getBundles(order.id)}
                            onChange={(e) => handleBundlesChange(order.id, parseInt(e.target.value) || 1)}
                            className="h-8 w-10 border-none bg-transparent p-0 text-center text-sm font-bold focus-visible:ring-0"
                            aria-label={`Cantidad de bultos para ${order.client_name_cache}`}
                          />
                        </div>
                        <ShippingLabelButton
                          orders={[{ id: order.id, bundles: getBundles(order.id) }]}
                          className="h-11 flex-1 bg-amber-600 text-white hover:bg-amber-700 border-transparent shadow-sm"
                        />
                      </div>
                    )}

                    {blocker === null && (
                      <Button
                        size="sm"
                        onClick={() => handleDispatch(order)}
                        disabled={isPending}
                        className="h-11 w-full gap-2 bg-emerald-700 text-white hover:bg-emerald-800 shadow-sm transition-all"
                      >
                        <Truck className="h-4 w-4" />
                        Despachar pedido
                      </Button>
                    )}

                    {/* Acciones Secundarias: Ver pedido y Gestión de Rótulo complementario */}
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-10 flex-1 gap-2 border-white/15 bg-white/5 hover:bg-white/10 text-xs"
                          >
                            <ClipboardList className="h-4 w-4" />
                            Ver productos
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
                              {getProductLines(order).map((item) => (
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
                            {order.notes && (
                              <p className="rounded-lg bg-muted/50 p-3 text-sm">
                                <span className="font-semibold">Nota: </span>
                                {order.notes}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Incluye las unidades promocionales para preparar el total físico.
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {/* Si ya imprimió rótulo pero quiere re-imprimir o ajustar bultos */}
                      {order.printed_at && (
                        <div className="flex items-center gap-1">
                          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 h-10">
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={getBundles(order.id)}
                              onChange={(e) => handleBundlesChange(order.id, parseInt(e.target.value) || 1)}
                              className="h-7 w-8 border-none bg-transparent p-0 text-center text-xs font-bold focus-visible:ring-0"
                              aria-label={`Bultos`}
                            />
                          </div>
                          <ShippingLabelButton
                            orders={[{ id: order.id, bundles: getBundles(order.id) }]}
                            compact
                            className="h-10 text-xs border-amber-500/30 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20"
                          />
                        </div>
                      )}
                    </div>

                    {/* Mensaje de Ayuda/Bloqueo */}
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
                            {getProductLines(order).map((item) => (
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
      {/* VISTA ESCRITORIO: Tabla Completa con Colores Unificados   */}
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

              return (
                <TableRow
                  key={order.id}
                  className="border-white/5 hover:bg-white/5 transition-colors group"
                >
                  <TableCell className="pl-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    {formatDate(order.created_at)}
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
                      {/* Botón Ver pedido */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-9 gap-2 whitespace-nowrap border-white/15 bg-white/5 hover:bg-white/10"
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
                              {getProductLines(order).map((item) => (
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
                            {order.notes && (
                              <p className="rounded-lg bg-muted/50 p-3 text-sm">
                                <span className="font-semibold">Nota: </span>
                                {order.notes}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Incluye las unidades promocionales para preparar el total físico.
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>

                      {isArmed && (
                        <>
                          {/* Botón Paso 1: WhatsApp (Sky) */}
                          {!order.whatsapp_confirmed_at && (
                            <Button
                              size="sm"
                              onClick={() => handleWorkflowStep(order, 'whatsapp')}
                              disabled={isPending}
                              className="gap-2 h-9 whitespace-nowrap bg-sky-700 text-white hover:bg-sky-800 shadow-sm"
                            >
                              <MessageCircle className="h-4 w-4" />
                              Confirmar recepción
                            </Button>
                          )}

                          {/* Botón Paso 2: Preparación (Violet) */}
                          {order.whatsapp_confirmed_at && !order.prepared_at && (
                            <Button
                              size="sm"
                              onClick={() => handleWorkflowStep(order, 'preparation')}
                              disabled={isPending}
                              className="gap-2 h-9 whitespace-nowrap bg-violet-700 text-white hover:bg-violet-800 shadow-sm"
                            >
                              <PackageCheck className="h-4 w-4" />
                              Marcar preparado
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

                          {/* Botón Paso 3: Rótulos (Amber si falta rótulo) */}
                          <ShippingLabelButton
                            orders={[{ id: order.id, bundles: getBundles(order.id) }]}
                            className={
                              order.prepared_at && !order.printed_at
                                ? 'bg-amber-600 text-white hover:bg-amber-700 border-transparent shadow-sm'
                                : 'border-white/10 hover:bg-white/5'
                            }
                          />

                          {/* Botón Despachar (Emerald si listo) */}
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
                              <Truck className="h-4 w-4" />
                              Despachar
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
