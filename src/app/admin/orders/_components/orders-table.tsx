'use client';

import { useState } from 'react';
import type { Order } from '@/types';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { DataTableHeader } from '@/components/shared/data-table-header';
import { formatDate, formatCurrency } from '@/lib/formatters';
import { ShippingLabelButton } from '../../_components/shipping-label-button';
import { ReprintLabelButton } from '../../_components/reprint-label-button';
import { OrderStatusBadge } from '../../_components/order-status-badge';
import { Input } from '@/components/ui/input';
import { Printer, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type OrdersTableProps = {
  orders: Order[];
};

export function OrdersTable({ orders }: OrdersTableProps) {
  const [bundles, setBundles] = useState<Record<string, number>>({});

  const getBundles = (orderId: string) => bundles[orderId] || 1;

  const handleBundlesChange = (orderId: string, value: number) => {
    setBundles(prev => ({
      ...prev,
      [orderId]: Math.max(1, Math.min(20, value)),
    }));
  };

  return (
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
                        />
                      </div>
                      <ShippingLabelButton orders={[{ id: order.id, bundles: getBundles(order.id) }]} />
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
  );
}
