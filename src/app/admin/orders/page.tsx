
"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getOrders } from "@/app/admin/actions/orders.actions";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchInput } from "@/components/shared/search-input";
import { Pagination } from "@/components/shared/pagination";
import { ShoppingCart, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { ShippingLabelButton } from "../_components/shipping-label-button";
import { OrderStatusBadge } from "../_components/order-status-badge";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { OrderWithItems } from "@/types";

const statusFilters = [
    { label: 'Todos', value: 'all' },
    { label: 'Armado', value: 'armado' },
    { label: 'En Tránsito', value: 'transito' },
    { label: 'Entregado', value: 'entregado' },
];

const PAGE_SIZE = 20;

export default function OrdersHistoryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentStatus = searchParams.get("status") || "all";
  const currentQuery = searchParams.get("query") || "";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);
  
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, startTransition] = useTransition();

  const fetchOrders = useCallback((status: string, query: string, page: number) => {
    startTransition(async () => {
      const result = await getOrders({
        status: status === 'all' ? undefined : status,
        query: query || undefined,
        page,
        limit: PAGE_SIZE,
      });
      
      if (result.data) {
        setOrders(result.data.orders || []);
        setTotal(result.data.total || 0);
        setTotalPages(result.data.totalPages || 0);
      }
    });
  }, []);

  useEffect(() => {
    fetchOrders(currentStatus, currentQuery, currentPage);
  }, [currentStatus, currentQuery, currentPage, fetchOrders]);

  const updateUrl = useCallback((params: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(params)) {
      if (value === null || value === "") {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    }
    router.push(`/admin/orders?${newParams.toString()}`);
  }, [router, searchParams]);

  const handleStatusChange = (status: string) => {
    updateUrl({ status: status === 'all' ? null : status, page: null });
  };

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage.toString() });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="grid gap-4 md:gap-8">
      <PageHeader
        title="Historial"
        description="Filtro de gestión y control total."
      >
        <SearchInput placeholder="Buscar por cliente, producto..." />
      </PageHeader>

      <Card className="glass border-white/5 overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-black italic tracking-tighter">Todos los Pedidos</CardTitle>
          <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-60">Control histórico de transacciones.</CardDescription>
          <div className="flex gap-1 mt-4 flex-wrap">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => handleStatusChange(filter.value)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-colors",
                  currentStatus === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-white/5 text-muted-foreground hover:bg-white/10"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 pl-6">Fecha</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Cliente</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Contenido</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Monto</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Estado</TableHead>
                <TableHead className="text-right pr-6">
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
                    <EmptyState
                      icon={ShoppingCart}
                      title="No hay pedidos todavía"
                      description="Los pedidos aparecerán aquí cuando los clientes realicen su primer pedido."
                    />
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
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-7 text-[10px] font-bold uppercase tracking-widest gap-2 bg-white/5 border-white/10 hover:bg-white/10">
                            <Package className="w-3 h-3" />
                            Ver Contenido
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md bg-slate-950 border-white/10 text-white">
                          <DialogHeader>
                            <DialogTitle className="font-black italic tracking-tighter text-xl">Contenido del Pedido</DialogTitle>
                          </DialogHeader>
                          <div className="flex flex-col gap-1 mt-4 max-h-[60vh] overflow-y-auto pr-2">
                            {order.order_items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0 group">
                                <span className="text-sm font-semibold text-slate-200 group-hover:text-primary transition-colors">{item.products?.name}</span>
                                <Badge variant="secondary" className="bg-white/10 text-xs font-black">
                                  x{item.quantity}
                                </Badge>
                              </div>
                            )) || <p className="text-sm text-muted-foreground italic py-4">Sin detalle registrado</p>}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell className="font-headline font-black text-primary/80">
                      ${order.total_amount.toLocaleString()}
                    </TableCell>
                    <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                    <TableCell className="text-right pr-6">
                      {order.status === 'armado' && (
                        <ShippingLabelButton orders={[{ id: order.id, bundles: 1 }]} />
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        {orders.length > 0 && (
          <div className="border-t border-white/5">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={total}
              pageSize={PAGE_SIZE}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Card>
    </div>
  );
}
