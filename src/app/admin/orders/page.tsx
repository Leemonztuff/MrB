
import { getOrders } from "@/app/admin/actions/orders.actions";
import { PageHeader } from "@/components/shared/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/shared/glass-card";
import { OrdersTable } from "./_components/orders-table";

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
          <OrdersTable orders={orders || []} />
        </GlassCardContent>
      </GlassCard>
    </PageContainer>
  );
}
