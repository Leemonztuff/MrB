
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
  const { data: orders } = await getOrders({
    status: filters?.status,
    query: filters?.query
  });

  return (
    <div className="grid gap-4 md:gap-8">
      <PageHeader
        title="Historial de Pedidos"
        description="Revisa y gestiona todos los pedidos realizados en el sistema."
      />

      <Card className="glass border-white/5">
        <CardHeader>
          <CardTitle>Todos los Pedidos</CardTitle>
          <CardDescription>Busca por cliente o filtra por estado.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Rótulos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!orders || orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    No se encontraron pedidos.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-white/5 transition-colors">
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell className="font-medium">{order.client_name_cache}</TableCell>
                    <TableCell>${order.total_amount.toLocaleString()}</TableCell>
                    <TableCell><OrderStatusBadge status={order.status} /></TableCell>
                    <TableCell className="text-right">
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
