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
import { Printer, CheckCircle2, Truck, AlertTriangle, MessageCircle, PackageCheck, ClipboardList } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { markOrderWorkflowStep, updateOrderStatus } from '@/app/admin/actions/orders.actions';
import { useToast } from '@/hooks/use-toast';
import { getOrderDispatchBlocker } from '@/lib/order-workflow';
import { aggregateOrderItems } from '@/lib/curated-order';
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
    setBundles(prev => ({
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
        description: step === 'whatsapp'
          ? 'Quedó registrada la verificación manual de recepción del mensaje.'
          : `El pedido de ${order.client_name_cache} quedó marcado como preparado.`,
      });
    });
  };

  return (
    <>
      <div className="w-full overflow-x-auto">
        <Table className="min-w-[720px]">
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
          {!orders || orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={operatorMode ? 4 : 5} className="text-center py-12 text-muted-foreground italic">
                No se encontraron pedidos.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors group">
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
                      <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-700 bg-green-500/10 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Rótulo confirmado
                      </Badge>
                    )}
                  </div>
                  {order.status === 'armado' && (
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p>
                        WhatsApp: {order.whatsapp_confirmed_at ? 'recepción confirmada' : 'por confirmar'}
                      </p>
                      <p>
                        Preparación: {order.prepared_at ? 'pedido preparado' : 'pendiente'}
                      </p>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right pr-4 sm:pr-6">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 gap-2 whitespace-nowrap">
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
                            {getProductLines(order).map(item => (
                              <li key={item.id} className="flex min-h-12 items-center justify-between gap-4 py-2 text-sm">
                                <span>{item.name}</span>
                                <span className="rounded-md bg-muted px-2 py-1 font-bold tabular-nums">
                                  {item.quantity}
                                </span>
                              </li>
                            ))}
                          </ul>
                          {order.notes && (
                            <p className="rounded-lg bg-muted/50 p-3 text-sm">
                              <span className="font-semibold">Nota: </span>{order.notes}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Incluye las unidades promocionales para preparar el total físico.
                          </p>
                        </div>
                      </DialogContent>
                    </Dialog>
                    {order.status === 'armado' && (
                      <>
                        {!order.whatsapp_confirmed_at && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWorkflowStep(order, 'whatsapp')}
                          disabled={isPending}
                          className="gap-2 h-9 whitespace-nowrap"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Confirmar recepción
                        </Button>
                        )}
                        {order.whatsapp_confirmed_at && !order.prepared_at && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWorkflowStep(order, 'preparation')}
                          disabled={isPending}
                          className="gap-2 h-9 whitespace-nowrap"
                        >
                          <PackageCheck className="h-4 w-4" />
                          Marcar preparado
                        </Button>
                        )}
                        <div className="flex items-center gap-1">
                          <Printer className="h-3 w-3 text-muted-foreground" />
                          <Input
                            type="number"
                            min={1}
                            max={20}
                            value={getBundles(order.id)}
                            onChange={(e) => handleBundlesChange(order.id, parseInt(e.target.value) || 1)}
                            className="h-7 w-14 text-center text-xs glass border-white/10 bg-white/5"
                            aria-label={`Cantidad de bultos para ${order.client_name_cache}`}
                          />
                        </div>
                        <ShippingLabelButton orders={[{ id: order.id, bundles: getBundles(order.id) }]} />
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleDispatch(order)}
                            disabled={
                              isPending
                              || getOrderDispatchBlocker(order) === 'whatsapp'
                              || getOrderDispatchBlocker(order) === 'preparation'
                            }
                            className="gap-2 h-9 whitespace-nowrap"
                          >
                            <Truck className="h-4 w-4" />
                            Despachar
                          </Button>
                          <p className="hidden lg:block max-w-44 text-right text-[10px] leading-tight text-muted-foreground">
                            {getOrderDispatchBlocker(order) === 'whatsapp'
                              ? 'Confirmá la recepción del pedido por WhatsApp.'
                              : getOrderDispatchBlocker(order) === 'preparation'
                                ? 'Marcá el pedido como preparado.'
                                : getOrderDispatchBlocker(order) === 'label'
                                  ? 'El despacho requiere imprimir y confirmar el rótulo de envío.'
                                  : 'El pedido cumple los requisitos para despachar.'}
                          </p>
                        </div>
                      </>
                    )}
                    {order.status !== 'armado' && (
                      <ReprintLabelButton orderId={order.id} bundles={1} />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
        </Table>
      </div>

      <AlertDialog open={Boolean(orderNeedingLabel)} onOpenChange={(open) => !open && setOrderNeedingLabel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Falta confirmar el rótulo de envío
            </AlertDialogTitle>
            <AlertDialogDescription>
              Para despachar el pedido de {orderNeedingLabel?.client_name_cache}, imprimí el rótulo y confirmá la impresión en la vista previa. Después volvé a esta lista y despachalo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ahora no</AlertDialogCancel>
            {orderNeedingLabel && (
              <ShippingLabelButton
                orders={[{ id: orderNeedingLabel.id, bundles: getBundles(orderNeedingLabel.id) }]}
                onClick={() => setOrderNeedingLabel(null)}
              />
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
