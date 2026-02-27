
import { getOrders } from "@/app/admin/actions/orders.actions";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { ShippingLabelButton } from "../_components/shipping-label-button";
import { OrderStatusBadge } from "../_components/order-status-badge";

export default async function OrdersHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; query?: string }>;
}) {
  const filters = await searchParams;
  const { data: result } = await getOrders({
    status: filters?.status,
    query: filters?.query
  });
  const orders = result?.orders || [];

  return (
    <div className="grid gap-4 md:gap-8">
      <PageHeader
        title="Historial"
        description="Filtro de gestión y control total."
      />

      <Card className="glass border-white/5 overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-black italic tracking-tighter">Todos los Pedidos</CardTitle>
          <CardDescription className="text-xs uppercase font-bold tracking-widest opacity-60">Control histórico de transacciones.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 pl-6">Fecha</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Cliente</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Monto</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Estado</TableHead>
                <TableHead className="text-right pr-6">
                  <span className="sr-only">Acciones</span>
                </TableHead>
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
      </Card>
    </div>
  );
}
