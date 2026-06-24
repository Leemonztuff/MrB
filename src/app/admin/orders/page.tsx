
import { getOrders } from "@/app/admin/actions/orders.actions";
import { PageHeader } from "@/components/shared/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/shared/glass-card";
import { DataTableHeader } from "@/components/shared/data-table-header";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/formatters";
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
    <PageContainer>
      <PageHeader
        title="Historial"
        description="Filtro de gestión y control total."
      />

      <GlassCard>
        <GlassCardHeader className="pb-4">
          <GlassCardTitle>Todos los Pedidos</GlassCardTitle>
          <GlassCardDescription>Control histórico de transacciones.</GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="p-0">
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
        </GlassCardContent>
      </GlassCard>
    </PageContainer>
  );
}
