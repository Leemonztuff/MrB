
import { getOrders } from "@/app/admin/actions/orders.actions";
import { PageHeader } from "@/components/shared/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/shared/glass-card";
import { OrdersTable } from "./_components/orders-table";
import { ErrorDisplay } from "@/components/shared/error-display";

export default async function OrdersHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; query?: string; overdue?: string; labels?: string }>;
}) {
  const filters = await searchParams;
  const isPendingView = filters?.status === 'armado';
  const isOverdueView = isPendingView && filters?.overdue === 'true';
  const isUnprintedView = isPendingView && filters?.labels === 'pending';
  const { data: orders, error } = await getOrders({
    status: filters?.status,
    query: filters?.query,
    overdue: isOverdueView,
    unprinted: isUnprintedView,
  });

  if (error) {
    return <ErrorDisplay message={error.message} />;
  }

  return (
    <PageContainer>
      <PageHeader
        title={isOverdueView ? "Pedidos demorados" : isUnprintedView ? "Rótulos por confirmar" : isPendingView ? "Pedidos pendientes" : "Historial"}
        description={
          isOverdueView
            ? "Pedidos pendientes de despacho con más de 48 horas."
            : isUnprintedView
              ? "Pedidos de preparación sin confirmación de impresión del rótulo."
            : isPendingView
              ? "Pedidos pendientes de preparación o despacho."
              : "Filtro de gestión y control total."
        }
      />

      <GlassCard>
        <GlassCardHeader className="pb-4">
          <GlassCardTitle>{isPendingView ? "Pedidos por gestionar" : "Todos los Pedidos"}</GlassCardTitle>
          <GlassCardDescription>
            {isOverdueView
              ? "La demora se calcula desde la fecha de creación del pedido."
              : isUnprintedView
                ? "Imprimí el rótulo de envío y confirmá la impresión desde la vista previa antes de despachar."
              : isPendingView
                ? "Solo se muestran pedidos que aún están en preparación."
                : "Control histórico de transacciones."}
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="p-0">
          <OrdersTable orders={orders || []} />
        </GlassCardContent>
      </GlassCard>
    </PageContainer>
  );
}
