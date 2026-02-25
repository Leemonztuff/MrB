
"use client";

import type { Order } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { OrderStatusBadge } from "@/app/admin/_components/order-status-badge";
import { ReprintLabelButton } from "@/app/admin/_components/reprint-label-button";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
}

export function ClientOrders({ orders }: { orders: Order[] }) {
  return (
    <Card className="glass border-white/5 overflow-hidden">
      <CardHeader className="bg-white/5 pb-4">
        <CardTitle className="text-sm uppercase tracking-widest">Historial de Pedidos</CardTitle>
        <CardDescription>
          Registro de todos los envíos y entregas de este cliente.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">ID</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-white/5 transition-colors">
                  <TableCell className="font-medium pl-6">#{order.id.slice(-6).toUpperCase()}</TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(order.total_amount)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <ReprintLabelButton orderId={order.id} />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground italic">
                  Este cliente aún no ha realizado pedidos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="bg-white/5 py-3 px-6">
        <div className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
          Total: {orders.length} pedidos.
        </div>
      </CardFooter>
    </Card>
  );
}
