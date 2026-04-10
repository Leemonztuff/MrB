
"use client";

import type { OrderWithItems } from "@/types";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Eye } from "lucide-react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(value);
}

export function ClientOrders({ orders }: { orders: OrderWithItems[] }) {
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
              <TableHead>Contenido</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right pr-6">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-white/5 transition-colors group">
                  <TableCell className="font-medium pl-6">
                    <span className="text-xs bg-white/5 px-2 py-1 rounded">#{order.id.slice(-6).toUpperCase()}</span>
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(order.created_at)}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 gap-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors border border-white/5 rounded-lg cursor-pointer"
                        >
                          <ShoppingBag className="h-3.5 w-3.5" />
                          <span>{order.order_items?.length || 0} items</span>
                          <Eye className="h-3 w-3 opacity-50" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="glass flex max-h-[85dvh] flex-col overflow-hidden border-white/10 p-0 w-[95vw] max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 border-b border-white/10 px-4 sm:px-6 py-4 font-headline italic text-base sm:text-lg">
                            <ShoppingBag className="h-5 w-5 text-primary shrink-0" />
                            <span className="truncate">Pedido #{order.id.slice(-6).toUpperCase()}</span>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="flex min-h-0 flex-1 flex-col px-4 sm:px-6 pb-4 sm:pb-6 overflow-hidden">
                          <div className="flex-1 min-h-0 overflow-y-auto pr-2 [scrollbar-gutter:stable]">
                            <div className="grid gap-2">
                              {order.order_items?.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <Badge variant="secondary" className="bg-primary/20 text-primary h-6 w-6 flex items-center justify-center p-0 font-black shrink-0">
                                      {item.quantity}
                                    </Badge>
                                    <span className="text-xs truncate">{item.products?.name}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap ml-2">
                                    {formatCurrency((item.price_per_unit || 0) * item.quantity)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4 shrink-0">
                            <span className="text-xs uppercase font-bold text-muted-foreground tracking-widest">Total</span>
                            <span className="text-lg font-headline font-black text-primary">
                              {formatCurrency(order.total_amount)}
                            </span>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
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
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground italic">
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
