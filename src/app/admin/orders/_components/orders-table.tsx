'use client';

import { useState, useTransition } from 'react';
import type { Order } from '@/types';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { DataTableHeader } from '@/components/shared/data-table-header';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { ShippingLabelButton } from '../../_components/shipping-label-button';
import { ReprintLabelButton } from '../../_components/reprint-label-button';
import { OrderStatusBadge } from '../../_components/order-status-badge';
import { Input } from '@/components/ui/input';
import { Printer, CheckCircle2, Truck, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { updateOrderStatus } from '@/app/admin/actions/orders.actions';
import { useToast } from '@/hooks/use-toast';
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

type OrdersTableProps = {
  orders: Order[];
};

export function OrdersTable({ orders }: OrdersTableProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [bundles, setBundles] = useState<Record<string, number>>({});
  const [orderNeedingLabel, setOrderNeedingLabel] = useState<Order | null>(null);

  const getBundles = (orderId: string) => bundles[orderId] || 1;

  const handleBundlesChange = (orderId: string, value: number) => {
    setBundles(prev => ({
      ...prev,
      [orderId]: Math.max(1, Math.min(20, value)),
    }));
  };

  const handleDispatch = (order: Order) => {
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

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-white/5 hover:bg-transparent">
            <DataTableHeader>Fecha</DataTableHeader>
            <DataTableHeader>Cliente</DataTableHeader>
            <DataTableHeader>Monto</DataTableHeader>
            <DataTableHeader>Estado</DataTableHeader>
            <DataTableHeader align="right">
              <span className="sr-only">Acciones</span>
            </DataTableHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!orders || orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-muted-foreground italic">
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
                <TableCell className="font-headline font-black text-primary/80">
                  {formatCurrency(order.total_amount)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <OrderStatusBadge status={order.status} />
                    {order.printed_at && (
                      <Badge variant="outline" className="text-[10px] border-green-500/30 text-green-400 bg-green-500/10">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Impreso
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right pr-6">
                  <div className="flex items-center justify-end gap-2">
                    {order.status === 'armado' && (
                      <>
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
                        <Button
                          size="sm"
                          onClick={() => handleDispatch(order)}
                          disabled={isPending}
                          className="gap-2"
                        >
                          <Truck className="h-4 w-4" />
                          Despachar
                        </Button>
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
