import Link from "next/link";
import { getOrders, getOrderViewCounts } from "@/app/admin/actions/orders.actions";
import { PageHeader } from "@/components/shared/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { GlassCard, GlassCardHeader, GlassCardTitle, GlassCardDescription, GlassCardContent } from "@/components/shared/glass-card";
import { OrdersTable } from "./_components/orders-table";
import { ErrorDisplay } from "@/components/shared/error-display";
import { getCurrentAppRole } from "@/app/admin/actions/_helpers";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OrdersSearchParams = {
  status?: string;
  query?: string;
  overdue?: string;
  labels?: string;
  workflow?: string;
  view?: string;
};

type OrdersView = "active" | "completed" | "all";

function resolveOrdersView(filters?: OrdersSearchParams): OrdersView {
  if (filters?.status === "entregado") return "completed";
  if (filters?.status === "armado" || filters?.status === "transito") return "active";
  if (filters?.status === "all") return "all";
  if (filters?.view === "completed" || filters?.view === "all") return filters.view;
  return "active";
}

const views: { key: OrdersView; label: string; href: string }[] = [
  { key: "active", label: "Activos", href: "/admin/orders" },
  { key: "completed", label: "Entregados", href: "/admin/orders?view=completed" },
  { key: "all", label: "Todos", href: "/admin/orders?view=all" },
];

export default async function OrdersHistoryPage({
  searchParams,
}: {
  searchParams?: Promise<OrdersSearchParams>;
}) {
  const filters = await searchParams;
  const role = await getCurrentAppRole();
  const activeView = resolveOrdersView(filters);
  const requestedStatus = filters?.status && filters.status !== "all" ? filters.status : undefined;
  const isPendingView = requestedStatus === "armado";
  const isOverdueView = isPendingView && filters?.overdue === "true";
  const isUnprintedView = isPendingView && filters?.labels === "pending";
  const workflow = isPendingView && (filters?.workflow === "whatsapp" || filters?.workflow === "preparation")
    ? filters.workflow
    : undefined;

  const [ordersResult, countsResult] = await Promise.all([
    getOrders({
      status: requestedStatus,
      view: activeView,
      query: filters?.query,
      overdue: isOverdueView,
      unprinted: isUnprintedView,
      workflow,
    }),
    getOrderViewCounts(),
  ]);

  const { data: orders, error } = ordersResult;
  const counts = countsResult.success ? countsResult.data : null;
  const isDefaultActiveView = activeView === "active" && !requestedStatus;

  if (error) {
    return <ErrorDisplay message={error.message} />;
  }

  const pageTitle = isOverdueView
    ? "Pedidos demorados"
    : isUnprintedView
      ? "Rótulos por confirmar"
      : workflow === "whatsapp"
        ? "Recepción por confirmar"
        : workflow === "preparation"
          ? "Pedidos por preparar"
          : isPendingView
            ? "Pedidos pendientes"
            : requestedStatus === "transito"
              ? "Pedidos despachados"
              : activeView === "completed"
                ? "Pedidos entregados"
                : activeView === "all"
                  ? "Historial completo"
                  : "Pedidos activos";

  const pageDescription = isOverdueView
    ? "Pedidos pendientes de despacho con más de 48 horas."
    : isUnprintedView
      ? "Pedidos preparados sin confirmación de impresión del rótulo."
      : workflow === "whatsapp"
        ? "Pedidos registrados que todavía requieren confirmación manual de recepción del mensaje por WhatsApp."
        : workflow === "preparation"
          ? "Pedidos con recepción confirmada que todavía no fueron marcados como preparados."
          : isPendingView
            ? "Pedidos pendientes de preparación o despacho."
            : requestedStatus === "transito"
              ? "Pedidos despachados pendientes de conformación del cliente."
              : activeView === "completed"
                ? "Pedidos conformados. Se conservan para consulta y no se eliminan."
                : activeView === "all"
                  ? "Todos los pedidos registrados, incluidos los entregados."
                  : "Pedidos en gestión y despachados. Los entregados se muestran en el historial.";

  return (
    <PageContainer>
      <PageHeader title={pageTitle} description={pageDescription} />

      <div className="flex flex-wrap items-center gap-2" aria-label="Vistas de pedidos">
        {views.map(view => {
          const isActive = activeView === view.key;
          const count = counts?.[view.key];

          return (
            <Button
              key={view.key}
              asChild
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="h-10 gap-2"
            >
              <Link href={view.href} aria-current={isActive ? "page" : undefined}>
                {view.label}
                {typeof count === "number" && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-black tabular-nums",
                      isActive ? "bg-primary-foreground/20" : "bg-muted"
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            </Button>
          );
        })}
      </div>

      {isDefaultActiveView && counts && counts.completed > 0 && (
        <p className="text-sm text-muted-foreground">
          {counts.completed === 1
            ? "1 pedido entregado está oculto en esta vista."
            : `${counts.completed} pedidos entregados están ocultos en esta vista.`}{" "}
          <Link href="/admin/orders?view=completed" className="font-semibold underline underline-offset-2">
            Ver historial
          </Link>
        </p>
      )}

      <GlassCard>
        <GlassCardHeader className="pb-4">
          <GlassCardTitle>
            {isPendingView
              ? "Pedidos por gestionar"
              : activeView === "completed"
                ? "Pedidos entregados"
                : activeView === "all"
                  ? "Todos los Pedidos"
                  : "Pedidos activos"}
          </GlassCardTitle>
          <GlassCardDescription>
            {isOverdueView
              ? "La demora se calcula desde la fecha de creación del pedido."
              : isUnprintedView
                ? "Imprimí el rótulo de envío y confirmá la impresión desde la vista previa antes de despachar."
                : workflow === "whatsapp"
                  ? "La app no puede comprobar el envío del mensaje. Confirmá la recepción después de verificarla en WhatsApp."
                  : workflow === "preparation"
                    ? "Confirmá la recepción del pedido en WhatsApp antes de marcarlo como preparado."
                    : isPendingView
                      ? "Solo se muestran pedidos que aún están en preparación."
                      : activeView === "completed"
                        ? "Historial de pedidos conformados por el cliente."
                        : activeView === "all"
                          ? "Control histórico completo de transacciones."
                          : "Solo se muestran pedidos en gestión o despachados."}
          </GlassCardDescription>
        </GlassCardHeader>
        <GlassCardContent className="p-0">
          <OrdersTable orders={orders || []} operatorMode={role === "operario"} />
        </GlassCardContent>
      </GlassCard>
    </PageContainer>
  );
}
